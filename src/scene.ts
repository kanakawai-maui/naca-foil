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
    this.scene.background = new THREE.Color("darkblue");
    this.scene.fog = new THREE.Fog("darkblue", 300, 550);
    // 2. Initiate FlyControls with various params
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  _clear() {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }

  update(
    naca_code: NacaCode,
    camber: number = 100,
    extrude_depth: number = 10,
  ) {
    this._clear();
    this.camera.position.z = 200;
    const { camera, scene, renderer } = this;

    const foil = new Vector2NacaFoil(camber, naca_code);
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
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    const g1 = this.getGlow(foil, "upper", extrude_depth);
    const g2 = this.getGlow(foil, "lower", extrude_depth);
    const g3 = this.getGlow(foil, "leadingedge", extrude_depth);

    scene.add(g1);
    scene.add(g2);
    scene.add(g3);

    mesh.rotation.x = THREE.MathUtils.degToRad(90);
    mesh.rotation.z = THREE.MathUtils.degToRad(-30);
    g1.rotation.y = THREE.MathUtils.degToRad(-60);
    g2.rotation.y = THREE.MathUtils.degToRad(-60);
    g3.rotation.y = THREE.MathUtils.degToRad(-60);

    // Plane geometry

    const width = 1024;
    const height = 0.07; // Example height value

    const numSegments = width - 1; // We have one less vertex than pixel

    var planeGeo = new THREE.PlaneGeometry(
      7500,
      7500,
      numSegments,
      numSegments,
    );

    geometry.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: false,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 0.8,
    });

    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.name = "clouds";

    const positionAttribute = plane.geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const z =
        height *
        (Math.sin(x * 0.002) * Math.cos(y * 0.002) +
          Math.sin(x * 0.005) * Math.cos(y * 0.005) +
          this.cnoise(new THREE.Vector3(x * 0.1, y * 0.1, Date.now() * 0.01)));
      positionAttribute.setZ(i, z);
    }
    positionAttribute.needsUpdate = true;

    plane.position.y = -200;
    plane.position.x = -100;
    plane.rotation.set((Math.PI * 1.5) / 3, 0, 0);

    scene.add(plane);
    // End plane geo

    const sunlight = new THREE.DirectionalLight(0xfffffb, 0.9);
    sunlight.position.set(200, 300, 400);
    sunlight.castShadow = true;

    sunlight.shadow.mapSize.width = 10024;
    sunlight.shadow.mapSize.height = 1024;
    sunlight.shadow.camera.near = 10;
    sunlight.shadow.camera.far = 1000;
    sunlight.intensity = 1;
    sunlight.castShadow = true;
    scene.add(sunlight);

    const spotLight = new THREE.SpotLight(0xadd8e6, 0.7);
    spotLight.position.set(100, 200, 500);
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.1;
    spotLight.decay = 2;
    spotLight.distance = 500;
    spotLight.castShadow = true;
    scene.add(spotLight);

    const al1 = new THREE.AmbientLight(0x0000ff, 4); // Soft ambient light
    scene.add(al1);

    const al2 = new THREE.AmbientLight(0x0000f0, 2); // Soft ambient light
    scene.add(al2);

    const al3 = new THREE.AmbientLight(0xffffff, 6); // Soft ambient light
    scene.add(al3);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(hemisphereLight);

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      const time = Date.now() * 0.0005;
      const meshDip = Math.sin(time) * 0.02;

      const liftFactor = 0.05; // Simulate lift effect
      const dragFactor = 0.01; // Simulate drag effect

      // Apply lift to the glow and mesh
      g1.position.y += liftFactor * Math.sin(time);
      g2.position.y += liftFactor * Math.sin(time);
      g3.position.y += liftFactor * Math.sin(time);
      mesh.position.y += liftFactor * Math.sin(time);

      // Simulate drag by slightly reducing forward motion
      plane.position.x += 0.015 - dragFactor;

      // Add slight rotation to simulate aerodynamic forces
      mesh.rotation.y += meshDip * 0.005; // Reduced rotation for realism
      g1.rotation.x += meshDip * 0.01;
      g2.rotation.x += meshDip * 0.01;
      g3.rotation.x += meshDip * 0.005;

      // Update plane position to make us look like we're in motion
      plane.position.x += 0.015;

      this.controls.update(delta);
      renderer.render(scene, camera);
    };
    animate();
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
