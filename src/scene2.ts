import { Vector2NacaFoil } from "./vector";
import * as THREE from "three";
import { NacaCode } from "./types";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Create Three.js scene
export class NacaFoilScene {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock = new THREE.Clock();
  controls: OrbitControls;

  constructor(id: string = "naca-foil") {
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
    this.scene.background = new THREE.Color(0x1e90ff); // Ocean blue color
    this.scene.fog = new THREE.FogExp2("blue", 0.2);
    // 2. Initiate FlyControls with various params
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // An axis object to visualize the 3 axes in a simple way.
    // sThe X axis is red. The Y axis is green. The Z axis is blue.
    const axesHelper = new THREE.AxesHelper( 5 );
    this.scene.add(axesHelper);
  }

  update(
    naca_code: NacaCode,
    depth: number = 10,
    chord: number = 10
  ) {
    this.camera.position.z -= 40;

    const { camera, scene, renderer } = this;

    const resolution = 0.1;

    const vectors = new Vector2NacaFoil(chord, naca_code, resolution);

    const foil = this.getFoilMesh(vectors, depth);

    scene.add(foil);

    /*
    const g1 = this.getGlow(vectors, "upper", depth);
    const g2 = this.getGlow(vectors, "lower", depth);
    const g3 = this.getGlow(vectors, "leadingedge", depth);

    scene.add(g1);
    scene.add(g2);
    scene.add(g3);
    */

    const sunlight = new THREE.DirectionalLight(0xfffffb, 0.9);
    sunlight.position.set(200, 1000, 900);
    sunlight.castShadow = true;

    sunlight.shadow.mapSize.width = 10024;
    sunlight.shadow.mapSize.height = 1024;
    sunlight.shadow.camera.near = 10;
    sunlight.shadow.camera.far = 1000;
    sunlight.intensity = 1;
    sunlight.castShadow = true;
    scene.add(sunlight);

    const spotLight = new THREE.SpotLight(0xadd8e6, 0.7);
    spotLight.position.set(500, 500, 500);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.1;
    spotLight.decay = 2;
    spotLight.distance = 1500;
    spotLight.castShadow = true;
    scene.add(spotLight);

    const al1 = new THREE.AmbientLight(0x0000ff, 0.9); // Soft ambient light
    scene.add(al1);

    const al2 = new THREE.AmbientLight(0xff0000, 0.9); // Soft ambient light
    scene.add(al2);

    const al3 = new THREE.AmbientLight(0x00ff00, 0.9); // Soft ambient light
    scene.add(al3);

    const hemisphereLight = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 0.9);
    scene.add(hemisphereLight);

    // Create particles to flow over and under the foil
    const particleCount = 500000;
    const pg = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * chord * 2 - chord; // Spread particles within a cube along the x-axis
      const y = Math.random() * chord * 2 - chord; // Spread particles within a cube along the y-axis
      const z = Math.random() * chord * 2 - chord; // Spread particles within a cube along the z-axis
      particlePositions.set([x, y, z], i * 3);
    }

    pg.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      opacity: 0.8,
      blending: THREE.AdditiveBlending, // Additive blending for glow effect
    });

    const colors = new Float32Array(pg.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      const y = pg.attributes.position.getY(i / 3);
      if (y >= 0) {
        colors[i] = 1.0; // Red
        colors[i + 1] = 0.0; // Green
        colors[i + 2] = 0.3; // Blue
      } else {
        colors[i] = 0.0; // Red
        colors[i + 1] = 0.0; // Green
        colors[i + 2] = 1.0; // Blue
      }
    }
    pg.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleMaterial.vertexColors = true;
    particleMaterial.needsUpdate = true;

    const particles = new THREE.Points(pg, particleMaterial);
    scene.add(particles);

    const cloudGeo = new THREE.SphereGeometry(32, 32, 32);

    const cloudMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending, // Additive blending for glow effect
      depthWrite: true,
    });

    // const clouds: Array<THREE.Mesh> = [];

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      const time = Date.now();
      const floor = Math.floor(time);

      const seed = Math.random();

      /*
      if (floor % 20 === 0) {
        if (seed > 0.7) {
          const mat = cloudMat.clone();
          const geo = cloudGeo.clone();
          const cloud = new THREE.Mesh(geo, mat);
          const positionAttribute = geo.attributes.position;
          const noiseFactor = 5; // Adjust for more or less irregularity

          for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);

            const offsetX = (Math.random() - 0.5) * noiseFactor;
            const offsetY = (Math.random() - 0.5) * noiseFactor;
            const offsetZ = (Math.random() - 0.5) * noiseFactor;

            positionAttribute.setXYZ(i, x + offsetX, y + offsetY, z + offsetZ);
          }

          positionAttribute.needsUpdate = true;
         }} 
          cloud.position.set(
            -1500/2, // Spread clouds across the front in x-axis
            Math.random() * 10 + 10, // Position clouds slightly above the horizon in y-axis
            Math.random() * 10 - 100 // Keep clouds in a narrow band along the z-axis
              );
              cloud.name = `cloud-${time}`;
              cloud.scale.set(
            Math.random() * 1 + 0.1, // Random scale
            Math.random() * 0.1 + 0.1,
            Math.random() * 1 + 0.1
              );
              cloud.castShadow = true;
              cloud.material.vertexColors = true;
              cloud.receiveShadow = true;
              cloud.material.color.setHSL(Math.random(), 0.5, 0.5);
              cloud.material.needsUpdate = true;

              clouds.unshift(cloud);

              this.scene.add(cloud);
              if (clouds.length >= 30) {
            const last = clouds.pop();
            if (last) {
              this.scene.remove(last);
            }
              }
            }
          }
          */
    
          const f = time * 0.002;
          const aoa = Math.sin(f);
          
          const liftFactor = 1.5; // Increased lift effect for quicker ascent
          const smoothFactor = 0.02; // Adjust for smoother oscillation

          if(aoa > 0.5) {
            foil.rotation.z += smoothFactor * Math.sin(f) / 5 * (aoa > 0.5 ? 1 : -1);
            foil.position.y += smoothFactor * Math.cos(f) * (liftFactor) * (aoa > 0.5 ? 1 : -1);
          } else { 
            foil.rotation.z -= smoothFactor * Math.sin(f) / 5 * (aoa > 0.5 ? 1 : -1);
            foil.position.y -= smoothFactor * Math.cos(f) * (liftFactor) * (aoa > 0.5 ? 1 : -1);
          }

          // Animate particles to flow over and under the foil
          const particleSpeed = 0.05;
            const animateParticles = () => {
            let particleGeometry = pg.clone()
            const positions = particleGeometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
              const index = i * 3;
              const x = positions[index];
              const y = positions[index + 1];
              const z = positions[index + 2];

              // Simulate fluid-like behavior with velocity and turbulence
              const velocity = new THREE.Vector3(
              (foil.position.x - x) * 0.01, // Adjust x velocity to simulate flow
              (foil.position.y - y) * 0.01, // Adjust y velocity to simulate flow
              (Math.random() - 0.5) * 0.02 // Add slight random z velocity for turbulence
              ).normalize().multiplyScalar(particleSpeed);

              positions[index] += velocity.x;
              positions[index + 1] += velocity.y;
              positions[index + 2] += velocity.z;

              // Add a damping effect to simulate fluid resistance
              positions[index] *= 0.995;
              positions[index + 1] *= 0.995;
              positions[index + 2] *= 0.995;

              // Wrap particles around to keep them within bounds
              if (positions[index] > chord || positions[index] < -chord) {
              positions[index] = Math.random() * chord * 2 - chord;
              }
              if (positions[index + 1] > chord || positions[index + 1] < -chord) {
              positions[index + 1] = Math.random() * chord * 2 - chord;
              }
              if (positions[index + 2] > chord || positions[index + 2] < -chord) {
              positions[index + 2] = Math.random() * chord * 2 - chord;
              }
            }
            positions[0] -= 0.1; // Move particles left along the x-axis
            particleGeometry.attributes.position.needsUpdate = true;
          };
          

          animateParticles();

          this.controls.update(delta);
          renderer.render(scene, camera);
    };
    animate();
  }

  makeConvexPlane(plane: THREE.Mesh, radius: number = 100) {
    // Ensure the plane is curved like the Earth's surface
    const positionAttribute = plane.geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z = positionAttribute.getZ(i);

      // Calculate the length of the vector from the origin
      const length = Math.sqrt(x * x + y * y + z * z);

      // Scale the vector to match the desired radius
      const factor = radius / length;

      positionAttribute.setX(i, x * factor);
      positionAttribute.setY(i, y * factor);
      positionAttribute.setZ(i, z * factor);
    }
    positionAttribute.needsUpdate = true;

    // Recompute the normals for proper lighting
    plane.geometry.computeVertexNormals();
  }

  getOceanMesh(width: number = 1024 * 7) {
    const numSegments = width - 1; // We have one less vertex than pixel

    var planeGeo = new THREE.PlaneGeometry(
      width,
      width,
      numSegments,
      numSegments,
    );

    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x1e90ff, // Ocean blue color
      wireframe: false,
      roughness: 0.45,
      metalness: 0.99,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.name = "ocean";

    // Add wave-like displacement to simulate ocean surface
    const positionAttribute = plane.geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z =
      0.9 * Math.sin(x * 7 + Date.now()) +
      0.5 * Math.cos(y * 5 + Date.now());
      positionAttribute.setZ(i, z);
    }

    this.makeConvexPlane(plane, 100);

    positionAttribute.needsUpdate = true;

    plane.position.y = -100;

    plane.rotation.set((Math.PI * 1.5) / 3, 0, 0);

    return plane;
  }

  getFoilMesh(foil: Vector2NacaFoil, extrude_depth: number = 10) {
    const shape = new THREE.Shape(foil.getVectors());
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: extrude_depth,
      bevelEnabled: true,
    });

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: false,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0.9,
    });
    const foilMesh = new THREE.Mesh(geometry, material);
    return foilMesh;
  }

  getGlow(
    foil: Vector2NacaFoil,
    position: "upper" | "lower" | "leadingedge",
    depth: number = 10,
  ) {
    // Create a glow effect around the mesh using Points and a PointsMaterial
    let glowShape = new THREE.Shape();
    let closed = false;
    let opacity = 0.2;
    let points2D = foil.getPoints(true);
    switch (position) {
      case "upper":
        points2D = foil.getUpper();
        glowShape = new THREE.Shape(foil.getUpperVectors(1.5));
        break;
      case "lower":
        points2D = foil.getLower();
        glowShape = new THREE.Shape(foil.getLowerVectors(1.5));
        break;
      case "leadingedge":
        points2D = foil.getLeadingEdge();
        glowShape = new THREE.Shape(foil.getLeadingEdgeVectors(1.5));
        closed = true;
        opacity = 0.05;
        break;
      default:
        console.warn("Invalid option for 'upper'");
        break;
    }

    const curve = this.getCurve(points2D, closed);

    const glowGeometry = new THREE.ExtrudeGeometry(glowShape, {
      steps: 1000,
      depth: depth,
      bevelEnabled: false,
      extrudePath: curve,
    });

    const glowMaterial = new THREE.PointsMaterial({
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending, // Additive blending for glow effect
      depthWrite: true,
    });

    const colors = new Float32Array(glowGeometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      if (position === "upper") {
        colors[i] = 1.0; // Red
        colors[i + 1] = 0.0; // Green
        colors[i + 2] = 0.3; // Blue
      } else if (position === "lower") {
        colors[i] = 0.0; // Red
        colors[i + 1] = 0.0; // Green
        colors[i + 2] = 1.0; // Blue
      } else if (position === "leadingedge") {
        colors[i] = 0.0; // Red
        colors[i + 1] = 1.0; // Green
        colors[i + 2] = 0.3; // Blue
      }
    }
    glowGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    glowMaterial.vertexColors = true;
    glowMaterial.needsUpdate = true;

    const glow = new THREE.Points(glowGeometry, glowMaterial);

    return glow;
  }

  getCurve = (point2D: [number, number][], closed: boolean = false) => {
    const points = point2D
      .map(([x, y]) => new THREE.Vector3(x / 1 / 30, y / 1 / 30, 1))
      .filter((_, i) => i % 5 === 0);
    const closedSpline = new THREE.CatmullRomCurve3(points, true); // true for closed curve
    closedSpline.curveType = "catmullrom";
    closedSpline.closed = closed;
    closedSpline.tension = 0.9; // Adjust tension for smoothness
    return closedSpline;
  };

  cnoise = (vector: THREE.Vector3) => {
    return Math.random() * Math.sin(Date.now() * 0.001) * vector.x * vector.y;
  };
}
