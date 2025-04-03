import { Vector2 } from "three";
import { NacaFoil } from "./core";

export class Vector2NacaFoil extends NacaFoil {
    vectors: Array<Vector2> = [];

    constructor(c: number = 100, naca_code: string = '0015', resolution: number = 100, convex_hull=true) {
        super();
        this._constructor(c, naca_code, resolution, convex_hull);
        this.vectors = this.points.map((point) => new Vector2(point[0], point[1]));
    }

    getVectors(): Array<Vector2> {
        return this.vectors;
    }

    getUpperVectors(scale: number = 1): Array<Vector2> {
        return this.getUpper(scale).map((point) => new Vector2(point[0], point[1]));
    }

    getLowerVectors(scale: number = 1): Array<Vector2> {
        return this.getLower(scale).map((point) => new Vector2(point[0], point[1]));
    }

    getLeadingEdgeVectors(scale: number = 1): Array<Vector2> {
        return this.getLeadingEdge(scale).map((point) => new Vector2(point[0], point[1]));
    }
}