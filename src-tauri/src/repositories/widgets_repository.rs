use crate::services::DatabaseService;
use async_trait::async_trait;
use entity::widget::*;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use uuid::Uuid;

#[async_trait]
pub trait WidgetsRepository: Send + Sync {
    async fn get_widget_by_name(&self, name: String) -> Result<Option<Model>, String>;
    async fn get_widgets(&self) -> Result<Vec<Model>, String>;
    async fn add_widget(&self, dev_path: Option<String>, manifest: Manifest) -> Result<(), String>;
    async fn delete_widget_by_id(&self, id: String) -> Result<(), String>;
}

#[async_trait]
impl WidgetsRepository for DatabaseService {
    async fn get_widget_by_name(&self, name: String) -> Result<Option<Model>, String> {
        Entity::find()
            .filter(Column::Name.eq(name))
            .one(&self.connection)
            .await
            .map_err(|e| {
                log::error!("Get widget by name error: {}", e);
                e.to_string()
            })
    }
    async fn get_widgets(&self) -> Result<Vec<Model>, String> {
        Entity::find().all(&self.connection).await.map_err(|e| {
            log::error!("Get widgets error: {}", e);
            e.to_string()
        })
    }
    async fn add_widget(&self, dev_path: Option<String>, manifest: Manifest) -> Result<(), String> {
        ActiveModel::builder()
            .set_id(Uuid::new_v4().to_string())
            .set_name(manifest.name.clone())
            .set_manifest(manifest)
            .set_dev_path(dev_path)
            .insert(&self.connection)
            .await
            .map_err(|e| {
                log::error!("Upload widget error: {}", e);
                e.to_string()
            })?;

        Ok(())
    }
    async fn delete_widget_by_id(&self, id: String) -> Result<(), String> {
        Entity::delete_by_id(id)
            .exec(&self.connection)
            .await
            .map_err(|e| {
                log::error!("Delete widget by id error: {}", e);
                e.to_string()
            })?;
        Ok(())
    }
}
