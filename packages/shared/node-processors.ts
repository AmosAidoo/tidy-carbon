import { FilterConfig, FilterConfigConditions, JoinConfig, JoinType, MapConfig, SelectConfig, TransformationConfig, TransformationType } from "./types/transformations"

function extractFields(inputData: any[]) {
  if (Array.isArray(inputData) && inputData.length) {
    return Object.keys(inputData[0])
  }
  return []
}

export function processNode(config: TransformationConfig, inputData: any[]) {
  switch (config.type) {
    case TransformationType.Filter:
      return applySimpleFilter(config, inputData)
    case TransformationType.Select:
      return applySelect(config, inputData)
    case TransformationType.Join:
      return applyJoin(config, inputData)
    default:
      return { fields: extractFields(inputData), output: inputData }
  }
}

export function applySimpleFilter(config: FilterConfig, data: any[]) {
  const { field, condition, value } = config

  const conditionHandlers = {
    [FilterConfigConditions.Equals]: (a: any, b: any) => a == b,
    [FilterConfigConditions.NotEquals]: (a: any, b: any) => a != b,
    [FilterConfigConditions.GreaterThan]: (a: any, b: any) => a > b,
    [FilterConfigConditions.LessThan]: (a: any, b: any) => a < b,
  }

  const handler = conditionHandlers[condition]

  if (!handler) {
    throw new Error(`Unsupported filter condition: ${condition}`)
  }

  return { fields: extractFields(data), output: data.filter((item) => handler(item[field], value)) }
}

export function applyMap(config: MapConfig, data: any[]) {}

export function applySelect(config: SelectConfig, data: any[]) {
  const { fields } = config

  const output = data.map((item) =>
    Object.fromEntries(
      fields.map((field) => [field, item[field]])
    )
  )

  return { fields: extractFields(data), output }
}

export function applySort(config: TransformationConfig, data: any[]) {}

export function applyJoin(config: JoinConfig, data: any[]) {
  const { joinType, leftField, rightField } = config

  const leftData = data[0]
  const rightData = data[1]

  if (!Array.isArray(leftData) || !Array.isArray(rightData)) {
    throw new Error("applyJoin expects inputData to be an array of two arrays")
  }

  if (!leftField || !rightField) {
    throw new Error("keys are required to perform join operation")
  }

  // Ensure join keys are arrays for multiple key support
  const leftKeys = Array.isArray(leftField) ? leftField : [leftField]
  const rightKeys = Array.isArray(rightField) ? rightField : [rightField]

  if (leftKeys.length !== rightKeys.length) {
    throw new Error("The number of left and right join keys must match")
  }

  const allLeftKeys = leftData.length ? Object.keys(leftData[0]) : []
  const allRightKeys = rightData.length ? Object.keys(rightData[0]) : []

  // Find common keys to apply prefixes, excluding join fields
  const commonKeys = allLeftKeys.filter(key => allRightKeys.includes(key) && !leftKeys.includes(key) && !rightKeys.includes(key))

  const resolveFields = (item: any, keys: string[], prefix: string) =>
    Object.fromEntries(keys.map(key => {
      const resolvedKey = commonKeys.includes(key) ? `${prefix}${key}` : key
      return [resolvedKey, item ? item[key] : null]
    }))

  // Helper to check if two rows match based on all join keys
  const rowsMatch = (leftItem: any, rightItem: any) =>
    leftKeys.every((leftKey, index) => leftItem[leftKey] === rightItem[rightKeys[index]])

  const result: any[] = []

  if (joinType === JoinType.Inner || joinType === JoinType.Left) {
    leftData.forEach(leftItem => {
      const matches = rightData.filter(rightItem => rowsMatch(leftItem, rightItem))
      if (matches.length > 0) {
        matches.forEach(match => result.push({
          ...resolveFields(leftItem, allLeftKeys, 'left_'),
          ...resolveFields(match, allRightKeys, 'right_')
        }))
      } else if (joinType === JoinType.Left) {
        result.push({
          ...resolveFields(leftItem, allLeftKeys, 'left_'),
          ...Object.fromEntries(
            allRightKeys.map(key => [
              commonKeys.includes(key) ? `right_${key}` : key,
              null
            ])
          )
        })
      }
    })
  }

  if (joinType === JoinType.Right) {
    rightData.forEach(rightItem => {
      const matches = leftData.filter(leftItem => rowsMatch(leftItem, rightItem))
      if (matches.length > 0) {
        matches.forEach(match => result.push({
          ...resolveFields(match, allLeftKeys, 'left_'),
          ...resolveFields(rightItem, allRightKeys, 'right_')
        }))
      } else {
        result.push({
          ...Object.fromEntries(
            allLeftKeys.map(key => [
              commonKeys.includes(key) ? `left_${key}` : key,
              null
            ])
          ),
          ...resolveFields(rightItem, allRightKeys, 'right_')
        })
      }
    })
  }

  const outputFields = [
    ...allLeftKeys.map(key => (commonKeys.includes(key) ? `left_${key}` : key)),
    ...allRightKeys.map(key => (commonKeys.includes(key) ? `right_${key}` : key))
  ]

  return { fields: outputFields, output: result }
}



