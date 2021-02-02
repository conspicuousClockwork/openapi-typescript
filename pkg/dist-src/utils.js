export function comment(text) {
    const commentText = text.trim();
    if (commentText.indexOf("\n") === -1) {
        return `/** ${commentText} */\n`;
    }
    return `/**
  * ${commentText.replace(/\r?\n/g, "\n  * ")}
  */\n`;
}
export function fromEntries(entries) {
    return entries.reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
}
export function isRef(obj) {
    return !!obj.$ref;
}
export function nodeType(obj) {
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
export function swaggerVersion(definition) {
    const { openapi } = definition;
    if (openapi && parseInt(openapi, 10) === 3) {
        return 3;
    }
    const { swagger } = definition;
    if (swagger && parseInt(swagger, 10) === 2) {
        return 2;
    }
    throw new Error(`🚏 version missing from schema; specify whether this is OpenAPI v3 or v2 https://swagger.io/specification`);
}
export function transformRef(ref, root = "") {
    const isExternalRef = !ref.startsWith("#");
    if (isExternalRef)
        return "any";
    const parts = ref.replace(/^#\//, root).split("/");
    return `${parts[0]}["${parts.slice(1).join('"]["')}"]`;
}
export function tsArrayOf(type) {
    return `(${type})[]`;
}
export function tsTupleOf(types) {
    return `[${types.join(", ")}]`;
}
export function tsIntersectionOf(types) {
    if (types.length === 1)
        return types[0];
    return `(${types.join(") & (")})`;
}
export function tsPartial(type) {
    return `Partial<${type}>`;
}
export function tsUnionOf(types) {
    if (types.length === 1)
        return types[0];
    return `(${types.join(") | (")})`;
}
export function unrefComponent(components, ref) {
    const [type, object] = ref.match(/(?<=\[")([^"]+)/g);
    return components[type][object];
}
