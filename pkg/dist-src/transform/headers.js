import { comment } from "../utils";
import { transformSchemaObj } from "./schema";
export function transformHeaderObjMap(headerMap) {
    let output = "";
    Object.entries(headerMap).forEach(([k, v]) => {
        if (!v.schema)
            return;
        if (v.description)
            output += comment(v.description);
        const required = v.required ? "" : "?";
        output += `  "${k}"${required}: ${transformSchemaObj(v.schema)}\n`;
    });
    return output;
}
