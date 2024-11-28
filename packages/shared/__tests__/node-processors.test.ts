import { applyJoin } from "../node-processors"
import { JoinType, JoinConfig, TransformationType } from "../types/transformations"

describe("applyJoin", () => {
  const leftData = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ]

  const rightData = [
    { userId: 1, age: 25 },
    { userId: 3, age: 30 },
    { userId: 4, age: 40 },
  ]

  test("should perform inner join", () => {
    const config: JoinConfig = {
      type: TransformationType.Join,
      joinType: JoinType.Inner,
      leftField: "id",
      rightField: "userId",
    }

    const result = applyJoin(config, [leftData, rightData])

    expect(result.output).toEqual([
      { id: 1, name: "Alice", userId: 1, age: 25 },
      { id: 3, name: "Charlie", userId: 3, age: 30 },
    ])
  })

  test("should perform left join", () => {
    const config: JoinConfig = {
      type: TransformationType.Join,
      joinType: JoinType.Left,
      leftField: "id",
      rightField: "userId",
    }

    const result = applyJoin(config, [leftData, rightData])

    expect(result.output).toEqual([
      { id: 1, name: "Alice", userId: 1, age: 25 },
      { id: 2, name: "Bob", userId: null, age: null },
      { id: 3, name: "Charlie", userId: 3, age: 30 },
    ])
  })

  test("should perform right join", () => {
    const config: JoinConfig = {
      type: TransformationType.Join,
      joinType: JoinType.Right,
      leftField: "id",
      rightField: "userId",
    }

    const result = applyJoin(config, [leftData, rightData])

    expect(result.output).toEqual([
      { id: 1, name: "Alice", userId: 1, age: 25 },
      { id: 3, name: "Charlie", userId: 3, age: 30 },
      { id: null, name: null, userId: 4, age: 40 },
    ])
  })

  test("should handle field name conflicts gracefully", () => {
    const leftData = [
      { id: 1, name: "Alice", age: 22 },
      { id: 2, name: "Bob", age: 30 },
      { id: 3, name: "Charlie", age: 40 },
    ]
    
    const rightData = [
      { userId: 1, name: "Alice", salary: 5000 },
      { userId: 3, name: "Charlie", salary: 7000 },
      { userId: 4, name: "David", salary: 8000 },
    ]

    const config: JoinConfig = {
      type: TransformationType.Join,
      joinType: JoinType.Left,
      leftField: "id",
      rightField: "userId",
    }
  
    const result = applyJoin(config, [leftData, rightData])
  
    expect(result.output).toEqual([
      {
        id: 1,
        left_name: "Alice",
        age: 22,
        userId: 1,
        right_name: "Alice",
        salary: 5000,
      },
      {
        id: 2,
        left_name: "Bob",
        age: 30,
        userId: null,
        right_name: null,
        salary: null,
      },
      {
        id: 3,
        left_name: "Charlie",
        age: 40,
        userId: 3,
        right_name: "Charlie",
        salary: 7000,
      },
    ])
  })
  
})
