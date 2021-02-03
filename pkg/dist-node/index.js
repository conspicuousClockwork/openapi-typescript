'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = _interopDefault(require('path'));
var prettier = _interopDefault(require('prettier'));

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function comment(text) {
  const commentText = text.trim();

  if (commentText.indexOf("\n") === -1) {
    return `/** ${commentText} */\n`;
  }

  return `/**
  * ${commentText.replace(/\r?\n/g, "\n  * ")}
  */\n`;
}
function isRef(obj) {
  return !!obj.$ref;
}
function nodeType(obj) {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }

  if (obj.$ref) {
    return "ref";
  }

  if (Array.isArray(obj.enum)) {
    return "enum";
  }

  if (obj.type === "boolean") {
    return "boolean";
  }

  if (["binary", "byte", "date", "dateTime", "password", "string"].includes(obj.type)) {
    return "string";
  }

  if (["double", "float", "integer", "number"].includes(obj.type)) {
    return "number";
  }

  if (Array.isArray(obj.anyOf)) {
    return "anyOf";
  }

  if (Array.isArray(obj.oneOf)) {
    return "oneOf";
  }

  if (obj.type === "array" || obj.items) {
    return "array";
  }

  return "object";
}
function swaggerVersion(definition) {
  const {
    openapi
  } = definition;

  if (openapi && parseInt(openapi, 10) === 3) {
    return 3;
  }

  const {
    swagger
  } = definition;

  if (swagger && parseInt(swagger, 10) === 2) {
    return 2;
  }

  throw new Error(`🚏 version missing from schema; specify whether this is OpenAPI v3 or v2 https://swagger.io/specification`);
}
function transformRef(ref, root = "") {
  const isExternalRef = !ref.startsWith("#");
  if (isExternalRef) return "any";
  const parts = ref.replace(/^#\//, root).split("/");
  return `${parts[0]}["${parts.slice(1).join('"]["')}"]`;
}
function tsArrayOf(type) {
  return `(${type})[]`;
}
function tsTupleOf(types) {
  return `[${types.join(", ")}]`;
}
function tsIntersectionOf(types) {
  if (types.length === 1) return types[0];
  return `(${types.join(") & (")})`;
}
function tsPartial(type) {
  return `Partial<${type}>`;
}
function tsUnionOf(types) {
  if (types.length === 1) return types[0];
  return `(${types.join(") | (")})`;
}

function transformSchemaObjMap(obj, options) {
  let output = "";
  let required = options && options.required || [];
  Object.entries(obj).forEach(([key, value]) => {
    if (value.description) output += comment(value.description);
    output += `"${key}"${required.includes(key) ? "" : "?"}: `;
    output += transformSchemaObj(value.schema || value);
    output += `;\n`;
  });
  return output.replace(/\n+$/, "\n");
}
function transformAnyOf(anyOf) {
  return tsIntersectionOf(anyOf.map(s => tsPartial(transformSchemaObj(s))));
}
function transformOneOf(oneOf) {
  return tsUnionOf(oneOf.map(transformSchemaObj));
}
function transformSchemaObj(node) {
  let output = "";

  if (node.nullable) {
    output += "(";
  }

  switch (nodeType(node)) {
    case "ref":
      {
        output += transformRef(node.$ref);
        break;
      }

    case "string":
    case "number":
    case "boolean":
      {
        output += nodeType(node) || "any";
        break;
      }

    case "enum":
      {
        output += tsUnionOf(node.enum.map(item => typeof item === "string" ? `'${item.replace(/'/g, "\\'")}'` : item));
        break;
      }

    case "object":
      {
        if ((!node.properties || !Object.keys(node.properties).length) && !node.allOf && !node.additionalProperties) {
          output += `{ [key: string]: any }`;
          break;
        }

        let properties = transformSchemaObjMap(node.properties || {}, {
          required: node.required
        });
        let additionalProperties;

        if (node.additionalProperties) {
          if (node.additionalProperties === true) {
            additionalProperties = `{ [key: string]: any }`;
          } else if (typeof node.additionalProperties === "object") {
            const oneOf = node.additionalProperties.oneOf || undefined;
            const anyOf = node.additionalProperties.anyOf || undefined;

            if (oneOf) {
              additionalProperties = `{ [key: string]: ${transformOneOf(oneOf)}; }`;
            } else if (anyOf) {
              additionalProperties = `{ [key: string]: ${transformAnyOf(anyOf)}; }`;
            } else {
              additionalProperties = `{ [key: string]: ${transformSchemaObj(node.additionalProperties) || "any"}; }`;
            }
          }
        }

        output += tsIntersectionOf([...(node.allOf ? node.allOf.map(transformSchemaObj) : []), ...(properties ? [`{\n${properties}\n}`] : []), ...(additionalProperties ? [additionalProperties] : [])]);
        break;
      }

    case "array":
      {
        if (Array.isArray(node.items)) {
          output += tsTupleOf(node.items.map(transformSchemaObj));
        } else {
          output += tsArrayOf(node.items ? transformSchemaObj(node.items) : "any");
        }

        break;
      }

    case "anyOf":
      {
        output += transformAnyOf(node.anyOf);
        break;
      }

    case "oneOf":
      {
        output += transformOneOf(node.oneOf);
        break;
      }
  }

  if (node.nullable) {
    output += ") | null";
  }

  return output;
}

function transformHeaderObjMap(headerMap) {
  let output = "";
  Object.entries(headerMap).forEach(([k, v]) => {
    if (!v.schema) return;
    if (v.description) output += comment(v.description);
    const required = v.required ? "" : "?";
    output += `  "${k}"${required}: ${transformSchemaObj(v.schema)}\n`;
  });
  return output;
}

function transformParametersArray(parameters, globalParams) {
  let output = "";
  let mappedParams = {};
  parameters.forEach(paramObj => {
    if (paramObj.$ref && globalParams) {
      const paramName = paramObj.$ref.split("/").pop();

      if (globalParams[paramName]) {
        const reference = globalParams[paramName];
        if (!mappedParams[reference.in]) mappedParams[reference.in] = {};
        mappedParams[reference.in][reference.name || paramName] = _objectSpread2(_objectSpread2({}, reference), {}, {
          schema: {
            $ref: paramObj.$ref
          }
        });
      }

      return;
    }

    if (!paramObj.in || !paramObj.name) return;
    if (!mappedParams[paramObj.in]) mappedParams[paramObj.in] = {};
    mappedParams[paramObj.in][paramObj.name] = paramObj;
  });
  Object.entries(mappedParams).forEach(([paramIn, paramGroup]) => {
    output += `  ${paramIn}: {\n`;
    Object.entries(paramGroup).forEach(([paramName, paramObj]) => {
      let paramComment = "";
      if (paramObj.deprecated) paramComment += `@deprecated `;
      if (paramObj.description) paramComment += paramObj.description;
      if (paramComment) output += comment(paramComment);
      const required = paramObj.required ? `` : `?`;
      output += `    "${paramName}"${required}: ${paramObj.schema ? transformSchemaObj(paramObj.schema) : "unknown"};\n`;
    });
    output += `  }\n`;
  });
  return output;
}

const resType = res => res === 204 || res >= 300 && res < 400 ? "never" : "unknown";

function transformResponsesObj(responsesObj) {
  let output = "";
  Object.entries(responsesObj).forEach(([httpStatusCode, response]) => {
    if (response.description) output += comment(response.description);
    const statusCode = Number(httpStatusCode) || `"${httpStatusCode}"`;

    if (response.$ref) {
      output += `  ${statusCode}: ${transformRef(response.$ref)};\n`;
      return;
    }

    if (!response.content && !response.schema || response.content && !Object.keys(response.content).length) {
      output += `  ${statusCode}: ${resType(statusCode)};\n`;
      return;
    }

    output += `  ${statusCode}: {\n`;

    if (response.headers && Object.keys(response.headers).length) {
      if (response.headers.$ref) {
        output += `    headers: ${transformRef(response.headers.$ref)};\n`;
      } else {
        output += `    headers: {\n      ${transformHeaderObjMap(response.headers)}\n    }\n`;
      }
    }

    if (response.content && Object.keys(response.content).length) {
      output += `    content: {\n`;
      Object.entries(response.content).forEach(([contentType, contentResponse]) => {
        output += `      "${contentType}": ${transformSchemaObj(contentResponse.schema)};\n`;
      });
      output += `    }\n`;
    } else if (response.schema) {
      output += `  schema: ${transformSchemaObj(response.schema)};\n`;
    }

    output += `  }\n`;
  });
  return output;
}

function transformOperationObj(operation, globalParams) {
  let output = "";

  if (operation.parameters) {
    output += `  parameters: {\n    ${transformParametersArray(operation.parameters, globalParams)}\n  }\n`;
  }

  if (operation.responses) {
    output += `  responses: {\n  ${transformResponsesObj(operation.responses)}\n  }\n`;
  }

  if (operation.requestBody) {
    if (isRef(operation.requestBody)) {
      output += `  requestBody: ${transformRef(operation.requestBody.$ref)};\n`;
    } else {
      const {
        description,
        content
      } = operation.requestBody;
      if (description) output += comment(description);

      if (content && Object.keys(content).length) {
        output += `  requestBody: {\n    content: {\n`;
        Object.entries(content).forEach(([k, v]) => {
          output += `      "${k}": ${transformSchemaObj(v.schema)};\n`;
        });
        output += `    }\n  }\n`;
      } else {
        output += `  requestBody: unknown;\n`;
      }
    }
  }

  return output;
}

function transformPathsObj(paths, {
  operations,
  parameters
}) {
  let output = "";
  Object.entries(paths).forEach(([url, pathItem]) => {
    if (pathItem.description) output += comment(pathItem.description);

    if (pathItem.$ref) {
      output += `  "${url}": ${transformRef(pathItem.$ref)};\n`;
      return;
    }

    output += `  "${url}": {\n`;
    ["get", "put", "post", "delete", "options", "head", "patch", "trace"].forEach(method => {
      const operation = pathItem[method];
      if (!operation) return;
      if (operation.description) output += comment(operation.description);

      if (operation.operationId) {
        output += `    "${method}": operations["${operation.operationId}"];\n`;
        operations[operation.operationId] = operation;
        return;
      }

      output += `    "${method}": {\n      ${transformOperationObj(operation, parameters)}\n    }\n`;
    });

    if (pathItem.parameters) {
      output += `    parameters: {\n      ${transformParametersArray(pathItem.parameters, parameters)}\n    }\n`;
    }

    output += `  }\n`;
  });
  return output;
}

function transformAll(schema, {
  version,
  rawSchema
}) {
  let output = "";
  let operations = {};

  if (rawSchema) {
    switch (version) {
      case 2:
        {
          return `export interface definitions {\n  ${transformSchemaObjMap(schema, {
            required: Object.keys(schema)
          })}\n}`;
        }

      case 3:
        {
          return `export interface schemas {\n    ${transformSchemaObjMap(schema, {
            required: Object.keys(schema)
          })}\n  }\n\n`;
        }
    }
  }

  output += `export interface paths {\n`;

  if (schema.paths) {
    output += transformPathsObj(schema.paths, {
      operations,
      parameters: schema.components && schema.components.parameters || schema.parameters
    });
  }

  output += `}\n\n`;

  switch (version) {
    case 2:
      {
        output += `export interface definitions {\n  ${transformSchemaObjMap(schema.definitions || {}, {
          required: Object.keys(schema.definitions)
        })}\n}\n\n`;

        if (schema.parameters) {
          const required = Object.keys(schema.parameters);
          output += `export interface parameters {\n    ${transformSchemaObjMap(schema.parameters, {
            required
          })}\n  }\n\n`;
        }

        if (schema.responses) {
          output += `export interface responses {\n    ${transformResponsesObj(schema.responses)}\n  }\n\n`;
        }

        break;
      }

    case 3:
      {
        output += `export interface components {\n`;

        if (schema.components) {
          if (schema.components.schemas) {
            const required = Object.keys(schema.components.schemas);
            output += `  schemas: {\n    ${transformSchemaObjMap(schema.components.schemas, {
              required
            })}\n  }\n`;
          }

          if (schema.components.responses) {
            output += `  responses: {\n    ${transformResponsesObj(schema.components.responses)}\n  }\n`;
          }

          if (schema.components.parameters) {
            const required = Object.keys(schema.components.parameters);
            output += `  parameters: {\n    ${transformSchemaObjMap(schema.components.parameters, {
              required
            })}\n  }\n`;
          }

          if (schema.components.requestBodies) {
            const required = Object.keys(schema.components.requestBodies);
            output += `  requestBodies: {\n    ${transformSchemaObjMap(schema.components.requestBodies, {
              required
            })}\n  }\n`;
          }

          if (schema.components.headers) {
            output += `  headers: {\n    ${transformHeaderObjMap(schema.components.headers)}  }\n`;
          }
        }

        output += `}\n\n`;
        break;
      }
  }

  output += `export interface operations {\n`;

  if (Object.keys(operations).length) {
    Object.entries(operations).forEach(([operationId, operation]) => {
      if (operation.description) output += comment(operation.description);
      output += `  "${operationId}": {\n    ${transformOperationObj(operation, schema.components && schema.components.parameters || schema.parameters || [])};\n  }\n`;
    });
  }

  output += `}\n`;
  return output.trim();
}

const WARNING_MESSAGE = `/**
* This file was auto-generated by openapi-typescript.
* Do not make direct changes to the file.
*/


`;
function swaggerToTS(schema, options) {
  const version = options && options.version || swaggerVersion(schema);
  let output = `${WARNING_MESSAGE}
  ${transformAll(schema, {
    version,
    rawSchema: options && options.rawSchema
  })}
`;
  let prettierOptions = {
    parser: "typescript"
  };

  if (options && options.prettierConfig) {
    try {
      const userOptions = prettier.resolveConfig.sync(path.resolve(process.cwd(), options.prettierConfig));
      prettierOptions = _objectSpread2(_objectSpread2({}, prettierOptions), userOptions);
    } catch (err) {
      console.error(`❌ ${err}`);
    }
  }

  return prettier.format(output, prettierOptions);
}

exports.WARNING_MESSAGE = WARNING_MESSAGE;
exports.default = swaggerToTS;
//# sourceMappingURL=index.js.map
