use entity::{
    service::{ServiceAuth, ServiceType, StreamLabsAuth},
    settings::Currency,
};
use futures::FutureExt;
use rust_socketio::{asynchronous::ClientBuilder, Payload, TransportType};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::sync::broadcast;

use crate::{repositories::ServicesRepository, services::DatabaseService, utils::on_new_donation};

#[derive(Debug, Clone, Deserialize, Serialize)]
struct DonationMessage {
    message: Vec<Donation>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
struct Donation {
    _id: String,
    amount: f64,
    currency: Currency,
    message: Option<String>,
    from: Option<String>,
    #[serde(rename = "isTest")]
    is_test: bool,
}

pub struct StreamLabsService {
    sign_out_sender: broadcast::Sender<()>,
}

impl StreamLabsService {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(1);
        Self {
            sign_out_sender: tx,
        }
    }

    pub async fn connect(&self, app: &AppHandle) -> Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        let service = database_service
            .get_service_with_auth_by_id(entity::service::ServiceType::StreamLabs)
            .await?;
        if let Some(entity::service::Model {
            id: ServiceType::StreamLabs,
            auth: Some(ServiceAuth::StreamLabs(auth)),
            ..
        }) = service
        {
            if let Err(e) = self.run_socket_io_client(app.clone(), auth.jwt).await {
                database_service
                    .update_service_auth(ServiceType::StreamLabs, None, false)
                    .await
                    .map_err(|e| format!("Failed to clear auth after connection error: {e}"))?;

                return Err(e);
            }
        }

        Ok(())
    }

    async fn run_socket_io_client(&self, app: AppHandle, jwt: String) -> Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        database_service
            .update_service_auth(
                ServiceType::StreamLabs,
                Some(ServiceAuth::StreamLabs(StreamLabsAuth { jwt: jwt.clone() })),
                true,
            )
            .await?;
        tauri::async_runtime::spawn(async move {
            let stream_labs_service = app.state::<StreamLabsService>();
            let mut sign_out_receiver = stream_labs_service.sign_out_sender.subscribe();
            let socket =
                ClientBuilder::new(format!("https://sockets.streamlabs.com?token={}", jwt))
                    .transport_type(TransportType::Websocket)
                    .on("event", move |payload, _socket| {
                        let app_clone = app.clone();
                        async move {
                            if let Payload::Text(values) = payload {
                                if let Some(value) = values.first() {
                                    if let Ok(donation_message) =
                                        serde_json::from_value::<DonationMessage>(value.clone())
                                    {
                                        let donation = donation_message.message[0].clone();
                                        #[cfg(not(debug_assertions))]
                                        if donation.is_test {
                                            return;
                                        }
                                        let _ = on_new_donation(
                                            donation._id,
                                            ServiceType::StreamLabs,
                                            donation.from,
                                            donation.currency,
                                            donation.amount,
                                            donation.message,
                                            &app_clone,
                                        )
                                        .await;
                                    }
                                }
                            }
                        }
                        .boxed()
                    })
                    .connect()
                    .await
                    .map_err(|e| {
                        log::error!("Failed to connect to StreamLabs Socket.IO: {e}");
                    })
                    .unwrap();
            sign_out_receiver.recv().await.ok();
            socket.disconnect().await.unwrap();
        });
        Ok(())
    }

    pub async fn sign_out(&self, app: &AppHandle) -> core::result::Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        database_service
            .update_service(entity::service::Model {
                id: ServiceType::StreamLabs,
                settings: None,
                auth: None,
                authorized: false,
            })
            .await?;
        let _ = self.sign_out_sender.send(());
        Ok(())
    }
}
