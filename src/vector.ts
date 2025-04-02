import { Vector2 } from "three";
import { NacaFoil } from "./core";

export class Vector2NacaFoil extends NacaFoil {
    vectors: Array<Vector2> = [];

    constructor(c: number = 100, naca_code: string = '0015', resolution: number = 100, fill=true) {
        super();
        this._constructor(c, naca_code, resolution, fill);
        this.vectors = this.points.map((point) => new Vector2(point[0], point[1]));
    }

    getVectors(): Array<Vector2> {
        return this.vectors;
    }
}