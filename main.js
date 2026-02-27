// CG HW1 - Environment side
import * as THREE from "./js/three.module.js";
import { OrbitControls } from "./js/OrbitControls.js";
let scene, camera, renderer;
let controls;

// textures 
let grassTex, roadTex, brickTex;

start();
loop();

function start() {
 scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 7, 18);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // shadows are required later anyway (sun light)
  renderer.shadowMap.enabled = true;

  document.body.appendChild(renderer.domElement);

  // Orbit controls (requirement)
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 2, 0);
  controls.enableDamping = true;

  window.addEventListener("resize", onResize);

  // background first so we don't stare at black
  
  setupSky();

  
    // debugging helper while placing stuff:
    // scene.add(new THREE.AxesHelper(5));
  

  // temporary light just so we can see objects while building.
  // Partner will add the proper "sun" DirectionalLight.
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);
}

function setupSky() {
  const skyLoader = new THREE.CubeTextureLoader();
  const sky = skyLoader.setPath("./skybox/").load([
    "px.jpg", "nx.jpg",
    "py.jpg", "ny.jpg",
    "pz.jpg", "nz.jpg"
  ]);
  scene.background = sky;
}

// --- load textures, THEN build the scene (but don't silently fail) ---
loadTexturesAndBuild();

function loadTexturesAndBuild() {
  const manager = new THREE.LoadingManager(
    () => {
      console.log("✅ Texture loading finished (including any errors). Building scene...");
      makeGroundAndRoad();
      makeHouses();
      placeTrees();
      placeLamps();
      camera.lookAt(0, 2, 0);
    }
  );

  manager.onError = (url) => {
    console.error("❌ Failed to load:", url);
  };

  const tl = new THREE.TextureLoader(manager);

  grassTex = tl.load("./textures/grass.jpg");
  roadTex  = tl.load("./textures/road.jpg");
  brickTex = tl.load("./textures/brick.jpg");

  // set wrapping/repeat (safe even if textures fail)
  [grassTex, roadTex, brickTex].forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
  });
  grassTex.repeat.set(12, 12);
  roadTex.repeat.set(1, 8);
  brickTex.repeat.set(2, 1);
}

function makeGroundAndRoad() {
  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 1,
    metalness: 0
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.9,
    metalness: 0
  });

  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 80), roadMat);
  road.rotation.x = -Math.PI / 2;

  // tiny lift so it doesn't flicker with the ground (z-fighting)
  road.position.y = 0.02;
  road.receiveShadow = true;
  scene.add(road);
}

function makeHouses() {
  // brick material for the main walls
  const wallMat = new THREE.MeshStandardMaterial({
    map: brickTex,
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.05
  });

  // roof: slightly flat-shaded so it doesn't look too smooth
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x7a2d2d,
    roughness: 1.0,
    metalness: 0.0,
    flatShading: true
  });

  // windows: emissive so they look like they have a bit of glow
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x111122,
    emissive: 0x222255,
    emissiveIntensity: 0.6,
    roughness: 0.3
  });

  for (let i = 0; i < 6; i++) {
    const x = -18 + i * 7;
    const z = -18;

    const house = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 6), wallMat);
    house.position.set(x, 2.5, z);
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.2, 4), roofMat);
    roof.position.set(x, 5.7, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);

    // front windows
    for (let w = 0; w < 3; w++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), windowMat);
      win.position.set(x - 2 + w * 2, 3, z + 3.01);
      scene.add(win);
    }
  }

  // TODO: add another row on the other side later if we have time
}

function placeTrees() {
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6b3f2a,
    roughness: 1.0
  });

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2f7d32,
    roughness: 0.9
  });

  for (let i = 0; i < 12; i++) {
    const x = (i % 6) * 10 - 25;
    const z = Math.floor(i / 6) * 18 - 10;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 4, 10),
      trunkMat
    );
    trunk.position.set(x, 2, z);
    trunk.castShadow = true;
    scene.add(trunk);

    // canopy as 3 spheres (simple but looks fine)
    for (let k = 0; k < 3; k++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), leafMat);
      leaf.position.set(x + (k - 1) * 1.0, 4.2 + (k % 2) * 0.4, z);
      leaf.castShadow = true;
      scene.add(leaf);
    }
  }
}

function placeLamps() {
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.3,
    roughness: 0.6
  });

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffffaa,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 0.85
  });

  for (let i = 0; i < 8; i++) {
    const z = -30 + i * 8;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 12), poleMat);
    pole.position.set(5, 2.5, z);
    pole.castShadow = true;
    scene.add(pole);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bulbMat);
    bulb.position.set(5, 5.2, z);
    scene.add(bulb);
  }
}

function loop() {
  requestAnimationFrame(loop);
  if (controls) controls.update();
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
