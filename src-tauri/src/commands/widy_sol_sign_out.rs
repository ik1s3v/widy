use std::sync::Arc;

use tauri::{AppHandle, State};

use crate::services::WidySolService;

#[tauri::command]
pub async fn widy_sol_sign_out(
    app: AppHandle,
    widy_sol_service: State<'_, Arc<WidySolService>>,
) -> Result<(), String> {
    widy_sol_service.sign_out(&app).await?;
    Ok(())
}
