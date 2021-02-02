import { transformSchemaObj } from "./schema";
import { comment } from "../utils";
export function transformParametersArray(parameters, globalParams) {
    let output = "";
    let mappedParams = {};
    parameters.forEach((paramObj) => {
        if (paramObj.$ref && globalParams) {
            const paramName = paramObj.$ref.split("/").pop();
            if (globalParams[paramName]) {
                const reference = globalParams[paramName];
                if (!mappedParams[reference.in])
                    mappedParams[reference.in] = {};
                mappedParams[reference.in][reference.name || paramName] = {
                    ...reference,
                    schema: { $ref: paramObj.$ref },
                };
            }
            return;
        }
        if (!paramObj.in || !paramObj.name)
            return;
        if (!mappedParams[paramObj.in])
            mappedParams[paramObj.in] = {};
        mappedParams[paramObj.in][paramObj.name] = paramObj;
    });
    Object.entries(mappedParams).forEach(([paramIn, paramGroup]) => {
        output += `  ${paramIn}: {\n`;
        Object.entries(paramGroup).forEach(([paramName, paramObj]) => {
            let paramComment = "";
            if (paramObj.deprecated)
                paramComment += `@deprecated `;
            if (paramObj.description)
                paramComment += paramObj.description;
            if (paramComment)
                output += comment(paramComment);
            const required = paramObj.required ? `` : `?`;
            output += `    "${paramName}"${required}: ${paramObj.schema ? transformSchemaObj(paramObj.schema) : "unknown"};\n`;
        });
        output += `  }\n`;
    });
    return output;
}
