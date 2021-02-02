import { comment, transformRef } from "../utils";
import { transformHeaderObjMap } from "./headers";
import { transformSchemaObj } from "./schema";
const resType = (res) => (res === 204 || (res >= 300 && res < 400) ? "never" : "unknown");
export function transformResponsesObj(responsesObj) {
    let output = "";
    Object.entries(responsesObj).forEach(([httpStatusCode, response]) => {
        if (response.description)
            output += comment(response.description);
        const statusCode = Number(httpStatusCode) || `"${httpStatusCode}"`;
        if (response.$ref) {
            output += `  ${statusCode}: ${transformRef(response.$ref)};\n`;
            return;
        }
        if ((!response.content && !response.schema) || (response.content && !Object.keys(response.content).length)) {
            output += `  ${statusCode}: ${resType(statusCode)};\n`;
            return;
        }
        output += `  ${statusCode}: {\n`;
        if (response.headers && Object.keys(response.headers).length) {
            if (response.headers.$ref) {
                output += `    headers: ${transformRef(response.headers.$ref)};\n`;
            }
            else {
                output += `    headers: {\n      ${transformHeaderObjMap(response.headers)}\n    }\n`;
            }
        }
        if (response.content && Object.keys(response.content).length) {
            output += `    content: {\n`;
            Object.entries(response.content).forEach(([contentType, contentResponse]) => {
                output += `      "${contentType}": ${transformSchemaObj(contentResponse.schema)};\n`;
            });
            output += `    }\n`;
        }
        else if (response.schema) {
            output += `  schema: ${transformSchemaObj(response.schema)};\n`;
        }
        output += `  }\n`;
    });
    return output;
}
