import { NacaCode } from "./types";

export class NacaFoilMath {

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
    static foilY(x: number, c: number, t: number, closeAirfoils = true) {
        return (
            5 *
            t *
            c *
            (0.2969 * Math.sqrt(x / c) -
            0.126 * (x / c) -
            0.3516 * Math.pow(x / c, 2) +
            0.2843 * Math.pow(x / c, 3) -
            (closeAirfoils ? 0.1036 : 0.1015) * Math.pow(x / c, 4))
        );
    }

    // Helper method to calculate the cross product of vectors
    static cross(
        o: [number, number],
        a: [number, number],
        b: [number, number],
    ): number {
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    }

    static camber(x: number, c: number, m: number, p: number) {
        return x <= p * c
        ? ((c * m) / Math.pow(p, 2)) * (2 * p * (x / c) - Math.pow(x / c, 2))
        : ((c * m) / Math.pow(1 - p, 2)) *
            (1 - 2 * p + 2 * p * (x / c) - Math.pow(x / c, 2));
    }

    static theta(x: number, c: number, m: number, p: number) {
        return x <= p * c
        ? Math.atan((m / Math.pow(p, 2)) * (p - x / c))
        : Math.atan((m / Math.pow(1 - p, 2)) * (p - x / c));
    }

    static camberY(
        x: number,
        c: number,
        t: number,
        m: number,
        p: number,
        upper = true,
    ) {
        return upper
        ? NacaFoilMath.camber(x, c, m, p) +
            NacaFoilMath.foilY(x, c, t) * Math.cos(NacaFoilMath.theta(x, c, m, p))
        : NacaFoilMath.camber(x, c, m, p) -
            NacaFoilMath.foilY(x, c, t) *
                Math.cos(NacaFoilMath.theta(x, c, m, p));
    }

    static camberX(
        x: number,
        c: number,
        t: number,
        m: number,
        p: number,
        upper = true,
    ) {
        return upper
        ? x -
            NacaFoilMath.foilY(x, c, t) * Math.sin(NacaFoilMath.theta(x, c, m, p))
        : x +
            NacaFoilMath.foilY(x, c, t) *
                Math.sin(NacaFoilMath.theta(x, c, m, p));
    }

    static convexHull(points: [number, number][]) {
        // Sort points by x-coordinate
        points.sort((a, b) => a[0] - b[0]);

        // Create lower hull
        let lower: [number, number][] = [];
        for (let i = 0; i < points.length; i++) {
        while (
            lower.length >= 2 &&
            NacaFoilMath.cross(
            lower[lower.length - 2],
            lower[lower.length - 1],
            points[i],
            ) <= 0
        ) {
            lower.pop();
        }
        lower.push(points[i]);
        }

        // Create upper hull
        let upper: [number, number][] = [];
        for (let i = points.length - 1; i >= 0; i--) {
        while (
            upper.length >= 2 &&
            NacaFoilMath.cross(
            upper[upper.length - 2],
            upper[upper.length - 1],
            points[i],
            ) <= 0
        ) {
            upper.pop();
        }
        upper.push(points[i]);
        }

        // Fill interior with points
        let interior: [number, number][] = [];
        for (let i = 0; i < points.length - 1; i++) {
        let [x1, y1] = points[i];
        let [x2, y2] = points[i + 1];
        let step = 0.01; // Adjust step size for density of interior points
        for (let t = step; t < 1; t += step) {
            let x = x1 + t * (x2 - x1);
            let y = y1 + t * (y2 - y1);
            interior.push([x, y]);
        }
        }

        // Ensure leading edge connection
        for (let i = 0; i < points.length; i++) {
        let leadingEdgeXUpper = points[i][0];
        let leadingEdgeYUpper = points[i][1];
        let leadingEdgeXLower = points[i][0];
        let leadingEdgeYLower = points[i][1];

        // Add both upper and lower leading edge points
        lower.push([leadingEdgeXUpper, leadingEdgeYUpper]);
        upper.push([leadingEdgeXLower, leadingEdgeYLower]);
        }

        // Remove the last point of each half because it's repeated at the beginning of the other half
        upper.pop();
        lower.pop();

        // Combine lower and upper hulls
        return lower.concat(upper).concat(interior);
    }
}

export class NacaFoil {
  points: [number, number][] = [];
  upper: [number, number][] = [];
  lower: [number, number][] = [];
  leadingEdge: [number, number][] = [];

  // Generate airfoil points
  _constructor(
    chord: number = 10,
    naca_code: NacaCode = "0015",
    resolution: number = 0.1
  ) {
    let naca = parseInt(naca_code);
    let c = chord;
    let t = (naca % 100) / 100;
    let m = Math.floor((naca - (naca % 100)) / 1000) / 100;
    let p = (((naca - (naca % 100)) / 100) % 10) / 10;
    let res = resolution;

    let shift = 0;

    // Upper surface
    for (let i = 0; i <= c; i += res) {
      this.upper.push([
        NacaFoilMath.camberX(i + shift, c, t, m, p),
        NacaFoilMath.camberY(i, c, t, m, p),
      ]);
    }

    console.log(c, res, this.upper);

    // Lower surface
    for (let i = c; i >= 0; i -= res) {
      this.lower.push([
        NacaFoilMath.camberX(i + shift, c, t, m, p, false),
        NacaFoilMath.camberY(i, c, t, m, p, false),
      ]);
    }

    // Ensure leading edge connection
    for (let i = 0; i < c; i += res) {
      let leadingEdgeXUpper = NacaFoilMath.camberX(shift + i, c, t, m, p);
      let leadingEdgeYUpper = NacaFoilMath.camberY(0 + i, c, t, m, p);
      let leadingEdgeXLower = NacaFoilMath.camberX(
        shift + i,
        c,
        t,
        m,
        p,
        false,
      );
      let leadingEdgeYLower = NacaFoilMath.camberY(0 + i, c, t, m, p, false);

      // Add both upper and lower leading edge points
      this.leadingEdge.push([leadingEdgeXUpper, leadingEdgeYUpper]);
      this.leadingEdge.push([leadingEdgeXLower, leadingEdgeYLower]);
    }

    this.upper = this.upper
      .filter((point) => !isNaN(point[0]) && !isNaN(point[1]))
      .map((point) => [point[0], point[1]]);

    this.lower = this.lower
      .filter((point) => !isNaN(point[0]) && !isNaN(point[1]))
      .map((point) => [point[0], point[1]]);

    this.leadingEdge = this.leadingEdge
      .filter((point) => !isNaN(point[0]) && !isNaN(point[1]))
      .map((point) => [point[0], point[1]]);

    this.points = this.upper.concat(this.lower).concat(this.leadingEdge);

    this.points = this.points
      .filter((point) => !isNaN(point[0]) && !isNaN(point[1]))
      .map((point) => [point[0], point[1]]);

    this.points = NacaFoilMath.convexHull(this.points);

    this.points = this.points
      .filter((point) => !isNaN(point[0]) && !isNaN(point[1]))
      .map((point) => [point[0], point[1]]);
  }

  getUpper(
    scale: number = 1,
    transform: Function = (p: [number, number], scale: number) => [
      p[0] * scale,
      p[1] * scale,
    ],
  ) {
    return this.upper.map((point) => transform([point[0], point[1]], scale));
  }

  getLower(
    scale: number = 1,
    transform: Function = (p: [number, number], scale: number) => [
      p[0] * scale,
      p[1] * -scale,
    ],
  ) {
    return this.upper.map((point) => transform([point[0], point[1]], scale));
  }

  getLeadingEdge(
    scale: number = 1,
    transform: Function = (p: [number, number], scale: number) => [
      p[0] * scale,
      p[1] * -scale,
    ],
  ) {
    return this.leadingEdge.map((point) =>
      transform([point[0], point[1]], scale),
    );
  }

  getPoints(sampled: boolean = false): [number, number][] {
    if (sampled) {
      return this.points.filter((_, index) => index % 1000 === 0);
    }
    return this.points;
  }
}
