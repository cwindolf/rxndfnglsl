/* ****************************************************************************
 * Loverly globals. */

const print = console.log;
// dom object that this runs in will land here.
var container;
// THREE scene globals
var camera, mainScene, renderer;

var terrainMat, terrain;
var UVgg0, UVgg, rxnCompute;
const rxnD = 256, rxnDOn2 = rxnD / 2;
const worldD = 2048, worldDon2 = worldD / 2;
const clock = new THREE.Clock();
const SCALE = 0.01;
var t0;
const fs = [
    0.0141,
    0.014,
    0.022,
    0.019,
    0.026,
    0.022,
    0.026,
    0.038,
    0.042,
    0.058,
    0.062,
    0.0638,
    0.058,
    0.038,
];
const ks = [
    0.0525,
    0.05,
    0.051,
    0.0548,
    0.054,
    0.051,
    0.0565,
    0.061,
    0.059,
    0.062,
    0.061,
    0.061,
    0.062,
    0.061,
];
const num_phases = fs.length;
const phase_freq = 1 / num_phases;
var frame = 0;
const PERIOD = 150000;

/* ****************************************************************************
 * Lib */

function fk(t) {
    t = (t % PERIOD) / PERIOD;
    let t_ = phase_freq;
    for (let i = 0; i < num_phases; i++) {
        if (t_ > t)  {
            return [
                fs[i], 
                ks[i]
            ];
        }
        t_ += phase_freq;
    }
}
const fk0 = fk(0);


function onWindowResize() {
    var screen = 2 * Math.tan(camera.fov * Math.PI / 360) * Math.max(container.clientWidth, container.clientHeight) / container.clientHeight;
    camera.position.z = 2 * worldD / screen;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function initialConditions(tex) {
    let ic = tex.image.data;
    noise.seed(Math.random());
    let idx = 0;
    for (let i = 0; i < rxnD; i++) {
        for (let j = 0; j < rxnD; j++) {
            let n = 0, freq = 0, max = 0;
            for (let o = 0; o < 21; o++) {
                freq = Math.pow(2, o);
                max += (1 / freq);
                n += noise.simplex2(
                    i * freq * rxnD * SCALE,
                    j * freq * rxnD * SCALE) / freq;
            }
            n /= max;
            ic[idx + 0] = 1.;
            if (n > 0.525) {
                ic[idx + 1] = (1.5 + n) / 4.;
            } else {
                ic[idx + 1] = 0;
            }
            ic[idx + 2] = 0;
            ic[idx + 3] = 1;
            idx += 4;
        }
    }
}

function initRxn() {
    rxnCompute = new GPUComputationRenderer(rxnD, rxnD, renderer);
    UVgg0 = rxnCompute.createTexture();
    initialConditions(UVgg0);
    UVgg = rxnCompute.addVariable(
        'UVgg',
        document.getElementById('rfs').textContent,
        UVgg0);
    rxnCompute.setVariableDependencies(UVgg, [UVgg]);
    UVgg.material.uniforms.D_u = { type: 'f', value: 1.0 };
    UVgg.material.uniforms.D_v = { type: 'f', value: 0.5 };
    UVgg.material.uniforms.f   = { type: 'f', value: fk0[0] };
    UVgg.material.uniforms.k   = { type: 'f', value: fk0[1] };
    UVgg.material.uniforms.dt  = { type: 'f', value: 0 };
    let err = rxnCompute.init();
    if (err !== null) {
        console.error(err);
    }
}


function init() {
    container = document.getElementById('container');
    container.innerHTML = "";

    camera = new THREE.PerspectiveCamera(60,
        window.innerWidth / window.innerHeight, 1, 10000);

    renderer = new THREE.WebGLRenderer({
        antialias: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.context.getExtension('OES_standard_derivatives');
    container.appendChild(renderer.domElement);

    initRxn();

    mainScene = new THREE.Scene();

    var terrainGeom = new THREE.PlaneBufferGeometry(worldD, worldD, rxnD - 1, rxnD - 1);
    terrainMat = new THREE.ShaderMaterial({
        uniforms: {
            UVgg: { type: 't', value: UVgg0, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping },
        },
        vertexShader: document.getElementById('tvs').textContent,
        fragmentShader: document.getElementById('tfs').textContent,
        flatShading: true,
        side: THREE.DoubleSide,
    });
    terrainMat.uniforms.UVgg.wrapS = terrainMat.uniforms.UVgg.wrapT = THREE.RepeatWrapping;
    terrainMat.defines.WIDTH = rxnD.toFixed(1);
    terrainMat.defines.BOUNDS = worldD.toFixed(1);
    terrainMat.uniforms.time = { type: 'f', value: 0.0 };
    // terrainMat.uniforms.UVgg.minFilter = THREE.NearestFilter;
    // terrainMat.uniforms.UVgg.magFilter = THREE.NearestFilter;
    terrainMat.uniforms.UVgg.needsUpdate = true;
    terrain = new THREE.Mesh(terrainGeom, terrainMat);
    mainScene.add(terrain);

    window.addEventListener('resize', onWindowResize, false);
}


function react(dt) {
    let fk_ = fk(frame++);
    UVgg.material.uniforms.f  = { type: 'f', value: fk_[0] };
    UVgg.material.uniforms.k  = { type: 'f', value: fk_[1] };
    UVgg.material.uniforms.dt = { type: 'f', value: dt     };
    rxnCompute.compute();
    terrainMat.uniforms.UVgg.value = rxnCompute.getCurrentRenderTarget(UVgg).texture;
}

function animate() {
    dt = Math.max(clock.getDelta(), 0.05);
    react(dt);
    renderer.render(mainScene, camera);
    requestAnimationFrame(animate);
}


/* ****************************************************************************
 * Main. */

if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    document.getElementById('container').innerHTML = "";
} else {
    window.addEventListener(
        'keyup',
        function(e) { if(e.keyCode == 27) { debugger; } },
        false);
    init();
    onWindowResize();
    requestAnimationFrame(animate);
}
