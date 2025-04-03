import { Vector2 } from 'three';
import { NacaFoil } from './core';
export declare class Vector2NacaFoil extends NacaFoil {
    vectors: Array<Vector2>;
    constructor(c?: number, naca_code?: string, resolution?: number, convex_hull?: boolean);
    getVectors(): Array<Vector2>;
    getUpperVectors(scale?: number): Array<Vector2>;
    getLowerVectors(scale?: number): Array<Vector2>;
    getLeadingEdgeVectors(scale?: number): Array<Vector2>;
}
