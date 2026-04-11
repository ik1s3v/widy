use entity::widget::Manifest;
use tauri::State;
use uuid::Uuid;

use crate::{repositories::WidgetsRepository, services::DatabaseService};

#[tauri::command]
pub async fn add_widget(
    database_service: State<'_, DatabaseService>,
    dev_path: Option<String>,
    manifest: Manifest,
) -> Result<(), String> {
    if let Some(dev_path) = dev_path.clone() {
        if let Some(_) = database_service
            .get_widget_by_dev_path(dev_path.clone())
            .await?
        {
            return Ok(());
        }
    }
    let id = Uuid::new_v4().to_string();
    database_service.add_widget(dev_path, manifest, id).await
}
