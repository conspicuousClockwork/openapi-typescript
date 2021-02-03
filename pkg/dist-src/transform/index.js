import { comment } from "../utils";
import { transformHeaderObjMap } from "./headers";
import { transformOperationObj } from "./operation";
import { transformPathsObj } from "./paths";
import { transformResponsesObj } from "./responses";
import { transformSchemaObjMap } from "./schema";
export function transformAll(schema, { version, rawSchema }) {
    let output = "";
    let operations = {};
    if (rawSchema) {
        switch (version) {
            case 2: {
                return `export interface definitions {\n  ${transformSchemaObjMap(schema, {
                    required: Object.keys(schema),
                })}\n}`;
            }
            case 3: {
                return `export interface schemas {\n    ${transformSchemaObjMap(schema, {
                    required: Object.keys(schema),
                })}\n  }\n\n`;
            }
        }
    }
    output += `export interface paths {\n`;
    if (schema.paths) {
        output += transformPathsObj(schema.paths, {
            operations,
            parameters: (schema.components && schema.components.parameters) || schema.parameters,
        });
    }
    output += `}\n\n`;
    switch (version) {
        case 2: {
            output += `export interface definitions {\n  ${transformSchemaObjMap(schema.definitions || {}, {
                required: Object.keys(schema.definitions),
            })}\n}\n\n`;
            if (schema.parameters) {
                const required = Object.keys(schema.parameters);
                output += `export interface parameters {\n    ${transformSchemaObjMap(schema.parameters, {
                    required,
                })}\n  }\n\n`;
            }
            if (schema.responses) {
                output += `export interface responses {\n    ${transformResponsesObj(schema.responses)}\n  }\n\n`;
            }
            break;
        }
        case 3: {
            output += `export interface components {\n`;
            if (schema.components) {
                if (schema.components.schemas) {
                    const required = Object.keys(schema.components.schemas);
                    output += `  schemas: {\n    ${transformSchemaObjMap(schema.components.schemas, { required })}\n  }\n`;
                }
                if (schema.components.responses) {
                    output += `  responses: {\n    ${transformResponsesObj(schema.components.responses)}\n  }\n`;
                }
                if (schema.components.parameters) {
                    const required = Object.keys(schema.components.parameters);
                    output += `  parameters: {\n    ${transformSchemaObjMap(schema.components.parameters, {
                        required,
                    })}\n  }\n`;
                }
                if (schema.components.requestBodies) {
                    const required = Object.keys(schema.components.requestBodies);
                    output += `  requestBodies: {\n    ${transformSchemaObjMap(schema.components.requestBodies, {
                        required,
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
            if (operation.description)
                output += comment(operation.description);
            output += `  "${operationId}": {\n    ${transformOperationObj(operation, (schema.components && schema.components.parameters) || schema.parameters || [])};\n  }\n`;
        });
    }
    output += `}\n`;
    return output.trim();
}
