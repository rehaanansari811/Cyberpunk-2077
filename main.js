// Import necessary Three.js components
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';


// Create the scene
const scene = new THREE.Scene();
let Model;
// Create a camera, which determines what we'll see when we render the scene
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 8;

// Create a renderer and attach it to our document
const canvas = document.querySelector('#canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true,alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Enable physically correct lighting
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// // Create OrbitControls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true;
// controls.dampingFactor = 0.25;
// controls.enableZoom = true;

// Create a PMREMGenerator for environment map processing
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Create EffectComposer
const composer = new EffectComposer(renderer);

// Create RenderPass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Create RGBShiftShader pass
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0015;
composer.addPass(rgbShiftPass);

// Load HDRI environment map
new RGBELoader()
    .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;

        texture.dispose();
        pmremGenerator.dispose();

        // Load the GLTF model
        loadModel();
    });

// Function to load the GLTF model
function loadModel() {
    const loader = new GLTFLoader();
    loader.load(
        '/DamagedHelmet.gltf',
        (gltf) => {
            const model = gltf.scene;
            Model = model;
            scene.add(model);

            // Start auto-rotation for mobile
            if (window.innerWidth <= 768) {
                startAutoRotation();
            }
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error happened', error);
        }
    );
}

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

let autoRotating = false;
let rotationSpeed = 0.013;

function startAutoRotation() {
    autoRotating = true;
}

function stopAutoRotation() {
    autoRotating = false;
}

// Create an animation loop
function animate() {
    requestAnimationFrame(animate);

    // Auto-rotate model for mobile devices
    if (Model && autoRotating) {
        Model.rotation.y += rotationSpeed;
    }

    // Render the scene using the composer
    composer.render();
}

// MouseMove Effect - only for desktop
window.addEventListener('mousemove', (e) => {
    if (window.innerWidth > 768 && Model) {  // Only for desktop
        const rotationX = (e.clientX / window.innerWidth - .5) * (Math.PI *.7);
        const rotationY = (e.clientY / window.innerHeight - .5) * (Math.PI *.7);
        gsap.to(Model.rotation, {
            x: rotationY,
            y: rotationX,
            duration: 0.9,
            ease: "power2.out"
        });
    }
});

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    // Toggle auto-rotation based on screen width
    if (window.innerWidth <= 768) {
        startAutoRotation();
    } else {
        stopAutoRotation();
    }
}

// Start the animation loop
animate();
