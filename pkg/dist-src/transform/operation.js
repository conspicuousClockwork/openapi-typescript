import { comment, isRef, transformRef } from "../utils";
import { transformParametersArray } from "./parameters";
import { transformResponsesObj } from "./responses";
import { transformSchemaObj } from "./schema";
export function transformOperationObj(operation, globalParams) {
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
        }
        else {
            const { description, content } = operation.requestBody;
            if (description)
                output += comment(description);
            if (content && Object.keys(content).length) {
                output += `  requestBody: {\n    content: {\n`;
                Object.entries(content).forEach(([k, v]) => {
                    output += `      "${k}": ${transformSchemaObj(v.schema)};\n`;
                });
                output += `    }\n  }\n`;
            }
            else {
                output += `  requestBody: unknown;\n`;
            }
        }
    }
    return output;
}
