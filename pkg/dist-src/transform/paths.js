import { comment, transformRef } from "../utils";
import { transformOperationObj } from "./operation";
import { transformParametersArray } from "./parameters";
export function transformPathsObj(paths, { operations, parameters }) {
    let output = "";
    Object.entries(paths).forEach(([url, pathItem]) => {
        if (pathItem.description)
            output += comment(pathItem.description);
        if (pathItem.$ref) {
            output += `  "${url}": ${transformRef(pathItem.$ref)};\n`;
            return;
        }
        output += `  "${url}": {\n`;
        ["get", "put", "post", "delete", "options", "head", "patch", "trace"].forEach((method) => {
            const operation = pathItem[method];
            if (!operation)
                return;
            if (operation.description)
                output += comment(operation.description);
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
