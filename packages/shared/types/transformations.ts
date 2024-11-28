// Common Enum for Transformation Types
export enum TransformationType {
  Filter = "filter",
  Map = "map",
  Join = "join",
  Aggregate = "aggregate",
  Sort = "sort",
  Select = "select",
}

// Type Definitions for Each Transformation Config

// Filter Config
export enum FilterConfigConditions {
  Equals = "equals",
  NotEquals = "not equals",
  GreaterThan = "greater than",
  LessThan = "less than"
}

export interface FilterCondition {
  field: string
  condition: FilterConfigConditions
  value: any
}

export interface FilterGroup {
  operator: "AND" | "OR"
  conditions: (FilterCondition | FilterGroup)[]
}

export interface FilterConfig {
  type: TransformationType.Filter
  field: string
  condition: FilterConfigConditions
  value: any
  rules?: FilterGroup
}

// Map Config
export interface MapConfig {
  type: TransformationType.Map
  field: string
  mappingFunction: string // JavaScript function as a string
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
