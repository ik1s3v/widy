use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use entity::service::{ServiceAuth, ServiceType, WidyAuth};
use eventsource_client::{self as es, Client};
use futures::{Stream, StreamExt, TryStreamExt};
use reqwest::blocking::Response;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::{pin, sync::broadcast};

use crate::{
    enums::AppEvent,
    repositories::ServicesRepository,
    services::{
        DatabaseService, DeepLinkHandler, DeepLinkQueryParams, EventMessage, WebSocketBroadcaster,
        WidyNetwork,
    },
};

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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trace {
    pub transaction: Transaction,
    pub interfaces: Vec<String>,
    pub children: Option<Vec<Trace>>,
    pub emulated: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub hash: String,
    pub lt: u64,
    pub account: AccountAddress,
    pub success: bool,
    pub utime: i64,
    pub orig_status: AccountStatus,
    pub end_status: AccountStatus,
    pub total_fees: i64,
    pub end_balance: i64,
    pub transaction_type: TransactionType,
    pub state_update_old: String,
    pub state_update_new: String,
    pub in_msg: Option<Message>,
    pub out_msgs: Vec<Message>,
    pub block: String,
    pub aborted: bool,
    pub destroyed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountAddress {
    pub address: String,
    pub name: Option<String>,
    pub is_scam: bool,
    pub icon: Option<String>,
    pub is_wallet: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub hash: String,
    pub source: Option<AccountAddress>,
    pub destination: Option<AccountAddress>,
    pub value: i64, // nanoTON
    pub fwd_fee: i64,
    pub ihr_fee: i64,
    pub created_lt: u64,
    pub created_at: i64,
    pub opcode: Option<String>,
    pub ih_disabled: bool,
    pub bounce: bool,
    pub bounced: bool,
    pub import_fee: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccountStatus {
    Uninit,
    Active,
    Frozen,
    Nonexist,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TransactionType {
    TransOrd,
    TransTickTock,
    TransSplitPrepare,
    TransSplitInstall,
    TransMergePrepare,
    TransMergeInstall,
    TransStorage,
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
        let client = es::ClientBuilder::for_url(
            "https://testnet.tonapi.io/v2/sse/accounts/traces?accounts=ALL",
        )
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
                        println!("{:?}", trace.hash);
                        // widy_ton_service.getTransaction(trace.hash).await;
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }

    async fn getTransaction(&self, hash: String) {
        let result = self
            .http_client
            .get(format!("https://tonapi.io/v2/traces/{hash}"))
            .send()
            .await;
        if let Ok(response) = result {
            if let Ok(trace) = response.json::<Trace>().await {
                println!("{:?}", trace.transaction.success)
            };
        }
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
