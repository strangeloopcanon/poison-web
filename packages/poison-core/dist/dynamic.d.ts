import { Technique } from './index';
export interface DynamicInjectOptions {
    payload: string;
    techniques: Technique[];
    selector?: string;
    interval?: number;
    observe?: boolean;
}
export declare function injectDynamic(options: DynamicInjectOptions): void;
export declare function injectIntoReactApp(options: DynamicInjectOptions): void;
export declare function injectIntoVueApp(options: DynamicInjectOptions): void;
export declare function injectIntoAngularApp(options: DynamicInjectOptions): void;
