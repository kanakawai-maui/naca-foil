import { NacaCode } from './types';
export declare class NacaFoilMath {
    static foilY(x: number, c: number, t: number, closeAirfoils?: boolean): number;
    static cross(o: [number, number], a: [number, number], b: [number, number]): number;
    static camber(x: number, c: number, m: number, p: number): number;
    static theta(x: number, c: number, m: number, p: number): number;
    static camberY(x: number, c: number, t: number, m: number, p: number, upper?: boolean): number;
    static camberX(x: number, c: number, t: number, m: number, p: number, upper?: boolean): number;
    static convexHull(points: [number, number][]): [number, number][];
}
export declare class NacaFoil {
    points: [number, number][];
    upper: [number, number][];
    lower: [number, number][];
    leadingEdge: [number, number][];
    _constructor(c?: number, naca_code?: NacaCode, resolution?: number, convex_hull?: boolean): void;
    getUpper(scale?: number, transform?: Function): any[];
    getLower(scale?: number, transform?: Function): any[];
    getLeadingEdge(scale?: number, transform?: Function): any[];
    getPoints(sampled?: boolean): [number, number][];
}
