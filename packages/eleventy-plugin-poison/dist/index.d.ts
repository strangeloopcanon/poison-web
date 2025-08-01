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
export declare function inject(html: string, options: InjectOptions): string;
export declare function substituteVariables(text: string, variables?: Record<string, string>): string;
export declare function addEntropy(text: string, entropy?: number): string;
export declare function selectWeightedPayload(payloads: Payload[]): Payload;
export declare function processPayloads(payloads: Payload[], variables?: Record<string, string>, entropy?: number): Payload;
export default function (eleventyConfig: any, options: any): void;
