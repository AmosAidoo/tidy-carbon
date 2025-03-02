import { ASTTypes, BinaryExpressionOperators, ExpressionStatementTypes } from "../types/ast"

function evaluateExpressionStatement(node: any) {
  switch (node.type) {
    case ExpressionStatementTypes.Literal: {
      return node.value
    }
    case ExpressionStatementTypes.BinaryExpression: {
      const leftValue: any = evaluateExpressionStatement(node.left)
      const rightValue: any = evaluateExpressionStatement(node.right)

      switch (node.operator) {
        case BinaryExpressionOperators.ADDITION: {
          return leftValue + rightValue
        }
        case BinaryExpressionOperators.SUBTRACTION: {
          return leftValue - rightValue
        }
        case BinaryExpressionOperators.MULTIPLICATION: {
          return leftValue * rightValue
        }
        case BinaryExpressionOperators.DIVISION: {
          return leftValue / rightValue
        }
      }
    }
  }
}


export function evaluate(ast: any) {
  switch (ast.type) {
    case ASTTypes.Program: {
      
      break
    }

    case ASTTypes.BlockStatement: {
      // const context = {}
      for (let i = 0; i < ast.body.length - 1; i++) {
        // Idea here is to build up context which will be
        // used in the final return statement
      }
      // Process RETURN statement
      
      break
    }

    case ASTTypes.ExpressionStatement: {
      const results = evaluateExpressionStatement(ast.expression)
      return results
    }

    case ASTTypes.ReturnStatement: {

      break
    }

    default: {
      console.log("Invalid type:", ast.type)
    }
  }
}