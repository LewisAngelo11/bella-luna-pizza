/* global BABYLON */
import { hex3, makeTex, nextId } from "../utils.js";

const OPT = { cast: false, receive: false };
const GAME_VERSION = "0.3.0";

/**
 * Escena exterior del menú principal — separada del `root` de gameplay.
 * Fachada a la derecha; luces cálidas/frías + sombra direccional propia del menú.
 */
export function setupMenuExterior(r) {
  r.menuMode = false;
  r.menuT = 0;
  r._menuLights = [];
  r._gameLights = [];
  r._menuNeonMats = [];
  r._menuGlowMeshes = [];

  const root = new BABYLON.TransformNode("menuRoot", r.scene);
  root.setEnabled(false);
  r.menuRoot = root;

  const brickTex = makeMenuBrick(r.scene);
  const asphaltTex = makeAsphalt(r.scene);
  const stripeTex = makeAwningStripes(r.scene);
  const chalkTex = makeChalkboard(r.scene);
  const interiorTex = makeInteriorGlow(r.scene);
  const skyTex = makeNightSky(r.scene);

  const brick = std(r, { map: brickTex, color: 0xffffff, specular: 0x333333 });
  const brickDark = std(r, { map: brickTex, color: 0xb0a090, specular: 0x222222 });
  const asphalt = std(r, { map: asphaltTex, color: 0xffffff, specular: 0xffd0a0 });
  asphalt.specularPower = 128;
  const wood = std(r, { color: 0x5a3a28, specular: 0x333333 });
  const woodDark = std(r, { color: 0x3a2418, specular: 0x222222 });
  const metal = std(r, { color: 0x4a5058, specular: 0x888888 });
  const awning = std(r, { map: stripeTex, color: 0xffffff, specular: 0x222222 });
  const warmGlass = std(r, {
    map: interiorTex,
    color: 0xffffff,
    emissive: 0xffdd88,
    specular: 0x666655,
  });
  warmGlass.emissiveTexture = interiorTex;
  warmGlass.emissiveColor = hex3(0xffe099);
  const neonY = neonMat(r, 0xffe08a, 0xffcc44);
  const neonR = neonMat(r, 0xff3344, 0xff1122);
  const neonO = neonMat(r, 0xff9933, 0xff7711);
  const chalk = std(r, { map: chalkTex, color: 0xffffff, emissive: 0x111811 });
  chalk.emissiveTexture = chalkTex;

  // —— Cielo / luna ——
  const sky = BABYLON.MeshBuilder.CreateSphere("menuSky", {
    diameter: 120, segments: 16, sideOrientation: BABYLON.Mesh.BACKSIDE,
  }, r.scene);
  sky.material = std(r, { map: skyTex, color: 0xffffff, emissive: 0x0a1018, specular: 0x000000 });
  sky.material.emissiveTexture = skyTex;
  sky.material.disableLighting = true;
  sky.parent = root;
  sky.isPickable = false;
  sky.infiniteDistance = true;

  const moon = BABYLON.MeshBuilder.CreateSphere("menuMoon", { diameter: 5.2, segments: 12 }, r.scene);
  moon.material = std(r, { color: 0xd8e0ec, emissive: 0xa8b8d0, specular: 0x000000 });
  moon.material.disableLighting = true;
  // Luna arriba-izquierda del encuadre (el restaurante va a la derecha).
  moon.position.set(-22, 15, 22);
  moon.parent = root;
  moon.isPickable = false;

  const moonHalo = BABYLON.MeshBuilder.CreateDisc("menuMoonHalo", { radius: 4.8, tessellation: 24 }, r.scene);
  moonHalo.material = std(r, { color: 0xffffff, emissive: 0x8899bb, alpha: 0.14, backFace: true });
  moonHalo.material.disableLighting = true;
  moonHalo.position.copyFrom(moon.position);
  moonHalo.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
  moonHalo.parent = root;
  moonHalo.isPickable = false;

  // —— Suelo mojado ——
  const ground = BABYLON.MeshBuilder.CreateGround("menuGround", { width: 56, height: 44 }, r.scene);
  ground.material = asphalt;
  ground.position.set(2, 0, 3);
  ground.parent = root;
  ground.isPickable = false;
  ground.receiveShadows = true;
  r.menuGround = ground;

  // —— Edificio (lado derecho del encuadre) ——
  const bldg = new BABYLON.TransformNode("menuBldg", r.scene);
  bldg.parent = root;
  bldg.position.set(6.4, 0, 7.4);
  r.menuBldg = bldg;

  // Reflejos húmedos bajo ventanas / neón (anclados al edificio)
  fakeGlow(r, bldg, 0xff7733, 4.2, 2.0, 0.1, -3.9, 0.012, 0.38);
  fakeGlow(r, bldg, 0xff3344, 3.0, 1.4, 1.9, -3.9, 0.013, 0.3);
  fakeGlow(r, bldg, 0xffbb55, 3.6, 2.2, -1.8, -3.9, 0.012, 0.36);
  fakeGlow(r, bldg, 0xff9940, 5.5, 3.2, 0.4, -4.6, 0.011, 0.16);

  // Cuerpo principal
  box(r, 9.2, 3.6, 6.2, brick, 0, 1.8, 0, bldg);
  // Remate / cornisa
  box(r, 9.5, 0.22, 6.5, brickDark, 0, 3.7, 0, bldg);
  // Tejado plano bajo
  box(r, 9.6, 0.18, 6.6, woodDark, 0, 3.9, 0, bldg);
  // Pared trasera más oscura
  box(r, 9.0, 3.4, 0.2, brickDark, 0, 1.7, 3.0, bldg);

  // Fachada del edificio (box sólido) termina ~z=-3.10.
  // Todo el vano va DELANTE del muro para no pelear con el ladrillo.
  // Orden (interior → cámara): fill opaco → glow → cristal → marco → travesaños.

  // —— Ventana grande: 1 cristal + marco hueco + travesaños (sin capas duplicadas) ——
  const winL = BABYLON.MeshBuilder.CreatePlane("menuWinL", { width: 3.22, height: 1.84 }, r.scene);
  winL.material = warmGlass;
  winL.position.set(-2.2, 1.7, -3.16);
  winL.parent = bldg;
  winL.isPickable = false;
  winL.metadata = { menuGlass: true };

  windowFrame(r, wood, -2.2, 1.7, -3.26, 3.6, 2.2, 0.12, 0.18, bldg);
  // Travesaños más cortos que el hueco (no se clavan en el marco)
  box(r, 0.1, 1.72, 0.08, woodDark, -2.2, 1.7, -3.36, bldg);
  box(r, 3.1, 0.1, 0.08, woodDark, -2.2, 1.7, -3.36, bldg);

  // —— Puerta: panel bajo sólido + cristal arriba (sin solapar) ——
  box(r, 1.5, 1.35, 0.1, wood, 2.35, 0.68, -3.18, bldg);
  windowFrame(r, wood, 2.35, 1.88, -3.26, 1.5, 1.25, 0.1, 0.12, bldg);
  const doorGlass = BABYLON.MeshBuilder.CreatePlane("menuDoorGlass", { width: 1.2, height: 0.98 }, r.scene);
  doorGlass.material = warmGlass;
  doorGlass.position.set(2.35, 1.88, -3.16);
  doorGlass.parent = bldg;
  doorGlass.isPickable = false;
  doorGlass.metadata = { menuGlass: true };
  box(r, 0.12, 0.12, 0.14, metal, 2.9, 1.15, -3.32, bldg);

  // —— Ventana estrecha ——
  const winS = BABYLON.MeshBuilder.CreatePlane("menuWinS", { width: 1.05, height: 0.64 }, r.scene);
  winS.material = warmGlass;
  winS.position.set(1.0, 2.55, -3.16);
  winS.parent = bldg;
  winS.isPickable = false;
  winS.metadata = { menuGlass: true };
  windowFrame(r, wood, 1.0, 2.55, -3.26, 1.3, 0.9, 0.1, 0.12, bldg);

  // Toldo rayado
  const awningMesh = BABYLON.MeshBuilder.CreateBox("menuAwning", { width: 8.6, height: 0.08, depth: 1.35 }, r.scene);
  awningMesh.material = awning;
  awningMesh.position.set(0, 2.95, -3.7);
  awningMesh.rotation.x = -0.18;
  awningMesh.parent = bldg;
  awningMesh.isPickable = false;
  // Volantes del toldo
  for (let i = 0; i < 11; i++) {
    const scallop = BABYLON.MeshBuilder.CreateCylinder(`sc${i}`, {
      diameterTop: 0.01, diameterBottom: 0.22, height: 0.22, tessellation: 6,
    }, r.scene);
    scallop.material = (i % 2 === 0)
      ? std(r, { color: 0xc82828, emissive: 0x200808 })
      : std(r, { color: 0xf0ece4, emissive: 0x101010 });
    scallop.position.set(-4.0 + i * 0.8, 2.72, -4.25);
    scallop.rotation.x = Math.PI / 2;
    scallop.parent = bldg;
    scallop.isPickable = false;
  }

  // Banco
  box(r, 2.4, 0.1, 0.55, wood, -2.2, 0.48, -3.85, bldg);
  box(r, 2.4, 0.45, 0.08, wood, -2.2, 0.72, -3.6, bldg);
  box(r, 0.1, 0.45, 0.5, woodDark, -3.3, 0.25, -3.85, bldg);
  box(r, 0.1, 0.45, 0.5, woodDark, -1.1, 0.25, -3.85, bldg);

  // Papelera
  const can = BABYLON.MeshBuilder.CreateCylinder("menuCan", {
    diameter: 0.42, height: 0.7, tessellation: 10,
  }, r.scene);
  can.material = metal;
  can.position.set(3.55, 0.35, -3.7);
  can.parent = bldg;
  can.isPickable = false;

  // Cartel A-frame
  const aframe = new BABYLON.TransformNode("menuAframe", r.scene);
  aframe.parent = bldg;
  aframe.position.set(4.55, 0, -4.2);
  aframe.rotation.y = -0.35;
  box(r, 0.9, 1.15, 0.05, chalk, 0, 0.7, 0.18, aframe);
  box(r, 0.9, 1.15, 0.05, woodDark, 0, 0.7, -0.18, aframe);
  box(r, 0.08, 1.2, 0.08, woodDark, -0.4, 0.6, 0, aframe);
  box(r, 0.08, 1.2, 0.08, woodDark, 0.4, 0.6, 0, aframe);

  // —— Letrero neón en el tejado ——
  const sign = new BABYLON.TransformNode("menuSign", r.scene);
  sign.parent = bldg;
  sign.position.set(0, 4.15, -1.2);
  r.menuSign = sign;

  // Postes
  box(r, 0.12, 1.25, 0.12, metal, -3.9, 0.4, 0.2, sign);
  box(r, 0.12, 1.25, 0.12, metal, 3.9, 0.4, 0.2, sign);
  box(r, 8.4, 0.1, 0.7, metal, 0, 1.05, 0.15, sign);

  // Panel trasero oscuro (más alto para tipografía grande)
  box(r, 8.2, 2.05, 0.08, woodDark, 0, 1.85, 0.35, sign);

  const bella = neonLabel(
    r, "Bella Luna", 6.6, 1.05, neonY, 0.2, 2.4, 0.05, sign,
    "900 italic 108px 'Special Elite', cursive",
  );
  const pizzaLbl = neonLabel(
    r, "PIZZA", 5.0, 0.88, neonR, 0.35, 1.42, 0.05, sign,
    "900 112px Cinzel, serif",
  );
  r._menuNeonMats.push(bella.mat, pizzaLbl.mat);

  // Pizza entera (izq del letrero)
  const pie = wholePizza(r, neonO, neonY);
  pie.parent = sign;
  pie.position.set(-3.6, 1.88, 0.14);
  pie.scaling.setAll(0.88);
  pie.rotation.x = -0.15;

  // Luna creciente (der)
  const crescent = crescentMoon(r, neonO);
  crescent.parent = sign;
  crescent.position.set(3.45, 1.95, 0.08);
  crescent.scaling.setAll(0.78);
  r._menuNeonMats.push(neonO);

  // Estrellitas
  for (const [x, y] of [[-1.35, 2.85], [1.9, 2.9], [0.15, 2.95], [2.55, 1.15]]) {
    const st = box(r, 0.12, 0.12, 0.04, neonY, x, y, 0.1, sign);
    st.rotation.z = Math.PI / 4;
  }

  // Siluetas de bosque: pinos + árboles (más cerca para leerse con la niebla)
  const pines = [
    // Fondo detrás / a los lados del local
    [-6.5, 12.5, 1.55], [-3.8, 13.8, 1.85], [-1.2, 14.5, 1.4],
    [1.8, 13.2, 1.65], [4.2, 14.8, 1.9], [10.8, 13.5, 1.7],
    [13.5, 12.2, 1.45], [16.2, 13.8, 1.8], [18.8, 11.8, 1.35],
    // Cintura media (siluetas claras a izquierda del encuadre)
    [-9.5, 9.5, 1.25], [-11.5, 11.2, 1.5], [-7.8, 10.5, 1.1],
    [20.5, 10.2, 1.2], [22.2, 12.5, 1.55],
    // Lejanos (capa extra)
    [-2, 17.5, 2.1], [8, 18, 2.0], [15, 17.2, 1.85],
  ];
  for (const [x, z, s] of pines) pine(r, root, x, z, s);

  const roundTrees = [
    [-5.2, 11.5, 1.15], [0.2, 12.8, 1.35], [12.2, 11.0, 1.05],
    [17.0, 12.5, 1.25], [-8.5, 14.2, 1.1],
  ];
  for (const [x, z, s] of roundTrees) tree(r, root, x, z, s);

  // Valla detrás
  for (let i = -4; i <= 12; i++) {
    box(r, 0.08, 1.3, 0.08, metal, i * 1.15, 0.65, 14.5, root);
    if (i < 12) box(r, 1.15, 0.06, 0.04, metal, i * 1.15 + 0.55, 1.05, 14.5, root);
  }

  // Coche parcial (fondo izquierdo, no tapa el copy)
  const car = new BABYLON.TransformNode("menuCar", r.scene);
  car.parent = root;
  car.position.set(-8.5, 0, 1.5);
  car.rotation.y = 0.65;
  box(r, 4.2, 1.1, 1.8, std(r, { color: 0x4a1010, specular: 0x333333 }), 0, 0.7, 0, car);
  box(r, 2.4, 0.7, 1.7, std(r, { color: 0x3a0c0c, specular: 0x222222 }), -0.3, 1.45, 0, car);
  const tireM = std(r, { color: 0x111111 });
  for (const [x, z] of [[-1.3, 0.95], [-1.3, -0.95], [1.3, 0.95], [1.3, -0.95]]) {
    const tire = BABYLON.MeshBuilder.CreateCylinder(`t${nextId(r)}`, {
      diameter: 0.7, height: 0.28, tessellation: 10,
    }, r.scene);
    tire.material = tireM;
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, 0.35, z);
    tire.parent = car;
    tire.isPickable = false;
  }

  // Niebla baja (planos alpha) — más hacia la fachada
  for (let i = 0; i < 3; i++) {
    const fog = BABYLON.MeshBuilder.CreateGround(`menuFog${i}`, { width: 18, height: 8 }, r.scene);
    fog.material = std(r, { color: 0xaa8866, emissive: 0x553322, alpha: 0.045, backFace: true });
    fog.position.set(3 + (i - 1) * 3.5, 0.35 + i * 0.15, 1 + i * 1.8);
    fog.parent = root;
    fog.isPickable = false;
    fog.metadata = { menuFog: true, phase: i };
  }

  // —— Iluminación cálida + sombreado (PCSS / AO) ——
  // Ambiente frío muy bajo: las cálidas mandan
  const moonL = new BABYLON.HemisphericLight("menuHemi", new BABYLON.Vector3(-0.35, 1, 0.15), r.scene);
  moonL.diffuse = hex3(0x3a4a60);
  moonL.groundColor = hex3(0x020304);
  moonL.intensity = 0.16;
  moonL.setEnabled(false);
  r._menuLights.push(moonL);

  // Luna direccional + sombras contact-hardening (soft shadows tipo ray-traced)
  const moonDir = new BABYLON.DirectionalLight(
    "menuMoonDir",
    new BABYLON.Vector3(0.55, -0.85, -0.35),
    r.scene,
  );
  moonDir.position = new BABYLON.Vector3(-14, 18, 10);
  moonDir.diffuse = hex3(0x8aa0bc);
  moonDir.intensity = 1.15;
  moonDir.shadowEnabled = true;
  moonDir.shadowMinZ = 1;
  moonDir.shadowMaxZ = 55;
  moonDir.shadowFrustumSize = 36;
  moonDir.autoUpdateExtends = false;
  moonDir.setEnabled(false);
  r._menuLights.push(moonDir);
  r.menuMoonDir = moonDir;

  r.menuShadowGen = new BABYLON.ShadowGenerator(2048, moonDir);
  // PCSS / contact hardening ≈ soft shadows por “trazado” de penumbra
  if (typeof r.menuShadowGen.useContactHardeningShadow !== "undefined") {
    r.menuShadowGen.useContactHardeningShadow = true;
    r.menuShadowGen.contactHardeningLightSizeUVRatio = 0.08;
  } else {
    r.menuShadowGen.usePercentageCloserFiltering = true;
  }
  r.menuShadowGen.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
  r.menuShadowGen.setDarkness(0.12);
  r.menuShadowGen.bias = 0.0015;
  r.menuShadowGen.normalBias = 0.03;
  r.menuShadowGen.transparencyShadow = true;

  // Neón ámbar intenso
  const neonL = new BABYLON.PointLight("menuNeonL", new BABYLON.Vector3(6.4, 6.5, 5.8), r.scene);
  neonL.diffuse = hex3(0xff8833);
  neonL.specular = hex3(0xffaa66);
  neonL.intensity = 8.8;
  neonL.range = 24;
  neonL.setEnabled(false);
  r._menuLights.push(neonL);
  r.menuNeonLight = neonL;

  // Ventana: spill cálido + sombra local en el suelo
  const winLight = new BABYLON.SpotLight(
    "menuWinL",
    new BABYLON.Vector3(4.2, 2.05, 4.15),
    new BABYLON.Vector3(0.15, -0.65, -1),
    Math.PI / 2.6,
    6,
    r.scene,
  );
  winLight.diffuse = hex3(0xffc060);
  winLight.specular = hex3(0xffe0a0);
  winLight.intensity = 12.5;
  winLight.range = 22;
  winLight.shadowEnabled = true;
  winLight.shadowMinZ = 0.3;
  winLight.shadowMaxZ = 18;
  winLight.setEnabled(false);
  r._menuLights.push(winLight);
  r.menuWinLight = winLight;

  r.menuWarmShadowGen = new BABYLON.ShadowGenerator(1024, winLight);
  r.menuWarmShadowGen.usePercentageCloserFiltering = true;
  r.menuWarmShadowGen.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
  r.menuWarmShadowGen.setDarkness(0.28);
  r.menuWarmShadowGen.bias = 0.002;
  r.menuWarmShadowGen.normalBias = 0.04;

  // Segunda mancha cálida (ventana estrecha / puerta)
  const win2 = new BABYLON.SpotLight(
    "menuWin2",
    new BABYLON.Vector3(7.4, 2.2, 4.1),
    new BABYLON.Vector3(-0.15, -0.55, -1),
    Math.PI / 3.4,
    7,
    r.scene,
  );
  win2.diffuse = hex3(0xffb050);
  win2.specular = hex3(0xffd080);
  win2.intensity = 7.4;
  win2.range = 16;
  win2.setEnabled(false);
  r._menuLights.push(win2);

  // Puerta / porche
  const doorLight = new BABYLON.PointLight("menuDoorL", new BABYLON.Vector3(8.6, 1.7, 4.0), r.scene);
  doorLight.diffuse = hex3(0xffa040);
  doorLight.specular = hex3(0xffc070);
  doorLight.intensity = 6.2;
  doorLight.range = 14;
  doorLight.setEnabled(false);
  r._menuLights.push(doorLight);

  // Fill cálido bajo el toldo
  const awningFill = new BABYLON.PointLight("menuAwningL", new BABYLON.Vector3(6.4, 2.7, 3.6), r.scene);
  awningFill.diffuse = hex3(0xff9940);
  awningFill.specular = hex3(0xffbb66);
  awningFill.intensity = 4.6;
  awningFill.range = 12;
  awningFill.setEnabled(false);
  r._menuLights.push(awningFill);

  // Bounce cálido al suelo delante de la fachada
  const groundBounce = new BABYLON.PointLight("menuBounce", new BABYLON.Vector3(6.0, 0.35, 3.2), r.scene);
  groundBounce.diffuse = hex3(0xff9955);
  groundBounce.specular = hex3(0x000000);
  groundBounce.intensity = 3.8;
  groundBounce.range = 11;
  groundBounce.setEnabled(false);
  r._menuLights.push(groundBounce);

  // Sin GlowLayer (rompía framebuffer). Bloom vía pipeline de menú.
  r.menuGlow = null;

  // Registrar casters / receivers de sombra del menú
  ground.receiveShadows = true;
  const shadowGens = [r.menuShadowGen, r.menuWarmShadowGen];
  const castRoots = [bldg, car];
  for (const node of castRoots) {
    for (const m of node.getChildMeshes?.(false) ?? []) {
      const nm = String(m.name || "");
      if (nm.startsWith("menuFog") || nm.startsWith("fg")) continue;
      if (nm.startsWith("menuWinBloom") || nm.startsWith("menuDoorBloom") || nm.startsWith("menuNeonHalo")) continue;
      if (m.material?.disableLighting) continue;
      // Cristales no castean: el spot cálido pegado a la fachada provocaba acne/parpadeo
      if (m.metadata?.menuGlass) {
        m.receiveShadows = false;
        continue;
      }
      m.receiveShadows = true;
      for (const gen of shadowGens) gen.addShadowCaster(m, false);
    }
  }
  for (const n of root.getChildren?.() ?? []) {
    const nm = String(n.name || "");
    if (!nm.startsWith("tree") && !nm.startsWith("pine")) continue;
    for (const m of n.getChildMeshes?.(false) ?? []) {
      m.receiveShadows = true;
      // Solo luna: pinos lejos del spot cálido
      r.menuShadowGen.addShadowCaster(m, false);
    }
  }

  // Halos emisivos extras detrás del neón / ventanas
  const neonHalo = glowPlane(r, "menuNeonHalo", 8.6, 2.5, 0xff7722, 0xff6611, 0.34);
  neonHalo.position.set(0, 1.85, 0.02);
  neonHalo.parent = sign;

  // Sin planos glow en la ventana: un alpha encima del cristal/marco
  // era la “capa que sobresalía” y parpadeaba. El brillo viene del
  // emisivo del cristal + bloom del pipeline.

  // Post: AO + bloom + tono cálido (solo menú)
  setupMenuPost(r);

  // Cámara: ligeramente a la izquierda, mirando al restaurante (derecha)
  r._menuCam = {
    pos: new BABYLON.Vector3(-3.0, 1.6, -6.8),
    rot: new BABYLON.Vector3(-0.02, 0.58, 0),
    fov: (48 * Math.PI) / 180,
  };
  r._gameCam = {
    pos: r.camera.position.clone(),
    rot: r.camera.rotation.clone(),
    fov: r.camera.fov,
    minZ: r.camera.minZ,
    maxZ: r.camera.maxZ,
  };

  r.gameVersion = GAME_VERSION;
}

/** Activa/desactiva menú vs gameplay sin destruir ninguna escena. */
export function setMenuMode(r, on) {
  r.menuMode = !!on;
  if (r.menuRoot) r.menuRoot.setEnabled(r.menuMode);
  if (r.root) r.root.setEnabled(!r.menuMode);

  // Luces de gameplay
  if (!r._gameLights.length) {
    r._gameLights = r.scene.lights.filter((l) => !String(l.name).startsWith("menu"));
  }
  for (const L of r._gameLights) {
    if (String(L.name).startsWith("jump")) continue;
    try { L.setEnabled(!r.menuMode); } catch (_) { /* */ }
  }
  for (const L of r._menuLights) {
    try { L.setEnabled(r.menuMode); } catch (_) { /* */ }
  }

  if (r.jumpGroup) r.jumpGroup.setEnabled(false);
  if (r.jumpLight) r.jumpLight.setEnabled(false);

  if (r.menuMode) {
    r.rainSystem?.stop?.();
    r.dustSystem?.stop?.();
    r.emberSystem?.stop?.();
    r.scene.shadowsEnabled = true;
    r.scene.clearColor = new BABYLON.Color4(0.01, 0.012, 0.02, 1);
    r.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    r.scene.fogColor = hex3(0x05080e);
    r.scene.fogDensity = 0.012;
    r.camera.minZ = 0.2;
    r.camera.maxZ = 140;
    r.camera.fov = r._menuCam.fov;
    r.camera.position.copyFrom(r._menuCam.pos);
    r.camera.rotation.copyFrom(r._menuCam.rot);
    r.camera.rotation.z = 0;
    setMenuPostEnabled(r, true);
  } else {
    r.rainSystem?.start?.();
    r.dustSystem?.start?.();
    r.emberSystem?.start?.();
    r.scene.shadowsEnabled = true;
    r.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    r.scene.clearColor = new BABYLON.Color4(0.02, 0.012, 0.008, 1);
    r.scene.fogColor = hex3(0x0a0604);
    r.scene.fogDensity = 0.022;
    setMenuPostEnabled(r, false);
    r.camera.minZ = r._gameCam.minZ;
    r.camera.maxZ = r._gameCam.maxZ;
    r.camera.fov = r._gameCam.fov;
    r.camera.position.set(0, 1.62, 0.15);
    r.camera.rotation.set(0, 0, 0);
    r.baseYaw = 0;
    r.targetBaseYaw = 0;
    r.yaw = 0;
    r.pitch = 0;
    r.targetYaw = 0;
    r.targetPitch = 0;
    r.lookingBehind = false;
  }
}

export function updateMenuExterior(r, dt) {
  if (!r.menuMode || !r.menuRoot) return;
  r.menuT += dt;

  // Parallax suave con el ratón (sin empujar el restaurante fuera del lado derecho)
  const px = (r.pointerX ?? 0.5) - 0.5;
  const py = (r.pointerY ?? 0.5) - 0.5;
  const base = r._menuCam;
  const targetYaw = base.rot.y + px * 0.08;
  const targetPitch = base.rot.x - py * 0.05;
  r.camera.rotation.y += (targetYaw - r.camera.rotation.y) * Math.min(1, dt * 3.2);
  r.camera.rotation.x += (targetPitch - r.camera.rotation.x) * Math.min(1, dt * 3.2);
  r.camera.position.x += (base.pos.x + px * 0.22 - r.camera.position.x) * Math.min(1, dt * 2.4);
  r.camera.position.y += (base.pos.y - py * 0.14 - r.camera.position.y) * Math.min(1, dt * 2.4);
  r.camera.position.z = base.pos.z;

  // Neón: pulso + parpadeo ocasional
  const flicker = Math.random() > 0.992 ? 0.35 : 1;
  const pulse = 0.85 + Math.sin(r.menuT * 2.1) * 0.08;
  if (r.menuNeonLight) {
    r.menuNeonLight.intensity = 8.6 * pulse * flicker;
  }
  if (r.menuWinLight) {
    r.menuWinLight.intensity = 12.2 + Math.sin(r.menuT * 1.4) * 0.55;
  }
  for (const m of r._menuNeonMats) {
    if (!m?.emissiveColor || !m.metadata?.baseE) continue;
    const k = 0.75 + pulse * 0.35 * flicker;
    m.emissiveColor.copyFrom(m.metadata.baseE);
    m.emissiveColor.scaleInPlace(k);
  }

  // Niebla a la deriva delante de la fachada
  for (const mesh of r.menuRoot.getChildMeshes?.(false) ?? []) {
    if (!mesh.metadata?.menuFog) continue;
    const ph = mesh.metadata.phase || 0;
    mesh.position.x = 3 + (ph - 1) * 3.5 + Math.sin(r.menuT * 0.12 + ph) * 1.6;
    mesh.material.alpha = 0.03 + Math.sin(r.menuT * 0.4 + ph) * 0.015;
  }

  if (r.menuSign) {
    r.menuSign.rotation.y = Math.sin(r.menuT * 0.25) * 0.02;
  }
}

// ——— helpers ———

function box(r, w, h, d, mat, x, y, z, parent) {
  return r.box(w, h, d, mat, x, y, z, parent, OPT);
}

/** Marco de ventana hueco (4 listones) — evita solapar un panel sólido con el cristal. */
function windowFrame(r, mat, x, y, z, w, h, depth, thickness, parent) {
  const t = thickness;
  // laterales
  box(r, t, h, depth, mat, x - (w - t) / 2, y, z, parent);
  box(r, t, h, depth, mat, x + (w - t) / 2, y, z, parent);
  // superior / inferior (entre laterales)
  const innerW = w - 2 * t;
  box(r, innerW, t, depth, mat, x, y + (h - t) / 2, z, parent);
  box(r, innerW, t, depth, mat, x, y - (h - t) / 2, z, parent);
}

function std(r, opts) {
  const m = r.mats._std(opts);
  m.maxSimultaneousLights = 12;
  return m;
}

/** Bloom + AO + tono cálido; se engancha a la cámara solo en menú. */
function setupMenuPost(r) {
  r.menuPipeline = null;
  r.menuSSAO = null;
  r._menuPostName = "menuPipe";
  r._menuSsaoName = "menuSSAO";

  try {
    if (BABYLON.DefaultRenderingPipeline) {
      // Se crea sin cámaras; se adjunta al entrar al menú.
      const pipe = new BABYLON.DefaultRenderingPipeline(
        r._menuPostName,
        true,
        r.scene,
        [],
      );
      pipe.fxaaEnabled = true;
      pipe.bloomEnabled = true;
      pipe.bloomThreshold = 0.48;
      pipe.bloomWeight = 0.72;
      pipe.bloomKernel = 64;
      pipe.bloomScale = 0.7;
      pipe.imageProcessingEnabled = true;
      if (pipe.imageProcessing) {
        pipe.imageProcessing.contrast = 1.22;
        pipe.imageProcessing.exposure = 1.28;
        pipe.imageProcessing.toneMappingEnabled = true;
        pipe.imageProcessing.vignetteEnabled = true;
        pipe.imageProcessing.vignetteWeight = 1.8;
        pipe.imageProcessing.vignetteColor = new BABYLON.Color4(0.03, 0.012, 0.004, 1);
        pipe.imageProcessing.colorCurvesEnabled = true;
        if (pipe.imageProcessing.colorCurves) {
          const c = pipe.imageProcessing.colorCurves;
          c.globalHue = 10;
          c.globalSaturation = 22;
          c.highlightsHue = 28;
          c.highlightsSaturation = 28;
        }
      }
      r.menuPipeline = pipe;
    }
  } catch (_) {
    r.menuPipeline = null;
  }

  try {
    if (BABYLON.SSAO2RenderingPipeline) {
      const ssao = new BABYLON.SSAO2RenderingPipeline(
        r._menuSsaoName,
        r.scene,
        { ssaoRatio: 0.5, blurRatio: 0.5 },
        [],
      );
      ssao.radius = 1.7;
      ssao.totalStrength = 1.45;
      ssao.base = 0.32;
      ssao.maxZ = 80;
      r.menuSSAO = ssao;
    }
  } catch (_) {
    r.menuSSAO = null;
  }
}

function setMenuPostEnabled(r, on) {
  const cam = r.camera;
  const mgr = r.scene?.postProcessRenderPipelineManager;
  if (!cam || !mgr) return;

  if (r.menuPipeline) {
    try {
      if (on) {
        if (typeof r.menuPipeline.addCamera === "function") r.menuPipeline.addCamera(cam);
        else mgr.attachCamerasToRenderPipeline(r._menuPostName, cam);
      } else if (typeof r.menuPipeline.removeCamera === "function") {
        r.menuPipeline.removeCamera(cam);
      } else {
        mgr.detachCamerasFromRenderPipeline(r._menuPostName, cam);
      }
    } catch (_) { /* */ }
  }

  if (r.menuSSAO) {
    try {
      if (on) mgr.attachCamerasToRenderPipeline(r._menuSsaoName, cam);
      else mgr.detachCamerasFromRenderPipeline(r._menuSsaoName, cam);
    } catch (_) { /* */ }
  }

  const ipc = r.scene?.imageProcessingConfiguration;
  if (ipc) {
    ipc.contrast = on ? 1.2 : 1;
    ipc.exposure = on ? 1.2 : 1;
    ipc.toneMappingEnabled = !!on;
  }
}

function neonMat(r, color, emissive) {
  const m = std(r, { color, emissive, specular: 0x000000 });
  m.disableLighting = true;
  m.metadata = { baseE: hex3(emissive) };
  return m;
}

function neonLabel(r, text, w, h, mat, x, y, z, parent, font) {
  const tex = makeTex(r.scene, `neon${nextId(r)}`, (ctx, tw, th) => {
    ctx.clearRect(0, 0, tw, th);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const glow = mat.emissiveColor
      ? `rgba(${mat.emissiveColor.r * 255|0},${mat.emissiveColor.g * 255|0},${mat.emissiveColor.b * 255|0},0.95)`
      : "#ffaa44";
    ctx.shadowColor = glow;
    ctx.shadowBlur = 28;
    // Contorno oscuro para que el bold se lea de lejos
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(20,8,0,0.85)";
    ctx.strokeText(text, tw / 2, th / 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = glow;
    ctx.strokeText(text, tw / 2, th / 2);
    ctx.fillStyle = "#fff8e6";
    ctx.fillText(text, tw / 2, th / 2);
  }, 1024, 256);
  tex.hasAlpha = true;
  const m = mat.clone(`neonLbl${nextId(r)}`);
  m.diffuseTexture = tex;
  m.emissiveTexture = tex;
  m.opacityTexture = tex;
  m.metadata = { baseE: mat.metadata?.baseE?.clone?.() ?? hex3(0xffcc44) };
  m.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
  const mesh = BABYLON.MeshBuilder.CreatePlane(`nl${nextId(r)}`, { width: w, height: h }, r.scene);
  mesh.material = m;
  mesh.position.set(x, y, z);
  mesh.parent = parent;
  mesh.isPickable = false;
  return { mesh, mat: m };
}

/** Pizza entera: corteza cálida + queso + pepperoni (legible de lejos). */
function wholePizza(r, _crustNeon, _cheeseNeon) {
  const g = new BABYLON.TransformNode(`pie${nextId(r)}`, r.scene);
  const crustM = neonMat(r, 0xd4923a, 0xc87820);
  const cheeseM = neonMat(r, 0xffe08a, 0xffcc55);
  const crust = BABYLON.MeshBuilder.CreateCylinder("pieCrust", {
    diameter: 1.4, height: 0.12, tessellation: 22,
  }, r.scene);
  crust.material = crustM;
  crust.rotation.x = Math.PI / 2;
  crust.parent = g;
  crust.isPickable = false;

  const cheese = BABYLON.MeshBuilder.CreateCylinder("pieCheese", {
    diameter: 1.12, height: 0.06, tessellation: 22,
  }, r.scene);
  cheese.material = cheeseM;
  cheese.rotation.x = Math.PI / 2;
  cheese.position.z = 0.04;
  cheese.parent = g;
  cheese.isPickable = false;

  // Cortes de rebanada
  const cutMat = neonMat(r, 0x5a2810, 0x3a1808);
  for (let i = 0; i < 6; i++) {
    const cut = BABYLON.MeshBuilder.CreateBox(`pieCut${i}`, {
      width: 0.04, height: 1.08, depth: 0.02,
    }, r.scene);
    cut.material = cutMat;
    cut.rotation.z = (i * Math.PI) / 6;
    cut.position.z = 0.06;
    cut.parent = g;
    cut.isPickable = false;
  }

  const pepMat = neonMat(r, 0xe01828, 0xff2030);
  for (const [x, y] of [[0.22, 0.18], [-0.25, 0.12], [0.05, -0.28], [-0.15, -0.18], [0.28, -0.1], [-0.28, -0.05], [0.0, 0.05]]) {
    const pep = BABYLON.MeshBuilder.CreateCylinder(`pep${nextId(r)}`, {
      diameter: 0.2, height: 0.05, tessellation: 8,
    }, r.scene);
    pep.material = pepMat;
    pep.rotation.x = Math.PI / 2;
    pep.position.set(x, y, 0.08);
    pep.parent = g;
    pep.isPickable = false;
  }
  return g;
}

function crescentMoon(r, mat) {
  const g = new BABYLON.TransformNode(`cres${nextId(r)}`, r.scene);
  const big = BABYLON.MeshBuilder.CreateSphere("cmBig", { diameter: 1.15, segments: 10 }, r.scene);
  big.material = mat;
  big.parent = g;
  big.isPickable = false;
  const cut = BABYLON.MeshBuilder.CreateSphere("cmCut", { diameter: 0.95, segments: 10 }, r.scene);
  cut.material = std(r, { color: 0x050810, emissive: 0x050810 });
  cut.material.disableLighting = true;
  cut.position.set(0.38, 0.12, 0.35);
  cut.parent = g;
  cut.isPickable = false;
  return g;
}

function tree(r, parent, x, z, s) {
  const g = new BABYLON.TransformNode(`tree${nextId(r)}`, r.scene);
  g.parent = parent;
  g.position.set(x, 0, z);
  g.scaling.setAll(s);
  const trunk = std(r, { color: 0x12100c });
  const leaf = std(r, { color: 0x060a08, emissive: 0x020403 });
  box(r, 0.35, 2.2, 0.35, trunk, 0, 1.1, 0, g);
  const crown = BABYLON.MeshBuilder.CreateSphere(`crown${nextId(r)}`, { diameter: 2.4, segments: 6 }, r.scene);
  crown.material = leaf;
  crown.position.set(0, 2.8, 0);
  crown.scaling.set(1, 1.2, 1);
  crown.parent = g;
  crown.isPickable = false;
}

/** Pino silueta (conos apilados) — castea sombra en el suelo. */
function pine(r, parent, x, z, s) {
  const g = new BABYLON.TransformNode(`pine${nextId(r)}`, r.scene);
  g.parent = parent;
  g.position.set(x, 0, z);
  g.scaling.setAll(s);
  const trunk = std(r, { color: 0x14100c, specular: 0x111111 });
  // Un toque frío para siluetear contra el cielo negro
  const needle = std(r, { color: 0x0c1410, emissive: 0x050a08, specular: 0x000000 });
  box(r, 0.28, 1.6, 0.28, trunk, 0, 0.8, 0, g);
  const tiers = [
    [2.8, 1.75, 1.95],
    [2.15, 1.45, 3.25],
    [1.5, 1.2, 4.35],
    [0.9, 1.0, 5.25],
  ];
  for (const [diam, h, y] of tiers) {
    const cone = BABYLON.MeshBuilder.CreateCylinder(`pn${nextId(r)}`, {
      diameterTop: 0.02,
      diameterBottom: diam,
      height: h,
      tessellation: 7,
    }, r.scene);
    cone.material = needle;
    cone.position.set(0, y, 0);
    cone.parent = g;
    cone.isPickable = false;
  }
}

function fakeGlow(r, parent, color, w, d, x, z, y, alpha) {
  const m = std(r, { color, emissive: color, alpha, backFace: true });
  m.disableLighting = true;
  const plane = BABYLON.MeshBuilder.CreateGround(`fg${nextId(r)}`, { width: w, height: d }, r.scene);
  plane.material = m;
  plane.position.set(x, y, z);
  plane.parent = parent;
  plane.isPickable = false;
}

/** Halo emisivo estable: sin depth-write ni double-sided (evita parpadeo). */
function glowPlane(r, name, w, h, color, emissive, alpha) {
  const mat = std(r, { color, emissive, alpha });
  mat.disableLighting = true;
  mat.backFaceCulling = true;
  mat.disableDepthWrite = true;
  mat.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
  mat.alphaMode = BABYLON.Engine.ALPHA_ADD;
  const plane = BABYLON.MeshBuilder.CreatePlane(name, { width: w, height: h }, r.scene);
  plane.material = mat;
  plane.isPickable = false;
  plane.receiveShadows = false;
  return plane;
}

function makeMenuBrick(scene) {
  return makeTex(scene, "menuBrick", (ctx, w, h) => {
    ctx.fillStyle = "#2c1814";
    ctx.fillRect(0, 0, w, h);
    const bw = 42;
    const bh = 20;
    for (let row = 0; row < h / bh + 1; row++) {
      const off = (row % 2) * (bw / 2);
      for (let col = -1; col < w / bw + 1; col++) {
        const x = col * bw + off;
        const y = row * bh;
        const shade = 70 + Math.random() * 50;
        ctx.fillStyle = `rgb(${shade + 30},${shade * 0.45},${shade * 0.3})`;
        ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    }
  }, 256, 256, 3, 2);
}

function makeAsphalt(scene) {
  return makeTex(scene, "menuAsphalt", (ctx, w, h) => {
    ctx.fillStyle = "#14161c";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.5
        ? `rgba(80,90,110,${Math.random() * 0.08})`
        : `rgba(0,0,0,${Math.random() * 0.15})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 2);
    }
    // Brillos húmedos
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(140,160,200,${0.04 + Math.random() * 0.06})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      const y = Math.random() * h;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + 8, w * 0.6, y - 6, w, y + 4);
      ctx.stroke();
    }
  }, 256, 256, 8, 8);
}

function makeAwningStripes(scene) {
  return makeTex(scene, "menuAwning", (ctx, w, h) => {
    const n = 10;
    const sw = w / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#c82028" : "#f2eee6";
      ctx.fillRect(i * sw, 0, sw + 1, h);
    }
  }, 256, 64, 4, 1);
}

function makeChalkboard(scene) {
  return makeTex(scene, "menuChalk", (ctx, w, h) => {
    ctx.fillStyle = "#1a2218";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#d8e0d0";
    ctx.font = "bold 28px Special Elite, cursive";
    ctx.textAlign = "center";
    ctx.fillText("Pizza", w / 2, h * 0.35);
    ctx.fillText("Siempre Mejor", w / 2, h * 0.55);
    ctx.font = "36px Special Elite, cursive";
    ctx.fillText(":)", w / 2, h * 0.78);
  }, 256, 256);
}

function makeInteriorGlow(scene) {
  return makeTex(scene, "menuInterior", (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 10, w * 0.5, h * 0.5, w * 0.7);
    g.addColorStop(0, "#ffe2a8");
    g.addColorStop(0.45, "#e09040");
    g.addColorStop(1, "#5a2010");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // siluetas de lámparas
    ctx.fillStyle = "rgba(255,220,150,0.55)";
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.28, 8, 0, Math.PI * 2);
    ctx.arc(w * 0.65, h * 0.3, 7, 0, Math.PI * 2);
    ctx.fill();
  }, 128, 128);
}

function makeNightSky(scene) {
  return makeTex(scene, "menuSky", (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#010205");
    g.addColorStop(0.4, "#050812");
    g.addColorStop(0.75, "#08060e");
    g.addColorStop(1, "#0a0708");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 95; i++) {
      ctx.fillStyle = `rgba(180,200,230,${0.08 + Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * w, Math.random() * h * 0.65, 1, 1);
    }
    // Nubes casi negras
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(12,16,24,${0.12 + Math.random() * 0.14})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h * 0.45, 50 + Math.random() * 70, 14 + Math.random() * 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 512, 256);
}
