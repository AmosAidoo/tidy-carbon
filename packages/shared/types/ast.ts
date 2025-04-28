export interface AST {
  
}

export enum ASTTypes {
  Program = "Program",
  ExpressionStatement = "ExpressionStatement",
  BlockStatement = "BlockStatement",
  ReturnStatement = "ReturnStatement"
}

export enum ExpressionStatementTypes {
  Literal = "Literal",
  BinaryExpression = "BinaryExpression"
}

export enum BinaryExpressionOperators {
  ADDITION = "+",
  SUBTRACTION = "-",
  MULTIPLICATION = "*",
  DIVISION = "/"
}