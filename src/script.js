import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;


/**
 * Base
 */

const debugObject = {}
const gui = new dat.GUI({
    width: isMobile ? 200 : 400,
    closed: true, // Make sure controls start closed
    autoPlace: true
})

// Hide GUI by default and add toggle button for all devices
gui.domElement.style.display = "none";
const guiVisible = false;

// Add a more visible and consistent toggle button for all devices
const guiToggle = document.createElement('button');
guiToggle.innerHTML = "Settings";
guiToggle.style.position = "absolute";
guiToggle.style.bottom = "10px";
guiToggle.style.right = "10px";
guiToggle.style.zIndex = "1000";
guiToggle.style.padding = "8px";
guiToggle.style.backgroundColor = "#2c2c2c";
guiToggle.style.color = "white";
guiToggle.style.border = "none";
guiToggle.style.borderRadius = "4px";
guiToggle.style.cursor = "pointer";
guiToggle.style.fontFamily = "Arial, sans-serif";
guiToggle.style.fontSize = isMobile ? "12px" : "14px";
guiToggle.addEventListener('click', () => {
    if (gui.domElement.style.display === "none") {
        gui.domElement.style.display = "block";
        gui.open();
    } else {
        gui.domElement.style.display = "none";
        gui.close();
    }
});
document.body.appendChild(guiToggle);

// Also allow keyboard shortcut 'h' to toggle GUI on desktop
if (!isMobile) {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'h') {
            if (gui.domElement.style.display === "none") {
                gui.domElement.style.display = "block";
                gui.open();
            } else {
                gui.domElement.style.display = "none";
                gui.close();
            }
        }
    });
}

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

// fireflies

const firefliesGeometry = new THREE.BufferGeometry()
// Reduce firefly count on mobile for better performance
const firefliesCount = isMobile ? 15 : 30
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for (let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 2.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}

// Material
// Adjust fireflies size for mobile
const defaultFirefliesSize = isMobile ? 400 : 500;

const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: defaultFirefliesSize }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(500).step(1).name('firefliesSize')

// points

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))

firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))
/**
 * Loaders
 */

const textureLoader = new THREE.TextureLoader()


const dracoLoader = new DRACOLoader()


const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

// Portal GUI controls
let ColorStart = debugObject.portalColorStart = '#d6d6ff'
let ColorEnd = debugObject.portalColorEnd = '#7070ff'


const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

const poleLightMaterial = new THREE.MeshBasicMaterial({ color: '#FFA828FF' })
const portalMaterial = new THREE.ShaderMaterial({
    uniforms:{
        uTime: {value:0},
        uColorStart:{value: new THREE.Color(ColorStart)},
        uColorEnd:{value: new THREE.Color(ColorEnd)},
    },
    vertexShader:portalVertexShader,
    fragmentShader:portalFragmentShader
})


gui.addColor(debugObject, 'portalColorStart')
   .onChange(() => {
      portalMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
   })
   .name('Portal Color Start')

gui.addColor(debugObject, 'portalColorEnd')
   .onChange(() => {
      portalMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
   })
   .name('Portal Color End')

/**
 * Model!
 */

gltfLoader.load(
    'baked.glb',
    (gltf) => {
        const bakedMesh = gltf.scene.children.find(child => child.name === 'baked')
        const portalMesh = gltf.scene.children.find(child => child.name === 'Circle')
        const lampMeshA = gltf.scene.children.find(child => child.name === 'Cube011')
        const lampMeshB = gltf.scene.children.find(child => child.name === 'Cube031')
        bakedMesh.material = bakedMaterial
        lampMeshA.material = poleLightMaterial
        lampMeshB.material = poleLightMaterial
        portalMesh.material = portalMaterial
        scene.add(gltf.scene)
    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    const newIsMobile = window.innerWidth < 768;
    
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    // Lower pixel ratio on mobile for performance
    const pixelRatio = Math.min(newIsMobile ? 1.5 : 2, window.devicePixelRatio);
    renderer.setPixelRatio(pixelRatio)

    firefliesMaterial.uniforms.uPixelRatio.value = pixelRatio
    
    // Adjust camera position on resize if device type changes
    if (newIsMobile !== isMobile) {
        updateCameraForDevice(newIsMobile);
    }
})

/**
 * Camera
 */

const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)

// Function to position camera properly depending on device
function updateCameraForDevice(mobileDevice) {
    if (mobileDevice) {
        // Move camera further back for mobile to see more scene
        camera.position.set(-8, 5.5, 2.5); 
    } else {
        camera.position.set(-7, 6, 4);
    }
    camera.lookAt(0, 1, 0);
}

// Set initial camera position based on device
updateCameraForDevice(isMobile);
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
// Set appropriate control settings for touch
if (isMobile) {
    controls.rotateSpeed = 0.7;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.5;
    controls.enablePan = false; // Disable panning on mobile for simpler controls
    controls.maxPolarAngle = Math.PI * 0.85; // Prevent going below the ground
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !isMobile // Disable antialiasing on mobile for performance
})
renderer.setSize(sizes.width, sizes.height)
// Use lower pixel ratio on mobile
renderer.setPixelRatio(Math.min(isMobile ? 1.5 : 2, window.devicePixelRatio))
renderer.outputEncoding = THREE.sRGBEncoding
debugObject.clearColor = '#6e70af'

renderer.setClearColor(debugObject.clearColor)

gui
    .addColor(debugObject, 'clearColor')
    .onChange(() => {
        renderer.setClearColor(debugObject.clearColor)
    })
/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    portalMaterial.uniforms.uTime.value = elapsedTime
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    controls.update()


    renderer.render(scene, camera)


    window.requestAnimationFrame(tick)
}

tick()