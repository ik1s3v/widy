use tauri::{AppHandle, State};

use crate::services::StreamLabsService;

#[tauri::command]
pub async fn stream_labs_sign_out(
    app: AppHandle,
    stream_labs_service: State<'_, StreamLabsService>,
) -> Result<(), String> {
    stream_labs_service.sign_out(&app).await
}
