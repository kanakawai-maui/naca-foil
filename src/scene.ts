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
    compareNacaCode: string;
    particleSize: number;
    showWireframe: boolean;
    showBoundaryLines: boolean;
    particleSpeed: number;
    airFriction: number;
    particleCount: number;
    particleOpacity: number;
    turbulentViscosity: number;
    boundaryForceSize: number;
    boundaryLayerSize: number;
    compareNacaPositionX: number;
    reset: () => void;
  };
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock = new THREE.Clock();
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
  constructor(id: string = "naca-foil") {
    // Load the saved NACA code from localStorage if available
    const savedNacaCode = localStorage.getItem("nacaCode") || '2412';
    console.log("Saved NACA code:", savedNacaCode);
    const savedCompareNacaCode = localStorage.getItem("compareNacaCode") || '';
    console.log("Compare NACA code:", savedCompareNacaCode);
    const savedAirFriction = localStorage.getItem("airFriction") || '0.01';
    console.log("Saved air friction:", savedAirFriction);
    const savedParticleCount = localStorage.getItem("particleCount") || '5000';
    console.log("Saved particle count:", savedParticleCount);
    // Load the saved particle size from localStorage if available
    const savedParticleSize = localStorage.getItem("particleSize") || '14.6';
    console.log("Saved particle size:", savedParticleSize);
    // Load the saved particle speed from localStorage if available
    const savedParticleSpeed = localStorage.getItem("particleSpeed") || '990';
    console.log("Saved particle speed:", savedParticleSpeed);
    const savedParticleOpacity = localStorage.getItem("particleOpacity") || '0.76';
    console.log("Saved particle opacity:", savedParticleOpacity);
    const savedTurbulentViscosity = localStorage.getItem("turbulentViscosity") || '0.5';
    console.log("Saved turbulent viscosity:", savedTurbulentViscosity);
    const savedShowWireframe = localStorage.getItem("showWireframe") || 'false';
    console.log("Saved show wireframe:", savedShowWireframe);
    const savedBoundaryLayerSize = localStorage.getItem("boundaryLayerSize") || '0.1';
    console.log("Saved boundary layer size:", savedBoundaryLayerSize);
    const savedShowBoundaryLines = localStorage.getItem("showBoundaryLines") || 'false';
    console.log("Saved show boundary lines:", savedShowBoundaryLines);
    const savedCompareNacaPositionX = localStorage.getItem("compareNacaPositionX") || '10';
    console.log("Saved compare NACA position X:", savedCompareNacaPositionX);
    const savedBoundaryForceSize = localStorage.getItem("boundaryForceSize") || '1000';
    console.log("Saved boundary force size:", savedBoundaryForceSize);
    
    this.settings = {
      nacaCode: savedNacaCode || "2412",
      compareNacaCode: savedCompareNacaCode || "",
      showWireframe: savedShowWireframe === 'true',
      showBoundaryLines: savedShowBoundaryLines === 'true',
      chord: 8,
      particleSize: parseFloat(savedParticleSize) || 14.6,
      particleOpacity: parseFloat(savedParticleOpacity) || 0.76,
      particleSpeed: parseFloat(savedParticleSpeed) || 990,
      particleCount: parseInt(savedParticleCount) || 5000,
      airFriction: parseFloat(savedAirFriction) || 0.01,
      turbulentViscosity: parseFloat(savedTurbulentViscosity) || 0.1,
      boundaryLayerSize: parseFloat(savedBoundaryLayerSize) || 0.1,
      compareNacaPositionX: parseFloat(savedCompareNacaPositionX) || 10,
      boundaryForceSize: parseFloat(savedBoundaryForceSize) || 1000,
      reset: () => {
        localStorage.removeItem("nacaCode");
        localStorage.removeItem("airFriction");
        localStorage.removeItem("particleCount");
        localStorage.removeItem("particleSize");
        localStorage.removeItem("particleSpeed");
        localStorage.removeItem("particleOpacity");
        localStorage.removeItem("showWireframe");
        localStorage.removeItem("compareNacaCode");
        localStorage.removeItem("turbulentViscosity");
        localStorage.removeItem("boundaryLayerSize");
        localStorage.removeItem("showBoundaryLines");
        localStorage.removeItem("compareNacaPositionX");
        localStorage.removeItem("boundaryForceSize");
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
    // const axesHelper = new THREE.AxesHelper( 5 );

    this.camera.position.z -= 200;
    // this.scene.add(axesHelper);
    const gui = new GUI();
      gui.add(this.settings, "nacaCode").name("NACA Code").onChange((newValue: string) => {
        const isValidNacaCode = /^[0-9]{4,5}$/.test(newValue);
        if (isValidNacaCode) {
          localStorage.setItem("nacaCode", newValue); // Save the new value to localStorage
          location.reload();
        }
      });
      gui.add(this.settings, "particleCount", 1000, 22800, 100).name("Particle Count").onChange((newValue: number) => {
        localStorage.setItem("particleCount", newValue.toString()); // Save the new value to localStorage
        location.reload(); // Refresh the page
      });
      gui.add(this.settings, "particleSpeed", 180, 2000, 10).name("Velocity (km/h)").onChange((newValue: number) => {
        localStorage.setItem("particleSpeed", newValue.toString()); // Save the new value to localStorage
      });
      gui.add(this.settings, "airFriction", 0, 1, 0.01).name("Drag Coefficient").onChange((newValue: number) => {
        localStorage.setItem("airFriction", newValue.toString()); // Save the new value to localStorage
      });
      gui.add(this.settings, "boundaryForceSize", 500, 10000, 500).name("Bound. Force Size").onChange((newValue: number) => {
        localStorage.setItem("boundaryForceSize", newValue.toString()); // Save the new value to localStorage
      });
      gui.add(this.settings, "boundaryLayerSize", 0, 1, 0.01).name("Bound. Layer Size").onChange((newValue: number) => {
        localStorage.setItem("boundaryLayerSize", newValue.toString()); // Save the new value to localStorage
        location.reload(); // Refresh the page
      });
      gui.add(this.settings, "turbulentViscosity", 0, 1, 0.01).name("Turbulent Viscosity").onChange((newValue: number) => {
        localStorage.setItem("turbulentViscosity", newValue.toString()); // Save the new value to localStorage
      });
      gui.add(this.settings, "showBoundaryLines").name("Boundary Lines").onChange((newValue: boolean) => {
        localStorage.setItem("showBoundaryLines", newValue.toString()); // Save the new value to localStorage
        location.reload(); // Refresh the page
      });
      gui.add(this.settings, "showWireframe").name("Wireframe Only").onChange((newValue: boolean) => {
        localStorage.setItem("showWireframe", newValue.toString()); // Save the new value to localStorage
        this.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.material instanceof THREE.MeshStandardMaterial) {
              object.material.wireframe = newValue;
              object.material.emissive = newValue ? new THREE.Color(0x00FF00) : new THREE.Color(0x000000) ; // Set emissive color to green
              object.material.needsUpdate = true;
            }
          }
        });
      });

      gui.add(this.settings, "particleSize", 0.1, 18, 0.1).name("Particle Size").onChange((newValue: number) => {
        localStorage.setItem("particleSize", newValue.toString()); // Save the new value to localStorage
        const particlesObject = this.scene.getObjectByName("particles");
        const particleMaterial = particlesObject instanceof THREE.Points ? particlesObject.material as THREE.PointsMaterial : null;
        if (particleMaterial) {
          particleMaterial.size = newValue;
          particleMaterial.needsUpdate = true;
        }
      });
      gui.add(this.settings, "particleOpacity", 0, 1, 0.01).name("Particle Opacity").onChange((newValue: number) => {
        localStorage.setItem("particleOpacity", newValue.toString()); // Save the new value to localStorage
        const particlesObject = this.scene.getObjectByName("particles");
        const particleMaterial = particlesObject instanceof THREE.Points ? particlesObject.material as THREE.PointsMaterial : null;
        if (particleMaterial) {
          particleMaterial.opacity = newValue;
          particleMaterial.needsUpdate = true;
        }
      });
      
      const compareFolder = gui.addFolder("Compare Settings");

      compareFolder.add(this.settings, "compareNacaCode").name("Compare Last").onChange((newValue: string) => {
        if (newValue === "") {
          localStorage.removeItem("compareNacaCode");
          location.reload();
        }
        const isValidNacaCode = /^[0-9]{4,5}$/.test(newValue);
        if (isValidNacaCode) {
          localStorage.setItem("compareNacaCode", newValue); // Save the new value to localStorage
          location.reload();
        }
      });

      compareFolder.add(this.settings, "compareNacaPositionX", 8, 80, 1).name("Compare Position").onChange((newValue: number) => {
        localStorage.setItem("compareNacaPositionX", newValue.toString()); // Save the new value to localStorage
        location.reload(); // Refresh the page
      });

      gui.add({ info: "←→ Use Arrow Keys" }, "info")
      .name("Angle of Attack")
      .disable();
      gui.add({ info: "↑↓ Use Arrow Keys" }, "info")
      .name("Altitude")
      .disable();
      

      gui.add(this.settings, "reset").name("Reset").onChange(() => {
        localStorage.removeItem("nacaCode");
        localStorage.removeItem("chord");
        localStorage.removeItem("airFriction");
        localStorage.removeItem("particleCount");
        localStorage.removeItem("particleSize");
        localStorage.removeItem("particleSpeed");
        localStorage.removeItem("turbulentViscosity");
        localStorage.removeItem("particleOpacity");
        localStorage.removeItem("boundaryLayerSize");
        localStorage.removeItem("showBoundaryLines");
        localStorage.removeItem("showWireframe");
        localStorage.removeItem("compareNacaCode");
        location.reload(); // Refresh the page
      });
  }

  update() {

    const rapierWorld = new RAPIER.World({ x: 0, y: 0, z: 0 });

    const { camera, scene, renderer } = this;

    const resolution = 0.1;

    const foils = [];

    let depth = 1;

    const vectors = new Vector2NacaFoil(this.settings.chord, this.settings.nacaCode, resolution);

    const foil = this.getFoilMesh(vectors, depth);

    // Add boundary lines for the foil
    if(this.settings.showBoundaryLines) {
      const shape = new THREE.Shape(vectors.getVectors());
      const foilEdgesGeometry = new THREE.EdgesGeometry(new THREE.ShapeGeometry(shape));
      const foilLineMaterial = new THREE.LineDashedMaterial({ color: 0xffffff });
      const foilBoundaryLines = new THREE.LineSegments(foilEdgesGeometry, foilLineMaterial);
      const scaledBoundaryLines = foilBoundaryLines.clone();
      const scaleFactor = 1 + this.settings.boundaryLayerSize;
      scaledBoundaryLines.scale.set(scaleFactor, scaleFactor, 0);
      scaledBoundaryLines.position.set(0, 0, depth/2);
      foil.add(scaledBoundaryLines);
      for (let i = 3; i <= 5; i++) {
        const scaledBoundaryLines = foilBoundaryLines.clone();
        const scaleFactor = Math.pow(i + 0.1, 1.1);
        scaledBoundaryLines.scale.set(scaleFactor/3, scaleFactor/3, 0);
        scaledBoundaryLines.position.set(0, 0, depth/2);
        scaledBoundaryLines.position.x -= 0.25;
        foil.add(scaledBoundaryLines);
      }

    }

    foil.name = "foil"; // Assign a unique name
    
    scene.add(foil);
    foils.push(foil);

    let foilAlt = null;
    let vectorsAlt = null;


    if(this.settings.compareNacaCode !== "") {
      depth = 5;
      vectorsAlt = new Vector2NacaFoil(this.settings.chord, this.settings.compareNacaCode, resolution);
      foilAlt = this.getFoilMesh(vectorsAlt, depth);
      foilAlt.name = "foil"; // Assign a unique name
      scene.add(foilAlt);
      foilAlt.position.x = -this.settings.compareNacaPositionX;
    }

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
    //scene.add(tunnelMesh);

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
    const particleCount = this.settings.particleCount; // Reduced particle count
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);



    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMaterial = new THREE.PointsMaterial({
      vertexColors: true, // Enable vertex colors to allow color blending
      size: this.settings.particleSize, // Slightly larger size for a blurrier effect
      opacity: this.settings.particleOpacity, // More transparent for a softer, blurry look
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
      colors[i + 2] = 0.01; // Blue
    }
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleMaterial.vertexColors = true;
    particleMaterial.needsUpdate = true;

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.name = "particles"; // Assign a unique name
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

      particleBodies.push(rigidBody);
    }

    for (let i = 0; i < particleCount; i++) {
      const rigidBody = particleBodies[i];
      const newX = Math.random() * 200 - 100; // Reset to a random position between -100 and 100
      const theta = Math.random() * Math.PI * 2; // Random angle in radians
      const phi = Math.random() * Math.PI; // Random angle in radians
      const radius = 20; // Radius for spherical coordinates
      const newY = radius * Math.sin(phi) * Math.sin(theta); // Y coordinate
      const newZ = radius * Math.cos(phi); // Z coordinate
      rigidBody.setTranslation({ x: newX, y: newY, z: newZ }, true);
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true); // Reset linear velocity
      rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true); // Reset angular velocity
      rigidBody.addForce({ x: this.settings.particleSpeed/2, y: 0, z: 0 }, true); // Reset velocity
    }

    // Create a group of overlapping bounding spheres representing the foil
    let foilVertices = vectors.getCoreVectors();

    if(foilAlt && vectorsAlt) {
      const foilVerticesAlt = vectorsAlt.getCoreVectors();
      foilVertices = [...foilVertices, ...foilVerticesAlt];
    }

    const boundingSphereGroup = new THREE.Group();
    
    for (let i = 0; i < foilVertices.length; i += 1) {
      for (let z = -depth; z <= 0; z += depth/10) {
        const radii = Math.abs((foilVertices[i].y)); // Use 1/2 the difference between upper and lower edges as the radius
        const vertex = new THREE.Vector3(
          foilVertices[i].x,
          0,
          z+depth
        );

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
      focus: { value: 0.5 }, // Adjusted focus to center the effect
      maxblur: { value: 0.02 }, // Reduced maxblur for a more subtle effect
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
        color += texture2D(tDiffuse, vUv + offset) * 0.33; // Balanced weights
        color += texture2D(tDiffuse, vUv - offset) * 0.33; // Balanced weights
        color += texture2D(tDiffuse, vUv) * 0.34; // Balanced weights
        gl_FragColor = color;
      }
      `,
    });
    composer.addPass(tiltShiftPass);

    // Add bounding spheres to the scene for visualization
    // scene.add(boundingSphereGroup);

    // Make the foil tip up and down based on arrow key input
    const rotationFactor = 0.1; // Adjust amplitude
    const distanceFactor = 1.0; // Adjust distance
   
    // Smoothly listen for arrow key input
    let targetRotationZ = foil.rotation.z;
    let targetPositionZ = foil.position.y;

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        targetRotationZ += rotationFactor; // Increase target rotation
      } else if (event.key === "ArrowRight") {
        targetRotationZ -= rotationFactor; // Increase target rotation
      }
      if (event.key === "ArrowUp") {
          targetPositionZ += distanceFactor; // Increase target rotation
        } else if (event.key === "ArrowDown") {
          targetPositionZ -= distanceFactor; // Decrease target rotation
        }
    });

    // Smoothly interpolate foil rotation
    const smoothSpeed = 0.1;
    const updateFoilRotationPosition = () => {
      foil.rotation.z += (targetRotationZ - foil.rotation.z) * smoothSpeed;
      foil.position.y += (targetPositionZ - foil.position.y) * smoothSpeed;
      return [foil.rotation.z, foil.position.y];
    };

    const adjustFoilRotation = () => {
      const boundingBox = new THREE.Box3().setFromObject(foil);
      const initialWidth = boundingBox.max.x - boundingBox.min.x;

      let maxWidth = initialWidth;
      let optimalRotation = foil.rotation.z;

      for (let angle = 0; angle <= Math.PI * 2; angle += 1) {
        foil.rotation.z = angle;
        foil.position.y -= 0.1;
        const testBoundingBox = new THREE.Box3().setFromObject(foil);
        const testWidth = testBoundingBox.max.x - testBoundingBox.min.x;

        if (testWidth > maxWidth) {
          maxWidth = testWidth;
          optimalRotation = angle;
        }
      }

      foil.rotation.z = optimalRotation;
      console.log(`Optimal rotation for maximum projection on X-axis: ${optimalRotation}`);
    };

    adjustFoilRotation();

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = this.clock.getDelta();

      //applyGravityToFoil(delta);

      // Set air friction (linear and angular damping) globally for all particles
      // Set linear and angular damping based on air friction
      const linearDamping = Math.max(0, 1 - this.settings.airFriction * 1.5); // Increased linear damping for stronger air resistance
      const angularDamping = Math.max(0, 1 - this.settings.airFriction * 1.0); // Increased angular damping for stronger air resistance

      const positions = particleGeometry.attributes.position.array;

      // Update Rapier physics simulation
      rapierWorld.step();

      const [rotation, position] = updateFoilRotationPosition();

      // Update boundingSphereGroup physics
      boundingSphereGroup.rotation.z = rotation;
      boundingSphereGroup.position.y = position;



      // Precompute reusable values for performance
      const sphereCenters = boundingSpheres.map(sphere => new THREE.Vector3(sphere.center.x, foil.position.y, sphere.center.z));
      const sphereRadii = boundingSpheres.map(sphere => sphere.radius);
      const sphereCenterline = boundingSpheres.reduce(
      (acc, sphere) => acc.add(sphere.center),
        new THREE.Vector3(0, 0, 0)
      ).divideScalar(boundingSpheres.length);

      let updatedNuTilde = 0.5; // Turbulent viscosity (adjust as needed)

      // Sync particle positions with Rapier rigid bodies
      for (let i = 0; i < particleCount; i++) {
        const rigidBody = particleBodies[i];
        const translation = rigidBody.translation();
        const index = i * 3;

        const particlePosition = new THREE.Vector3(
          translation.x,
          translation.y,
          translation.z
        );

        // Apply air friction to the particle's velocity
        rigidBody.setLinearDamping(linearDamping); // Set linear damping for air resistance
        rigidBody.setAngularDamping(angularDamping); // Set angular damping for air resistance

        // Move particles from right to left (positive x direction)
        let newX = translation.x + THREE.MathUtils.mapLinear(this.settings.particleSpeed, 10, 2000, 0.01, 10);

        // Check for collisions with the tunnel walls
        const distanceFromCenter = Math.sqrt(translation.y ** 2 + translation.z ** 2);
        if (distanceFromCenter >= tunnelRadius) {
          // Reflect the particle back into the tunnel
          const collisionNormal = new THREE.Vector3(0, translation.y, translation.z).normalize();
          const velocity = new THREE.Vector3(
            rigidBody.linvel().x,
            rigidBody.linvel().y,
            rigidBody.linvel().z
          );

          // Retain the x velocity while reflecting the y and z components
          const reflectedVelocity = new THREE.Vector3(
            velocity.x, // Retain x velocity
            velocity.y - 2 * velocity.dot(collisionNormal) * collisionNormal.y,
            velocity.z - 2 * velocity.dot(collisionNormal) * collisionNormal.z
          );
          rigidBody.setLinvel({ x: reflectedVelocity.x, y: reflectedVelocity.y, z: reflectedVelocity.z }, true);

          // Adjust position to ensure the particle is inside the tunnel
          const penetrationDepth = distanceFromCenter - tunnelRadius;
          const correction = collisionNormal.multiplyScalar(penetrationDepth);
          rigidBody.setTranslation(
            { x: translation.x, y: translation.y - correction.y, z: translation.z - correction.z },
            true
          );
        }
      

        // Wrap particles around to keep them originating from the front of the tunnel
        if (newX > 100) {
          newX = Math.random() * 15 - 100; // Reset to a random position between -100 and -80
          const theta = Math.random() * Math.PI * 2; // Random angle in radians
          const phi = Math.random() * Math.PI; // Random angle in radians
          const radius = 10; // Radius for spherical coordinates
          const newY = radius * Math.sin(phi) * Math.sin(theta); // Y coordinate
          const newZ = radius * Math.cos(phi); // Z coordinate
          rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true); // Reset linear velocity
          rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true); // Reset angular velocity
          rigidBody.setTranslation({ x: newX, y: newY, z: newZ }, true);
          rigidBody.addForce({ x: this.settings.particleSpeed * delta, y: 0, z: 0 }, true); // Reset velocity
          colors[index] = 0.01; // Red
          colors[index + 1] = 0.01; // Green
          colors[index + 2] = 0.01; // Blue
        } 

        // Apply Spalart-Allmaras turbulence model
        const nuTilde = this.settings.turbulentViscosity || 0.1; // Turbulent viscosity (adjust as needed)
        const sigma = 2.0 / 3.0; // Turbulent Prandtl number
        const cb1 = 0.1355; // Model constant
        const cw1 = cb1 / (sigma ** 2); // Model constant
        const cw3 = 2.0; // Model constant


        let sphereCenter = sphereCenters[0];
        let sphereRadius = sphereRadii[0];
        const boundaryLayerThickness = Math.max(0.01, sphereRadius * this.settings.boundaryLayerSize); // Approximate boundary layer thickness

        let distanceToParticle = sphereCenter.distanceTo(particlePosition);

        const velocity = new THREE.Vector3(
          rigidBody.linvel().x,
          rigidBody.linvel().y,
          rigidBody.linvel().z
        );

        // Update particle colors based on position and velocity
        let centerlineDistance = translation.y - sphereCenter.y;

        

        if (!(particlePosition.x > sphereCenter.x + sphereRadius + boundaryLayerThickness)) {
            for (let j = 0; j < boundingSpheres.length; j++) {
              if (distanceToParticle > sphereRadii[j] + boundaryLayerThickness) {
                continue; // Skip this particle if it's outside the bounding sphere
              } else  {
                if(particlePosition.x < sphereCenter.x - sphereRadius - boundaryLayerThickness) {
                  sphereCenter = sphereCenters[j];
                  sphereRadius = sphereRadii[j];
                  distanceToParticle = sphereCenter.distanceTo(particlePosition);
                  centerlineDistance = particlePosition.y - sphereCenter.y;
                } 
                 
                  
                
              }
            }

            const distanceFactor = Math.min(0.1, (1/Math.pow(distanceToParticle, 3))); // Fall off at the cube of the distance
            const velocityFactor = Math.max(1, Math.pow(velocity.length(), 2)); // Scale velocity factor

            if (centerlineDistance > 0) {
              // Above the foil (red)
              colors[index] = Math.min(1.0 * distanceFactor * velocityFactor, 0.5); // Red increases
              colors[index + 1] = 0.01; // Green remains constant
              colors[index + 2] = 0.01; // Blue is zero
            } else {
              // Below the foil (blue)
              colors[index] = 0.01; // Red is zero
              colors[index + 1] = 0.01; // Green remains constant
              colors[index + 2] = Math.min(1.0 * distanceFactor * velocityFactor, 1); // Blue increases
            }

            // Compute production term  
            const production = cb1 * nuTilde * Math.pow(velocity.length() / 1000, 2);

            // Compute destruction term
            const destruction = cw1 * Math.pow(nuTilde / boundaryLayerThickness, 2) * (1 + cw3 * Math.pow(nuTilde / boundaryLayerThickness, 2));

            // Update turbulent viscosity
            const deltaNuTilde = production - destruction;
            updatedNuTilde = Math.max(0, nuTilde + deltaNuTilde * delta);

            // Apply turbulent viscosity as an additional drag force
            const turbulentDragForce = velocity.clone().multiplyScalar(-updatedNuTilde);
            rigidBody.applyImpulse(
              { x: Math.min(50, turbulentDragForce.x), y: Math.min(500, turbulentDragForce.y), z: Math.min(1, turbulentDragForce.z/1) },
              true
            );



            // Calculate impulse based on collision normal
            const collisionNormal = particlePosition.clone().sub(sphereCenter).normalize();
            const penetrationDepth = sphereRadius + boundaryLayerThickness - distanceToParticle;

            // Apply boundary layer effect
            const boundaryLayerEffect = collisionNormal.multiplyScalar(penetrationDepth * 0.5);
            rigidBody.applyImpulse(
              { x: boundaryLayerEffect.x * (1/Math.pow(distanceToParticle,2)), y: boundaryLayerEffect.y* (1/Math.pow(distanceToParticle,2)), z: boundaryLayerEffect.z* (1/Math.pow(distanceToParticle,2)) },
              true
            );

            // Adjust particle velocity to simulate boundary layer drag
            const dragCoefficient = this.settings.airFriction; // Adjust drag coefficient for boundary layer

            const dragForce = velocity.clone().multiplyScalar(-dragCoefficient);
            rigidBody.applyImpulse(
              { x: dragForce.x* (1/Math.pow(distanceToParticle,2)), y: dragForce.y* (1/Math.pow(distanceToParticle,2)), z: dragForce.z* (1/Math.pow(distanceToParticle,2)) },
              true
            );

            const dy = centerlineDistance > 0 ? 1 : -1; // Determine direction of the particle relative to the foil
             // Increase drag proportionally to the foil's rotation
             const rotationDragFactor = Math.abs(foil.rotation.z) * 0.1; // Adjust the multiplier as needed
             const rotationDragForce = velocity.clone().multiplyScalar(-rotationDragFactor).length();

            // Apply a force to guide particles along the boundary of the foil
            const tangentDirection = particlePosition.clone().sub(sphereCenter).normalize().cross(new THREE.Vector3(0, 0, 1)).normalize();
            const boundaryForceStrength = this.settings.boundaryForceSize; // Adjust the strength of the force
            const boundaryForce = tangentDirection.multiplyScalar(boundaryForceStrength);
            rigidBody.applyImpulse(
              { x: rotationDragForce * boundaryForce.x * (1 / Math.pow(distanceToParticle, 2)), y: dy * boundaryForce.y * (1 / Math.pow(distanceToParticle, 2)), z: boundaryForce.z * (1 / Math.pow(distanceToParticle, 3)) },
              true
            );
            
          }

        // Apply force to the foil based on particle collisions
        const foilForce = new THREE.Vector3(0, 0, 0);

        for (let j = 0; j < boundingSpheres.length; j++) {
          const sphereCenter = sphereCenters[j];
          const sphereRadius = sphereRadii[j];

          const particlePosition = new THREE.Vector3(
            translation.x,
            translation.y,
            translation.z
          );

          if (distanceToParticle <= sphereRadius) {
            const collisionNormal = particlePosition.clone().sub(sphereCenter).normalize();
            const penetrationDepth = sphereRadius - distanceToParticle;

            // Calculate force based on penetration depth
            const collisionForce = collisionNormal.multiplyScalar(penetrationDepth * 0.1);
            foilForce.add(collisionForce);
          }
        }

        // Apply the accumulated force to the foil's position
        foil.position.y += foilForce.y * 0.001; // Adjust the multiplier for sensitivity

          // Update particle positions based on rigid body translation
          positions[index] = translation.x;
          positions[index + 1] = translation.y;
          positions[index + 2] = translation.z;
      }

      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.color.needsUpdate = true;

      this.controls.update(delta);
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

    // const wireframe = new THREE.WireframeGeometry(geometry);
    // const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    // const line = new THREE.LineSegments(wireframe, lineMaterial);
    // this.scene.add(line);

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
