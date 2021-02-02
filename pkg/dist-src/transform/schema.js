import { comment, nodeType, transformRef, tsArrayOf, tsIntersectionOf, tsPartial, tsTupleOf, tsUnionOf, } from "../utils";
export function transformSchemaObjMap(obj, options) {
    let output = "";
    let required = (options && options.required) || [];
    Object.entries(obj).forEach(([key, value]) => {
        if (value.description)
            output += comment(value.description);
        output += `"${key}"${required.includes(key) ? "" : "?"}: `;
        output += transformSchemaObj(value.schema || value);
        output += `;\n`;
    });
    return output.replace(/\n+$/, "\n");
}
export function transformAnyOf(anyOf) {
    return tsIntersectionOf(anyOf.map((s) => tsPartial(transformSchemaObj(s))));
}
export function transformOneOf(oneOf) {
    return tsUnionOf(oneOf.map(transformSchemaObj));
}
export function transformSchemaObj(node) {
    let output = "";
    if (node.nullable) {
        output += "(";
    }
    switch (nodeType(node)) {
        case "ref": {
            output += transformRef(node.$ref);
            break;
        }
        case "string":
        case "number":
        case "boolean": {
            output += nodeType(node) || "any";
            break;
        }
        case "enum": {
            output += tsUnionOf(node.enum.map((item) => (typeof item === "string" ? `'${item.replace(/'/g, "\\'")}'` : item)));
            break;
        }
        case "object": {
            if ((!node.properties || !Object.keys(node.properties).length) && !node.allOf && !node.additionalProperties) {
                output += `{ [key: string]: any }`;
                break;
            }
            let properties = transformSchemaObjMap(node.properties || {}, { required: node.required });
            let additionalProperties;
            if (node.additionalProperties) {
                if (node.additionalProperties === true) {
                    additionalProperties = `{ [key: string]: any }`;
                }
                else if (typeof node.additionalProperties === "object") {
                    const oneOf = node.additionalProperties.oneOf || undefined;
                    const anyOf = node.additionalProperties.anyOf || undefined;
                    if (oneOf) {
                        additionalProperties = `{ [key: string]: ${transformOneOf(oneOf)}; }`;
                    }
                    else if (anyOf) {
                        additionalProperties = `{ [key: string]: ${transformAnyOf(anyOf)}; }`;
                    }
                    else {
                        additionalProperties = `{ [key: string]: ${transformSchemaObj(node.additionalProperties) || "any"}; }`;
                    }
                }
            }
            output += tsIntersectionOf([
                ...(node.allOf ? node.allOf.map(transformSchemaObj) : []),
                ...(properties ? [`{\n${properties}\n}`] : []),
                ...(additionalProperties ? [additionalProperties] : []),
            ]);
            break;
        }
        case "array": {
            if (Array.isArray(node.items)) {
                output += tsTupleOf(node.items.map(transformSchemaObj));
            }
            else {
                output += tsArrayOf(node.items ? transformSchemaObj(node.items) : "any");
            }
            break;
        }
        case "anyOf": {
            output += transformAnyOf(node.anyOf);
            break;
        }
        case "oneOf": {
            output += transformOneOf(node.oneOf);
            break;
        }
    }
    if (node.nullable) {
        output += ") | null";
    }
    return output;
}
