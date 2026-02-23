use crate::{
    constants::USDT_MULTIPLICATION,
    enums::AppEvent,
    repositories::ServicesRepository,
    services::{
        DatabaseService, DeepLinkHandler, DeepLinkQueryParams, EventMessage, WebSocketBroadcaster,
        WidyNetwork,
    },
    utils::on_new_donation,
};
use entity::service::{ServiceAuth, ServiceType, WidyAuth};
use eventsource_client::{self as es, Client};
use futures::{StreamExt, TryStreamExt};
use serde::Deserialize;
use serde_json::Value;
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};
use tauri::{AppHandle, Manager};
use tokio::{pin, sync::broadcast};
use tonlib_core::cell::{BagOfCells, Cell};

#[derive(Debug, Clone, Deserialize)]
pub struct TraceResponse {
    pub transaction: Transaction,
    pub interfaces: String,
    pub emulated: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Transaction {
    pub hash: String,
    pub success: bool,
    #[serde(default)]
    pub out_msgs: Vec<Message>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Message {
    pub op_code: String,
    pub raw_body: String,
    #[serde(default)]
    pub out_msgs: Vec<Message>,
}
#[derive(Debug, Clone, Deserialize)]
pub struct TonDonationEvent {
    pub op_code: u32,
    pub query_id: u64,
    pub amount: u64,
    pub sender: String,
    pub name: String,
    pub message: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TonTraceAccounts {
    pub accounts: Vec<String>,
    pub hash: String,
}
pub struct WidyTonService {
    http_client: reqwest::Client,
    pub nonce: Arc<Mutex<Option<String>>>,
    sign_out_sender: broadcast::Sender<()>,
}

impl DeepLinkHandler for WidyTonService {
    fn can_handle(&self, url: &url::Url) -> bool {
        let Some(query) = url.query() else {
            return false;
        };
        let Ok(query_params) = serde_qs::from_str::<DeepLinkQueryParams>(query) else {
            return false;
        };

        url.host_str() == Some("create-donation-account")
            && query_params.network == WidyNetwork::Ton
    }

    fn handle(&self, url: &url::Url, app: &AppHandle) {
        let Some(query) = url.query() else {
            return;
        };

        let Ok(query_params) = serde_qs::from_str::<DeepLinkQueryParams>(query) else {
            ::log::error!("Failed to parse deep link query params");
            return;
        };

        let nonce: Arc<Mutex<Option<String>>> = self.nonce.clone();

        let is_nonce_valid = {
            let mut nonce_guard = nonce.lock().unwrap();
            if nonce_guard.as_ref() == Some(&query_params.nonce) {
                *nonce_guard = None;
                true
            } else {
                false
            }
        };

        if !is_nonce_valid {
            return;
        }

        let app_clone = app.clone();

        tauri::async_runtime::spawn(async move {
            let widy_ton_service = app_clone.state::<Arc<WidyTonService>>();
            let database_service = app_clone.state::<DatabaseService>();
            let websocket_broadcaster = app_clone.state::<WebSocketBroadcaster>();

            let _ = database_service
                .update_service(entity::service::Model {
                    id: ServiceType::WidyTon,
                    auth: Some(ServiceAuth::Widy(WidyAuth {
                        donation_account_name: query_params.donation_account_name.clone(),
                        user: query_params.user.clone(),
                        donation_account_address: query_params.donation_account_address.clone(),
                    })),
                    settings: None,
                    authorized: true,
                })
                .await;

            if let Err(e) = widy_ton_service.connect(&app_clone).await {
                ::log::error!("Service connection error: {}", e);
                return;
            }

            websocket_broadcaster
                .broadcast_event_message(&EventMessage {
                    event: AppEvent::CreateDonationAccount,
                    data: query_params,
                })
                .await;
        });
    }
}

impl WidyTonService {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(1);
        Self {
            nonce: Arc::new(Mutex::new(None)),
            sign_out_sender: tx,
            http_client: reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
                .expect("http_client build error"),
        }
    }

    pub async fn connect(&self, app: &AppHandle) -> Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        let service = database_service
            .get_service_with_auth_by_id(ServiceType::WidyTon)
            .await?;
        if let Some(entity::service::Model {
            authorized: true,
            auth: Some(ServiceAuth::Widy(auth)),
            ..
        }) = service
        {
            let app_clone = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) =
                    Self::subscribe_to_donation_event(app_clone, auth.donation_account_address)
                        .await
                {
                    ::log::error!("Failed to listen to program events: {}", e);
                }
            });
        }

        Ok(())
    }

    pub async fn subscribe_to_donation_event(
        app: AppHandle,
        donation_account_address: String,
    ) -> core::result::Result<(), Box<dyn std::error::Error>> {
        let widy_ton_service = app.state::<Arc<WidyTonService>>();
        let mut sign_out_receiver = widy_ton_service.sign_out_sender.subscribe();
        let client = es::ClientBuilder::for_url(&format!(
            "https://tonapi.io/v2/sse/accounts/traces?accounts={}&operations=0x05a73567",
            donation_account_address
        ))
        .map_err(|e| {
            log::error!("{}", e.to_string());
        })
        .unwrap()
        .reconnect(
            es::ReconnectOptions::reconnect(true)
                .retry_initial(false)
                .delay(Duration::from_secs(1))
                .backoff_factor(2)
                .delay_max(Duration::from_secs(60))
                .build(),
        )
        .build();
        let stop_signal = sign_out_receiver.recv();
        pin!(stop_signal);
        let mut stream = client.stream().take_until(stop_signal);

        while let Ok(Some(sse)) = stream.try_next().await {
            match sse {
                es::SSE::Event(ev) => {
                    if let Ok(trace) = serde_json::from_str::<TonTraceAccounts>(&ev.data) {
                        if let Some(transaction) =
                            widy_ton_service.get_donation_transaction(trace.hash).await
                        {
                            if let Some(message) = transaction.out_msgs.first() {
                                if let Ok(event) =
                                    widy_ton_service.parse_donation_event(&message.raw_body)
                                {
                                    let _ = on_new_donation(
                                        transaction.hash,
                                        ServiceType::WidyTon,
                                        event.name,
                                        entity::settings::Currency::USD,
                                        event.amount as f64 / USDT_MULTIPLICATION,
                                        Some(event.message),
                                        app.clone(),
                                    )
                                    .await;
                                }
                            }
                        };
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }
    fn parse_donation_event(&self, hex: &str) -> Result<TonDonationEvent, String> {
        let boc_bytes = hex::decode(hex).map_err(|e| e.to_string())?;
        let boc = BagOfCells::parse(&boc_bytes).map_err(|e| e.to_string())?;

        let root = boc.single_root().map_err(|e| e.to_string())?;
        let mut parser = root.parser();

        let op_code = parser.load_u32(32).map_err(|e| e.to_string())?;
        let query_id = parser.load_u64(64).map_err(|e| e.to_string())?;
        let amount = parser.load_coins().map_err(|e| e.to_string())?;
        let sender = parser.load_address().map_err(|e| e.to_string())?;

        let name_cell = parser.next_reference().map_err(|e| e.to_string())?;
        let mut name_parser = name_cell.parser();

        let bytes_len: usize = name_parser.remaining_bytes();
        let name = name_parser
            .load_utf8(bytes_len)
            .map_err(|e| e.to_string())?;

        let message_cell = parser.next_reference().map_err(|e| e.to_string())?;
        let message = message_cell.load_snake_string()?;

        Ok(TonDonationEvent {
            op_code,
            query_id,
            amount: amount.to_u64_digits().first().cloned().unwrap_or(0),
            sender: sender.to_string(),
            message,
            name,
        })
    }

    async fn get_donation_transaction(&self, hash: String) -> Option<Transaction> {
        let result = self
            .http_client
            .get(format!("https://tonapi.io/v2/traces/{hash}"))
            .send()
            .await;
        if let Ok(response) = result {
            if let Ok(trace_response) = response.json::<Value>().await {
                let raw_transaction = trace_response["children"][0]["children"][0]["children"][0]
                    ["transaction"]
                    .clone();
                return serde_json::from_value::<Transaction>(raw_transaction).ok();
            }
        }
        None
    }

    pub async fn sign_out(&self, app: &AppHandle) -> core::result::Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        database_service
            .update_service(entity::service::Model {
                id: ServiceType::WidyTon,
                settings: None,
                auth: None,
                authorized: false,
            })
            .await?;
        let _ = self.sign_out_sender.send(());
        Ok(())
    }
}

trait StringTail {
    fn load_snake_string(&self) -> Result<String, String>;
}
impl StringTail for Cell {
    fn load_snake_string(&self) -> Result<String, String> {
        let mut bytes = Vec::new();
        let mut current = self.clone();

        loop {
            let mut parser = current.parser();
            let available = parser.remaining_bytes();
            let chunk = parser.load_bytes(available).map_err(|e| e.to_string())?;
            bytes.extend_from_slice(&chunk);

            if current.references().is_empty() {
                break;
            }

            current = (*current.references()[0]).clone();
        }

        Ok(String::from_utf8(bytes).map_err(|e| e.to_string())?)
    }
}
