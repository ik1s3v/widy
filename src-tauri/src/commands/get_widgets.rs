use crate::{repositories::WidgetsRepository, services::DatabaseService};
use entity::widget::*;
use tauri::State;

#[tauri::command]
pub async fn get_widgets(
    database_service: State<'_, DatabaseService>,
) -> Result<Vec<Model>, String> {
    database_service.get_widgets().await
}
