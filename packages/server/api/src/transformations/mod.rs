use datafusion::prelude::{col, lit, DataFrame, Expr, SessionContext};

use crate::models::{
    FilterCondition, FilterConfigConditions, FilterGroup, FilterGroupOperator, Node, NodeConfig,
};

fn parse_literal(s: &str) -> Expr {
    if let std::result::Result::Ok(i) = s.parse::<i64>() {
        lit(i)
    } else if let std::result::Result::Ok(f) = s.parse::<f64>() {
        lit(f)
    } else if let std::result::Result::Ok(b) = s.parse::<bool>() {
        lit(b)
    } else {
        lit(s)
    }
}

fn build_filter_predicate(group: &FilterGroup) -> Expr {
    let mut exprs: Vec<Expr> = group
        .conditions
        .iter()
        .map(|cond| match cond {
            FilterCondition::Rule(rule) => {
                let left = col(&rule.field);
                let right = parse_literal(&rule.value.as_str().unwrap_or(""));

                match rule.condition {
                    FilterConfigConditions::Equals => left.eq(right),
                    FilterConfigConditions::NotEquals => left.not_eq(right),
                    FilterConfigConditions::GreaterThan => left.gt(right),
                    FilterConfigConditions::LessThan => left.lt(right),
                }
            }
            FilterCondition::Group(group) => build_filter_predicate(group),
        })
        .collect();

    let mut result = exprs.remove(0);
    for expr in exprs {
        result = match group.operator {
            FilterGroupOperator::AND => result.and(expr),
            FilterGroupOperator::OR => result.or(expr),
        };
    }
    result
}

pub async fn apply_transformation(
    df: DataFrame,
    node: &Node,
    ctx: &SessionContext,
) -> anyhow::Result<DataFrame> {
    if let Some(config) = node.config.as_ref() {
        match config {
            NodeConfig::Filter { rules } => {
                if rules.conditions.len() == 0 {
                    return Ok(df);
                }
                let predicate = build_filter_predicate(rules);
                let df = df.filter(predicate)?;
                Ok(df)
            }
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
