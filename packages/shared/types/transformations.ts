// Common Enum for Transformation Types
export enum TransformationType {
  Filter = "Filter",
  Map = "Map",
  Join = "Join",
  Aggregate = "Aggregate",
  Sort = "Sort",
  Select = "Select",
}

// Type Definitions for Each Transformation Config

// Filter Config
export enum FilterConfigConditions {
  Equals = "Equals",
  NotEquals = "NotEquals",
  GreaterThan = "GreaterThan",
  LessThan = "LessThan"
}

export interface FilterRule {
  type: "Rule"
  field: string
  condition: FilterConfigConditions
  value: any
}

export enum FilterGroupOperator {
  AND = "AND",
  OR = "OR"
}

export interface FilterGroup {
  type: "Group"
  operator: FilterGroupOperator
  conditions: (FilterRule | FilterGroup)[]
}

export interface FilterConfig {
  type: TransformationType.Filter
  rules: FilterGroup
}

export interface MapConfigField {
  key: string
  expression: string
}

// Map Config
export interface MapConfig {
  type: TransformationType.Map
  fields: MapConfigField[]
}

// Join Config
export enum JoinType {
  Inner = "inner",
  Left = "left",
  Right = "right"
}

export interface JoinConfig {
  type: TransformationType.Join
  joinType: JoinType
  leftTable?: string
  rightTable?: string
  leftField: string
  rightField: string
}

// Aggregate Config
export interface AggregateConfig {
  type: TransformationType.Aggregate
  groupByField: string
  aggregationFunction: "sum" | "avg" | "count"
  targetField: string
}

// Sort Config
export interface SortConfig {
  type: TransformationType.Sort
  field: string
  order: "ascending" | "descending"
}

// Select Config
export interface SelectConfig {
  type: TransformationType.Select
  fields: string[]
}

// Union Type for All Transformation Configs
export type TransformationConfig =
  | FilterConfig
  | MapConfig
  | JoinConfig
  | AggregateConfig
  | SortConfig
  | SelectConfig
