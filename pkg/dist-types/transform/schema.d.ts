interface TransformSchemaObjMapOptions {
    required?: string[];
}
export declare function transformSchemaObjMap(obj: Record<string, any>, options?: TransformSchemaObjMapOptions): string;
export declare function transformAnyOf(anyOf: any): string;
export declare function transformOneOf(oneOf: any): string;
export declare function transformSchemaObj(node: any): string;
export {};
