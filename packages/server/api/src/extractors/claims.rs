use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use jsonwebtoken::{
    decode, decode_header,
    jwk::{AlgorithmParameters, JwkSet},
    Algorithm, DecodingKey, Validation,
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json, RequestPartsExt,
};
use thiserror::Error;

use crate::models::AppState;

#[derive(Debug, Serialize)]
pub struct ErrorMessage {
    pub error: Option<String>,
    pub error_description: Option<String>,
    pub message: String,
}

#[derive(Debug, Error)]
pub enum ClientError {
    #[error("invalid token")]
    InvalidToken,
    #[error("kid not found")]
    KidMissing,
    #[error("jwk not found")]
    JwkNotFound,
    #[error("unsupported algorithm")]
    UnsupportedAlgorithm(AlgorithmParameters),
    #[error("JWT decode error")]
    JwtError(#[from] jsonwebtoken::errors::Error),
    #[error("HTTP error")]
    ReqwestError(#[from] reqwest::Error),
    #[error("decode error")]
    DecodeError,
}

#[derive(Clone, Deserialize)]
pub struct Auth0Config {
    pub audience: String,
    pub domain: String,
}

impl Default for Auth0Config {
    fn default() -> Self {
        envy::prefixed("AUTH0_")
            .from_env()
            .expect("Provide missing environment variables for Auth0Client")
    }
}

impl IntoResponse for ClientError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ClientError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
            ClientError::KidMissing => (StatusCode::UNAUTHORIZED, "Missing 'kid' in JWT header"),
            ClientError::JwkNotFound => (StatusCode::UNAUTHORIZED, "Matching JWK not found"),
            ClientError::UnsupportedAlgorithm(_) => {
                (StatusCode::UNAUTHORIZED, "Unsupported algorithm")
            }
            ClientError::JwtError(_) => (StatusCode::UNAUTHORIZED, "Failed to decode JWT"),
            ClientError::ReqwestError(_) => (StatusCode::BAD_GATEWAY, "Failed to fetch JWKs"),
            ClientError::DecodeError => (
                StatusCode::UNAUTHORIZED,
                "Authorization header value must follow this format: Bearer access-token",
            ),
        };

        let body = Json(ErrorMessage {
            error: Some("invalid_token".to_string()),
            error_description: Some(message.to_string()),
            message: "Bad credentials".to_string(),
        });

        (status, body).into_response()
    }
}

#[derive(Debug, Deserialize)]
pub struct Claims {
    permissions: Option<HashSet<String>>,
}

impl Claims {
    pub fn validate_permissions(&self, required_permissions: &HashSet<String>) -> bool {
        self.permissions.as_ref().map_or(false, |permissions| {
            permissions.is_superset(required_permissions)
        })
    }
}

impl FromRequestParts<AppState> for Claims {
    type Rejection = ClientError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| ClientError::InvalidToken)?;

        let token = bearer.token();
        let header = decode_header(token).map_err(ClientError::JwtError)?;
        let kid = header.kid.ok_or(ClientError::KidMissing)?;

        let jwks_url = format!(
            "https://{}/.well-known/jwks.json",
            state.auth0_config.domain
        );
        let jwks: JwkSet = reqwest::get(&jwks_url)
            .await
            .map_err(|_| ClientError::InvalidToken)?
            .json()
            .await
            .map_err(|_| ClientError::InvalidToken)?;

        let jwk = jwks.find(&kid).ok_or(ClientError::JwkNotFound)?;

        let decoding_key = match &jwk.algorithm {
            AlgorithmParameters::RSA(rsa) => DecodingKey::from_rsa_components(&rsa.n, &rsa.e)
                .map_err(|_| ClientError::DecodeError)?,
            _ => return Err(ClientError::UnsupportedAlgorithm(jwk.algorithm.clone())),
        };

        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_audience(&[&state.auth0_config.audience]);
        validation.set_issuer(&[&format!("https://{}/", state.auth0_config.domain)]);

        let token_data = decode::<Claims>(token, &decoding_key, &validation)
            .map_err(|_| ClientError::InvalidToken)?;

        Ok(token_data.claims)
    }
}
