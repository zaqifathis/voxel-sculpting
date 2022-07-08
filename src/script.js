import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

// Debug
// const gui = new dat.GUI();
const voxelDim = 1;
let INTERSECTED;

const canvas = document.querySelector("canvas.webgl");
let scene = new THREE.Scene();
// scene.background = new THREE.Color(0x222222);

//Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Base camera
const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  1000
);

camera.position.set(22, 22, 22);
camera.lookAt(0, 0, 0);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// getInitial voxels
generateVoxels(5, 15, 5, voxelDim);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 0);
scene.add(dirLight);

window.addEventListener("pointermove", onPointerMove);
window.addEventListener("click", removeVoxel);
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

// Axes
const axesHelper = new THREE.AxesHelper();
scene.add(axesHelper);

//raycaster
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const tick = () => {
  // Update Orbital Controls
  controls.update();

  render();
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

function onPointerMove(event) {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function removeVoxel(event) {
  const selectedVoxel = INTERSECTED.uuid;
  console.log("removeVoxel::", selectedVoxel);
  scene.children.forEach((child, i) => {
    if (child.uuid === selectedVoxel) {
      scene.children.splice(i, 1);
    }
  });
}

function render() {
  camera.updateMatrixWorld();

  // update the picking ray with the camera and pointer position
  // find intersections
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, false);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
      }
      INTERSECTED = intersects[0].object;
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
      INTERSECTED.material.emissive.setHex(0xff0000);
    }
  }

  renderer.render(scene, camera);
}
