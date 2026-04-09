use entity::widget;
use tauri::State;
use tokio::fs;

use crate::{
    repositories::WidgetsRepository,
    services::{ConfigService, DatabaseService},
};

#[tauri::command]
pub async fn delete_widget(
    database_service: State<'_, DatabaseService>,
    config_service: State<'_, ConfigService>,
    widget: widget::Model,
) -> Result<(), String> {
    database_service.delete_widget_by_id(widget.id).await?;
    if widget.dev_path.is_none() {
        fs::remove_dir_all(config_service.widgets_path.join(widget.manifest.id))
            .await
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
