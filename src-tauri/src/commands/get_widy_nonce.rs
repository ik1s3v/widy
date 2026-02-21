use crate::services::{WidyNetwork, WidySolService, WidyTonService};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn get_widy_nonce(
    widy_sol_service: State<'_, Arc<WidySolService>>,
    widy_ton_service: State<'_, Arc<WidyTonService>>,
    network: WidyNetwork,
) -> Result<Option<String>, String> {
    let mut nonce;
    match network {
        WidyNetwork::Ton => {
            nonce = widy_ton_service.nonce.lock().unwrap();
        }
        WidyNetwork::Sol => {
            nonce = widy_sol_service.nonce.lock().unwrap();
        }
    }
    *nonce = Some(uuid::Uuid::new_v4().to_string());
    Ok(nonce.clone())
}
