use crate::{repositories::WidgetsRepository, services::DatabaseService};
use entity::widget::*;
use tauri::State;

#[tauri::command]
pub async fn get_widget_by_widget_id(
    database_service: State<'_, DatabaseService>,
    widget_id: String,
) -> Result<Option<Model>, String> {
    database_service.get_widget_by_widget_id(widget_id).await
}
