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
    addGlow(foil: Vector2NacaFoil, upper?: boolean): THREE.Points<THREE.ExtrudeGeometry, THREE.PointsMaterial, THREE.Object3DEventMap>;
    cnoise: (vector: THREE.Vector3) => number;
}
