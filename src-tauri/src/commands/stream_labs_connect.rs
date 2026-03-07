use crate::services::StreamLabsService;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn stream_labs_connect(
    app: AppHandle,
    stream_labs_service: State<'_, StreamLabsService>,
) -> Result<(), String> {
    stream_labs_service.connect(&app).await
}
