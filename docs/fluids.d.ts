export type VectorField = (x: number, y: number, t: number) => [number, number];
export interface NavierStokesParams {
    velocity: VectorField;
    pressure: (x: number, y: number, t: number) => number;
    density: number;
    viscosity: number;
    externalForce?: VectorField;
}
/**
 * Represents the Navier-Stokes equations for incompressible fluid flow.
 * @param params - Parameters for the fluid system.
 */
export declare function navierStokes(params: NavierStokesParams): {
    continuity: (x: number, y: number, t: number) => number;
    momentum: (x: number, y: number, t: number) => [number, number];
};
/**
 * Computes the partial derivative of a function with respect to a variable.
 * This uses central difference for better accuracy.
 */
export declare function partialDerivative(func: (x: number) => number, x: number, direction: 'x' | 'y' | 't'): number;
/**
 * Computes the Laplacian of a scalar field.
 * @param func - The scalar field as a function of (x, y).
 * @param x - The x-coordinate.
 * @param y - The y-coordinate.
 * @returns The Laplacian of the scalar field at (x, y).
 */
export declare function laplacian(func: (x: number, y: number) => number, x: number, y: number): number;
