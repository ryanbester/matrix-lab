import * as THREE from 'three';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";

const l11 = document.getElementById('l11');
const l12 = document.getElementById('l12');
const l13 = document.getElementById('l13');
const l21 = document.getElementById('l21');
const l22 = document.getElementById('l22');
const l23 = document.getElementById('l23');
const l31 = document.getElementById('l31');
const l32 = document.getElementById('l32');
const l33 = document.getElementById('l33');

const a11 = document.getElementById('a11');
const a12 = document.getElementById('a12');
const a13 = document.getElementById('a13');
const a14 = document.getElementById('a14');
const a21 = document.getElementById('a21');
const a22 = document.getElementById('a22');
const a23 = document.getElementById('a23');
const a24 = document.getElementById('a24');
const a31 = document.getElementById('a31');
const a32 = document.getElementById('a32');
const a33 = document.getElementById('a33');
const a34 = document.getElementById('a34');
const a41 = document.getElementById('a41');
const a42 = document.getElementById('a42');
const a43 = document.getElementById('a43');
const a44 = document.getElementById('a44');

const doNotTranspose = document.getElementById("no-transpose");

let selectedMode = "linear";
handleModeSwitch(selectedMode);

const matrixModeBtns = document.querySelectorAll('.matrix-mode-radio');
matrixModeBtns.forEach(radio => {
    radio.addEventListener('change', (event) => {
        selectedMode = event.target.value;
        handleModeSwitch(selectedMode);
    })
});

function handleModeSwitch(mode) {
    if (mode === "linear") {
        document.getElementById('affine-matrix').classList.add('hidden');
        document.getElementById('linear-matrix').classList.remove('hidden');
    } else {
        document.getElementById('linear-matrix').classList.add('hidden');
        document.getElementById('affine-matrix').classList.remove('hidden');
    }
}

const getWidth = () => {
    return window.innerWidth - 300;
}

const getHeight = () => {
    return window.innerHeight - 300;
}

const scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, getWidth() / getHeight(), 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(getWidth(), getHeight());
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(5, 5, 5);
controls.update();

const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
scene.add(gridHelper);
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
cube.matrixAutoUpdate = false;
scene.add(cube);

const edgesGeometry = new THREE.EdgesGeometry(geometry);
const edgeMaterial = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 2});
const lineSegments = new THREE.LineSegments(edgesGeometry, edgeMaterial);

cube.add(lineSegments);

const vertexMarkers = [];
let clickedMarker = null;

function createVertexMarkers(mesh) {
    const posAttr = mesh.geometry.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
        const markerGeo = new THREE.SphereGeometry(0.08);
        const markerMat = new THREE.MeshBasicMaterial({color: 0xff0000});
        const marker = new THREE.Mesh(markerGeo, markerMat);

        marker.position.set(
            posAttr.getX(i),
            posAttr.getY(i),
            posAttr.getZ(i)
        );
        marker.userData = marker.position.clone();

        scene.add(marker);
        vertexMarkers.push(marker);
    }
}

createVertexMarkers(cube);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousedown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(vertexMarkers);

    if (intersects.length > 0) {
        vertexMarkers.forEach(marker => {
            marker.material.color.set(0xff0000);
            marker.scale.set(1, 1, 1);
        });

        clickedMarker = intersects[0].object;
        clickedMarker.material.color.set(0x00ff00);
        clickedMarker.scale.set(1.5, 1.5, 1.5);

        updateMath();
    }
});

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 2, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff));

function animate() {
    requestAnimationFrame(animate);

    if (selectedMode === "linear") {
        const M = new THREE.Matrix3();
        M.set(
            parseFloat(l11.value), parseFloat(l12.value), parseFloat(l13.value),
            parseFloat(l21.value), parseFloat(l22.value), parseFloat(l23.value),
            parseFloat(l31.value), parseFloat(l32.value), parseFloat(l33.value),
        );

        const Mt = doNotTranspose.checked ? M : M.transpose();

        const M4 = new THREE.Matrix4();
        M4.set(
            Mt.elements[0], Mt.elements[3], Mt.elements[6], 0,
            Mt.elements[1], Mt.elements[4], Mt.elements[7], 0,
            Mt.elements[2], Mt.elements[5], Mt.elements[8], 0,
            0, 0, 0, 1
        );

        cube.applyMatrix4(M4);
        cube.matrix.copy(M4);
    } else {
        const M4 = new THREE.Matrix4();
        M4.set(
            parseFloat(a11.value), parseFloat(a12.value), parseFloat(a13.value), parseFloat(a14.value),
            parseFloat(a21.value), parseFloat(a22.value), parseFloat(a23.value), parseFloat(a24.value),
            parseFloat(a31.value), parseFloat(a32.value), parseFloat(a33.value), parseFloat(a34.value),
            parseFloat(a41.value), parseFloat(a42.value), parseFloat(a43.value), parseFloat(a44.value),
        );

        const Mt = doNotTranspose.checked ? M4 : M4.transpose();

        cube.applyMatrix4(Mt);
        cube.matrix.copy(Mt);
    }

    const posAttr = cube.geometry.attributes.position;

    for (let i = 0; i < vertexMarkers.length; i++) {
        const localPoint = new THREE.Vector3(
            posAttr.getX(i),
            posAttr.getY(i),
            posAttr.getZ(i)
        );

        const worldPoint = localPoint.applyMatrix4(cube.matrix);

        vertexMarkers[i].position.copy(worldPoint);
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

document.getElementById('btn2d').addEventListener('click', () => {
    const width = getWidth();
    const height = getHeight();
    camera = new THREE.OrthographicCamera(-width / 200, width / 200, height / 200, -height / 200, 0.1, 1000);
    camera.position.set(0, 0, 10);
    rebindControls(camera);
});

document.getElementById('btn3d').addEventListener('click', () => {
    const width = getWidth();
    const height = getHeight();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    rebindControls(camera);
});

function rebindControls(newCam) {
    controls.object = newCam;
    controls.update();
    renderer.render(scene, new THREE.PerspectiveCamera()); // dummy call
}

window.addEventListener('resize', () => {
    camera.aspect = getWidth() / getHeight();
    camera.updateProjectionMatrix();
    renderer.setSize(getWidth(), getHeight());
});

function onInputChange() {
    updateMath();
}

document.querySelectorAll('input[type="number"]').forEach(el => {
    el.addEventListener('change', onInputChange);
});

function updateMath() {
    const linearMathOutput = document.getElementById('linear-math-output');
    const affineMathOutput = document.getElementById('affine-math-output');
    const affineMathOutputHomogenous = document.getElementById('affine-math-output-homogeneous');

    let latex = `\\[
        \\begin{alignat}{3}
            vM &= v_x \\begin{bmatrix} m_{11} & m_{12} & m_{13} \\end{bmatrix} &&+ v_y \\begin{bmatrix} m_{21} & m_{22} & m_{23} \\end{bmatrix} &&+ v_z \\begin{bmatrix} m_{31} & m_{32} & m_{33} \\end{bmatrix} \\\\
            &= v_x \\begin{bmatrix} ${l11.value} & ${l12.value} & ${l13.value} \\end{bmatrix} &&+ v_y \\begin{bmatrix} ${l21.value} & ${l22.value} & ${l23.value} \\end{bmatrix} &&+ v_z \\begin{bmatrix} ${l31.value} & ${l32.value} & ${l33.value} \\end{bmatrix}
            `;

    if (clickedMarker != null) {
        const pos = clickedMarker.userData;
        latex += `\\\\ &= ${pos.x} \\begin{bmatrix} ${l11.value} & ${l12.value} & ${l13.value} \\end{bmatrix} &&+ ${pos.y} \\begin{bmatrix} ${l21.value} & ${l22.value} & ${l23.value} \\end{bmatrix} &&+ ${pos.z} \\begin{bmatrix} ${l31.value} & ${l32.value} & ${l33.value} \\end{bmatrix} \\\\
                &= \\begin{bmatrix} ${pos.x * l11.value} & ${pos.x * l12.value} & ${pos.x * l13.value} \\end{bmatrix} &&+ \\begin{bmatrix} ${pos.y * l21.value} & ${pos.y * l22.value} & ${pos.y * l23.value} \\end{bmatrix} &&+ \\begin{bmatrix} ${pos.z * l31.value} & ${pos.z * l32.value} & ${pos.z * l33.value} \\end{bmatrix} \\\\
                &= \\begin{bmatrix} ${pos.x * l11.value + pos.y * l21.value + pos.z * l31.value} & ${pos.x * l12.value + pos.y * l22.value + pos.z * l32.value} & ${pos.x * l13.value + pos.y * l23.value + pos.z * l33.value} \\end{bmatrix}
            `;
    }

    latex += `\\end{alignat}\\]`;

    linearMathOutput.innerHTML = latex;

    latex = `\\[
        \\begin{alignat}{3}
            vM &= v_x \\begin{bmatrix} m_{11} & m_{12} & m_{13} & m_{14} \\end{bmatrix} &&+ v_y \\begin{bmatrix} m_{21} & m_{22} & m_{23} & m_{24} \\end{bmatrix} &&+ v_z \\begin{bmatrix} m_{31} & m_{32} & m_{33} & m_{34} \\end{bmatrix} &&+ 1 \\begin{bmatrix} m_{41} & m_{42} & m_{43} & m_{44} \\end{bmatrix} \\\\
            &= v_x \\begin{bmatrix} ${a11.value} & ${a12.value} & ${a13.value} & ${a14.value} \\end{bmatrix} &&+ v_y \\begin{bmatrix} ${a21.value} & ${a22.value} & ${a23.value} & ${a24.value} \\end{bmatrix} &&+ v_z \\begin{bmatrix} ${a31.value} & ${a32.value} & ${a33.value} & ${a34.value} \\end{bmatrix} &&+ 1 \\begin{bmatrix} ${a41.value} & ${a42.value} & ${a43.value} & ${a44.value} \\end{bmatrix}
            `;

    if (clickedMarker != null) {
        const pos = clickedMarker.userData;
        latex += `\\\\ &= ${pos.x} \\begin{bmatrix} ${a11.value} & ${a12.value} & ${a13.value} & ${a14.value} \\end{bmatrix} &&+ ${pos.y} \\begin{bmatrix} ${a21.value} & ${a22.value} & ${a23.value} & ${a24.value} \\end{bmatrix} &&+ ${pos.z} \\begin{bmatrix} ${a31.value} & ${a32.value} & ${a33.value} & ${a34.value} \\end{bmatrix}&&+ 1 \\begin{bmatrix} ${a41.value} & ${a42.value} & ${a43.value} & ${a44.value} \\end{bmatrix} \\\\
                &= \\begin{bmatrix} ${pos.x * a11.value} & ${pos.x * a12.value} & ${pos.x * a13.value} & ${pos.x * a14.value} \\end{bmatrix} &&+ \\begin{bmatrix} ${pos.y * a21.value} & ${pos.y * a22.value} & ${pos.y * a23.value} & ${pos.y * a24.value} \\end{bmatrix} &&+ \\begin{bmatrix} ${pos.z * a31.value} & ${pos.z * a32.value} & ${pos.z * a33.value} & ${pos.z * a44.value} \\end{bmatrix} &&+ \\begin{bmatrix} ${a41.value} & ${a42.value} & ${a43.value} & ${a44.value} \\end{bmatrix} \\\\
                &= \\begin{bmatrix} ${pos.x * a11.value + pos.y * a21.value + pos.z * a31.value + parseFloat(a41.value)} & ${pos.x * a12.value + pos.y * a22.value + pos.z * a32.value + parseFloat(a42.value)} & ${pos.x * a13.value + pos.y * a23.value + pos.z * a33.value + parseFloat(a43.value)} & ${parseFloat(a14.value) + parseFloat(a24.value) + parseFloat(a34.value) + parseFloat(a44.value)} \\end{bmatrix}
            `;
    }

    latex += `\\end{alignat}\\]`;

    affineMathOutput.innerHTML = latex;

    if (clickedMarker != null) {
        const pos = clickedMarker.userData;
        const vm1 = pos.x * a11.value + pos.y * a21.value + pos.z * a31.value + parseFloat(a41.value);
        const vm2 = pos.x * a12.value + pos.y * a22.value + pos.z * a32.value + parseFloat(a42.value);
        const vm3 = pos.x * a13.value + pos.y * a23.value + pos.z * a33.value + parseFloat(a43.value);
        const w = parseFloat(a14.value) + parseFloat(a24.value) + parseFloat(a34.value) + parseFloat(a44.value);

        latex = `\\[
        \\begin{align}
            &= \\begin{bmatrix} \\frac{${vm1}}{${w}} & \\frac{${vm2}}{${w}} & \\frac{${vm3}}{${w}} \\end{bmatrix} \\\\
            &= \\begin{bmatrix} ${vm1 / w} & ${vm2 / w} & ${vm3 / w} \\end{bmatrix}
        \\end{align}
        \\]`;
        affineMathOutputHomogenous.innerHTML = latex;
    } else {
        affineMathOutputHomogenous.innerHTML = '';
    }

    if (window.MathJax) {
        MathJax.typesetPromise([linearMathOutput, affineMathOutput, affineMathOutputHomogenous]);
    }
}

window.onload = () => {
    setTimeout(updateMath, 500);
};
