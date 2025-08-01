export type Technique = 'zerowidth' | 'css' | 'comment' | 'jsonld' | 'aria';
export interface InjectOptions {
    payload: string;
    techniques: Technique[];
    selector?: string;
}
export declare function substituteVariables(text: string, variables?: Record<string, string>): string;
export declare function addEntropy(text: string, entropy?: number): string;
export declare function injectLightweight(html: string, options: InjectOptions): string;
export declare function selectWeightedPayload(payloads: any[]): any;
export declare function processPayloads(payloads: any[], variables?: Record<string, string>, entropy?: number): any;
