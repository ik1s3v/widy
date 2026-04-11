use entity::widget::Manifest;
use futures::StreamExt;
use tauri::State;
use tokio::{fs, io::AsyncWriteExt};
use uuid::Uuid;

use crate::{
    repositories::WidgetsRepository,
    services::{ConfigService, DatabaseService},
};

#[tauri::command]
pub async fn install_widget(
    reqwest_client: State<'_, reqwest::Client>,
    config_service: State<'_, ConfigService>,
    database_service: State<'_, DatabaseService>,
    manifest: Manifest,
) -> Result<(), String> {
    let widget = format!("{}-v{}", manifest.id, manifest.version);
    let widget_url = format!(
        "https://github.com/widy-fun/widgets/releases/download/{}/{}.zip",
        widget, widget
    );

    let mut stream = reqwest_client
        .get(&widget_url)
        .send()
        .await
        .map_err(|e| {
            log::error!("Filed to download widget: {}", e);
            e.to_string()
        })?
        .bytes_stream();

    fs::create_dir_all(&config_service.widgets_path)
        .await
        .map_err(|e| {
            log::error!("Filed to crate widgets directory: {}", e);
            e.to_string()
        })?;

    let zip_path = config_service.tmp_path.join(format!("{}.zip", widget));

    let mut zip_file = tokio::fs::File::create(zip_path.clone())
        .await
        .map_err(|e| {
            log::error!("Filed to crate widgets zip file: {}", e);
            e.to_string()
        })?;

    while let Some(Result::Ok(chunk)) = stream.next().await {
        zip_file.write_all(&chunk).await.map_err(|e| {
            log::error!("Filed write to zip file: {}", e);
            e.to_string()
        })?;
    }
    let id = Uuid::new_v4().to_string();
    let extract_path = config_service.widgets_path.join(&manifest.id).join(&id);
    let zip_path_clone = zip_path.clone();
    tokio::task::spawn_blocking(move || -> Result<(), String> {
        let file = std::fs::File::open(&zip_path_clone).map_err(|e| {
            log::error!("Filed to open widget zip file: {}", e);
            e.to_string()
        })?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| {
            log::error!("Filed to crate zip reader: {}", e);
            e.to_string()
        })?;
        archive.extract(&extract_path).map_err(|e| {
            log::error!("Filed to extract files from zip file: {}", e);
            e.to_string()
        })?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())??;

    fs::remove_file(&zip_path).await.map_err(|e| {
        log::error!("Filed to remove tmp zip file: {}", e);
        e.to_string()
    })?;
    database_service.add_widget(None, manifest, id).await?;
    Ok(())
}
