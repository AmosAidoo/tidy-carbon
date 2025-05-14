use std::{collections::HashMap, sync::Arc};

use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};

use crate::extractors::claims::Auth0Config;

#[derive(Clone)]
pub struct AppState {
    pub conn: DatabaseConnection,
    pub auth0_config: Arc<Auth0Config>,
}

#[derive(Debug, Deserialize)]
pub enum FilterConfigConditions {
    Equals,
    NotEquals,
    GreaterThan,
    LessThan,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterRule {
    pub field: String,
    pub condition: FilterConfigConditions,
    pub value: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub enum FilterGroupOperator {
    AND,
    OR,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FilterGroup {
    pub operator: FilterGroupOperator,
    pub conditions: Vec<FilterCondition>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum FilterCondition {
    Rule(FilterRule),
    Group(Box<FilterGroup>),
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum NodeConfig {
    // Source Types

    // Destination Types

    // Transformation Types
    Filter { rules: FilterGroup },
    Map {},
    Join {},
    Aggregate {},
    Sort {},
    Select { fields: Vec<String> },
}

#[derive(Debug, Deserialize)]
pub enum NodeType {
    Source,
    Transformation,
    Destination,
}

#[derive(Debug, Deserialize)]
pub struct Node {
    pub id: String,
    pub r#type: NodeType,
    pub config: Option<NodeConfig>,
}

#[derive(Debug, Deserialize)]
pub struct Edge {
    pub id: String,
    pub source: String,
    pub target: String,
}

#[derive(Debug, Deserialize)]
pub struct PreviewRequest {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaField {
    pub name: String,
    pub data_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewResponse {
    pub incoming_schema: Vec<SchemaField>,
    pub schema: Vec<SchemaField>,
    pub data: Vec<Vec<String>>,
}

/// This type is the adjacency list representation
/// of our DAG
pub type AdjacencyList = HashMap<String, Vec<String>>;

impl PreviewRequest {
    pub fn to_adjacency_list(&self) -> AdjacencyList {
        let mut results = AdjacencyList::new();
        for edge in self.edges.iter() {
            let entry = results.entry(edge.source.clone()).or_insert(vec![]);
            entry.push(edge.target.clone());
        }
        results
    }
}
