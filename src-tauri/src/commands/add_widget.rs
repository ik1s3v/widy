use entity::widget::Manifest;
use tauri::State;

use crate::{repositories::WidgetsRepository, services::DatabaseService};

#[tauri::command]
pub async fn add_widget(
    database_service: State<'_, DatabaseService>,
    dev_path: Option<String>,
    manifest: Manifest,
) -> Result<(), String> {
    database_service.add_widget(dev_path, manifest).await
}
