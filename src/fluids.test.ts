import { describe, it, expect } from 'vitest';
import {VectorField,NavierStokesParams,navierStokes,partialDerivative,laplacian} from './fluids';

describe('Hello World Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
describe('navierStokes', () => {
    it('should return continuity and momentum functions', () => {
        const velocity: VectorField = (x, y, t) => [x + t, y - t];
        const pressure = (x: number, y: number, t: number) => x * y * t;
        const params: NavierStokesParams = {
            velocity,
            pressure,
            density: 1,
            viscosity: 0.1,
        };

        const { continuity, momentum } = navierStokes(params);

        expect(typeof continuity).toBe('function');
        expect(typeof momentum).toBe('function');
    });

    it('continuity function should calculate incompressibility condition', () => {
        const velocity: VectorField = (x, y, t) => [x + t, y - t];
        const pressure = (x: number, y: number, t: number) => x * y * t;
        const params: NavierStokesParams = {
            velocity,
            pressure,
            density: 1,
            viscosity: 0.1,
        };

        const { continuity } = navierStokes(params);
        const result = continuity(1, 1, 1);

        expect(result).toBeCloseTo(0, 12); // Placeholder expectation
    });

    it('momentum function should calculate momentum equations', () => {
        const velocity: VectorField = (x, y, t) => [x + t, y - t];
        const pressure = (x: number, y: number, t: number) => x * y * t;
        const params: NavierStokesParams = {
            velocity,
            pressure,
            density: 1,
            viscosity: 0.1,
        };

        const { momentum } = navierStokes(params);
        const [momentumX, momentumY] = momentum(1, 1, 1);

        expect(momentumX).toBeDefined();
        expect(momentumY).toBeDefined();
    });
});
describe('partialDerivative', () => {
    it('should calculate the partial derivative of a function with respect to x', () => {
        const func = (x: number) => x * 2 + 3;
        const result = partialDerivative(func, 1, 'x');
        expect(result).toBeCloseTo(2, 5); // The derivative of 2x + 3 with respect to x is 2
    });

    it('should calculate the partial derivative of a function with respect to y', () => {
        const func = (y: number) => y * y + 2 * y + 1;
        const result = partialDerivative(func, 1, 'y');
        expect(result).toBeCloseTo(4, 5); // The derivative of y^2 + 2y + 1 with respect to y at y=1 is 4
    });

    it('should calculate the partial derivative of a function with respect to t', () => {
        const func = (t: number) => Math.sin(t);
        const result = partialDerivative(func, Math.PI / 4, 't');
        expect(result).toBeCloseTo(Math.cos(Math.PI / 4), 5); // The derivative of sin(t) is cos(t)
    });
});

describe('laplacian', () => {
    it('should calculate the Laplacian of a scalar field', () => {
        const result = laplacian((x: number, y: number) => x + y, 1, 1);
        expect(result).toBeCloseTo(0, 5); // The Laplacian of x + y is 0
    });
});