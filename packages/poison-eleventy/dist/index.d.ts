import { Technique } from 'poison-core';
export interface PoisonEleventyOptions {
    payloadsPath?: string;
    variables?: Record<string, string>;
    entropy?: number;
    techniques?: Technique[];
    selector?: string;
}
export default function poisonEleventyPlugin(options?: PoisonEleventyOptions): {
    configFunction: (eleventyConfig: any) => void;
};
//# sourceMappingURL=index.d.ts.map