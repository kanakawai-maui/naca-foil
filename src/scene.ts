import { Vector2NacaFoil } from './vector';
import * as THREE from 'three';
import { NacaCode } from './types';

// Create Three.js scene
export class NacaFoilScene {
    render(naca_code: NacaCode, camber: number = 100) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1024);
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        const foil = new Vector2NacaFoil(camber, naca_code);
        const shape = new THREE.Shape(foil.getVectors());
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 10, bevelEnabled: false });
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xF0F0FF, 
            wireframe: true, 
            roughness: 0.7, 
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);

        scene.add(mesh);
        camera.position.z = 200;

        // Plane geometry

        const width = 1024;
        const height = 7; // Example height value

        const numSegments = width - 1; // We have one less vertex than pixel

        const planeGeo = new THREE.PlaneGeometry(1000, 1000, numSegments, numSegments);

        const planeMat = new THREE.MeshStandardMaterial({
            color: 0xccccff,
            wireframe: false
        });

        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.name = 'terrain';

        const positionAttribute = plane.geometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            const z = height * (Math.random()/2);
            positionAttribute.setZ(i, z);
        }
        positionAttribute.needsUpdate = true;

        plane.position.y = 0;
        plane.rotation.set((Math.PI * 2) / 3,0,0);

        scene.add(plane);
        // End plane geo

        const sunlight = new THREE.DirectionalLight(0xffffff, 1);
        sunlight.position.set(200, 300, 400);
        sunlight.castShadow = true;

        sunlight.shadow.mapSize.width = 1024;
        sunlight.shadow.mapSize.height = 1024;
        sunlight.shadow.camera.near = 0.5;
        sunlight.shadow.camera.far = 1000;
        sunlight.intensity = 1;
        sunlight.castShadow = true;
        scene.add(sunlight);

        const ambientLight = new THREE.AmbientLight(0xFFFFFB, 0.8); // Soft ambient light
        scene.add(ambientLight);

        const hemisphereLight = new THREE.HemisphereLight( 0xfffffb, 0xffffbb, 1 );
        scene.add(hemisphereLight);

        const pointLight = new THREE.PointLight(0xffffbb, 0.9, 1000);
        pointLight.position.set(200, 150, 200);
        scene.add(pointLight);

        const spotLight = new THREE.SpotLight(0xffffbb, 0.7);
        spotLight.position.set(100, 200, 300);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.1;
        spotLight.decay = 2;
        spotLight.distance = 500;
        spotLight.castShadow = true;
        scene.add(spotLight);
    
        const spotLight2 = new THREE.SpotLight(0xffffbb, 0.7);
        spotLight2.position.set(100, 200, 300);
        spotLight2.angle = Math.PI / 3;
        spotLight2.penumbra = 0.1;
        spotLight2.decay = 2;
        spotLight2.distance = 1500;
        spotLight2.castShadow = true;
        scene.add(spotLight2);

        function animate() {
            requestAnimationFrame(animate);
            mesh.rotation.y += 0.001;
            renderer.render(scene, camera);
        }
        animate();
    }
}
