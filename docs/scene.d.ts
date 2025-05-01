import { Vector2NacaFoil } from './vector';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from "three";
export declare class Scene {
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    settings: {
        nacaCode: string;
        chord: number;
        particleSpeed: number;
        airFriction: number;
        reset: () => void;
    };
    renderer: THREE.WebGLRenderer;
    clock: THREE.Clock;
    controls: OrbitControls;
    constructor(id?: string);
    update(): void;
    getFoilMesh(foil: Vector2NacaFoil, extrude_depth?: number): THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>;
}
