use std::sync::Arc;

use tauri::{AppHandle, State};

use crate::services::WidyTonService;

#[tauri::command]
pub async fn widy_ton_sign_out(
    app: AppHandle,
    widy_ton_service: State<'_, Arc<WidyTonService>>,
) -> Result<(), String> {
    widy_ton_service.sign_out(&app).await?;
    Ok(())
}
