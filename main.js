import * as THREE from 'three';

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
let cameraDist = camera.position.z;
let sphericalCameraAngle = { theta: Math.PI / 2, phi: Math.PI / 2 }

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

    let { theta, phi } = sphericalCameraAngle;

    // Calculate new camera angle based on mouse movement
    theta += deltaX * 0.01;
    phi -= deltaY * 0.01;

    // Limit camera angle to prevent it from going below the horizon
    phi = Math.max(Math.min(phi, Math.PI - 0.1), 0.1);

    // Calculate new camera position based on new angle
    const x = cameraDist * Math.sin(phi) * Math.cos(theta);
    const z = cameraDist * Math.sin(phi) * Math.sin(theta);
    const y = cameraDist * Math.cos(phi);

    sphericalCameraAngle = { theta, phi };

    // Update camera position and fix on the sphere
    camera.position.set(x, y, z);
    camera.lookAt(earth.position);
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

/* ========================================================================== */
/*                                  Animation                                 */
/* ========================================================================== */
// Adjust sphere rotation position y
function updateRotationY() {
    const now = new Date();
    const UTCMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    console.log(UTCMinutes, 'GMT-', now.getUTCHours(), ':', now.getUTCMinutes())
    earth.rotation.y = UTCMinutes * RadPerMinute + GMTOffset - Math.PI / 2;
}
updateRotationY();

// Adjust rotation x of light source
function updateRotationX() {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
    console.log(dayOfYear);

    const sunlightAngleSINE = 0.398 * Math.cos(2 * Math.PI * (dayOfYear - 173) / 365.242)
    const sunlightAngleTANGENT = sunlightAngleSINE / Math.sqrt(1 - sunlightAngleSINE * sunlightAngleSINE)
    directionalLight.position.set(0, SunlightDistance * sunlightAngleTANGENT, SunlightDistance)
}
updateRotationX();

// Animation loop
let lastYTime = 0;
let lastXTime = 0;

function animate(time) {
    if (time - lastYTime > 1000 * UpdateInterval) {
        updateRotationY();
        lastYTime = time;
    }
    if (time - lastXTime > 1000 * 3600) {
        updateRotationX();
        lastXTime = time;
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

