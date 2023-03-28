import * as ts from 'typescript';
import * as path from 'path';
import * as objHash from 'object-hash';
import {PartialVisitorContext} from './VisitorContext.js';

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export const transformNode = (node: ts.Node, visitorContext: PartialVisitorContext): ts.Node => {
  if (ts.isCallExpression(node)) {
    const signature = visitorContext.checker.getResolvedSignature(node);
    if (
      signature !== undefined
      && signature.declaration !== undefined
      && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', 'runtime', 'TypeGuard.d.ts'))
      && node.typeArguments !== undefined
      && node.typeArguments.length === 1
    ) {
      const name = visitorContext.checker.getTypeAtLocation(signature.declaration).symbol.name;
      switch(name) {
        case 'valid':
        case 'assertType': {
          const typeArgument = node.typeArguments[0];
          const type = visitorContext.checker.getTypeFromTypeNode(typeArgument);
          const schema = visitorContext.schemaGenerator.getTypeDefinition(type, false, undefined, undefined, undefined, undefined, true);

          const expression = generateAst(schema);
          const hash = objHash(schema);
          if (expression) {
            const args = ts.factory.createNodeArray([...node.arguments, expression, ts.factory.createStringLiteral(hash)]);
            return ts.factory.updateCallExpression(node, node.expression, node.typeArguments, args);
          }
          break;
        }
      }
    }
  }

  if (ts.isDecorator(node) && ts.isParameter(node.parent)) {
    if (node.parent.type === undefined)
      return node;

    const type = visitorContext.checker.getTypeFromTypeNode(node.parent.type);

    const expression = node.expression as ts.CallLikeExpression;
    const signature = visitorContext.checker.getResolvedSignature(expression);
    if (
      signature !== undefined
      && signature.declaration !== undefined
      && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', 'runtime', 'Decorator.d.ts'))
      // &&  <= 1
    ) {
      const name = visitorContext.checker.getTypeAtLocation(signature.declaration).symbol.name;
      switch (name) {
        case 'AssertType': {
          const schema = visitorContext.schemaGenerator.getTypeDefinition(type, false, undefined, undefined, undefined, undefined, true);
          const schemaExpression = generateAst(schema);
          if (schemaExpression) {
            const callExpression: ts.CallExpression = node.expression as ts.CallExpression;
            return ts.factory.updateDecorator(node, ts.factory.updateCallExpression(callExpression, callExpression.expression, undefined, [schemaExpression]));
          }
          break;
        }
      }
    }
  }
  return node;
};

const generateAst = (origin: unknown): ts.Expression | null => {
  if (typeof origin === 'boolean') {
    return ts.factory.createToken(origin ? ts.SyntaxKind.TrueKeyword : ts.SyntaxKind.FalseKeyword) as ts.Expression;
  }

  if (typeof origin == 'string') {
    return ts.factory.createStringLiteral(origin);
  }

  if (typeof origin === 'number') {
    return ts.factory.createNumericLiteral(origin.toString());
  }

  if (typeof origin === 'object') {
    if (Array.isArray(origin)) {
      const elements = origin.map(m => {
        return generateAst(m);
      }).filter(v => v !== null) as ts.Expression[];
      return ts.factory.createArrayLiteralExpression(elements);
    }
    if (origin === null) {
      return ts.factory.createToken(ts.SyntaxKind.NullKeyword);
    }
    const properties: ts.PropertyAssignment[] = [];
    for(const [key, value] of Object.entries(origin)) {
      const v = generateAst(value);
      if (v) {
        properties.push(ts.factory.createPropertyAssignment(ts.factory.createStringLiteral(key), v));
      }
    }
    return ts.factory.createObjectLiteralExpression(properties);
  }

  return null;
};
