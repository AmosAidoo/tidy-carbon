use std::collections::{HashMap, VecDeque};

use axum::{extract::State, response::IntoResponse, Json};
use datafusion::{
    arrow::{
        array::{Float32Array, Float64Array, Int32Array, Int64Array, StringArray},
        datatypes::DataType,
    },
    prelude::{CsvReadOptions, SessionContext},
};

use crate::{
    models::{AdjacencyList, AppState, PreviewRequest, PreviewResponse, SchemaField},
    transformations::apply_transformation,
};

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
pub async fn handle_preview(
    _state: State<AppState>,
    Json(input): Json<PreviewRequest>,
) -> impl IntoResponse {
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
        incoming_schema,
    })
}
