use sea_orm_migration::{prelude::*, schema::*};

use super::m20250522_115042_create_user_table::User;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Project::Table)
                    .if_not_exists()
                    .col(pk_uuid(Project::Id))
                    .col(string(Project::Title))
                    .col(string(Project::Description))
                    .col(uuid(Project::UserId))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk-project-user_id")
                            .from(Project::Table, Project::UserId)
                            .to(User::Table, User::Id),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Project::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Project {
    Table,
    Id,
    Title,
    Description,
    UserId,
}
