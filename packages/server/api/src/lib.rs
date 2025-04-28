use anyhow::Ok;
use axum::{
    extract::State,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use sea_orm::{Database, DatabaseConnection};
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, VecDeque},
    env,
};
use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;

use datafusion::{
    arrow::{
        array::{Float32Array, Float64Array, Int32Array, Int64Array, StringArray},
        datatypes::DataType,
    },
    prelude::*,
};

#[tokio::main]
async fn start() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    dotenvy::dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL is not set in .env file");
    let host = env::var("HOST").expect("HOST is not set in .env file");
    let port: String = env::var("PORT").expect("PORT is not set in .env file");
    let server_url = format!("{host}:{port}");

    let conn = Database::connect(db_url)
        .await
        .expect("Database connection failed");

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
    conn: DatabaseConnection,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
enum NodeConfig {
    // Source Types

    // Destination Types

    // Transformation Types
    Filter {},
    Map {},
    Join {},
    Aggregate {},
    Sort {},
    Select { fields: Vec<String> },
}

#[derive(Debug, Deserialize)]
enum NodeType {
    Source,
    Transformation,
    Destination,
}

#[derive(Debug, Deserialize)]
struct Node {
    id: String,
    r#type: NodeType,
    config: Option<NodeConfig>,
}

#[derive(Debug, Deserialize)]
struct Edge {
    id: String,
    source: String,
    target: String,
}

#[derive(Debug, Deserialize)]
struct PreviewRequest {
    nodes: Vec<Node>,
    edges: Vec<Edge>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SchemaField {
    pub name: String,
    pub data_type: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PreviewResponse {
    pub incoming_schema: Vec<SchemaField>,
    pub schema: Vec<SchemaField>,
    pub data: Vec<Vec<String>>,
}

/// This type is the adjacency list representation
/// of our DAG
type AdjacencyList = HashMap<String, Vec<String>>;

impl PreviewRequest {
    fn to_adjacency_list(&self) -> AdjacencyList {
        let mut results = AdjacencyList::new();
        for edge in self.edges.iter() {
            let entry = results.entry(edge.source.clone()).or_insert(vec![]);
            entry.push(edge.target.clone());
        }
        results
    }
}

// Ported C++ version of Kahn's algorithm from GFGs
// https://www.geeksforgeeks.org/topological-sorting-indegree-based-solution/
fn topological_sort(g: &PreviewRequest) -> Vec<String> {
    let mut res = vec![];
    let graph: AdjacencyList = g.to_adjacency_list();

    let mut indegree: HashMap<&String, i32> = HashMap::new();
    for node in g.nodes.iter() {
        indegree.entry(&node.id).or_insert(0);
        let target_nodes = graph.get(&node.id);
        if let Some(nodes) = target_nodes {
            for target_node in nodes {
                let entry = indegree.entry(target_node).or_insert(0);
                *entry += 1;
            }
        }
    }

    let mut queue = VecDeque::new();
    for node in g.nodes.iter() {
        if let Some(val) = indegree.get(&node.id) {
            if *val == 0 {
                queue.push_back(&node.id);
            }
        }
    }

    while !queue.is_empty() {
        let node = queue.front();
        if let Some(n) = node {
            res.push((*n).to_string());

            let target_nodes = graph.get(*n);
            if let Some(nodes) = target_nodes {
                for target_node in nodes {
                    let entry = indegree.entry(target_node).or_default();
                    *entry -= 1;

                    if *entry == 0 {
                        queue.push_back(target_node);
                    }
                }
            }
        }
        queue.pop_front();
    }

    res
}

/// This handler will take a series of nodes and edges,
/// transform them and execute them in DataFusion
async fn preview(_state: State<AppState>, Json(input): Json<PreviewRequest>) -> impl IntoResponse {
    let topological_sort_order = topological_sort(&input);

    let ctx = SessionContext::new();
    let mut df = ctx
        .read_csv("./api/src/data.csv", CsvReadOptions::new())
        .await
        .unwrap();

    let mut incoming_schema = vec![];

    for node_id in topological_sort_order {
        let node = input.nodes.iter().find(|n| n.id == node_id);
        if let Some(n) = node {
            let batches = df.clone().collect().await.unwrap();
            // Incoming schema here would contain the correct schema
            // since our target node would always be last in the topological
            // sort order
            if let Some(batch) = batches.get(0) {
                let schema = batch.schema();
                incoming_schema = schema
                    .fields()
                    .iter()
                    .map(|f| SchemaField {
                        name: f.name().to_string(),
                        data_type: format!("{:?}", f.data_type()),
                    })
                    .collect();
            }
            df = apply_transformation(df, n, &ctx).await.unwrap();
        }
    }

    let batches = df.collect().await.unwrap();

    // Reference: https://github.com/apache/arrow-rs/blob/6.5.0/arrow/src/util/pretty.rs#L56-L76
    if batches.is_empty() {
        return Json(PreviewResponse {
            data: vec![],
            schema: vec![],
            incoming_schema: vec![],
        });
    }

    let mut schema_fields = Vec::new();
    let mut data_rows = Vec::new();

    let schema = batches[0].schema();

    for field in schema.fields() {
        schema_fields.push(SchemaField {
            name: field.name().to_string(),
            data_type: format!("{:?}", field.data_type()),
        });
    }

    for batch in batches.iter() {
        for row_index in 0..batch.num_rows() {
            let mut row_data = Vec::new();
            for col_index in 0..batch.num_columns() {
                let column = batch.column(col_index);
                let field = schema.field(col_index);
                let value = match field.data_type() {
                    DataType::Utf8 => {
                        let array = column.as_any().downcast_ref::<StringArray>().unwrap();
                        array.value(row_index).to_string()
                    }
                    DataType::Float32 => {
                        let array = column.as_any().downcast_ref::<Float32Array>().unwrap();
                        array.value(row_index).to_string()
                    }
                    DataType::Float64 => {
                        let array = column.as_any().downcast_ref::<Float64Array>().unwrap();
                        array.value(row_index).to_string()
                    }
                    DataType::Int32 => {
                        let array = column.as_any().downcast_ref::<Int32Array>().unwrap();
                        array.value(row_index).to_string()
                    }
                    DataType::Int64 => {
                        let array = column.as_any().downcast_ref::<Int64Array>().unwrap();
                        array.value(row_index).to_string()
                    }
                    _ => "<unsupported type>".to_string(),
                };
                row_data.push(value);
            }
            data_rows.push(row_data);
        }
    }

    Json(PreviewResponse {
        schema: schema_fields,
        data: data_rows,
        incoming_schema
    })
}

async fn apply_transformation(
    df: DataFrame,
    node: &Node,
    ctx: &SessionContext,
) -> anyhow::Result<DataFrame> {
    if let Some(config) = node.config.as_ref() {
        match config {
            NodeConfig::Filter {} => Ok(df),
            NodeConfig::Select { fields } => {
                let mut cols = vec![];
                for field in fields {
                    cols.push(field.as_str());
                }
                let df = df.select_columns(&cols)?;
                Ok(df)
            }
            NodeConfig::Aggregate {} => Ok(df),
            _ => Err(anyhow::anyhow!("Unknown transformation type")),
        }
    } else {
        Ok(df)
    }
}

pub fn main() {
    let result = start();

    if let Some(err) = result.err() {
        println!("Error: {err}")
    }
}

#[cfg(test)]
mod tests {}
