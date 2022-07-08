import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

// Debug
// const gui = new dat.GUI();
const voxelDim = 1;
let raycaster;
let INTERSECTED;

const pointer = new THREE.Vector2();

const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// getInitial voxels
generateVoxels(5, 10, 5, voxelDim);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 0);
scene.add(dirLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(18, 18, 18);
camera.lookAt(0, 0, 0);

scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Axes
const axesHelper = new THREE.AxesHelper();
scene.add(axesHelper);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const tick = () => {
  // Update Orbital Controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

/* 
-------------------------------------------------------------------
 */

function generateVoxels(xLen, yLen, zLen, voxelDim) {
  for (let i = 0; i < yLen; i += voxelDim) {
    for (let j = 0; j < zLen; j += voxelDim) {
      for (let k = 0; k < xLen; k += voxelDim) {
        generateVoxel(k, j, i, voxelDim);
      }
    }
  }
}

function generateVoxel(xPos, zPos, yPos, voxelDim) {
  //ThreeJs
  const geometry = new THREE.BoxGeometry(voxelDim, voxelDim, voxelDim);
  const color = new THREE.Color(
    `hsl(${200}, 100%, ${Math.floor(Math.random() * 50)}%)`
  );
  const material = new THREE.MeshLambertMaterial({ color });
  //   const material = new THREE.MeshLambertMaterial({ color:Math.random() * 0xffffff   });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(xPos, yPos, zPos);
  mesh.isSelected = false;
  scene.add(mesh);
}
