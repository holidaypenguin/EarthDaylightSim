import * as THREE from 'three';
import { log } from 'three/tsl';

/* ========================================================================== */
/*                             Configs & Constants                            */
/* ========================================================================== */
const GMTOffset = -Math.PI; // Distance between map left edge and 0 longitude in radian
const RadPerMinute = 2 * Math.PI / 1440; // Radian per minute
const UpdateInterval = 60; // Time interval between rotation updates in seconds
const MapDir = './2k_earth_daymap.jpg';

const MarkerWidth = 0.003;
const PoleRadius = 0.0015;
const CameraDistance = 2.2;
const SunlightDistance = 5;
const SunlightIntensity = 4;

/* ========================================================================== */
/*                                 Scene Setup                                */
/* ========================================================================== */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = CameraDistance;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Create the Earth
const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial(
        { map: new THREE.TextureLoader().load(MapDir) }
    )
);
earth.position.set(0, 0, 0);
scene.add(earth);

// Create sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, SunlightIntensity);
directionalLight.position.set(0, 0, SunlightDistance);
directionalLight.target = earth;
scene.add(directionalLight);

// Noon Marker
const semiCircle = new THREE.CylinderGeometry(1 + 0.01, 1 + 0.01, MarkerWidth, 64, 1, true, 0, Math.PI)
const noonMarker = new THREE.Mesh(
    semiCircle,
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
noonMarker.position.set(0, 0, 0);
noonMarker.rotation.set(Math.PI / 2, 0, Math.PI / 2);
scene.add(noonMarker);

// Midnight Marker
const midnightMarker = new THREE.Mesh(
    semiCircle,
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
);
midnightMarker.position.set(0, 0, 0);
midnightMarker.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
scene.add(midnightMarker);

// Earth pole
const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(PoleRadius, PoleRadius, 1.3 * 2, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);
pole.position.set(0, 0, 0);
scene.add(pole);

/* ========================================================================== */
/*                            Control & Interaction                           */
/* ========================================================================== */
let isDragging = false;
let dragStartX, dragStartY;
let cameraTheta = Math.PI / 2, cameraPhi = Math.PI / 2, cameraTilt = 0;

function moveSphericCamera(deltaX, deltaY) {
    // Rotate delta angle based on camera tilt
    const deltaXRotated = deltaX * Math.cos(-cameraTilt) - deltaY * Math.sin(-cameraTilt);
    const deltaYRotated = deltaX * Math.sin(-cameraTilt) + deltaY * Math.cos(-cameraTilt);

    // Calculate new camera angle based on mouse movement
    cameraTheta += deltaXRotated * 0.01;
    cameraPhi -= deltaYRotated * 0.01;

    // Limit camera angle to prevent it from going below the horizon
    cameraPhi = Math.max(Math.min(cameraPhi, Math.PI), 0.001);

    // Calculate new camera position based on new angle
    const x = CameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
    const z = CameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
    const y = CameraDistance * Math.cos(cameraPhi);

    // Update camera position and fix on the sphere
    camera.position.set(x, y, z);
    camera.lookAt(earth.position);
    camera.rotation.z += cameraTilt;
}

function resetCamera() {
    camera.position.set(0, 0, CameraDistance);
    camera.lookAt(earth.position);
    cameraTilt = 0;
    cameraTheta = Math.PI / 2;
    cameraPhi = Math.PI / 2;
}

function tiltCamera(deltaZ) {
    camera.rotation.z -= cameraTilt;
    cameraTilt += deltaZ * 0.05;
    cameraTilt = Math.max(Math.min(cameraTilt, Math.PI / 2), -Math.PI / 2);
    camera.rotation.z += cameraTilt;
}

function handleMouseDown(event) {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
}

function handleMouseUp(event) {
    isDragging = false;
}

function handleMouseMove(event) {
    if (!isDragging) return;
    // Calculate mouse movement
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    dragStartX = event.clientX;
    dragStartY = event.clientY;

    moveSphericCamera(deltaX, deltaY);
}

function handleKeyDown(event) {
    let deltaZ;
    switch (event.key) {
        case 'q': case 'Q':
            deltaZ = -1; tiltCamera(deltaZ);
            break;
        case 'e': case 'E':
            deltaZ = 1; tiltCamera(deltaZ);
            break;
        case 'w': case 'W':
            moveSphericCamera(0, 1);
            break;
        case 's': case 'S':
            moveSphericCamera(0, -1);
            break;
        case 'a': case 'A':
            moveSphericCamera(1, 0);
            break;
        case 'd': case 'D':
            moveSphericCamera(-1, 0);
            break;
        case 'f': case 'F': // Reset camera tilt
            camera.rotation.z -= cameraTilt;
            cameraTilt = 0;
            break;
        case 'r': case 'R': // Reset camera
            resetCamera();
            break;
        default:
            return;
    }
}

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', handleResize, false);
window.addEventListener('mousedown', handleMouseDown, false);
window.addEventListener('mouseup', handleMouseUp, false);
window.addEventListener('mousemove', handleMouseMove, false);
window.addEventListener('keydown', handleKeyDown, false);


function setupVisibilityToggler(id, obj) {
    const checkbox = document.getElementById(id);
    if (!checkbox.checked) {
        obj.visible = false;
    }

    checkbox.addEventListener("change", function () {
        if (this.checked) {
            obj.visible = true;
        } else {
            obj.visible = false;
        }
    });
}

setupVisibilityToggler("showPole", pole);
setupVisibilityToggler("showNoon", noonMarker);
setupVisibilityToggler("showMidnight", midnightMarker);

/* ========================================================================== */
/*                                  Animation                                 */
/* ========================================================================== */
// Adjust sphere rotation position y
function updateEarthRotation() {
    const now = new Date();
    const UTCMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    console.log(UTCMinutes, 'GMT-', now.getUTCHours(), ':', now.getUTCMinutes())
    earth.rotation.y = UTCMinutes * RadPerMinute + GMTOffset - Math.PI / 2;
}
updateEarthRotation();

// Adjust rotation x of light source
function updateSunlightAngle() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
    console.log(dayOfYear);

    const sunlightAngleSINE = 0.398 * Math.cos(2 * Math.PI * (dayOfYear - 173) / 365.242)
    const sunlightAngleTANGENT = sunlightAngleSINE / Math.sqrt(1 - sunlightAngleSINE * sunlightAngleSINE)
    directionalLight.position.set(0, SunlightDistance * sunlightAngleTANGENT, SunlightDistance)
}
updateSunlightAngle();

// Animation loop
let lastEarthUpdate = 0;
let lastSunlightUpdate = 0;

function animate(time) {
    if (time - lastEarthUpdate > 1000 * UpdateInterval) {
        updateEarthRotation();
        lastEarthUpdate = time;
    }
    if (time - lastSunlightUpdate > 1000 * 3600) {
        updateSunlightAngle();
        lastSunlightUpdate = time;
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

