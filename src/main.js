
import * as THREE from 'three';

const $ = (id) => document.getElementById(id);

const ui = {
  canvas: $('game-canvas'), menu: $('menu'), hud: $('hud'), pause: $('pause-screen'), end: $('end-screen'),
  start: $('start-button'), testMode: $('test-mode-button'), pauseButton: $('pause-button'), resume: $('resume-button'), restart: $('restart-button'), again: $('again-button'),
  objective: $('objective-text'), progress: $('objective-progress-fill'), count: $('objective-count'), noise: $('noise-fill'), noiseWord: $('noise-word'),
  toast: $('toast'), prompt: $('interact-prompt'), promptLabel: $('interact-label'), interact: $('interact-button'), hide: $('hide-button'), flash: $('flash-button'),
  joystick: $('joystick'), thumb: $('joy-thumb'), moveCaption: $('move-caption'), sensorStatus: $('sensor-status'), hidden: $('hidden-indicator'), warning: $('warning-flash'),
  permission: $('permission-modal'), enableMotion: $('enable-motion-button'), touchMode: $('touch-mode-button'), sensorNote: $('sensor-note'),
  calibrate: $('calibrate-button'), calibrationHint: $('calibration-hint'), endTitle: $('end-title'), endCopy: $('end-copy'), endKicker: $('end-kicker')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d10);
scene.fog = new THREE.FogExp2(0x080d10, 0.024);

const camera = new THREE.PerspectiveCamera(72, 1, 0.06, 90);
camera.rotation.order = 'YXZ';
scene.add(camera);

const renderer = new THREE.WebGLRenderer({
  canvas: ui.canvas,
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const clock = new THREE.Clock();
const world = new THREE.Group();
scene.add(world);

const colliders = [];
const trampolines = [];
const fuses = [];
const hidingSpots = [];
const interactables = [];

const mats = {
  floor: new THREE.MeshStandardMaterial({ color: 0x242b2b, roughness: .88 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x353a38, roughness: .92 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x11191a, roughness: .84 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x68706a, roughness: .65, metalness: .18 }),
  mat: new THREE.MeshStandardMaterial({ color: 0x10191e, roughness: .7, metalness: .15 }),
  trampoline: new THREE.MeshStandardMaterial({ color: 0x202d32, roughness: .42, metalness: .18 }),
  foam: new THREE.MeshStandardMaterial({ color: 0x253b42, roughness: 1 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xc8c15d, roughness: .6 }),
  red: new THREE.MeshStandardMaterial({ color: 0x69282b, roughness: .8 }),
  white: new THREE.MeshStandardMaterial({ color: 0x9a9a87, roughness: .85 }),
  glow: new THREE.MeshStandardMaterial({ color: 0xd9f36a, emissive: 0x8ca52b, emissiveIntensity: 1.8 }),
  eye: new THREE.MeshStandardMaterial({ color: 0xff2525, emissive: 0xff0909, emissiveIntensity: 4 })
};

function addBox(name, x, y, z, w, h, d, material, solid = false, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  world.add(mesh);

  if (solid) {
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2
    });
  }

  return mesh;
}

function addCylinder(name, x, y, z, radiusTop, radiusBottom, height, material, segments = 12) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material
  );

  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  world.add(mesh);

  return mesh;
}

function addWall(x, z, width, depth, height = 5.2, material = mats.wall) {
  addBox('partition-wall', x, height / 2, z, width, height, depth, material, true);
  addBox('wall-cap', x, height + .07, z, width + .12, .14, depth + .12, mats.trim, false, false);
}

function addLamp(x, y, z, color = 0xd9edce, intensity = 5, distance = 10) {
  const fixture = addBox('fluorescent-fixture', x, y, z, 1.35, .09, .22, mats.white, false, false);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, .025, .14),
    new THREE.MeshBasicMaterial({ color: 0xd6edce })
  );

  glow.position.set(x, y - .06, z);
  world.add(glow);

  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.set(x, y - .25, z);
  light.castShadow = false;
  scene.add(light);

  return {
    light,
    fixture,
    glow,
    base: intensity,
    phase: Math.random() * 10
  };
}

const flickerLights = [];

// MAIN JUMPZONE SHELL

addBox('rubber-floor', 0, -.22, 0, 36, .4, 36, mats.floor, false, false);
addBox('ceiling', 0, 8.2, 0, 36, .4, 36, mats.dark, false, false);

addWall(-18, 0, .7, 36, 8);
addWall(18, 0, .7, 36, 8);
addWall(0, 18, 36, .7, 8);
addWall(-9.5, -18, 17, .7, 8);
addWall(9.5, -18, 17, .7, 8);

addWall(-7.2, -8.2, .42, 9.2, 4.8);
addWall(-7.2, 8.0, .42, 10.0, 4.8);
addWall(7.2, -8.2, .42, 9.2, 4.8);
addWall(7.2, 8.0, .42, 10.0, 4.8);
addWall(0, -10.7, 10.5, .35, 3.8);
addWall(-12.6, -1.8, 4.5, .35, 3.4);
addWall(12.6, -1.8, 4.5, .35, 3.4);

// FLOOR LINES

for (let z = -14; z <= 14; z += 2) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(.035, .012, .65),
    new THREE.MeshBasicMaterial({
      color: 0x56605a,
      transparent: true,
      opacity: .23
    })
  );

  line.position.set(0, -.012, z);
  world.add(line);
}

// EXIT DOOR

const exitDoor = new THREE.Group();
exitDoor.position.set(0, 2.55, -17.62);
world.add(exitDoor);

const doorMesh = new THREE.Mesh(
  new THREE.BoxGeometry(3.7, 5.1, .35),
  new THREE.MeshStandardMaterial({
    color: 0x303a39,
    roughness: .55,
    metalness: .5
  })
);

doorMesh.castShadow = true;
doorMesh.receiveShadow = true;
exitDoor.add(doorMesh);

for (let x of [-1.5, 1.5]) {
  addBox('exit-frame', x, 2.6, -17.65, .18, 5.4, .28, mats.trim, false, false);
}

const exitSign = addBox(
  'exit-sign',
  0, 5.65, -17.45,
  1.5, .35, .1,
  new THREE.MeshStandardMaterial({
    color: 0x243b32,
    emissive: 0x163e2e,
    emissiveIntensity: .8
  }),
  false,
  false
);

const exitLetters = new THREE.Mesh(
  new THREE.BoxGeometry(.8, .055, .025),
  new THREE.MeshBasicMaterial({ color: 0x8fffb1 })
);

exitLetters.position.set(0, 5.65, -17.37);
world.add(exitLetters);

const panel = new THREE.Group();
panel.position.set(2.7, 1.15, -15.9);
panel.rotation.y = -.16;
world.add(panel);

const panelBody = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.15, .25), mats.dark);
panelBody.castShadow = true;
panel.add(panelBody);

const panelLight = new THREE.Mesh(
  new THREE.BoxGeometry(.13, .13, .035),
  new THREE.MeshStandardMaterial({
    color: 0x7a1f20,
    emissive: 0xaa0808,
    emissiveIntensity: 1.2
  })
);

panelLight.position.set(-.13, .25, .145);
panel.add(panelLight);

addBox('exit-control-stanchion', 2.7, .56, -15.9, .1, 1.1, .1, mats.trim, false, false);

interactables.push({
  kind: 'panel',
  position: new THREE.Vector3(2.7, 0, -15.5),
  label: 'Restore exit power'
});

interactables.push({
  kind: 'exit',
  position: new THREE.Vector3(0, 0, -16.2),
  label: 'Leave JumpZone'
});

// TRAMPOLINE COURT

for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 2; col++) {
    const x = -4.15 + col * 4.15;
    const z = 1.8 + row * 2.85;

    addBox('trampoline-frame', x, .13, z, 3.55, .25, 2.35, mats.trim, false);
    addBox('trampoline-bed', x, .27, z, 3.2, .055, 2.0, mats.trampoline, false);

    for (let side = -1; side <= 1; side += 2) {
      addBox('yellow-safety-pad', x + side * 1.69, .25, z, .12, .23, 2.35, mats.yellow, false);
    }

    trampolines.push({
      x,
      z,
      radiusX: 1.62,
      radiusZ: 1.0,
      cooldown: 0
    });
  }
}

// FOAM PIT

addBox('foam-pit-frame', 12.2, .12, -9.1, 8.2, .25, 5.2, mats.trim, false);
addBox('foam-pit-darkness', 12.2, .3, -9.1, 7.8, .3, 4.8, mats.dark, false);

const foamColors = [0x314d50, 0x6b343c, 0x59633b, 0x354258, 0x7b5c39];

for (let i = 0; i < 46; i++) {
  const x = 8.7 + Math.random() * 7;
  const z = -11.1 + Math.random() * 4;
  const y = .55 + Math.random() * .28;

  const foam = new THREE.Mesh(
    new THREE.BoxGeometry(.42 + Math.random() * .3, .35, .42 + Math.random() * .3),
    new THREE.MeshStandardMaterial({
      color: foamColors[i % foamColors.length],
      roughness: 1
    })
  );

  foam.position.set(x, y, z);
  foam.rotation.set(Math.random() * .4, Math.random() * 2, Math.random() * .4);
  foam.castShadow = true;
  world.add(foam);
}

// TABLES AND ARCADE MACHINES

function makeTable(x, z) {
  addBox('party-table-top', x, .95, z, 2.3, .16, 1.0, mats.white, false);

  for (const dx of [-.9, .9]) {
    for (const dz of [-.35, .35]) {
      addBox('table-leg', x + dx, .47, z + dz, .1, .9, .1, mats.trim, false);
    }
  }
}

makeTable(-12, 5.8);
makeTable(12, 6.1);

for (let i = 0; i < 3; i++) {
  const x = 9.3 + i * 2.25;

  addBox('arcade-cabinet', x, 1.45, 1.8, 1.05, 2.8, .8, mats.dark, true);

  addBox(
    'arcade-screen',
    x, 1.95, 1.37,
    .76, .7, .04,
    new THREE.MeshStandardMaterial({
      color: 0x191d29,
      emissive: 0x17213b,
      emissiveIntensity: .45
    }),
    false,
    false
  );

  addBox('arcade-marquee', x, 2.7, 1.36, .8, .22, .05, mats.red, false, false);
}

for (let i = 0; i < 4; i++) {
  const z = 4 + i * 1.5;

  addBox('locker', -14.3, 1.45, z, .95, 2.9, .9, mats.dark, true);
  addBox('locker-door', -13.8, 1.45, z, .04, 2.65, .75, mats.trim, false, false);
  addBox('locker-slot', -13.76, 2.18, z, .04, .07, .23, mats.dark, false, false);
}

// SUPPORT PILLARS

for (const x of [-16, -8, 0, 8, 16]) {
  for (const z of [-14, -3, 8, 15]) {
    addBox('support-pillar', x, 3.9, z, .28, 7.8, .28, mats.dark, true);
    addBox('pillar-base', x, .25, z, .48, .5, .48, mats.trim, false, false);
  }
}

for (let x = -15; x <= 15; x += 5) {
  addBox('ceiling-beam', x, 7.65, 0, .12, .22, 35, mats.dark, false, false);
}

// BANNERS

for (let x of [-13, 0, 13]) {
  const banner = addBox('birthday-banner', x, 5.7, 10, 3.4, .55, .08, mats.red, false, false);
  banner.rotation.z = .025;
  addBox('banner-stripe', x, 5.7, 9.94, 2.7, .08, .02, mats.yellow, false, false);
}

// FUSE PICKUPS

function makeFuse(x, z, index) {
  const group = new THREE.Group();
  group.position.set(x, .78, z);
  world.add(group);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(.27, .58, .22),
    new THREE.MeshStandardMaterial({
      color: 0x9aa18b,
      metalness: .6,
      roughness: .35
    })
  );

  body.castShadow = true;
  group.add(body);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(.31, .09, .26), mats.yellow);
  cap.position.y = .32;
  group.add(cap);

  const glow = new THREE.PointLight(0xc9ed6c, 1.5, 3, 2);
  glow.position.y = .2;
  group.add(glow);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(.43, .018, 5, 24),
    new THREE.MeshBasicMaterial({
      color: 0xc9ed6c,
      transparent: true,
      opacity: .62
    })
  );

  halo.rotation.x = Math.PI / 2;
  halo.position.y = -.36;
  group.add(halo);

  fuses.push({
    group,
    position: new THREE.Vector3(x, 0, z),
    collected: false,
    index,
    glow,
    halo
  });
}

makeFuse(-12.4, -7.0, 1);
makeFuse(12.1, -4.3, 2);
makeFuse(-1.4, -13.8, 3);

// HIDING SPOTS

function addHidingSpot(x, z, label) {
  hidingSpots.push({
    position: new THREE.Vector3(x, 0, z),
    label
  });
}

addHidingSpot(-12, 5.8, 'under the party table');
addHidingSpot(12, 6.1, 'under the party table');

// DECORATIVE PROPS

for (let i = 0; i < 9; i++) {
  const x = -4 + Math.random() * 8;
  const z = -13 + Math.random() * 2;

  addBox(
    'lost-ball',
    x, .23, z,
    .32, .32, .32,
    new THREE.MeshStandardMaterial({
      color: [0x9e3840, 0x354e68, 0xb1a64e][i % 3],
      roughness: .65
    }),
    false
  );
}

for (let i = 0; i < 16; i++) {
  const x = -16 + Math.random() * 32;
  const z = -16 + Math.random() * 32;

  if (Math.abs(x) < 7 && Math.abs(z) < 8) continue;

  const mark = addBox(
    'scuff-mark',
    x, .006, z,
    .25 + Math.random() * .7, .008, .025,
    mats.dark,
    false,
    false
  );

  mark.rotation.y = Math.random() * Math.PI;
}

// LIGHTING

for (const [x, z] of [
  [-13, -12], [0, -13], [13, -12],
  [-13, 0], [0, 0], [13, 0],
  [-13, 13], [0, 13], [13, 13]
]) {
  flickerLights.push(addLamp(x, 7.75, z, 0xc6e0d1, 4.2, 12));
}

addLamp(0, 6.5, 15, 0xe8edc7, 3, 8);
scene.add(new THREE.HemisphereLight(0x263740, 0x090b0c, .35));

// PLAYER

const player = {
  position: new THREE.Vector3(0, 1.67, 14.3),
  yaw: 0,
  pitch: 0,
  hidden: false,
  alive: true,
  powered: false,
  fuses: 0,
  noise: 0,
  battery: 100,
  flashlightOn: true,
  bounce: 0,
  bounceVelocity: 0,
  moving: false,
  lastMove: 0
};

camera.position.copy(player.position);

const flashlight = new THREE.SpotLight(
  0xfff1cf,
  62,
  24,
  Math.PI / 6.3,
  .38,
  1.25
);

flashlight.position.set(0, 0, 0);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(512, 512);
flashlight.shadow.bias = -.00035;

camera.add(flashlight);

const flashTarget = new THREE.Object3D();
flashTarget.position.set(0, 0, -1);
camera.add(flashTarget);
flashlight.target = flashTarget;

const flashlightFill = new THREE.PointLight(0xffe8c4, 1.2, 4.2, 2);
flashlightFill.position.set(0, -.04, -.2);
camera.add(flashlightFill);

// THE BOUNCER

const monster = new THREE.Group();
world.add(monster);
monster.position.set(1.5, 0, -4.7);

const shadowSkin = new THREE.MeshStandardMaterial({
  color: 0x080909,
  roughness: 1
});

const ragged = new THREE.MeshStandardMaterial({
  color: 0x111514,
  roughness: 1,
  side: THREE.DoubleSide
});

const bone = new THREE.MeshStandardMaterial({
  color: 0xaaa58e,
  roughness: .9
});

const mouthMat = new THREE.MeshStandardMaterial({
  color: 0x020202,
  roughness: 1
});

const torso = new THREE.Mesh(
  new THREE.CapsuleGeometry(.31, .92, 5, 7),
  shadowSkin
);

torso.position.set(0, 1.45, 0);
torso.rotation.x = -.16;
torso.scale.set(.82, 1.18, .72);
torso.castShadow = true;
monster.add(torso);

const hunchedBack = new THREE.Mesh(
  new THREE.SphereGeometry(.42, 10, 8),
  ragged
);

hunchedBack.position.set(0, 1.72, .12);
hunchedBack.scale.set(1.05, 1.35, .7);
monster.add(hunchedBack);

const skull = new THREE.Mesh(
  new THREE.SphereGeometry(.29, 12, 10),
  shadowSkin
);

skull.position.set(0, 2.42, -.08);
skull.scale.set(.78, 1.32, .72);
skull.castShadow = true;
monster.add(skull);

const jaw = new THREE.Mesh(
  new THREE.ConeGeometry(.2, .35, 7),
  mouthMat
);

jaw.position.set(0, 2.18, -.25);
jaw.rotation.x = Math.PI;
monster.add(jaw);

const mouth = new THREE.Mesh(
  new THREE.BoxGeometry(.2, .12, .035),
  mouthMat
);

mouth.position.set(0, 2.31, -.282);
monster.add(mouth);

for (let i = 0; i < 5; i++) {
  const tooth = new THREE.Mesh(
    new THREE.ConeGeometry(.025, .09, 5),
    bone
  );

  tooth.position.set(-.075 + i * .037, 2.33, -.31);
  tooth.rotation.x = Math.PI;
  monster.add(tooth);
}

for (const side of [-1, 1]) {
  const eyeSocket = new THREE.Mesh(
    new THREE.SphereGeometry(.075, 8, 7),
    mouthMat
  );

  eyeSocket.position.set(side * .105, 2.48, -.275);
  monster.add(eyeSocket);

  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(.027, 8, 8),
    mats.eye
  );

  eye.position.set(side * .105, 2.48, -.34);
  monster.add(eye);

  const arm = new THREE.Mesh(
    new THREE.CapsuleGeometry(.105, .92, 4, 6),
    shadowSkin
  );

  arm.position.set(side * .39, 1.43, -.015);
  arm.rotation.z = side * -.24;
  arm.rotation.x = -.12;
  arm.castShadow = true;
  monster.add(arm);

  const hand = new THREE.Mesh(
    new THREE.SphereGeometry(.13, 8, 7),
    shadowSkin
  );

  hand.position.set(side * .48, .89, -.06);
  hand.scale.set(.75, 1.25, .65);
  monster.add(hand);

  for (let c = 0; c < 3; c++) {
    const claw = new THREE.Mesh(
      new THREE.ConeGeometry(.027, .22, 5),
      bone
    );

    claw.position.set(side * (.48 + (c - 1) * .07), .72, -.1);
    claw.rotation.x = Math.PI * .82;
    monster.add(claw);
  }

  const leg = new THREE.Mesh(
    new THREE.CapsuleGeometry(.12, .8, 4, 6),
    shadowSkin
  );

  leg.position.set(side * .17, .52, .04);
  leg.rotation.z = side * .08;
  monster.add(leg);
}

// TORN FABRIC

for (let i = 0; i < 7; i++) {
  const strip = new THREE.Mesh(
    new THREE.ConeGeometry(.12 + Math.random() * .08, .75 + Math.random() * .45, 5, 1, true),
    ragged
  );

  strip.position.set(
    (Math.random() - .5) * .5,
    .95 + Math.random() * .55,
    .16
  );

  strip.rotation.z = (Math.random() - .5) * .55;
  monster.add(strip);
}

const monsterAura = new THREE.PointLight(0x7e0709, .18, 2.3, 2);
monsterAura.position.set(0, 2.2, 0);
monster.add(monsterAura);

const monsterState = {
  mode: 'patrol',
  target: new THREE.Vector3(0, 0, 5),
  alert: 0,
  stun: 0,
  step: 0,
  lastKnown: new THREE.Vector3(0, 0, 0)
};

const patrolPoints = [
  new THREE.Vector3(1.5, 0, -4.7),
  new THREE.Vector3(-12, 0, -5),
  new THREE.Vector3(-12, 0, 10),
  new THREE.Vector3(12, 0, 10),
  new THREE.Vector3(12, 0, -5)
];

let patrolIndex = 1;

// AUDIO

let audioContext = null;
let masterGain = null;
let ambientOsc = null;
let ambientGain = null;

function initAudio() {
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume();
    return;
  }

  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;

  audioContext = new AC();

  masterGain = audioContext.createGain();
  masterGain.gain.value = .36;
  masterGain.connect(audioContext.destination);

  ambientOsc = audioContext.createOscillator();
  ambientOsc.type = 'sawtooth';
  ambientOsc.frequency.value = 42;

  ambientGain = audioContext.createGain();
  ambientGain.gain.value = .025;

  ambientOsc.connect(ambientGain);
  ambientGain.connect(masterGain);
  ambientOsc.start();

  const osc2 = audioContext.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 58;

  const g2 = audioContext.createGain();
  g2.gain.value = .012;

  osc2.connect(g2);
  g2.connect(masterGain);
  osc2.start();
}

function tone(freq = 120, duration = .12, type = 'sine', volume = .12, slide = 0) {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const o = audioContext.createOscillator();
  const g = audioContext.createGain();

  o.type = type;
  o.frequency.setValueAtTime(freq, now);

  if (slide) {
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, freq + slide),
      now + duration
    );
  }

  g.gain.setValueAtTime(volume, now);
  g.gain.exponentialRampToValueAtTime(.001, now + duration);

  o.connect(g);
  g.connect(masterGain);
  o.start(now);
  o.stop(now + duration + .03);
}

function noiseSound(duration = .18, volume = .07) {
  if (!audioContext) return;

  const n = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, n, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < n; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  }

  const src = audioContext.createBufferSource();
  const g = audioContext.createGain();

  src.buffer = buffer;
  g.gain.value = volume;
  src.connect(g);
  g.connect(masterGain);
  src.start();
}

// INPUT STATE

const input = {
  mode: 'touch',
  orientationReady: false,
  motionReady: false,
  hasOrientation: false,
  hasMotion: false,
  baseAlpha: null,
  baseBeta: null,
  lastAlpha: null,
  yawOffset: 0,
  pitchOffset: 0,
  targetYaw: 0,
  targetPitch: 0,
  filteredYaw: null,
  filteredPitch: null,
  gravity: null,
  stepEnergy: 0,
  stepCooldown: 0,
  motionStride: 0,
  joyX: 0,
  joyY: 0,
  joyActive: false,
  lookPointer: null,
  lastLookX: 0,
  lastLookY: 0,
  interact: false
};

let testMode = false;

function wrapAngle(a) {
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

function calibrate() {
  if (input.lastAlpha !== null) input.baseAlpha = input.lastAlpha;

  input.baseBeta = input.lastBeta ?? 90;
  input.yawOffset = player.yaw;
  input.pitchOffset = player.pitch;
  input.targetYaw = player.yaw;
  input.targetPitch = player.pitch;
  input.filteredYaw = player.yaw;
  input.filteredPitch = player.pitch;

  toast('AIM RECALIBRATED');
}

function onOrientation(e) {
  if (e.alpha === null || e.beta === null) return;

  input.hasOrientation = true;
  input.lastAlpha = (typeof e.webkitCompassHeading === 'number')
    ? e.webkitCompassHeading
    : e.alpha;

  input.lastBeta = e.beta;

  if (input.baseAlpha === null) {
    input.baseAlpha = input.lastAlpha;
    input.baseBeta = e.beta;
    input.yawOffset = player.yaw;
    input.pitchOffset = player.pitch;
  }

  if (input.mode === 'motion') {
    const yawDelta = wrapAngle(input.lastAlpha - input.baseAlpha);
    const pitchDelta = THREE.MathUtils.clamp(e.beta - input.baseBeta, -55, 55);
    const rollDelta = THREE.MathUtils.clamp(e.gamma || 0, -35, 35);

    input.targetYaw = input.yawOffset + THREE.MathUtils.degToRad(yawDelta) * .95;

    input.targetPitch = THREE.MathUtils.clamp(
      input.pitchOffset - THREE.MathUtils.degToRad(pitchDelta + rollDelta * .12) * .82,
      -.95,
      .95
    );
  }
}


function onMotion(e) {
  input.hasMotion = true;

  if (input.mode !== 'motion' || player.hidden || !gameRunning || paused) return;

  let ax = 0;
  let ay = 0;
  let az = 0;

  // Prefer gravity-free acceleration when the device provides it.
  if (
    e.acceleration &&
    e.acceleration.x !== null &&
    e.acceleration.y !== null &&
    e.acceleration.z !== null
  ) {
    ax = e.acceleration.x || 0;
    ay = e.acceleration.y || 0;
    az = e.acceleration.z || 0;
  } else if (e.accelerationIncludingGravity) {
    // Estimate gravity, then remove it to isolate walking movement.
    ax = e.accelerationIncludingGravity.x || 0;
    ay = e.accelerationIncludingGravity.y || 0;
    az = e.accelerationIncludingGravity.z || 0;

    if (!input.gravity) {
      input.gravity = { x: ax, y: ay, z: az };
    }

    input.gravity.x += (ax - input.gravity.x) * 0.08;
    input.gravity.y += (ay - input.gravity.y) * 0.08;
    input.gravity.z += (az - input.gravity.z) * 0.08;

    ax -= input.gravity.x;
    ay -= input.gravity.y;
    az -= input.gravity.z;
  } else {
    return;
  }

  // Calculate the strength of the movement.
  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

  // Faster response so smaller walking movements are detected.
  input.stepEnergy =
    input.stepEnergy * 0.62 + magnitude * 0.38;

  // Register steps with a lower threshold and shorter cooldown.
  if (input.stepEnergy > 0.65 && input.stepCooldown <= 0) {
    input.motionStride = Math.min(
      1,
      input.motionStride + 0.50
    );

    input.stepCooldown = 0.24;
  }
}


function setControlMode(mode) {
  input.mode = mode;

  if (mode === 'motion') {
    ui.sensorStatus.textContent = '⌁ MOTION CONTROL · TAP TO SWITCH';
    ui.moveCaption.textContent = 'WALK IN PLACE';
  } else {
    ui.sensorStatus.textContent = '⌁ TOUCH CONTROL · TAP TO SWITCH';
    ui.moveCaption.textContent = 'JOYSTICK + DRAG TO LOOK';
  }
}

// SENSOR PERMISSIONS
// This is the important fix: permission failure cannot stop the game from starting.

async function requestSensors() {
  let orientationRequest;
  let motionRequest;

  try {
    orientationRequest = typeof DeviceOrientationEvent === 'undefined'
      ? Promise.resolve('denied')
      : typeof DeviceOrientationEvent.requestPermission === 'function'
        ? DeviceOrientationEvent.requestPermission()
        : Promise.resolve('granted');
  } catch (err) {
    console.warn('Orientation permission:', err);
    orientationRequest = Promise.resolve('denied');
  }

  try {
    motionRequest = typeof DeviceMotionEvent === 'undefined'
      ? Promise.resolve('denied')
      : typeof DeviceMotionEvent.requestPermission === 'function'
        ? DeviceMotionEvent.requestPermission()
        : Promise.resolve('granted');
  } catch (err) {
    console.warn('Motion permission:', err);
    motionRequest = Promise.resolve('denied');
  }

  const results = await Promise.allSettled([
    orientationRequest,
    motionRequest
  ]);

  const orientationGranted =
    results[0].status === 'fulfilled' &&
    results[0].value === 'granted';

  const motionGranted =
    results[1].status === 'fulfilled' &&
    results[1].value === 'granted';

  if (orientationGranted) {
    window.removeEventListener('deviceorientation', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);
  }

  if (motionGranted) {
    window.removeEventListener('devicemotion', onMotion, true);
    window.addEventListener('devicemotion', onMotion, true);
  }

  input.orientationReady = orientationGranted;
  input.motionReady = motionGranted;

  if (orientationGranted) {
    setControlMode('motion');
    ui.calibrate.classList.remove('hidden');
    ui.calibrationHint.classList.remove('hidden');

    setTimeout(() => {
      ui.calibrationHint.classList.add('hidden');
    }, 4500);

    return true;
  }

  setControlMode('touch');
  return false;
}

// GAME STATE

let gameRunning = false;
let paused = false;
let gameEnded = false;
let toastTimer = null;

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    ui.toast.classList.remove('show');
  }, 1900);
}

function setNoise(value) {
  player.noise = THREE.MathUtils.clamp(value, 0, 1);

  ui.noise.style.width = `${player.noise * 100}%`;

  ui.noiseWord.textContent =
    player.noise > .72 ? 'DANGER' :
    player.noise > .42 ? 'LOUD' :
    player.noise > .18 ? 'NOTICEABLE' :
    'QUIET';

  ui.noiseWord.style.color = player.noise > .6 ? '#ff6767' : '#d9f36a';
}

function updateObjective() {
  ui.count.textContent = `FUSES ${player.fuses} / 3`;
  ui.progress.style.width = `${(player.fuses / 3) * 100}%`;

  if (player.powered) {
    ui.objective.textContent = 'Reach the exit door';
    ui.count.textContent = 'EXIT POWER RESTORED';
    ui.progress.style.width = '100%';
  } else if (player.fuses === 3) {
    ui.objective.textContent = 'Restore power at the exit panel';
  } else {
    ui.objective.textContent = 'Find the 3 backup fuses';
  }
}

function collectFuse(fuse) {
  fuse.collected = true;
  world.remove(fuse.group);
  player.fuses++;

  setNoise(player.noise + .12);

  tone(680, .12, 'triangle', .12, 150);
  tone(900, .2, 'sine', .07);

  toast(`BACKUP FUSE ${fuse.index} FOUND`);
  updateObjective();
}

function getNearestInteraction() {
  if (player.hidden) {
    return {
      kind: 'hide-exit',
      label: 'Leave hiding spot',
      position: player.position
    };
  }

  let best = null;
  let bestDistance = 2.15;

  for (const fuse of fuses) {
    if (fuse.collected) continue;

    const d = player.position.distanceTo(
      new THREE.Vector3(fuse.position.x, player.position.y, fuse.position.z)
    );

    if (d < bestDistance) {
      best = {
        kind: 'fuse',
        item: fuse,
        label: 'Pick up backup fuse',
        position: fuse.position
      };

      bestDistance = d;
    }
  }

  for (const item of interactables) {
    const d = player.position.distanceTo(
      new THREE.Vector3(item.position.x, player.position.y, item.position.z)
    );

    if (d < bestDistance) {
      if (item.kind === 'panel' && player.fuses < 3) continue;
      if (item.kind === 'exit' && !player.powered) continue;

      best = { ...item };
      bestDistance = d;
    }
  }

  for (const spot of hidingSpots) {
    const d = player.position.distanceTo(
      new THREE.Vector3(spot.position.x, player.position.y, spot.position.z)
    );

    if (d < 1.7 && d < bestDistance) {
      best = {
        kind: 'hide-enter',
        label: 'Hide under table',
        position: spot.position
      };

      bestDistance = d;
    }
  }

  return best;
}

function interact() {
  if (!gameRunning || paused || gameEnded) return;

  const target = getNearestInteraction();

  if (!target) {
    tone(180, .06, 'square', .04);
    return;
  }

  if (target.kind === 'fuse') {
    collectFuse(target.item);
  } else if (target.kind === 'panel') {
    player.powered = true;

    panelLight.material = new THREE.MeshStandardMaterial({
      color: 0x5cff9a,
      emissive: 0x20ff80,
      emissiveIntensity: 2.2
    });

    doorMesh.material = new THREE.MeshStandardMaterial({
      color: 0x33483d,
      emissive: 0x183525,
      emissiveIntensity: .55,
      metalness: .35
    });

    exitLetters.material.color.set(0x8fffb1);

    tone(220, .45, 'sawtooth', .11, 500);
    toast('EXIT POWER RESTORED');
    updateObjective();
  } else if (target.kind === 'exit') {
    winGame();
  } else if (target.kind === 'hide-enter') {
    enterHide();
  } else if (target.kind === 'hide-exit') {
    leaveHide();
  }
}

function enterHide() {
  player.hidden = true;
  ui.hidden.classList.remove('hidden');
  ui.hide.classList.add('active');

  toast('HIDING');
  setNoise(Math.max(0, player.noise - .18));
  tone(90, .2, 'sine', .06);
}

function leaveHide() {
  player.hidden = false;
  ui.hidden.classList.add('hidden');
  ui.hide.classList.remove('active');
  toast('BACK OUTSIDE');
}

function toggleHide() {
  if (player.hidden) {
    leaveHide();
    return;
  }

  const spot = hidingSpots.find(s =>
    player.position.distanceTo(
      new THREE.Vector3(s.position.x, player.position.y, s.position.z)
    ) < 1.7
  );

  if (spot) {
    enterHide();
  } else {
    toast('NO HIDING SPOT NEARBY');
  }
}

function toggleFlashlight() {
  player.flashlightOn = !player.flashlightOn;

  flashlight.visible = player.flashlightOn;
  flashlightFill.visible = player.flashlightOn;

  ui.flash.classList.toggle('active', player.flashlightOn);

  ui.flash.querySelector('small').textContent =
    player.flashlightOn ? 'LIGHT ON' : 'LIGHT OFF';

  tone(player.flashlightOn ? 540 : 260, .07, 'sine', .05);
}

// START / STOP

function startGame() {
  if (gameEnded) resetGame();

  initAudio();

  gameRunning = true;
  paused = false;
  gameEnded = false;

  ui.menu.classList.add('hidden');
  ui.pause.classList.add('hidden');
  ui.end.classList.add('hidden');
  ui.hud.classList.remove('hidden');

  player.alive = true;
  player.position.set(0, 1.67, 14.3);

  monster.visible = !testMode;
  monsterState.mode = 'patrol';

  player.yaw = 0;
  player.pitch = 0;

  camera.position.copy(player.position);
  camera.rotation.set(0, 0, 0);

  setNoise(0);
  updateObjective();

  toast('FIND THE BACKUP FUSES');
}

function pauseGame() {
  if (!gameRunning || gameEnded) return;

  paused = true;
  ui.pause.classList.remove('hidden');
}

function resumeGame() {
  paused = false;
  ui.pause.classList.add('hidden');

  if (audioContext?.state === 'suspended') {
    audioContext.resume();
  }
}

function winGame() {
  gameRunning = false;
  gameEnded = true;

  ui.hud.classList.add('hidden');
  ui.end.classList.remove('hidden');

  ui.endTitle.textContent = 'YOU MADE IT';
  ui.endCopy.textContent = 'The exit swings open. You leave JumpZone before the lights go out.';
  ui.endKicker.textContent = 'JUMPZONE / SHIFT COMPLETE';

  tone(440, .5, 'sine', .1, 240);
}

function loseGame() {
  if (gameEnded) return;

  gameRunning = false;
  gameEnded = true;

  ui.hud.classList.add('hidden');
  ui.end.classList.remove('hidden');

  ui.endTitle.textContent = 'CAUGHT';
  ui.endTitle.style.color = '#ff555a';

  ui.endCopy.textContent = 'The Bouncer found you. Maybe next time, keep your feet off the trampolines.';
  ui.endKicker.textContent = 'JUMPZONE / INCIDENT REPORT';

  noiseSound(.8, .22);
  tone(70, .75, 'sawtooth', .18, -40);
}

function resetGame() {
  player.fuses = 0;
  player.noise = 0;
  player.powered = false;
  player.hidden = false;
  player.battery = 100;
  player.flashlightOn = true;

  player.position.set(0, 1.67, 14.3);
  player.yaw = 0;
  player.pitch = 0;
  player.bounce = 0;
  player.bounceVelocity = 0;

  for (const f of fuses) {
    f.collected = false;
    world.add(f.group);
  }

  monster.position.set(1.5, 0, -4.7);
  monsterState.mode = 'patrol';
  monsterState.alert = 0;
  monsterState.stun = 0;
  patrolIndex = 1;

  panelLight.material = new THREE.MeshStandardMaterial({
    color: 0x7a1f20,
    emissive: 0xaa0808,
    emissiveIntensity: 1.2
  });

  doorMesh.material = new THREE.MeshStandardMaterial({
    color: 0x303a39,
    roughness: .55,
    metalness: .5
  });

  ui.endTitle.style.color = '';
  ui.flash.classList.add('active');
  ui.flash.querySelector('small').textContent = 'LIGHT ON';

  flashlight.visible = true;
  flashlightFill.visible = true;

  input.baseAlpha = null;
  input.baseBeta = null;

  updateObjective();
  setNoise(0);
}

// MOVEMENT

function stepForward() {
  if (!gameRunning || paused || player.hidden || gameEnded) return;

  const distance = .64;
  const dx = -Math.sin(player.yaw) * distance;
  const dz = -Math.cos(player.yaw) * distance;

  movePlayer(dx, dz);

  player.moving = true;
  player.lastMove = performance.now();

  let onTrampoline = null;

  for (const pad of trampolines) {
    if (
      Math.abs(player.position.x - pad.x) < pad.radiusX &&
      Math.abs(player.position.z - pad.z) < pad.radiusZ
    ) {
      onTrampoline = pad;
      break;
    }
  }

  if (onTrampoline && onTrampoline.cooldown <= 0) {
    onTrampoline.cooldown = 1.05;
    player.bounceVelocity = 3.4;

    setNoise(player.noise + .36);
    noiseSound(.28, .12);
    tone(95, .16, 'sine', .12, 90);

    toast('THE TRAMPOLINE ECHOES');
    monsterState.alert = Math.max(monsterState.alert, .9);
  } else {
    setNoise(player.noise + .085);
    tone(75, .045, 'sine', .025, -18);
  }
}

function movePlayer(dx, dz) {
  if (player.hidden) return;

  const radius = .34;

  let nx = player.position.x + dx;
  let nz = player.position.z + dz;

  const blocked = (x, z) => colliders.some(c =>
    x + radius > c.minX &&
    x - radius < c.maxX &&
    z + radius > c.minZ &&
    z - radius < c.maxZ
  );

  if (!blocked(nx, player.position.z)) {
    player.position.x = THREE.MathUtils.clamp(nx, -16.9, 16.9);
  }

  if (!blocked(player.position.x, nz)) {
    player.position.z = THREE.MathUtils.clamp(nz, -16.9, 16.9);
  }
}

function updateJoystick() {
  const max = 35;
  const x = input.joyX * max;
  const y = input.joyY * max;

  ui.thumb.style.transform = `translate(${x}px, ${y}px)`;
}

function useJoystickMove(dt) {
  if (input.mode === 'motion' && !player.hidden && gameRunning && !paused) {
    input.stepCooldown = Math.max(0, input.stepCooldown - dt);
    input.motionStride = Math.max(0, input.motionStride - dt * 1.35);

    const motionSpeed = input.motionStride;

    if (motionSpeed > .025) {
      const distance = dt * 2.35 * motionSpeed;

      movePlayer(
        -Math.sin(player.yaw) * distance,
        -Math.cos(player.yaw) * distance
      );

      player.moving = true;
      player.lastMove = performance.now();

      setNoise(Math.min(1, player.noise + dt * .035 * motionSpeed));
    }
  }

  if (!input.joyActive || player.hidden) return;

  const magnitude = Math.hypot(input.joyX, input.joyY);

  if (magnitude < .12) return;

  const forward = -input.joyY;
  const side = input.joyX;
  const speed = dt * 2.25;

  const dx = (
    -Math.sin(player.yaw) * forward +
    Math.cos(player.yaw) * side
  ) * speed;

  const dz = (
    -Math.cos(player.yaw) * forward -
    Math.sin(player.yaw) * side
  ) * speed;

  movePlayer(dx, dz);

  setNoise(Math.min(
    1,
    player.noise + dt * (magnitude > .75 ? .1 : .045)
  ));
}

// BOUNCER AI

function updateMonster(dt) {
  if (testMode) {
    monster.visible = false;
    return;
  }

  if (monsterState.stun > 0) {
    monsterState.stun -= dt;
    monster.position.y = .06 * Math.sin(performance.now() * .03);
    return;
  }

  const distance = monster.position.distanceTo(
    new THREE.Vector3(player.position.x, 0, player.position.z)
  );

  if (!player.hidden && (distance < 9 || player.noise > .27)) {
    monsterState.alert = Math.min(1, monsterState.alert + dt * .8);
    monsterState.mode = 'chase';
    monsterState.lastKnown.set(player.position.x, 0, player.position.z);
  } else if (monsterState.mode === 'chase' && monsterState.alert > 0) {
    monsterState.alert = Math.max(0, monsterState.alert - dt * .12);
  }

  if (player.hidden) {
    if (monsterState.mode === 'chase' && monsterState.alert < .2) {
      monsterState.mode = 'search';
    }
  }

  if (monsterState.mode === 'chase' && !player.hidden) {
    monsterState.target.set(player.position.x, 0, player.position.z);
  } else if (monsterState.mode === 'search') {
    monsterState.target.copy(monsterState.lastKnown);

    if (monster.position.distanceTo(monsterState.target) < 1.2) {
      monsterState.mode = 'patrol';
      monsterState.target.copy(patrolPoints[patrolIndex]);
    }
  } else if (monsterState.mode === 'patrol') {
    monsterState.target.copy(patrolPoints[patrolIndex]);

    if (monster.position.distanceTo(monsterState.target) < 1.1) {
      patrolIndex = (patrolIndex + 1) % patrolPoints.length;
    }
  }

  const dir = monsterState.target.clone().sub(monster.position);
  dir.y = 0;

  const d = dir.length();

  if (d > .08) {
    dir.normalize();

    const speed = monsterState.mode === 'chase' ? 2.15 : .82;
    const step = speed * dt;

    const blocked = (x, z) => colliders.some(c =>
      x + .42 > c.minX &&
      x - .42 < c.maxX &&
      z + .42 > c.minZ &&
      z - .42 < c.maxZ
    );

    const nx = monster.position.x + dir.x * step;
    const nz = monster.position.z + dir.z * step;

    if (!blocked(nx, monster.position.z)) {
      monster.position.x = nx;
    }

    if (!blocked(monster.position.x, nz)) {
      monster.position.z = nz;
    }

    monster.rotation.y = Math.atan2(-dir.x, -dir.z);
  }

  monster.position.y = .035 * Math.sin(performance.now() * .0045);
  monsterState.step += dt * (monsterState.mode === 'chase' ? 12 : 4);
  monster.scale.y = 1 + .018 * Math.sin(monsterState.step);

  monsterAura.intensity = monsterState.mode === 'chase' ? .7 : .2;

  if (!player.hidden && distance < .95) {
    loseGame();
  }

  if (player.flashlightOn && distance < 11 && distance > 1.2) {
    const toMonster = new THREE.Vector3(
      monster.position.x - camera.position.x,
      1.7,
      monster.position.z - camera.position.z
    ).normalize();

    const view = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

    if (view.dot(toMonster) > .955) {
      monsterState.stun = Math.max(monsterState.stun, .055);
      monsterState.alert = Math.max(0, monsterState.alert - dt * .6);
    }
  }
}

// FUSES AND INTERACTION PROMPT

function updateFuses(dt) {
  for (const f of fuses) {
    if (!f.collected) {
      f.group.rotation.y += dt * .55;
      f.group.position.y = .78 + Math.sin(performance.now() * .002 + f.index) * .08;
      f.halo.rotation.z += dt * .6;
    }
  }
}

function updatePrompt() {
  const target = getNearestInteraction();

  if (target) {
    ui.prompt.classList.remove('hidden');
    ui.promptLabel.textContent = target.label;
    ui.interact.querySelector('small').textContent = 'USE';
  } else {
    ui.prompt.classList.add('hidden');
  }

  ui.hide.style.opacity = (
    hidingSpots.some(s =>
      player.position.distanceTo(
        new THREE.Vector3(s.position.x, player.position.y, s.position.z)
      ) < 1.7
    ) || player.hidden
  ) ? '1' : '.55';
}

// CAMERA AND FLASHLIGHT

function updateCamera(dt) {
  if (input.mode === 'motion' && input.hasOrientation) {
    const smooth = 1 - Math.exp(-dt * 9.5);

    const yawError = Math.atan2(
      Math.sin(input.targetYaw - player.yaw),
      Math.cos(input.targetYaw - player.yaw)
    );

    player.yaw += yawError * smooth;

    player.pitch = THREE.MathUtils.clamp(
      player.pitch + (input.targetPitch - player.pitch) * smooth,
      -.95,
      .95
    );
  }

  camera.position.set(
    player.position.x,
    player.position.y + player.bounce,
    player.position.z
  );

  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  flashlight.intensity = player.flashlightOn
    ? (player.battery < 20 ? 42 : 62)
    : 0;

  if (player.flashlightOn) {
    player.battery = Math.max(0, player.battery - .0024);

    if (player.battery <= 0) {
      toggleFlashlight();
      toast('FLASHLIGHT BATTERY EMPTY');
    }
  }
}

// MAIN UPDATE LOOP

function update(dt) {
  if (!gameRunning || paused || gameEnded) return;

  useJoystickMove(dt);

  player.noise = Math.max(0, player.noise - dt * .035);

  for (const pad of trampolines) {
    pad.cooldown = Math.max(0, pad.cooldown - dt);
  }

  if (player.bounceVelocity !== 0 || player.bounce !== 0) {
    player.bounceVelocity -= 9.8 * dt;
    player.bounce += player.bounceVelocity * dt;

    if (player.bounce < 0) {
      player.bounce = 0;
      player.bounceVelocity = 0;
    }
  }

  if (performance.now() - player.lastMove > 280) {
    player.moving = false;
  }

  updateFuses(dt);
  updateMonster(dt);
  updateCamera(dt);
  updatePrompt();
  setNoise(player.noise);

  for (const l of flickerLights) {
    const t = performance.now() * .001 + l.phase;

    l.light.intensity = l.base * (
      Math.random() > .996
        ? .12
        : (.83 + .17 * Math.sin(t * 5))
    );
  }

  if (player.noise > .75 && Math.random() < .006) {
    ui.warning.classList.remove('hidden');

    setTimeout(() => {
      ui.warning.classList.add('hidden');
    }, 520);
  }
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), .05);

  update(dt);
  renderer.render(scene, camera);
}

// TOUCH CONTROLS

ui.joystick.addEventListener('pointerdown', e => {
  input.joyActive = true;
  ui.joystick.setPointerCapture(e.pointerId);
  updateJoyFromEvent(e);
});

ui.joystick.addEventListener('pointermove', e => {
  if (input.joyActive) updateJoyFromEvent(e);
});

function endJoy() {
  input.joyActive = false;
  input.joyX = 0;
  input.joyY = 0;
  ui.thumb.style.transform = 'translate(0,0)';
}

ui.joystick.addEventListener('pointerup', endJoy);
ui.joystick.addEventListener('pointercancel', endJoy);
ui.joystick.addEventListener('lostpointercapture', endJoy);

function updateJoyFromEvent(e) {
  const r = ui.joystick.getBoundingClientRect();

  let x = (e.clientX - (r.left + r.width / 2)) / (r.width * .36);
  let y = (e.clientY - (r.top + r.height / 2)) / (r.height * .36);

  const m = Math.hypot(x, y);

  if (m > 1) {
    x /= m;
    y /= m;
  }

  input.joyX = x;
  input.joyY = y;

  updateJoystick();
}

ui.canvas.addEventListener('pointerdown', e => {
  if (!gameRunning || paused) return;

  input.lookPointer = e.pointerId;
  input.lastLookX = e.clientX;
  input.lastLookY = e.clientY;

  ui.canvas.setPointerCapture(e.pointerId);
});

ui.canvas.addEventListener('pointermove', e => {
  if (input.lookPointer !== e.pointerId) return;

  const dx = e.clientX - input.lastLookX;
  const dy = e.clientY - input.lastLookY;

  input.lastLookX = e.clientX;
  input.lastLookY = e.clientY;

  player.yaw += dx * .0038;

  player.pitch = THREE.MathUtils.clamp(
    player.pitch - dy * .0034,
    -.82,
    .82
  );

  input.targetYaw = player.yaw;
  input.targetPitch = player.pitch;
});

function endLook() {
  input.lookPointer = null;
}

ui.canvas.addEventListener('pointerup', endLook);
ui.canvas.addEventListener('pointercancel', endLook);

// BUTTONS

ui.start.addEventListener('click', () => {
  ui.permission.classList.remove('hidden');
});

ui.testMode.addEventListener('click', () => {
  testMode = !testMode;

  ui.testMode.classList.toggle('selected', testMode);
  ui.testMode.textContent = testMode ? 'TEST MODE: ON' : 'TEST MODE: OFF';

  monster.visible = !testMode;

  toast(testMode ? 'SAFE TEST MODE ENABLED' : 'HORROR MODE ENABLED');
});

// IMPORTANT START FIX:
// Start the game immediately. Do not wait for motion permission.

ui.enableMotion.addEventListener('click', () => {
  ui.permission.classList.add('hidden');

  const sensorSetup = requestSensors();

  startGame();

  ui.sensorStatus.textContent = '⌁ REQUESTING MOTION…';

  sensorSetup.then(ok => {
    if (!ok) {
      toast('MOTION AIM UNAVAILABLE — TOUCH CONTROLS READY');
    } else {
      toast(
        input.motionReady
          ? 'MOTION CONTROLS ENABLED'
          : 'GYRO AIM ENABLED · TOUCH TO MOVE'
      );
    }
  }).catch(err => {
    console.warn('Sensor setup failed:', err);

    setControlMode('touch');
    toast('TOUCH CONTROLS READY');
  });
});

ui.touchMode.addEventListener('click', () => {
  setControlMode('touch');
  ui.permission.classList.add('hidden');
  startGame();
});

ui.sensorStatus.addEventListener('click', () => {
  if (input.mode === 'motion') {
    setControlMode('touch');
  } else if (input.orientationReady && input.motionReady) {
    setControlMode('motion');
    calibrate();
  } else {
    toast('MOTION SENSORS NOT AVAILABLE');
  }
});

ui.pauseButton.addEventListener('click', pauseGame);
ui.resume.addEventListener('click', resumeGame);

ui.restart.addEventListener('click', () => {
  resetGame();
  startGame();
});

ui.again.addEventListener('click', () => {
  resetGame();
  startGame();
});

ui.interact.addEventListener('click', interact);
ui.hide.addEventListener('click', toggleHide);
ui.flash.addEventListener('click', toggleFlashlight);
ui.calibrate.addEventListener('click', calibrate);

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    paused ? resumeGame() : pauseGame();
  }

  if (e.key.toLowerCase() === 'e') interact();
  if (e.key.toLowerCase() === 'f') toggleFlashlight();
});

// RESIZE

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h, false);
}

window.addEventListener('resize', resize);

window.addEventListener('orientationchange', () => {
  setTimeout(resize, 150);
});

resize();

ui.flash.classList.add('active');

ui.sensorNote.textContent =
  'For best results, allow motion access. Touch movement and drag-look remain available.';

ui.permission.classList.add('hidden');

animate();
