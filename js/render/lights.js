/* global BABYLON */
import { hex3 } from "./utils.js";
import { registerShadowCasters } from "./mesh.js";

/**
 * Sala tenues, cálida: el mostrador/horno llevan la luz;
 * el fondo cae a penumbra ámbar.
 */
export function setupLights(r) {
  r.hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0.1), r.scene);
  r.hemi.diffuse = hex3(0xffc090);
  r.hemi.groundColor = hex3(0x040201);
  r.hemi.intensity = 0.06;
  r.ambient = r.hemi;

  r.lamp = new BABYLON.PointLight("lamp", new BABYLON.Vector3(0, 2.7, 5), r.scene);
  r.lamp.diffuse = hex3(0xffb060);
  r.lamp.intensity = 1.05;
  r.lamp.range = 12;

  // Direccional = sombra (frustum amplio sobre la sala).
  r.dirLight = new BABYLON.DirectionalLight(
    "dirShadow",
    new BABYLON.Vector3(0.45, -1.1, 0.55),
    r.scene,
  );
  r.dirLight.position = new BABYLON.Vector3(-6, 12, -2);
  r.dirLight.diffuse = hex3(0xffc080);
  r.dirLight.intensity = 0.72;
  r.dirLight.shadowEnabled = true;
  r.dirLight.shadowMinZ = 0.5;
  r.dirLight.shadowMaxZ = 45;
  // Crítico: sin shadowFrustumSize > 0 el mapa ortho queda vacío.
  r.dirLight.shadowFrustumSize = 32;
  r.dirLight.shadowOrthoScale = 0.5;
  r.dirLight.autoUpdateExtends = false;
  r.dirLight.autoCalcShadowZBounds = true;

  r.shadowGen = new BABYLON.ShadowGenerator(2048, r.dirLight);
  r.shadowGen.usePercentageCloserFiltering = true;
  r.shadowGen.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
  r.shadowGen.setDarkness(0.15);
  r.shadowGen.bias = 0.001;
  r.shadowGen.normalBias = 0.03;
  registerShadowCasters(r);

  r.spotLamp = new BABYLON.SpotLight(
    "spot",
    new BABYLON.Vector3(0, 3.1, 5),
    new BABYLON.Vector3(0, -1, 0.25),
    Math.PI / 5.5,
    5,
    r.scene,
  );
  r.spotLamp.diffuse = hex3(0xffb070);
  r.spotLamp.intensity = 0.42;
  r.spotLamp.range = 9;

  r.ovenLight = new BABYLON.PointLight("ovenL", new BABYLON.Vector3(4.1, 0.7, 4.55), r.scene);
  r.ovenLight.diffuse = hex3(0xff6a18);
  r.ovenLight.intensity = 1.15;
  r.ovenLight.range = 8;

  // Fill débil: no ilumina el fondo, solo evita negro puro cerca.
  r.fill = new BABYLON.PointLight("fill", new BABYLON.Vector3(-2.5, 1.8, 7.5), r.scene);
  r.fill.diffuse = hex3(0xc06038);
  r.fill.intensity = 0.08;
  r.fill.range = 7;

  r.counterLight = new BABYLON.PointLight("counterL", new BABYLON.Vector3(0, 2.3, 1.5), r.scene);
  r.counterLight.diffuse = hex3(0xffc888);
  r.counterLight.intensity = 0.7;
  r.counterLight.range = 7;

  r.customerLight = new BABYLON.PointLight("custL", new BABYLON.Vector3(0, 2.0, 2.3), r.scene);
  r.customerLight.diffuse = hex3(0xffc090);
  r.customerLight.intensity = 0;
  r.customerLight.range = 5;
  r.customerLight.setEnabled(false);

  // Pasillo trasero: apenas una bombilla cálida.
  r.backLight = new BABYLON.PointLight("backL", new BABYLON.Vector3(0, 2.4, -4.5), r.scene);
  r.backLight.diffuse = hex3(0xffb070);
  r.backLight.intensity = 0.28;
  r.backLight.range = 7;

  r.backLight2 = new BABYLON.PointLight("backL2", new BABYLON.Vector3(0, 2.2, -2.0), r.scene);
  r.backLight2.diffuse = hex3(0xe08850);
  r.backLight2.intensity = 0.1;
  r.backLight2.range = 5;

  r.menuLight = null;

  for (const mat of r.scene.materials) {
    try {
      mat.maxSimultaneousLights = 10;
      mat.unfreeze?.();
      mat.markAsDirty?.(BABYLON.Material.AllDirtyFlag);
    } catch (_) { /* ignore */ }
  }
}
