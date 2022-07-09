import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

//---------------------------------------------------------------------
// Vairable declare
const voxelDim = 1;
const objects = [];
let INTERSECTED;
let material = new THREE.LineBasicMaterial({
  color: 0xffffff,
});

/* 
Setup ---------------------------------------------------------------------
 */
const canvas = document.querySelector("canvas.webgl");
let scene = new THREE.Scene();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Camera
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

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 0);
scene.add(dirLight);

// Initial Voxel
generateVoxels(5, 15, 5, voxelDim);

//eventListener
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("click", onPointerDown);

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

// Grid Helper
const gridHelper = new THREE.GridHelper(30, 30);
scene.add(gridHelper);

// Axes
const axesHelper = new THREE.AxesHelper();
scene.add(axesHelper);

//raycaster
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

//Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Animate
const tick = () => {
  controls.update();

  render();
  window.requestAnimationFrame(tick);
};
tick();

/*
---------------------------------------------------------------------
 */

function render() {
  camera.updateMatrixWorld();
  raycaster.setFromCamera(pointer, camera), material;
  const intersects = raycaster.intersectObjects(scene.children, false);

  if (intersects.length > 0) {
    if (
      INTERSECTED != intersects[0].object &&
      intersects[0].object.type !== "GridHelper"
    ) {
      if (INTERSECTED) {
        material = INTERSECTED.material;
        if (material.emissive) {
          material.emissive.setHex(INTERSECTED.currentHex);
        } else {
          material.color.setHex(INTERSECTED.currentHex);
        }
      }
      INTERSECTED = intersects[0].object;
      material = INTERSECTED.material;
      if (material.emissive) {
        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
        material.emissive.setHex(0xff0000);
      } else {
        INTERSECTED.currentHex = material.color.getHex();
        material.color.setHex(0xff0000);
      }
    }
  }

  renderer.render(scene, camera);
}

/* 
Generate Voxel -------------------------------------------------------------------
 */

function generateVoxels(xLen, yLen, zLen, voxelDim) {
  for (let i = voxelDim / 2; i < yLen; i += voxelDim) {
    for (let j = voxelDim / 2; j < zLen; j += voxelDim) {
      for (let k = voxelDim / 2; k < xLen; k += voxelDim) {
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
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(xPos, yPos, zPos);
  mesh.isSelected = false;
  scene.add(mesh);
}

// ---------------------------------------------------------------------
// EventListener Funct

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onPointerDown(event) {
  const selectedVoxel = INTERSECTED.uuid;
  console.log("removeVoxel::", selectedVoxel);
  scene.children.forEach((child, i) => {
    if (child.uuid === selectedVoxel) {
      scene.children.splice(i, 1);
    }
  });
}

function onDocumentKeyDown(event) {
  switch (event.keyCode) {
    case 16:
      isShiftDown = true;
      break;
  }
}

function onDocumentKeyUp(event) {
  switch (event.keyCode) {
    case 16:
      isShiftDown = false;
      break;
  }
}
