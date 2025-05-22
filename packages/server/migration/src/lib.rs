pub use sea_orm_migration::prelude::*;

mod m20250522_115042_create_user_table;
mod m20250522_121410_create_project_table;
mod m20250522_121530_create_pipeline_table;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20250522_115042_create_user_table::Migration),
            Box::new(m20250522_121410_create_project_table::Migration),
            Box::new(m20250522_121530_create_pipeline_table::Migration),
        ]
    }
}
