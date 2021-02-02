import { OperationObject, ParameterObject, PathItemObject } from "../types/index";
interface TransformPathsObjOption {
    operations: Record<string, OperationObject>;
    parameters: Record<string, ParameterObject>;
}
export declare function transformPathsObj(paths: Record<string, PathItemObject>, { operations, parameters }: TransformPathsObjOption): string;
export {};
