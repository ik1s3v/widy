use sea_orm_migration::{prelude::*, schema::*};
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Widgets::Table)
                    .if_not_exists()
                    .col(pk_uuid(Widgets::Id))
                    .col(string(Widgets::Name))
                    .col(string(Widgets::Manifest))
                    .col(string_null(Widgets::DevPath))
                    .col(string_null(Widgets::Storage))
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Widgets::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum Widgets {
    #[sea_orm(iden = "widgets")]
    Table,
    Id,
    Name,
    Manifest,
    DevPath,
    Storage,
}
