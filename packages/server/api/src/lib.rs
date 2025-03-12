use std::env;
use anyhow::Ok;
use sea_orm::{Database, DatabaseConnection};
use axum::{
    routing::{get, post},
    Router
};
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn start() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    dotenvy::dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL is not set in .env file");
    let host = env::var("HOST").expect("HOST is not set in .env file");
    let port: String = env::var("PORT").expect("PORT is not set in .env file");
    let server_url = format!("{host}:{port}");

    let conn = Database::connect(db_url).await.expect("Database connection failed");
    
    let state = AppState { conn };

    let app = Router::new()
        .route("/preview", post(preview))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = TcpListener::bind(&server_url).await.unwrap();
    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await?;

    Ok(())
}

#[derive(Clone)]
struct AppState {
    conn: DatabaseConnection
}

async fn preview() {}

pub fn main() {
    let result = start();

    if let Some(err) = result.err() {
        println!("Error: {err}")
    }
}