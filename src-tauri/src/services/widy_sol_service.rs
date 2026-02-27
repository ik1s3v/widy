use anchor_client::{
    solana_sdk::{commitment_config::CommitmentConfig, signature::Keypair},
    Client, Cluster, EventContext,
};
use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use entity::service::{ServiceAuth, ServiceType, WidyAuth};
use serde::{Deserialize, Serialize};
use serde_qs;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use tokio::sync::broadcast;

use crate::{
    constants::USDT_MULTIPLICATION,
    enums::AppEvent,
    repositories::ServicesRepository,
    services::{DatabaseService, DeepLinkHandler, EventMessage, WebSocketBroadcaster},
    utils::on_new_donation,
};

#[derive(Debug, Clone)]
#[event]
pub struct DonationEvent {
    pub message: Option<String>,
    pub name: Option<String>,
    pub amount: u64,
    pub donation_referral_amount: u64,
    pub user_amount: u64,
    pub user_referral_amount: u64,
    pub fee_recipient_amount: u64,
    pub user: Pubkey,
    pub sender: Pubkey,
    pub fee_recipient: Pubkey,
    pub donation_referral: Pubkey,
    pub user_referral: Pubkey,
}
pub enum WidyProgramEvent {
    Donation(DonationEvent),
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WidyNetwork {
    Ton,
    Sol,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DeepLinkQueryParams {
    pub nonce: String,
    pub donation_account_name: String,
    pub donation_account_address: String,
    pub user: String,
    pub network: WidyNetwork,
}

pub struct WidySolService {
    pub nonce: Arc<Mutex<Option<String>>>,
    pub widy_sol_program_id: String,
    sign_out_sender: broadcast::Sender<()>,
}
impl DeepLinkHandler for WidySolService {
    fn can_handle(&self, url: &url::Url) -> bool {
        let Some(query) = url.query() else {
            return false;
        };
        let Ok(query_params) = serde_qs::from_str::<DeepLinkQueryParams>(query) else {
            return false;
        };

        url.host_str() == Some("create-donation-account")
            && query_params.network == WidyNetwork::Sol
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
            let widy_sol_service = app_clone.state::<Arc<WidySolService>>();
            let database_service = app_clone.state::<DatabaseService>();
            let websocket_broadcaster = app_clone.state::<WebSocketBroadcaster>();

            let _ = database_service
                .update_service(entity::service::Model {
                    id: ServiceType::WidySol,
                    auth: Some(ServiceAuth::Widy(WidyAuth {
                        donation_account_name: query_params.donation_account_name.clone(),
                        user: query_params.user.clone(),
                        donation_account_address: query_params.donation_account_address.clone(),
                    })),
                    settings: None,
                    authorized: true,
                })
                .await;

            if let Err(e) = widy_sol_service.connect(&app_clone).await {
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
impl WidySolService {
    pub fn new(widy_program_id: &String) -> Self {
        let (tx, _) = broadcast::channel(1);
        Self {
            nonce: Arc::new(Mutex::new(None)),
            widy_sol_program_id: widy_program_id.clone(),
            sign_out_sender: tx,
        }
    }

    pub async fn connect(&self, app: &AppHandle) -> core::result::Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        let service = database_service
            .get_service_with_auth_by_id(ServiceType::WidySol)
            .await?;
        if let Some(entity::service::Model {
            authorized: true,
            auth: Some(ServiceAuth::Widy(auth)),
            ..
        }) = service
        {
            let app_clone = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = Self::subscribe_to_donation_event(app_clone, auth.user).await {
                    ::log::error!("Failed to listen to program events: {}", e);
                }
            });
        }
        Ok(())
    }

    async fn subscribe_to_donation_event(
        app: AppHandle,
        user: String,
    ) -> core::result::Result<(), Box<dyn std::error::Error>> {
        let widy_sol_service = app.state::<Arc<WidySolService>>();
        let mut sign_out_receiver = widy_sol_service.sign_out_sender.subscribe();
        let payer = Keypair::new();
        #[cfg(debug_assertions)]
        let cluster = Cluster::Devnet;
        #[cfg(not(debug_assertions))]
        let cluster = Cluster::Mainnet;
        let client =
            Client::new_with_options(cluster, Arc::new(payer), CommitmentConfig::finalized());

        let program = client.program(Pubkey::from_str_const(
            &widy_sol_service.widy_sol_program_id,
        ))?;
        let subscription = program
            .on(move |ctx: &EventContext, event: DonationEvent| {
                let app = app.clone();
                let signature = ctx.signature.to_string();
                let name = match event.name {
                    Some(name) => match name.as_str() {
                        "" => "Anonymous".to_string(),
                        _ => name,
                    },
                    None => "Anonymous".to_string(),
                };
                let amount = event.amount;
                let event_user = event.user;
                let message = event.message.clone();
                if user == event_user.to_string() {
                    tauri::async_runtime::spawn(async move {
                        let _ = on_new_donation(
                            signature,
                            ServiceType::WidySol,
                            name,
                            entity::settings::Currency::USD,
                            amount as f64 / USDT_MULTIPLICATION,
                            message.clone(),
                            app,
                        )
                        .await;
                    });
                }
            })
            .await?;

        sign_out_receiver.recv().await.ok();
        subscription.unsubscribe().await;
        Ok(())
    }

    pub async fn sign_out(&self, app: &AppHandle) -> core::result::Result<(), String> {
        let database_service = app.state::<DatabaseService>();
        database_service
            .update_service(entity::service::Model {
                id: ServiceType::WidySol,
                settings: None,
                auth: None,
                authorized: false,
            })
            .await?;
        let _ = self.sign_out_sender.send(());
        Ok(())
    }
}
