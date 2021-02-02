export interface OpenAPI2 {
    swagger: string;
    paths?: Record<string, PathItemObject>;
    definitions?: Record<string, SchemaObject>;
    parameters?: ParameterObject[];
    responses?: Record<string, ResponseObject>;
}
export interface OpenAPI3 {
    openapi: string;
    paths?: Record<string, PathItemObject>;
    components?: {
        schemas?: Record<string, ReferenceObject | SchemaObject>;
        responses?: Record<string, ReferenceObject | ResponseObject>;
        parameters?: Record<string, ReferenceObject | ParameterObject>;
        requestBodies?: Record<string, ReferenceObject | RequestBody>;
        headers?: Record<string, ReferenceObject | HeaderObject>;
        links?: Record<string, ReferenceObject | LinkObject>;
    };
}
export interface HeaderObject {
    type?: string;
    description?: string;
    required?: boolean;
    schema: ReferenceObject | SchemaObject;
}
export interface PathItemObject {
    $ref?: string;
    summary?: string;
    description?: string;
    get?: OperationObject;
    put?: OperationObject;
    post?: OperationObject;
    delete?: OperationObject;
    options?: OperationObject;
    head?: OperationObject;
    patch?: OperationObject;
    trace?: OperationObject;
    parameters?: (ReferenceObject | ParameterObject)[];
}
export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: (ReferenceObject | ParameterObject)[];
    requestBody?: RequestBody;
    description?: string;
}
export interface OperationObject {
    description?: string;
    tags?: string[];
    summary?: string;
    operationId?: string;
    parameters?: (ReferenceObject | ParameterObject)[];
    requestBody?: ReferenceObject | RequestBody;
    responses?: Record<string, ReferenceObject | ResponseObject>;
}
export interface ParameterObject {
    name?: string;
    in?: "query" | "header" | "path" | "cookie" | "formData" | "body";
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    schema?: ReferenceObject | SchemaObject;
}
export declare type ReferenceObject = {
    $ref: string;
};
export interface ResponseObject {
    description?: string;
    headers?: Record<string, ReferenceObject | HeaderObject>;
    schema?: ReferenceObject | SchemaObject;
    links?: Record<string, ReferenceObject | LinkObject>;
    content?: {
        [contentType: string]: {
            schema: ReferenceObject | SchemaObject;
        };
    };
}
export interface RequestBody {
    description?: string;
    content?: {
        [contentType: string]: {
            schema: ReferenceObject | SchemaObject;
        };
    };
}
export interface SchemaObject {
    title?: string;
    description?: string;
    required?: string[];
    enum?: string[];
    type?: string;
    items?: ReferenceObject | SchemaObject;
    allOf?: SchemaObject;
    properties?: Record<string, ReferenceObject | SchemaObject>;
    additionalProperties?: boolean | ReferenceObject | SchemaObject;
    nullable?: boolean;
    oneOf?: (ReferenceObject | SchemaObject)[];
    anyOf?: (ReferenceObject | SchemaObject)[];
}
export interface SwaggerToTSOptions {
    prettierConfig?: string;
    rawSchema?: boolean;
    version?: number;
}
