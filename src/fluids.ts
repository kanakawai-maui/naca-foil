
// /Users/robert/Desktop/scad/naca-foil/src/fluids.ts

export type VectorField = (x: number, y: number, t: number) => [number, number];

export interface NavierStokesParams {
    velocity: VectorField; // Velocity field as a function of space and time
    pressure: (x: number, y: number, t: number) => number; // Pressure field
    density: number; // Fluid density (ρ)
    viscosity: number; // Dynamic viscosity (μ)
    externalForce?: VectorField; // External force field (e.g., gravity)
}

/**
 * Represents the Navier-Stokes equations for incompressible fluid flow.
 * @param params - Parameters for the fluid system.
 */
export function navierStokes(params: NavierStokesParams) {
    const { velocity, pressure, density, viscosity, externalForce } = params;

    // Continuity equation (incompressibility condition)
    const continuity = (x: number, y: number, t: number): number => {
        const [u, v] = velocity(x, y, t);
        // ∂u/∂x + ∂v/∂y = 0
        const du_dx = partialDerivative((xVal) => velocity(xVal, y, t)[0], x, 'x');
        const dv_dy = partialDerivative((yVal) => velocity(x, yVal, t)[1], y, 'y');
        return du_dx + dv_dy;
    };

    // Momentum equation
    const momentum = (x: number, y: number, t: number): [number, number] => {
        const [u, v] = velocity(x, y, t);
        const fx = externalForce ? externalForce(x, y, t)[0] : 0;
        const fy = externalForce ? externalForce(x, y, t)[1] : 0;

        // ∂u/∂t + (u·∇)u = -1/ρ ∇p + ν∇²u + F
        const du_dt = partialDerivative((tVal) => velocity(x, y, tVal)[0], t, 't');
        const dv_dt = partialDerivative((tVal) => velocity(x, y, tVal)[1], t, 't');

        const convectiveU = u * partialDerivative((xVal) => velocity(xVal, y, t)[0], x, 'x') +
            v * partialDerivative((yVal) => velocity(x, yVal, t)[0], y, 'y');
        const convectiveV = u * partialDerivative((xVal) => velocity(xVal, y, t)[1], x, 'x') +
            v * partialDerivative((yVal) => velocity(x, yVal, t)[1], y, 'y');

        const pressureGradientX = -1 / density * partialDerivative((xVal) => pressure(xVal, y, t), x, 'x');
        const pressureGradientY = -1 / density * partialDerivative((yVal) => pressure(x, yVal, t), y, 'y');

        const viscousTermX = viscosity * laplacian((xVal, yVal) => velocity(xVal, yVal, t)[0], x, y);
        const viscousTermY = viscosity * laplacian((xVal, yVal) => velocity(xVal, yVal, t)[1], x, y);

        const momentumX = du_dt + convectiveU - pressureGradientX + viscousTermX + fx;
        const momentumY = dv_dt + convectiveV - pressureGradientY + viscousTermY + fy;

        return [momentumX, momentumY];
    };

    return { continuity, momentum };
}

/**
 * Computes the partial derivative of a function with respect to a variable.
 * This uses central difference for better accuracy.
 */
export function partialDerivative(
    func: (x: number) => number,
    x: number,
    direction: 'x' | 'y' | 't'
): number {
    const delta = 1e-5;

    // Central difference method for better accuracy
    if (direction === 'x' || direction === 'y' || direction === 't') {
        return (func(x + delta) - func(x - delta)) / (2 * delta);
    }

    throw new Error(`Invalid direction: ${direction}`);
}

/**
 * Computes the Laplacian of a scalar field.
 * @param func - The scalar field as a function of (x, y).
 * @param x - The x-coordinate.
 * @param y - The y-coordinate.
 * @returns The Laplacian of the scalar field at (x, y).
 */
export function laplacian(
    func: (x: number, y: number) => number,
    x: number,
    y: number
): number {
    const delta = 1e-5;

    // Second partial derivative with respect to x
    const d2f_dx2 =
        (func(x + delta, y) - 2 * func(x, y) + func(x - delta, y)) /
        (delta * delta);

    // Second partial derivative with respect to y
    const d2f_dy2 =
        (func(x, y + delta) - 2 * func(x, y) + func(x, y - delta)) /
        (delta * delta);

    return d2f_dx2 + d2f_dy2;
}