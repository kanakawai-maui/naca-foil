export declare class NacaFoilMath {
    /**
     * Calculates the Y-coordinate of a NACA airfoil at a given X-coordinate.
     *
     * @param x - The X-coordinate along the chord line of the airfoil.
     * @param c - The chord length of the airfoil (distance from leading edge to trailing edge).
     * @param t - The maximum thickness of the airfoil as a fraction of the chord length.
     * @param closeAirfoils - A boolean indicating whether to use the closed trailing edge formula (default: true).
     *                        If true, the trailing edge will be closed; otherwise, it will be slightly open.
     * @returns The Y-coordinate of the airfoil at the given X-coordinate.
     *
     * @remarks
     * - The chord (`c`) is the straight-line distance from the leading edge to the trailing edge of the airfoil.
     * - The camber is not directly calculated in this function but is influenced by the thickness distribution (`t`).
     */
    static foilY(x: number, c: number, t: number, closeAirfoils?: boolean): number;
    static cross(o: [number, number], a: [number, number], b: [number, number]): number;
    static camber(x: number, c: number, m: number, p: number): number;
    static theta(x: number, c: number, m: number, p: number): number;
    static camberY(x: number, c: number, t: number, m: number, p: number, upper?: boolean): number;
    static camberX(x: number, c: number, t: number, m: number, p: number, upper?: boolean): number;
}
export declare class NacaFoil {
    points: [number, number][];
    upper: [number, number][];
    lower: [number, number][];
    core: [number, number][];
    chord: number;
    xyRatio: number;
    yCamber: number;
    _constructor(chord?: number, naca_code?: string, resolution?: number): void;
    getUpper(scale?: number, transform?: Function): any[];
    getLower(scale?: number, transform?: Function): any[];
    getCore(scale?: number, transform?: Function): any[];
    getPoints(sampled?: boolean): [number, number][];
}
