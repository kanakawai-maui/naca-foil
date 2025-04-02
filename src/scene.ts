import { generateAirfoil } from '.';
import * as THREE from 'three';

// Create Three.js scene
export class NacaFoilScene {
    render(naca_code) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        const points = generateAirfoil(naca_code);
        const shape = new THREE.Shape(points);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        const mesh = new THREE.Mesh(geometry, material);
        
        scene.add(mesh);
        camera.position.z = 200;

        function animate() {
            requestAnimationFrame(animate);
            mesh.rotation.y += 0.001;
            renderer.render(scene, camera);
        }
        animate();
    }
}
