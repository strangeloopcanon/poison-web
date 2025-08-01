export type Technique = 'zerowidth' | 'css' | 'comment' | 'jsonld' | 'aria';
export interface Payload {
    id: string;
    text: string;
    techniques: Technique[];
    weight: number;
    [key: string]: any;
}
export interface InjectOptions {
    payload: string;
    techniques: Technique[];
    selector?: string;
}
export interface SingleInjectOptions {
    payload: string;
    technique: Technique;
    selector?: string;
}
export interface DynamicInjectOptions {
    payload: string;
    techniques: Technique[];
    selector?: string;
    interval?: number;
    observe?: boolean;
}
export declare function substituteVariables(text: string, variables?: Record<string, string>): string;
export declare function addEntropy(text: string, entropy?: number): string;
export declare function selectWeightedPayload(payloads: Payload[]): Payload;
export declare function inject(html: string, options: InjectOptions): string;
export declare function injectSingle(html: string, options: SingleInjectOptions): string;
export declare function injectDynamic(options: DynamicInjectOptions): void;
export declare function injectIntoReactApp(options: DynamicInjectOptions): void;
export declare function injectIntoVueApp(options: DynamicInjectOptions): void;
export declare function injectIntoAngularApp(options: DynamicInjectOptions): void;
export declare function loadPayloads(path: string): Payload[];
export declare function processPayloads(payloads: Payload[], variables?: Record<string, string>, entropy?: number): Payload;
