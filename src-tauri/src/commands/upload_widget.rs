use entity::widget::Manifest;
use tauri::State;

use crate::{repositories::WidgetsRepository, services::DatabaseService};

#[tauri::command]
pub async fn upload_widget(
    database_service: State<'_, DatabaseService>,
    dev_path: String,
    manifest: Manifest,
) -> Result<(), String> {
    database_service.upload_widget(dev_path, manifest).await
}
