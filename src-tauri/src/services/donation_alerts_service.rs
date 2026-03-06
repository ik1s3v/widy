use crate::{repositories::ServicesRepository, services::DatabaseService, utils::on_new_donation};
use entity::{
    service::{DonationAlertsAuth, ServiceAuth, ServiceType},
    settings::Currency,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{AppHandle, Manager};
use tokio_tungstenite::{
    connect_async,
    tungstenite::{Message, Utf8Bytes},
};

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
enum WebsocketMessage {
    Client(ClientMessage),
    Donation(DonationMessage),
}
#[derive(Debug, Clone, Deserialize)]
struct ClientMessage {
    result: ClientMessageResult,
}
#[derive(Debug, Clone, Deserialize)]
struct DonationMessage {
    result: DonationMessageResult,
}
#[derive(Debug, Clone, Deserialize)]
struct ClientMessageResult {
    client: String,
}
#[derive(Debug, Clone, Deserialize)]
struct DonationMessageResult {
    #[allow(dead_code)]
    channel: String,
    data: DonationMessageData,
}
#[derive(Debug, Clone, Deserialize)]
struct DonationMessageData {
    #[allow(dead_code)]
    seq: u64,
    data: Donation,
}
#[derive(Debug, Clone, Deserialize)]
struct Donation {
    id: u64,
    #[allow(dead_code)]
    name: String,
    username: Option<String>,
    message: String,
    #[allow(dead_code)]
    message_type: String,
    #[allow(dead_code)]
    payin_system: Option<String>,
    amount: f64,
    #[allow(dead_code)]
    amount_in_user_currency: f64,
    currency: Currency,
    #[allow(dead_code)]
    recipient_name: String,
    #[allow(dead_code)]
    is_shown: u8,
}

#[derive(Debug, Clone, Deserialize)]
struct ChannelsResponse {
    channels: Vec<Channel>,
}

#[derive(Debug, Clone, Deserialize)]
struct Channel {
    channel: String,
    token: String,
}
#[derive(Debug, Clone, Deserialize)]
struct UserInfoResponse {
    data: UserInfo,
}
#[derive(Debug, Clone, Serialize)]
struct SubscriptionBody {
    channels: Vec<String>,
    client: String,
}
#[derive(Debug, Clone, Deserialize)]
struct UserInfo {
    id: u64,
    socket_connection_token: String,
}
#[derive(Debug, Clone, Deserialize)]
struct AuthTokenResponse {
    data: AuthToken,
}
#[derive(Debug, Clone, Deserialize)]
struct AuthToken {
    token: String,
}
pub struct DonationAlertsService {
    is_close_connection: Arc<AtomicBool>,
}

impl DonationAlertsService {
    pub fn new() -> Self {
        Self {
            is_close_connection: Arc::new(AtomicBool::new(false)),
        }
    }

    pub async fn connect(&self, app: &AppHandle) -> Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        let service = database_service
            .get_service_with_auth_by_id(entity::service::ServiceType::DonationAlerts)
            .await?;
        if let Some(entity::service::Model {
            id: ServiceType::DonationAlerts,
            auth: Some(ServiceAuth::DonationAlerts(auth)),
            ..
        }) = service
        {
            if let Err(e) = self.run_websocket_client(app.clone(), auth.token).await {
                database_service
                    .update_service_auth(ServiceType::DonationAlerts, None, false)
                    .await
                    .map_err(|e| format!("Failed to clear auth after connection error: {e}"))?;

                return Err(e);
            }
        }

        Ok(())
    }
    async fn run_websocket_client(&self, app: AppHandle, token: String) -> Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        let reqwest_client = app.state::<reqwest::Client>();
        let auth_token = self.get_auth_token(&reqwest_client, &token).await?;
        let user_info = self.get_user_info(&reqwest_client, &auth_token).await?;
        database_service
            .update_service_auth(
                ServiceType::DonationAlerts,
                Some(ServiceAuth::DonationAlerts(DonationAlertsAuth { token })),
                true,
            )
            .await?;
        tauri::async_runtime::spawn(async move {
            let donation_alerts_service = app.state::<DonationAlertsService>();
            let reqwest_client = app.state::<reqwest::Client>();
            let connect_url = "wss://centrifugo.donationalerts.com/connection/websocket";
            'connection_loop: loop {
                log::info!("Connecting to donation alerts websocket: {}", connect_url);
                match connect_async(connect_url).await {
                    Ok((mut socket, _)) => {
                        log::info!("Donation Alerts websocket connected.");
                        let _ = socket
                            .send(Message::Text(Utf8Bytes::from(
                                json!({
                                    "params": {
                                        "token": user_info.socket_connection_token
                                    },
                                    "id": 1
                                })
                                .to_string(),
                            )))
                            .await
                            .map_err(|e| log::error!("{}", e.to_string()));
                        while let Some(msg_result) = socket.next().await {
                            let is_close_connection = donation_alerts_service
                                .is_close_connection
                                .load(Ordering::Relaxed);
                            if is_close_connection {
                                donation_alerts_service
                                    .is_close_connection
                                    .store(false, Ordering::Relaxed);
                                break 'connection_loop;
                            }

                            match msg_result {
                                Ok(Message::Text(text)) => {
                                    if let Ok(message) =
                                        serde_json::from_str::<WebsocketMessage>(&text)
                                    {
                                        match message {
                                            WebsocketMessage::Client(client_message) => {
                                                let result = donation_alerts_service
                                                    .subscribe(
                                                        &reqwest_client,
                                                        &auth_token,
                                                        SubscriptionBody {
                                                            channels: vec![format!(
                                                                "$alerts:donation_{}",
                                                                user_info.id
                                                            )],
                                                            client: client_message.result.client,
                                                        },
                                                    )
                                                    .await;
                                                if let Ok(response) = result {
                                                    let _ = socket
                                                        .send(Message::Text(Utf8Bytes::from(json!({
                                                            "params": {
                                                                "channel": response.channels[0].channel,
                                                                "token": response.channels[0].token
                                                            },
                                                            "method": 1,
                                                            "id": 2
                                                        }).to_string())))
                                                        .await
                                                        .map_err(|e| log::error!("{}", e.to_string()));
                                                }
                                            }
                                            WebsocketMessage::Donation(donation_message) => {
                                                let donation = donation_message.result.data.data;
                                                #[cfg(not(debug_assertions))]
                                                if donation.payin_system.is_none() {
                                                    continue;
                                                }
                                                let _ = on_new_donation(
                                                    donation.id.to_string(),
                                                    ServiceType::DonationAlerts,
                                                    donation.username,
                                                    donation.currency,
                                                    donation.amount,
                                                    Some(donation.message),
                                                    &app,
                                                )
                                                .await;
                                            }
                                        }
                                    }
                                }

                                Ok(Message::Close(_)) => {
                                    log::warn!("Donation Alerts closed connection.");
                                    break;
                                }
                                Err(e) => {
                                    log::error!("Donation Alerts websocket error: {}", e);
                                    break;
                                }
                                _ => {}
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to connect: {}. Retrying in 5s...", e);
                        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                    }
                }
            }
        });

        Ok(())
    }

    async fn get_auth_token(
        &self,
        reqwest_client: &reqwest::Client,
        token: &str,
    ) -> Result<String, String> {
        let response = reqwest_client
            .get(format!(
                "https://www.donationalerts.com/api/v1/token/widget?token={}",
                token
            ))
            .send()
            .await
            .map_err(|e| {
                log::error!("Failed to send auth token request: {}", e);
                e.to_string()
            })?;
        if response.status().is_success() {
            let json: AuthTokenResponse = response.json().await.map_err(|e| {
                log::error!("Failed to parse auth token response: {}", e);
                e.to_string()
            })?;
            Ok(json.data.token)
        } else {
            let error = format!("Failed to get token: HTTP {}", response.status());
            log::error!("{}", error);
            Err(error)
        }
    }

    async fn get_user_info(
        &self,
        reqwest_client: &reqwest::Client,
        auth_token: &str,
    ) -> Result<UserInfo, String> {
        let response = reqwest_client
            .get("https://www.donationalerts.com/api/v1/user/widget")
            .bearer_auth(auth_token)
            .send()
            .await
            .map_err(|e| {
                log::error!("Failed to send user info request: {}", e);
                e.to_string()
            })?;
        if response.status().is_success() {
            let json: UserInfoResponse = response.json().await.map_err(|e| {
                log::error!("Failed to parse user info response: {}", e);
                e.to_string()
            })?;
            Ok(json.data)
        } else {
            let error = format!("Failed to get user info: HTTP {}", response.status());
            log::error!("{}", error);
            Err(error)
        }
    }

    async fn subscribe(
        &self,
        reqwest_client: &reqwest::Client,
        auth_token: &str,
        body: SubscriptionBody,
    ) -> Result<ChannelsResponse, String> {
        let response = reqwest_client
            .post("https://www.donationalerts.com/api/v1/centrifuge/subscribe")
            .bearer_auth(auth_token)
            .json(&body)
            .send()
            .await
            .map_err(|e| {
                log::error!("Failed to send subscription request: {}", e);
                e.to_string()
            })?;
        if response.status().is_success() {
            let json: ChannelsResponse = response.json().await.map_err(|e| {
                log::error!("Failed to parse channels response: {}", e);
                e.to_string()
            })?;
            Ok(json)
        } else {
            let error = format!("Failed to subscribe: HTTP {}", response.status());
            log::error!("{}", error);
            Err(error)
        }
    }

    pub async fn sign_out(&self, app: &AppHandle) -> Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        database_service
            .update_service_auth(ServiceType::DonationAlerts, None, false)
            .await?;
        self.is_close_connection.store(true, Ordering::Relaxed);
        Ok(())
    }
}
