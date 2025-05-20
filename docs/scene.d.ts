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
    /**
     * Initializes the 3D scene for visualizing a NACA airfoil with interactive controls.
     *
     * This constructor sets up the following:
     * - Loads saved settings (`nacaCode`, `chord`, `airFriction`) from `localStorage` or uses default values.
     * - Configures a Three.js scene, camera, and renderer.
     * - Adds an interactive GUI for modifying airfoil parameters:
     *   - `nacaCode`: The NACA airfoil code (e.g., "2412").
     *   - `chord`: The chord length of the airfoil.
     *   - `particleSpeed`: The speed of particles in the simulation.
     *   - `airFriction`: The air friction coefficient.
     *   - `reset`: Resets all settings to defaults and reloads the page.
     * - Sets up orbit controls for camera manipulation.
     * - Displays an optional axes helper for visualization.
     *
     * @param id - The ID of the container element where the renderer's canvas will be appended. Defaults to `"naca-foil"`.
     *
     * @remarks
     * - Arrow keys can be used to adjust the foil's angle of attack.
     * - The GUI allows real-time updates to the airfoil parameters, with changes saved to `localStorage`.
     * - The scene background is set to black, and the camera is positioned to provide a clear view of the airfoil.
     */
    constructor(id?: string);
    update(): void;
    getFoilMesh(foil: Vector2NacaFoil, extrude_depth?: number): THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>;
}
