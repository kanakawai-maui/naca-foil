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
    this.scene.fog = new THREE.FogExp2(0xe4dcff, 0.0025);
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

    var pg = new THREE.PlaneGeometry(7500, 7500, 256 - 1, 256 - 1);

    /*
        const fogMesh = new THREE.Mesh(
            pg,
            new THREE.MeshBasicMaterial({ color: new THREE.Color(0xefd1b5) })
          );
        
        fogMesh.material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader.replace(
                `#include <fog_pars_vertex>`,
                fogParsVert
            );
            shader.vertexShader = shader.vertexShader.replace(
                `#include <fog_vertex>`,
                fogVert
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <fog_pars_fragment>`,
                fogParsFrag
            );
            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <fog_fragment>`,
                fogFrag
            );
        
            const uniforms = ({
                fogNearColor: { value: new THREE.Color(0xfc4848) },
                fogNoiseFreq: { value: .0012 },
                fogNoiseSpeed: { value: 100 },
                fogNoiseImpact: { value: .5 },
                time: { value: 0 }
            });
        
            shader.uniforms = THREE.UniformsUtils.merge([shader.uniforms, uniforms]);
        };

        scene.add(fogMesh);
        */

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
      roughness: 0.01,
      metalness: 0.9,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.rotation.x = THREE.MathUtils.degToRad(90);
    mesh.rotation.z = THREE.MathUtils.degToRad(-30);

    scene.add(mesh);
    const g1 = this.addGlow(foil, true);
    const g2 = this.addGlow(foil, false);
    scene.add(g1);
    scene.add(g2);

    // Plane geometry

    const width = 1024;
    const height = 60; // Example height value

    const numSegments = width - 1; // We have one less vertex than pixel

    var planeGeo = new THREE.PlaneGeometry(
      7500,
      7500,
      numSegments,
      numSegments,
    );

    geometry.rotateX(-Math.PI / 2);

    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xccccff,
      wireframe: false,
      roughness: 0.9,
    });

    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.name = "terrain";

    const positionAttribute = plane.geometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const z =
        height *
        (Math.sin(i * 0.1) +
          Math.cos(i * 0.05) +
          this.cnoise(new THREE.Vector3(i * 0.1, 0, Date.now() * 0.0001)));
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

    sunlight.shadow.mapSize.width = 5024;
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

    const al1 = new THREE.AmbientLight(0xffffff, 0.4); // Soft ambient light
    scene.add(al1);

    const al2 = new THREE.AmbientLight(0xffffff, 0.4); // Soft ambient light
    scene.add(al2);

    const hemisphereLight = new THREE.HemisphereLight(0xadd8e6, 0xadd8e6, 0.3);
    scene.add(hemisphereLight);

    const pl1 = new THREE.PointLight(0xffffff, 0.8, 1000);
    pl1.position.set(200, 150, 200);
    scene.add(pl1);

    const pl2 = new THREE.PointLight(0xffffff, 0.4, 1000);
    pl2.position.set(250, 350, 300);
    scene.add(pl2);

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = this.clock.getDelta();

      // Use deterministic values for performance
      const sinDelta = Math.sin(Date.now() / 3000) / 100;
      const randomFactor = Math.random() * 0.1;
      const dir = Math.sin(Date.now() / 3000) >= 0 ? 1 : -1;

      mesh.position.y += (sinDelta * randomFactor * dir) / 10;
      mesh.rotation.y += (sinDelta * randomFactor * dir) / 50;
      mesh.rotation.x += (sinDelta * randomFactor * dir) / 100;

      plane.position.x += 0.015;

      this.controls.update(delta);
      renderer.render(scene, camera);
    };
    animate();
  }

  addGlow(foil: Vector2NacaFoil, upper: boolean = true) {
    // Create a glow effect around the mesh using Points and a PointsMaterial
    let glowShape = new THREE.Shape();
    let color = 0x000000;
    if (upper) {
      glowShape = new THREE.Shape(foil.getUpperVectors(1.5));
      color = 0xff0000;
    } else {
      glowShape = new THREE.Shape(foil.getLowerVectors(1.5));
      color = 0x0000ff;
    }

    const glowGeometry = new THREE.ExtrudeGeometry(glowShape, {
      depth: 5,
      bevelEnabled: false,
    });
    const glowMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(color), // Bright glow color in hexadecimal
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending, // Additive blending for glow effect
      depthWrite: false,
    });
    const colors = new Float32Array(glowGeometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      if (upper) {
        colors[i] = 1.0; // Red
        colors[i + 1] = 0.0; // Green
        colors[i + 2] = 0.3; // Blue
      } else {
        colors[i] = 0.3; // Red
        colors[i + 1] = 0.0; // Green
        colors[i + 2] = 1.0; // Blue
      }
    }
    glowGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    glowMaterial.vertexColors = true;
    glowMaterial.needsUpdate = true;

    const glow = new THREE.Points(glowGeometry, glowMaterial);

    glow.rotation.x = THREE.MathUtils.degToRad(0);
    glow.rotation.y = THREE.MathUtils.degToRad(30);

    return glow;
  }

  cnoise = (vector: THREE.Vector3) => {
    return Math.random() * Math.sin(Date.now() * 0.001) * vector.x * vector.y;
  };
}

const noise = `
//	Classic Perlin 3D Noise 
//	by Stefan Gustavson
//
//  Source https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
// 
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
`;

const fogParsVert = `
#ifdef USE_FOG
  varying float fogDepth;
  varying vec3 vFogWorldPosition;
#endif
`;

const fogVert = `
#ifdef USE_FOG
  fogDepth = - mvPosition.z;
   vFogWorldPosition = (modelMatrix * vec4( transformed, 1.0 )).xyz;
#endif
`;

const fogFrag = `
#ifdef USE_FOG
  vec3 windDir = vec3(0.0, 0.0, time);
  vec3 scrollingPos = vFogWorldPosition.xyz + fogNoiseSpeed * windDir;  
  float noise = cnoise(fogNoiseFreq * scrollingPos.xyz);
  float vFogDepth = (1.0 - fogNoiseImpact * noise) * fogDepth;
  #ifdef FOG_EXP2
  float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
  float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  gl_FragColor.rgb = mix( gl_FragColor.rgb, mix(fogNearColor, fogColor, fogFactor), fogFactor );
#endif

`;

const fogParsFrag = `
#ifdef USE_FOG
  ${noise}
	uniform vec3 fogColor;
  uniform vec3 fogNearColor;
	varying float fogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
  varying vec3 vFogWorldPosition;
  uniform float time;
  uniform float fogNoiseSpeed;
  uniform float fogNoiseFreq;
  uniform float fogNoiseImpact;
#endif
`;
