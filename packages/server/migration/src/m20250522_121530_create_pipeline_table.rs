use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Pipeline::Table)
                    .if_not_exists()
                    .col(pk_uuid(Pipeline::Id))
                    .col(string(Pipeline::Title))
                    .col(string(Pipeline::Description))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Pipeline::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Pipeline {
    Table,
    Id,
    Title,
    Description,
}
