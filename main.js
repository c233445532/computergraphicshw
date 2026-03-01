// CG HW1 - P1: environment + house modeling, start lighting, and start camera controls
import * as THREE from "./js/three.module.js";
import { OrbitControls } from "./js/OrbitControls.js";
// import { GLTFLoader } from './js/GLTFLoader.js'; // uncomment later ti use

//global variables: basic scene, camera, renderer and controls
let scene, camera, renderer;
let controls;

// textures
let grassTex, roadTex, pathTex, brickTex;

//camera movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

//for moement speed
const speed = 0.3; //for the walking/ flying
start();
loop();

//initisalisation of setting up the scene
function start() {
    scene = new THREE.Scene(); //scene is the container for all our 3d objects, lightsand cameras

    //camera set up
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 7, 18); //enruring we start with a good view of the environment, not too close to the ground and not too far away

    //renderer set  
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    //countrols for mouse to look around
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; //for smoother movement

    //keyboard movements controls
    window.addEventListener("keydown", (e) => {
        switch (e.code) {
            case "KeyW": moveForward = true; break;
            case "KeyS": moveBackward = true; break;
            case "KeyA": moveLeft = true; break;
            case "KeyD": moveRight = true; break;
            case "KeyQ": moveDown = true; break;
            case "KeyE": moveUp = true; break;
        }
    });
    window.addEventListener("keyup", (e) => {
        switch (e.code) {
            case "KeyW": moveForward = false; break;
            case "KeyS": moveBackward = false; break;
            case "KeyA": moveLeft = false; break;
            case "KeyD": moveRight = false; break;
            case "KeyQ": moveDown = false; break;
            case "KeyE": moveUp = false; break;
        }
    });

   
    setupSky();
    setupLights();
    loadTexturesAndBuild();
}

//sky setup using skybox
function setupSky() {
    const loader = new THREE.TextureLoader();
    loader.load(
        "./textures/sky.jpg",
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.background = texture;
        },
    );
}

//lights setupfor general light and directional for sun with shadows
function setupLights() {
    //creates ambient light provides general light to the scene but makes sure that all objects are still well visible
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    //sun light direnctional that will caste the shadows
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(25, 50, 10); //positioned to show shadows clearly across the scene
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);
}

//loads textures and then builds the environment once all textures are ready
function loadTexturesAndBuild() {
    const manager = new THREE.LoadingManager(() => {

        makeGroundAndRoad();
        makeHouses();
        makeHousePaths();
        placeTrees();
        makeRoad();
        makeRoadsidePaths();
        placeLamps();
        addLaneMarkings();
        camera.lookAt(0, 2, 0);
    });

    //using textures downloaded from polyhaven and edited to tile better 
    const tl = new THREE.TextureLoader(manager);
    grassTex = tl.load("./textures/grass.jpg");
    roadTex = tl.load("./textures/road.jpg");
    pathTex = tl.load("./textures/path.jpg");
    brickTex = tl.load("./textures/brick.jpg");

    [grassTex, roadTex, brickTex, pathTex].forEach(t => t.wrapS = t.wrapT = THREE.RepeatWrapping);

    //repeat sets to fix streching issues
    grassTex.repeat.set(12, 12);
    roadTex.repeat.set(24, 8);
    brickTex.repeat.set(2, 1);
    pathTex.repeat.set(64, 4);
}

//scene building functions for different elements of the environment, 
function makeGroundAndRoad() {
    const groundMat = new THREE.MeshStandardMaterial({
        map: grassTex,
    });

    //creats large ground plane to cover the whole scene and rotated to be horizontal and receive shadows
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), groundMat);
    ground.rotation.x = -Math.PI / 2; //lies flat
    ground.receiveShadow = true;
    scene.add(ground);
}

//creating houses - adding walls, roofs,windows, doors and door handles
function makeHouses() {
    const wallMat = new THREE.MeshStandardMaterial({
        map: brickTex, //for brick texture on walls
        color: 0xffffff,
    });
    const roofMat = new THREE.MeshStandardMaterial({
        color: 0x7a2d2d, // dark red for roofs
        flatShading: true
    });
    const windowMat = new THREE.MeshStandardMaterial({
        color: 0x5555aa, // light blue windows
        emissive: 0x222255,
    });
    const doorMat = new THREE.MeshStandardMaterial({
        color: 0x5a2d0c,  // dark brown for doors
        roughness: 0.8,
        metalness: 0.1
    });
    const handleMat = new THREE.MeshStandardMaterial({
        color: 0xffd700, //gold color for door handle
        roughness: 0.3,
        metalness: 1.0
    });

    //using loop to create a row of houses along the road creating a little neightbourhood
    for (let i = -2; i < 8; i++) {
        const x = -18 + i * 7; //spacing the house apart
        const z = -18; //placing in same row

        //creating main house body (box)
        const house = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 6), wallMat);
        house.position.set(x, 2.5, z);
        house.castShadow = true;
        house.receiveShadow = true;
        scene.add(house);
        //creating roof (cone)
        const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.2, 4), roofMat);
        roof.position.set(x, 5.7, z);
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        scene.add(roof);

        //adding windows on the front of each house
        for (let w = 0; w < 3; w++) {
            const win = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), windowMat);
            win.position.set(x - 2 + w * 2, 3, z + 3.01);
            scene.add(win);
        }
        for (let i = -2; i < 8; i++) {
        const x = -18 + i * 7;
        const z = -18;

        //create the door as a thin box
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 0.2), doorMat);
        door.position.set(x, 0.7, z + 3.01); //slightly in front of house
        door.castShadow = true;
        scene.add(door);
        }
        //adding spherical door handle
        const handle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), handleMat);
        handle.position.set(x + 0.35, 1.25, z + 3.12); //slightly in front and to the side
        scene.add(handle);
       }
}

//paths conencting sidewalk to each house
function makeHousePaths(){
    //brown dirt paths from houses to sidewalk
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    for(let i=-2; i<8; i++){
        const x = -18 + i * 7;
        const zStart = -15; // house front
        const zEnd = -7;    // sidewalk edge
        //creating the plane for the paths
        const path = new THREE.Mesh(new THREE.PlaneGeometry(1.2, zEnd - zStart), mat);
        path.rotation.x = -Math.PI / 2;
        path.position.set(x, 0.05, (zStart + zEnd)/2);
        scene.add(path);
    }
}

//creating the trees
function placeTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3f2a, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.9 });

    //loopign to place multiple trees along the road
    for (let i = 0; i < 12; i++) {
      //calculate the x and z positions which will spread the trees in grid
        const x = (i % 6) * 10 - 25; //for 6 trees in a row, spaced 10 units apart and  centered around the road
        const z = Math.floor(i / 6) * 18 - 10; //rows of trees paces 18 units apart

        //creating the trunk as a cylinder
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 4, 10), trunkMat);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        scene.add(trunk);

        //create leafs using multiple speheres together
        for (let k = 0; k < 3; k++) {
            const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), leafMat);
            leaf.position.set(x + (k - 1) * 1.0, 4.2 + (k % 2) * 0.4, z);
            leaf.castShadow = true;
            scene.add(leaf);
        }
    }
}

//creating road
function makeRoad() {
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.9, metalness: 0 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 10), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 0); //slightly above ground to prevent z-fighting
    road.receiveShadow = true;
    scene.add(road);
}

//creating sidewalks on either side of the road
function makeRoadsidePaths() {
    const pathMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.9 });
    const pathWidth = 2;
    const pathLength = 80;
    const pathHeight = 0.05;

    const rightPath = new THREE.Mesh(new THREE.PlaneGeometry(pathLength, pathWidth), pathMat);
    rightPath.rotation.x = -Math.PI / 2;
    rightPath.position.set(0, pathHeight, 5 + pathWidth / 2);
    rightPath.receiveShadow = true;
    scene.add(rightPath);

    const leftPath = new THREE.Mesh(new THREE.PlaneGeometry(pathLength, pathWidth), pathMat);
    leftPath.rotation.x = -Math.PI / 2;
    leftPath.position.set(0, pathHeight, -5 - pathWidth / 2);
    leftPath.receiveShadow = true;
    scene.add(leftPath);
}

//creating lamps along the road using cylinders for poles and spheres
function placeLamps() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.6 });
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffaa, emissiveIntensity: 1.0, transparent: true, opacity: 0.85 });
    const pathOffset = 1.1;

    for (let i = -35; i <= 35; i += 8) {
        const poleRight = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 12), poleMat);
        poleRight.position.set(i, 2.5, 5 + pathOffset);
        poleRight.castShadow = true;
        scene.add(poleRight);

        const bulbRight = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bulbMat);
        bulbRight.position.set(i, 5.2, 5 + pathOffset);
        scene.add(bulbRight);

        const poleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 12), poleMat);
        poleLeft.position.set(i, 2.5, -5 - pathOffset);
        poleLeft.castShadow = true;
        scene.add(poleLeft);

        const bulbLeft = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), bulbMat);
        bulbLeft.position.set(i, 5.2, -5 - pathOffset);
        scene.add(bulbLeft);
    }
}

//lane markings for road 
function addLaneMarkings() {
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    //placing small rectanglles every 8 unites along road to create dashed lane markings
    for (let i = -35; i < 40; i += 8) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.3), lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(i, 0.03, 0);
        scene.add(line);
    }
}

//animations loop to update camera movement based on keyboard input and render the scene
function loop() {
    requestAnimationFrame(loop);

    //camera movement vector based on which keys are pressed
    const moveVec = new THREE.Vector3();
    if (moveForward) moveVec.z -= speed;
    if (moveBackward) moveVec.z += speed;
    if (moveLeft) moveVec.x -= speed;
    if (moveRight) moveVec.x += speed;
    if (moveUp) moveVec.y += speed;
    if (moveDown) moveVec.y -= speed;

    //move camera relative to its current rotation
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir); // get forward direction
    dir.y = 0; // prevent tilting forward/back
    dir.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, dir).normalize();
    camera.position.addScaledVector(dir, -moveVec.z); //forward and back
    camera.position.addScaledVector(right, moveVec.x); //left and right
    camera.position.y += moveVec.y; //up and down
 
    //for requiements is to keep above ground level this pervents falling through the plane
    if (camera.position.y < 1) camera.position.y = 1;

    if (controls) controls.update(); //for mouse movements
    renderer.render(scene, camera); //render screen for camrera perspective
}



//creating sun
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(50, 40, 50); //positioned to ensure the shadows are accurate based on the placement of the sun
sun.castShadow = true;

// Shadow settings
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;

scene.add(sun);

//adding the visible sun
const sunSphereMat = new THREE.MeshStandardMaterial({
    color: 0xffff33, // yellow
    emissive: 0xffff33, //glowing instead of just a sphere
    emissiveIntensity: 1 
});
const sunSphere = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 64), sunSphereMat);
sunSphere.position.copy(sun.position); // position it at the light
scene.add(sunSphere);

//used temporarily to visualise the direction of the shadows and making correct
//const dirHelper = new THREE.DirectionalLightHelper(sun, 5,  0xffff33);
//scene.add(dirHelper);