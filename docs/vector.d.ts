import { Vector2 } from 'three';
import { NacaFoil } from './core';
export declare class Vector2NacaFoil extends NacaFoil {
    vectors: Array<Vector2>;
    constructor(chord?: number, naca_code?: string, resolution?: number);
    getVectors(): Array<Vector2>;
    getUpperVectors(scale?: number): Array<Vector2>;
    getLowerVectors(scale?: number): Array<Vector2>;
    getCoreVectors(scale?: number): Array<Vector2>;
}
