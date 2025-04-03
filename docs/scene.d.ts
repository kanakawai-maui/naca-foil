import { Vector2NacaFoil } from './vector';
import { NacaCode } from './types';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from "three";
export declare class NacaFoilScene {
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    clock: THREE.Clock;
    controls: OrbitControls;
    constructor(id?: string);
    _clear(): void;
    update(naca_code: NacaCode, camber?: number, extrude_depth?: number): void;
    getGlow(foil: Vector2NacaFoil, position: "upper" | "lower" | "leadingedge", depth?: number): THREE.Points<THREE.ExtrudeGeometry, THREE.PointsMaterial, THREE.Object3DEventMap>;
    getCurve: (point2D: [number, number][], closed?: boolean) => THREE.CatmullRomCurve3;
    cnoise: (vector: THREE.Vector3) => number;
}
