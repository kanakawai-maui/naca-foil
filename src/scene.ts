import { Vector2NacaFoil } from "./vector";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import * as RAPIER from "@dimforge/rapier3d";
import GUI from "lil-gui";
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
// Add an event listener to reset the scene when settings change



const boundingSpheres: THREE.Sphere[] = [];


// Create Three.js scene
export class Scene {
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
  clock: THREE.Clock = new THREE.Clock();
  controls: OrbitControls;

  constructor(id: string = "naca-foil") {
    // Load the saved NACA code from localStorage if available
    const savedNacaCode = localStorage.getItem("nacaCode") || '0015';
    console.log("Saved NACA code:", savedNacaCode);
    const savedChord = localStorage.getItem("chord") || '8';
    console.log("Saved chord:", savedChord);
    const savedAirFriction = localStorage.getItem("airFriction") || '0.6';
    console.log("Saved air friction:", savedAirFriction);
    this.settings = {
      nacaCode: savedNacaCode || "2412",
      chord: parseInt(savedChord) || 10,
      particleSpeed: 2.1,
      airFriction: parseFloat(savedAirFriction) || 0.6,
      reset: () => {
        localStorage.removeItem("nacaCode");
        localStorage.removeItem("chord");
        localStorage.removeItem("airFriction");
        location.reload(); // Refresh the page
      },
    };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1024,
    );
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const container = document.getElementById(id);
    if (container) {
      container.appendChild(this.renderer.domElement);
    } else {
      console.error(`Container with id "${id}" not found.`);
    }
    this.scene.background = new THREE.Color(0x000000); // Ocean blue color
    // 2. Initiate FlyControls with various params
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // An axis object to visualize the 3 axes in a simple way.
    // sThe X axis is red. The Y axis is green. The Z axis is blue.
    const axesHelper = new THREE.AxesHelper( 5 );

    this.camera.position.z -= 40;
    // this.scene.add(axesHelper);
    const gui = new GUI();
      gui.add(this.settings, "nacaCode").name("NACA Code").onChange((newValue: string) => {
        if (newValue.length >= 4) {
          localStorage.setItem("nacaCode", newValue); // Save the new value to localStorage
          location.reload(); // Refresh the page
        }
      });
      gui.add(this.settings, "chord", 1, 10, 1).name("Chord").onChange((newValue: number) => {
        localStorage.setItem("chord", newValue.toString()); // Save the new value to localStorage
        location.reload(); // Refresh the page
      });
      gui.add(this.settings, "particleSpeed", 0.1, 10, 0.1).name("Particle Speed");
      gui.add(this.settings, "airFriction", 0, 1, 0.01).name("Air Friction").onChange((newValue: number) => {
        localStorage.setItem("airFriction", newValue.toString()); // Save the new value to localStorage
        location.reload(); // Refresh the page
      });
      gui.add(this.settings, "reset").name("Reset").onChange(() => {
        localStorage.removeItem("nacaCode");
        localStorage.removeItem("chord");
        localStorage.removeItem("airFriction");
        location.reload(); // Refresh the page
      });
  }

  update() {

    const rapierWorld = new RAPIER.World({ x: 0, y: 0, z: 0 });

    const { camera, scene, renderer } = this;

    const resolution = 0.04;

    const depth = 10;

    console.log("NACA code:", this.settings.nacaCode);

    const vectors = new Vector2NacaFoil(this.settings.chord, this.settings.nacaCode, resolution);

    const foil = this.getFoilMesh(vectors, depth);

    foil.name = "foil"; // Assign a unique name

    scene.add(foil);

    const skyColor = 0xB1E1FF; // light blue
    const groundColor = 0xB97A20; // brownish orange
    const hemisphereLight = new THREE.HemisphereLight( skyColor, groundColor, 1 );
    scene.add( hemisphereLight );

    const sunlight = new THREE.DirectionalLight(0xfffffb, 1.5); // Increased intensity
    sunlight.position.set(2000, 1000, 9000);
    sunlight.castShadow = true;

    sunlight.shadow.mapSize.width = 10024;
    sunlight.shadow.mapSize.height = 1024;
    sunlight.shadow.camera.near = 10;
    sunlight.shadow.camera.far = 1000;
    sunlight.intensity = 1.5; // Increased intensity
    sunlight.castShadow = true;
    scene.add(sunlight);
    
    const upperDirectional = new THREE.DirectionalLight(0xFFFFFF, 5); // Increased intensity
    upperDirectional.position.set(100, 200, -400);
    scene.add(upperDirectional);

    const lowerDirectional = new THREE.DirectionalLight(0xFFFFFF, 5); // Increased intensity
    lowerDirectional.position.set(-100, -200, 400);
    scene.add(lowerDirectional);

    const upperProbe = new THREE.LightProbe(new THREE.SphericalHarmonics3(), 2); // Increased intensity
    upperProbe.position.set(10, 20, 40);
    scene.add(upperProbe);

    const lowerProbe = new THREE.LightProbe(new THREE.SphericalHarmonics3(), 2); // Increased intensity
    lowerProbe.position.set(-10, -20, -40);
    scene.add(lowerProbe);

    // Add a wind tunnel-like background
    const tunnelTexture = new THREE.TextureLoader().load(
      "https://threejs.org/examples/textures/uv_grid_opengl.jpg"
    );
    tunnelTexture.wrapS = THREE.RepeatWrapping;
    tunnelTexture.wrapT = THREE.RepeatWrapping;
    tunnelTexture.repeat.set(7, 1);

    const tunnelMaterial = new THREE.MeshBasicMaterial({
      map: tunnelTexture,
      side: THREE.BackSide,
      color: new THREE.Color(0x005249), // Dark blue-grey color
    });

    const tunnelGeometry = new THREE.CylinderGeometry(20, 20, 2000, 32, 1, false);
    const tunnelMesh = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnelMesh.rotation.z = Math.PI / 2; // Rotate to align with the scene
    tunnelMesh.position.set(0, 0, this.settings.chord / 2); // Center the tunnel
    scene.add(tunnelMesh);

    // Restrict camera movement to stay within the tunnel
    const tunnelRadius = 20;
    const tunnelLength = 2000;
    this.controls.maxDistance = 140;

    this.controls.addEventListener("change", () => {
      const cameraPosition = this.camera.position;

      // Constrain camera to the tunnel's cylindrical bounds
      const distanceFromCenter = Math.sqrt(cameraPosition.x ** 2 + cameraPosition.y ** 2);
      if (distanceFromCenter > tunnelRadius) {
      const scale = tunnelRadius / distanceFromCenter;
      cameraPosition.x *= scale;
      cameraPosition.y *= scale;
      }

      // Constrain camera along the tunnel's length
      cameraPosition.z = Math.max(
      -tunnelLength / 2 + this.settings.chord / 2,
      Math.min(tunnelLength / 2 - this.settings.chord / 2, cameraPosition.z)
      );
    });

    // Create particles to flow over and under the foil
    const particleCount = 1200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    const fieldScalar = 4; // 2 or 4 are better values

    // Set air friction (linear and angular damping) globally for all particles
    // Set linear and angular damping based on air friction
    const linearDamping = Math.max(0, 1 - this.settings.airFriction * 1.5); // Increased linear damping for stronger air resistance
    const angularDamping = Math.max(0, 1 - this.settings.airFriction * 1.5); // Increased angular damping for stronger air resistance

    console.log("Enhanced Linear Damping:", linearDamping, "Enhanced Angular Damping:", angularDamping); // Log enhanced damping values for debugging

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * this.settings.chord*6 * fieldScalar - this.settings.chord*6; // Spread particles within a cube along the x-axis
      const y = Math.random() * depth * fieldScalar - depth; // Spread particles within a cube along the y-axis
      const z = Math.random() * this.settings.chord * fieldScalar - this.settings.chord; // Spread particles within a cube along the z-axis
      particlePositions.set([x, y, z], i * 3);
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMaterial = new THREE.PointsMaterial({
      vertexColors: true, // Enable vertex colors to allow color blending
      size: 3.0, // Slightly larger size for a blurrier effect
      opacity: 0.9, // More transparent for a softer, blurry look
      transparent: true, // Enable transparency
      blending: THREE.AdditiveBlending, // Additive blending for a glowing effect
      depthWrite: false, // Disable depth writing for a smoother appearance
      sizeAttenuation: true, // Make particles appear more spherical
    });

    particleMaterial.map = new THREE.TextureLoader().load(
      "https://threejs.org/examples/textures/sprites/circle.png"
    );
    particleMaterial.map.wrapS = THREE.ClampToEdgeWrapping;
    particleMaterial.map.wrapT = THREE.ClampToEdgeWrapping;
    particleMaterial.map.minFilter = THREE.LinearFilter;
    // Add fog to obscure edges of the scene
    const fogColor = new THREE.Color(0x0049FF); // Match the tunnel's color for a cohesive look
    const fogNear = 30;
    const fogFar = 200;
    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

    const colors = new Float32Array(particleGeometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 0.01; // Red
      colors[i + 1] = 0.01; // Green
      colors[i + 2] = 0.1; // Blue
    }
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleMaterial.vertexColors = true;
    particleMaterial.needsUpdate = true;

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const particleBodies: RAPIER.RigidBody[] = [];
    for (let i = 0; i < particleCount; i++) {
      const index = i * 3;
      const x = particlePositions[index];
      const y = particlePositions[index + 1];
      const z = particlePositions[index + 2];

      const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
      const rigidBody = rapierWorld.createRigidBody(rigidBodyDesc);

      const colliderDesc = RAPIER.ColliderDesc.ball(1); // Small radius for particles
      const collider = rapierWorld.createCollider(colliderDesc, rigidBody);
      if (!collider) {
      console.error("Failed to create collider for the rigid body.");
      }

      // Apply air friction to the particle's velocity
      rigidBody.setLinearDamping(linearDamping); // Set linear damping for air resistance
      rigidBody.setAngularDamping(angularDamping); // Set angular damping for air resistance

      particleBodies.push(rigidBody);
    }

    // Create a group of overlapping bounding spheres representing the foil
    const foilVertices = vectors.getCoreVectors();

    const boundingSphereGroup = new THREE.Group();
    

    for (let i = 0; i < foilVertices.length; i += 1) {
      for (let z = -depth/2; z <= depth/2; z += depth / 20) {
      const vertex = new THREE.Vector3(
        foilVertices[i].x,
        0,
        z+depth/2
      );

      const radii = Math.abs((foilVertices[i].y)); // Use 1/2 the difference between upper and lower edges as the radius

      const sphere = new THREE.Sphere(vertex, radii); // Use 1/2 the absolute value of y as the radius
      boundingSpheres.push(sphere);
      const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(radii, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x101010, wireframe: true })
      );
      sphereMesh.position.copy(vertex);
      boundingSphereGroup.add(sphereMesh);

      // Create a Rapier rigid body and collider for the sphere
      const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(vertex.x, vertex.y, vertex.z);
      const rigidBody = rapierWorld.createRigidBody(rigidBodyDesc);

      const colliderDesc = RAPIER.ColliderDesc.ball(radii);
      rapierWorld.createCollider(colliderDesc, rigidBody);
      }
    }

    // Add Unreal-style post-processing effects
    const unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.09, // strength (reduced for less intensity)
      0.9, // radius
      0.25 // threshold
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(unrealBloomPass);

    // Add TiltShift effect
    const tiltShiftPass = new ShaderPass({
      uniforms: {
      tDiffuse: { value: null },
      focus: { value: Math.max(0.6, 0.5 + (this.settings.particleSpeed - 2.1) * 0.05) }, // Reduced focus adjustment
      maxblur: { value: Math.min(0.5, 0.01 + (this.settings.particleSpeed) * 0.01) }, // Reduced maxblur for less blur
      aspect: { value: window.innerWidth / window.innerHeight },
      },
      vertexShader: `
      varying vec2 vUv;
      void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
      fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float focus;
      uniform float maxblur;
      uniform float aspect;
      varying vec2 vUv;

      void main() {
      vec4 color = vec4(0.0);
      float h = focus - vUv.y;
      float blur = maxblur * abs(h);
      vec2 offset = vec2(blur / aspect, blur);
      color += texture2D(tDiffuse, vUv + offset) * 0.3; // Adjusted weights for a lighter effect
      color += texture2D(tDiffuse, vUv - offset) * 0.3; // Adjusted weights for a lighter effect
      color += texture2D(tDiffuse, vUv) * 0.4; // Adjusted weights for a lighter effect
      gl_FragColor = color;
      }
      `,
    });
    composer.addPass(tiltShiftPass);

    // Add bounding spheres to the scene for visualization
    // scene.add(boundingSphereGroup);


    const animate = () => {
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      const positions = particleGeometry.attributes.position.array;

      // Update particle positions based on Rapier physics simulation
      rapierWorld.step();

      // Make the foil tip up and down
      foil.rotation.z = Math.sin(this.clock.elapsedTime * this.settings.particleSpeed) * (0.5 / this.settings.particleSpeed); // Oscillate around the x-axis with smaller amplitude as speed increases
      foil.position.y = Math.cos(this.clock.elapsedTime * this.settings.particleSpeed) * (5 / this.settings.particleSpeed); // Oscillate around the x-axis

      // Update boundingSphereGroup physics
      boundingSphereGroup.rotation.z = Math.sin(this.clock.elapsedTime * this.settings.particleSpeed) * 0.1;
      boundingSphereGroup.position.y = Math.cos(this.clock.elapsedTime * this.settings.particleSpeed) * 1;

      // Sync particle positions with Rapier rigid bodies
      for (let i = 0; i < particleCount; i++) {
      const rigidBody = particleBodies[i];
      const translation = rigidBody.translation();
      const index = i * 3;

      // Move particles from right to left (positive x direction)
      let newX = translation.x + this.settings.particleSpeed;

      // Wrap particles around to keep them within bounds
      if (newX > this.settings.chord + 100) {
        newX = Math.random() * this.settings.chord / 2 * fieldScalar - this.settings.chord / 2 + (-100);
        const newY = Math.random() * depth * fieldScalar - depth + (-10);
        const newZ = Math.random() * this.settings.chord / 2 * 2 * fieldScalar - this.settings.chord / 2 + (-10);
        rigidBody.setTranslation({ x: newX, y: newY, z: newZ }, true);
        colors[index] = 0.001; // Red
        colors[index + 1] = 0.005; // Green
        colors[index + 2] = 0.1; // Blue
      } else {
        rigidBody.setTranslation({ x: newX, y: translation.y, z: translation.z }, true);
      }

      // Check for collisions with bounding spheres
      for (const sphere of boundingSpheres) {
        const sphereCenter = new THREE.Vector3(
        sphere.center.x - (4 / this.settings.particleSpeed),
        sphere.center.y,
        sphere.center.z
        );
        const particlePosition = new THREE.Vector3(
        translation.x,
        translation.y,
        translation.z
        );
        const distance = sphereCenter.distanceTo(particlePosition);

        // Update particle color based on proximity and foil rotation
        const maxDistance = sphere.radius * (40 / this.settings.particleSpeed),
          intensity = 1 - Math.min(distance / maxDistance, 1),
          iscalar = foil.rotation.z > 0.01 ? intensity : 1 - intensity;

        if (distance <= sphere.radius * ((this.settings.airFriction*10)^2)) {
        // Calculate impulse based on collision normal
        const normal = particlePosition.clone().sub(sphereCenter).normalize();
        const impulse = normal.multiplyScalar(this.settings.particleSpeed * 0.9);
        rigidBody.applyImpulse(
          { x: impulse.x * (intensity^2), y: impulse.y, z: impulse.z },
          true
        );

        const offset = new THREE.Vector3(0, sphere.radius, 0);
        const newPosition = particlePosition.clone().add(offset);
        const yimpulse = new THREE.Vector3(0, 0, 0);

        // Ensure the particle is displaced based on its position relative to the sphere
        const leadingEdgeOffset = foil.position.x - this.settings.chord / 2; // Calculate leading edge offset
        if (particlePosition.x < leadingEdgeOffset) {
          // If the particle is near the leading edge, apply a stronger upward impulse
          yimpulse.y = Math.abs(newPosition.x) * 0.2; // Increase y impulse near the leading edge
          rigidBody.setTranslation(
            { x: particlePosition.x, y: particlePosition.y + 0.2, z: particlePosition.z },
            true
          );
        } else if (particlePosition.y > sphere.radius) {
          yimpulse.y = newPosition.x * 0.1; // Increase y as x increases
          rigidBody.setTranslation(
            { x: particlePosition.x, y: particlePosition.y + 0.1, z: particlePosition.z },
            true
          );
        } else {
          yimpulse.y = -newPosition.x * 0.1; // Decrease y as x increases
          rigidBody.setTranslation(
            { x: particlePosition.x, y: particlePosition.y - 0.1, z: particlePosition.z },
            true
          );
        }

        // Add random turbulence
        if (Math.random() < 0.2) {
          const turbulence = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
          );
          rigidBody.applyImpulse(
          { x: turbulence.x, y: turbulence.y, z: turbulence.z },
          false
          );
        }

        // Apply wind acceleration
        const foilCenter = boundingSphereGroup.position;
        const windAcceleration = new THREE.Vector3(
          0.5,
          (foilCenter.y / 10 - translation.y),
          (foilCenter.z - translation.z) * 0.02
        );
        rigidBody.applyImpulse(
          { x: windAcceleration.x, y: windAcceleration.y, z: windAcceleration.z },
          true
        );

        // Apply lift force
        const liftForce = new THREE.Vector3(0, Math.abs(foil.rotation.z) * 0.9, 0);
        rigidBody.applyImpulse(
          { x: liftForce.x, y: liftForce.y, z: liftForce.z },
          true
        );

        // Add swirling effect near the sphere
        const swirlRadius = sphere.radius * (6 / this.settings.particleSpeed);
        const toCenter = particlePosition.clone().sub(sphereCenter);
        if (toCenter.length() <= swirlRadius) {
          const swirlVector = new THREE.Vector3(-toCenter.z, 0, toCenter.x).normalize();
          const swirlEffect = swirlVector.multiplyScalar(
          0.9 * (1 - toCenter.length() / swirlRadius)
          );
          rigidBody.applyImpulse(
          { x: swirlEffect.x, y: swirlEffect.y, z: swirlEffect.z },
          true
          );
        }

        colors[index] = Math.min(1.0 * iscalar, 1);
        colors[index + 1] = 0.01;
        colors[index + 2] = Math.min(1.0 * intensity, 1);
        }
      }

      particleGeometry.attributes.color.needsUpdate = true;

      // Update particle positions based on rigid body translation
      positions[index] = rigidBody.translation().x;
      positions[index + 1] = rigidBody.translation().y;
      positions[index + 2] = rigidBody.translation().z;
      }

      particleGeometry.attributes.position.needsUpdate = true;

      this.controls.update(delta);
      renderer.render(scene, camera);
      composer.render(delta);
      
    };

    

    animate();
  }

  getFoilMesh(foil: Vector2NacaFoil, extrude_depth: number = 10) {
    const shape = new THREE.Shape(foil.getVectors());

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: extrude_depth,
      steps: 1,
      bevelEnabled: true,
    });

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: false,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.9,
    });
    const foilMesh = new THREE.Mesh(geometry, material);
    return foilMesh;
  }
}
