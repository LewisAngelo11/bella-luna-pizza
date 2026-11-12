import * as THREE from "three";

export function setupLights(r) {
  r.ambient = new THREE.AmbientLight(0x6a4a38, 0.75);
  r.scene.add(r.ambient);

  r.hemi = new THREE.HemisphereLight(0xffe8c8, 0x1a1008, 0.55);
  r.scene.add(r.hemi);

  r.lamp = new THREE.PointLight(0xffd090, 4.6, 20);
  r.lamp.position.set(0, 2.7, 5);
  r.lamp.castShadow = true;
  r.lamp.shadow.mapSize.set(512, 512);
  r.lamp.shadow.bias = -0.002;
  r.lamp.shadow.camera.near = 0.3;
  r.lamp.shadow.camera.far = 16;
  r.scene.add(r.lamp);

  r.spotLamp = new THREE.SpotLight(0xffe0b0, 1.4, 14, Math.PI / 5, 0.45, 1);
  r.spotLamp.position.set(0, 3.1, 5);
  r.spotLamp.target.position.set(0, 0, 7);
  r.scene.add(r.spotLamp);
  r.scene.add(r.spotLamp.target);

  // Horno en cocina (−Z build)
  // Luz del fuego delante de la boca (build −Z; tras flip queda hacia el jugador)
  r.ovenLight = new THREE.PointLight(0xff6622, 9.5, 9);
  r.ovenLight.position.set(-2.4, 0.9, -2.5);
  r.scene.add(r.ovenLight);

  r.fill = new THREE.PointLight(0xdd9977, 2.2, 18);
  r.fill.position.set(-3, 2.2, 8);
  r.scene.add(r.fill);

  r.counterLight = new THREE.PointLight(0xfff0d0, 3.6, 12);
  r.counterLight.position.set(0, 2.3, 1.5);
  r.scene.add(r.counterLight);

  r.customerLight = new THREE.PointLight(0xffe8c8, 0, 6);
  r.customerLight.position.set(0, 2.0, 2.3);
  r.scene.add(r.customerLight);

  r.backLight = new THREE.PointLight(0xffe0b0, 5.2, 14);
  r.backLight.position.set(0, 2.5, -3.2);
  r.scene.add(r.backLight);

  r.backLight2 = new THREE.PointLight(0xffd8a0, 2.8, 10);
  r.backLight2.position.set(0, 2.3, -5.5);
  r.scene.add(r.backLight2);

  // Luz puntual sobre la puerta trasera
  r.doorLight = new THREE.PointLight(0xffe8c0, 2.4, 8);
  r.doorLight.position.set(0, 2.6, -6.4);
  r.scene.add(r.doorLight);
}
