import { IFCLoader } from "web-ifc-three";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { IFCWALLSTANDARDCASE, IFCDOOR, IFCWINDOW, IFCFURNISHINGELEMENT } from "web-ifc";

// Scene, camera, and renderer setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1,1000);
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);
const canvasContainer = document.getElementById("three-canvas-container");
canvasContainer.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// IFC Loader setup
const loader = new IFCLoader();
loader.ifcManager.setWasmPath('/');

// File upload handler
document.getElementById("file-input").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    loadIFCModel(url);
  }
});

async function loadIFCModel(url) {
  loader.load(url, async (model) => {
    scene.add(model);
    centerModel(model);
    const components = await listIFCComponents(model);
    populateComponentList(model, components);
  });
}

function centerModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  model.position.sub(box.getCenter(new THREE.Vector3()));
  fitCameraToObject(camera, model);
}

function fitCameraToObject(camera, object, offset = 2) {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2)) * offset;

  camera.position.set(center.x, center.y, cameraZ);
  camera.lookAt(center);
  controls.target.copy(center);
  controls.update();
}

// Populate the component list
function populateComponentList(model, components) {
  const listElement = document.getElementById("components");
  listElement.innerHTML = "";

  components.forEach((component) => {
    const listItem = document.createElement("li");
    listItem.textContent = `Name: ${component.name}`;
    listItem.addEventListener("click", () => highlightComponent(model, component.id));
    listElement.appendChild(listItem);
  });
}

// List IFC Components
async function listIFCComponents(model) {
  const ifcManager = loader.ifcManager;
  const majorElements = [IFCWALLSTANDARDCASE, IFCDOOR, IFCWINDOW, IFCFURNISHINGELEMENT];

  let components = [];
  for (const type of majorElements) {
    const ids = await ifcManager.getAllItemsOfType(model.modelID, type, false);
    for (const id of ids) {
      const props = await ifcManager.getItemProperties(model.modelID, id);
      const name = props.Name?.value || props.ObjectType || `Unnamed Element (${id})`;
      components.push({ type, id, name });
    }
  }
  return components;
}

// Highlight Component with Hover Effect
let currentSubset = null;

function highlightComponent(model, id) {
  if (currentSubset) {
    loader.ifcManager.removeSubset(model.modelID, scene, currentSubset.material);
  }

  currentSubset = loader.ifcManager.createSubset({
    modelID: model.modelID,
    ids: [id],
    material: new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.6
    }),
    scene: scene,
    removePrevious: true
  });

  currentSubset.position.copy(model.position);
  currentSubset.rotation.copy(model.rotation);
  currentSubset.scale.copy(model.scale);
}

const timeLoader = document.getElementById("loader");
const fileInput = document.getElementById("file-input");

fileInput.addEventListener("change", async (event) => {
    if (event.target.files.length > 0) {
        showLoader();
        await loadModel(event.target.files[0]);
        hideLoader();
    }
});

function showLoader() {
    timeLoader.style.display = "flex";
}

function hideLoader() {
    timeLoader.style.display = "none";
}

async function loadModel(file) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log("Model Loaded: ", file.name);
            resolve();
        }, 3000); 
    });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

