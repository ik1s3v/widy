use sea_orm_migration::prelude::{prelude::Uuid, *};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Settings::Table)
                    .add_column(
                        ColumnDef::new(Settings::WidgetToken)
                            .text()
                            .default(Uuid::new_v4().to_string()),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Settings::Table)
                    .drop_column(Settings::WidgetToken)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}
#[derive(Iden)]
enum Settings {
    Table,
    WidgetToken,
}
