interface TransformOptions {
    rawSchema?: boolean;
    version: number;
}
export declare function transformAll(schema: any, { version, rawSchema }: TransformOptions): string;
export {};
