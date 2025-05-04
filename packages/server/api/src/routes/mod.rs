use axum::{routing::post, Router};
use tower_http::trace::TraceLayer;

use crate::{handlers, models::AppState};

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/preview", post(handlers::preview::handle_preview))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
