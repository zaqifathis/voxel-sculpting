//import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.142.0/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'https://unpkg.com/three@0.142.0/examples/jsm/loaders/FBXLoader';
import { io } from 'socket.io-client';

//import * as dat from 'lil-gui';

//this is a branch of Voxel-Sculpting by Gilang

export const Game = () => {
  /** 
BASE SET-UP
 */
  //const gui = new dat.GUI();
  const voxelDim = 1;
  let INTERSECTED;
  let removedTowers;
  let material = new THREE.LineBasicMaterial({
    color: 0xffffff,
  });
  let firstTimeRightClick = true;

  const canvas = document.querySelector('canvas.webgl');
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

  //Resize
  window.addEventListener('resize', () => {
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

  // Controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  // getInitial voxels
  //let tower = generateVoxels(5, 15, 5, voxelDim);
  let playState = null;
  //console.log(tower);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 0);
  scene.add(dirLight);

  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('click', removeVoxel);
  window.addEventListener('auxclick', removeRandomVoxels);

  /** 
HELPER
 */
  // Grid
  const gridHelper = new THREE.GridHelper(30, 30);
  scene.add(gridHelper);

  // Axes
  const axesHelper = new THREE.AxesHelper();
  scene.add(axesHelper);

  // Raycaster
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

  const socket = io();

  socket.on('user-connected', (payload) => {
    playState = payload;
    //console.log('user connected::::', payload);

    scene.children = scene.children.filter((obj) => {
      if (obj.isVox) {
        disposeMesh(scene, obj, true);
        return false;
      }

      return true;
    });

    if (payload.host === socket.id) {
      generateVoxels(5, 15, 5, voxelDim);
    } else {
      generateFromState();
    }
  });

  socket.on('removed', (payload) => {
    playState = payload;

    scene.children = scene.children.filter((obj) => {
      if (obj.isVox) {
        disposeMesh(scene, obj, true);
        return false;
      }

      return true;
    });

    generateFromState();
  });

  tick();

  /* 
FUNCTION
-------------------------------------------------------------------
 */

  function disposeMesh(scene, object, recur) {
    if (!object.isObject3D) return;

    if (!object) return;

    scene.remove(object);

    if (object.parent) object.parent.remove(object);

    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose(); // we don't use textures

    if (recur) {
      object.children.forEach((child) => disposeMesh(child, recur));
    }
  }

  function generateVoxels(xLen, yLen, zLen, voxelDim, doNotEmit) {
    //console.log('generateVoxels:::');
    const tower = {};

    for (let i = voxelDim / 2; i < yLen; i += voxelDim) {
      for (let j = voxelDim / 2; j < zLen; j += voxelDim) {
        for (let k = voxelDim / 2; k < xLen; k += voxelDim) {
          const voxel = generateVoxel(k, j, i, voxelDim);
          tower[voxel.name] = { ...voxel };
        }
      }
    }

    //console.log('generateVoxels:::', scene.children.length);

    playState.state = tower;

    if (!doNotEmit) {
      socket.emit('on-generate', playState);
    }
  }

  function generateFromState() {
    Object.keys(playState.state).forEach((key) => {
      const { color, name, xPos, yPos, zPos } = playState.state[key];
      generateVoxel(xPos, zPos, yPos, voxelDim, name, color);
    });

    console.log('generateFromState:::', scene.children.length);
  }

  function generateVoxel(xPos, zPos, yPos, voxelDim, key, assignedColor) {
    //ThreeJs
    const geometry = new THREE.BoxGeometry(voxelDim, voxelDim, voxelDim);

    //TODO: import UUID library
    //const name = `${Math.round(Math.random() * 100000000)}-${Date.now()}`;

    const color =
      assignedColor ||
      new THREE.Color(`hsl(${200}, 100%, ${Math.floor(Math.random() * 50)}%)`);
    const material = new THREE.MeshLambertMaterial({ color });
    //   const material = new THREE.MeshLambertMaterial({ color:Math.random() * 0xffffff   });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(xPos, yPos, zPos);
    mesh.isSelected = false;
    mesh.name = key || mesh.uuid;
    mesh.isVox = true;
    scene.add(mesh);

    return {
      name: mesh.name,
      color,
      xPos,
      yPos,
      zPos,
    };
  }

  function onPointerMove(event) {
    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  function removeVoxel(event) {
    const selectedVoxel = INTERSECTED.uuid;
    //console.log('removeVoxel::', selectedVoxel);
    let playUpdated = false;
    scene.children.forEach((obj) => {
      if (obj.uuid === selectedVoxel) {
        disposeMesh(scene, obj, true);
        delete playState.state[obj.name];
        playUpdated = true;
      }
    });

    if (playUpdated) {
      socket.emit('on-remove', playState);
    }
  }

  function removeRandomVoxels() {
    if (socket.id !== playState.host) {
      return;
    }

    scene.children = scene.children.filter((obj) => {
      if (obj.isVox) {
        disposeMesh(scene, obj, true);
        return false;
      }

      return true;
    });

    generateVoxels(5, 15, 5, voxelDim, true);

    const MAX_RANDOM_VOXELS = 100;

    const arr = [];
    const towerArr = Object.keys(playState.state);

    while (arr.length < MAX_RANDOM_VOXELS) {
      const r = Math.floor(Math.random() * towerArr.length) + 1;
      if (arr.indexOf(r) === -1) arr.push(towerArr[r]);
    }

    const voxelsToBeRemoved = arr.reduce(
      (acc, uuid) => ({ ...acc, [uuid]: true }),
      {}
    );

    const objectsToRemove = [];

    scene.children.forEach((obj) => {
      if (voxelsToBeRemoved[obj.uuid]) {
        objectsToRemove.push(obj);
      }
    });

    objectsToRemove.forEach((obj) => {
      disposeMesh(scene, obj, true);
      delete playState.state[obj.name];
    });

    // objectsToRemove.forEach((obj) => {
    //   disposeMesh(scene, obj, true);
    // });

    playState.randomGenerate = true;

    socket.emit('on-remove', playState);

    // scene.children.forEach((child, i) => {
    //   if (voxelsToBeRemoved[child.uuid]) {
    //     scene.children.splice(i, 1);
    //     delete tower[child.uuid];
    //   }
    // });

    // firstTimeRightClick = false;

    // for (let i = 0; i < arr.length; i++) {
    //   const voxelId = arr[i];
    //   scene.children.forEach((child, i) => {
    //     if (child.uuid === selectedVoxel) {
    //       scene.children.splice(i, 1);
    //     }
    //   });
    // }
  }

  function render() {
    camera.updateMatrixWorld();

    // update the picking ray with the camera and pointer position
    // find intersections
    raycaster.setFromCamera(pointer, camera), material;

    const intersects = raycaster.intersectObjects(scene.children, false);

    if (intersects.length > 0) {
      if (
        INTERSECTED != intersects[0].object &&
        intersects[0].object.type !== 'GridHelper'
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
};
