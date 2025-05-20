
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
}

export class NacaFoil {
  points: [number, number][] = [];
  upper: [number, number][] = [];
  lower: [number, number][] = [];
  core: [number, number][] = [];

  chord: number = 10;
  xyRatio: number = 1;
  yCamber: number = 0;

  // Generate airfoil points
  _constructor(
    chord: number = 10,
    naca_code: string = "0015",
    resolution: number = 10
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

    // Lower surface
    for (let i = 0; i <= c; i += res) {
      this.lower.push([
      NacaFoilMath.camberX(i + shift, c, t, m, p, false),
      NacaFoilMath.camberY(i, c, t, m, p, false),
      ]);
    }

    // Reverse lower surface to ensure counter-clockwise order
    //this.lower.reverse();

    this.points = [...this.upper, ...this.lower].sort((a, b) =>
      Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])
    );

    // Generate centerline points
    this.core = [];
    for (let i = 0; i <= c; i += 0.3) {
      this.core.push([i + shift, NacaFoilMath.camberY(i, c, t, m, p)]);
    }

    this.core = this.core.filter(([x, y]) => !isNaN(x) && !isNaN(y));
    this.points = this.points
      .filter(([x, y]) => !isNaN(x) && !isNaN(y))
      .filter((point, index, array) =>
        index === 0 || Math.hypot(point[0] - array[index - 1][0], point[1] - array[index - 1][1]) > 1e-6
      );

    this.chord = chord;
    this.xyRatio = chord/3;
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

  getCore(
    scale: number = 1,
    transform: Function = (p: [number, number], scale: number) => [
      p[0] * scale,
      p[1] * -scale,
    ],
  ) {
    return this.core.map((point) => transform([point[0], point[1]], scale));
  }

  getPoints(sampled: boolean = false): [number, number][] {
    if (sampled) {
      return this.points.filter((_, index) => index % 1000 === 0);
    }
    return this.points;
  }
}
