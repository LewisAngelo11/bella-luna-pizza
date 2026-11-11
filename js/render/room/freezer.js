/* global BABYLON */
import { hex3 } from "../utils.js";

/**
 * Congelador en la pared izquierda:
 * rotación π → puerta (+Z local) mira al mostrador (-Z mundo);
 * costado contra la pared izquierda; espalda hacia el fondo.
 */
export function buildFreezer(r) {
  r.freezerGroup = new BABYLON.TransformNode("freezer", r.scene);
  r.freezerGroup.position.set(-4.55, 0, 6.1);
  r.freezerGroup.rotation.y = Math.PI;
  r.freezerGroup.parent = r.root;

  // Cuerpo
  const body = r.box(1.25, 2.1, 0.95, r.mats.metal, 0, 1.05, -0.05, r.freezerGroup, { cast: true });
  // Trasera (contra la pared) — panel plano oscuro
  r.box(1.2, 2.05, 0.06, r.mats.metalDark, 0, 1.05, -0.52, r.freezerGroup, { cast: true });

  // Interior
  r.box(1.05, 1.75, 0.7, r.mats.ice, 0, 1.05, -0.05, r.freezerGroup);
  r.box(1.0, 0.04, 0.65, r.mats.metalDark, 0, 1.45, -0.05, r.freezerGroup);
  r.box(1.0, 0.04, 0.65, r.mats.metalDark, 0, 0.7, -0.05, r.freezerGroup);
  r.box(0.38, 0.22, 0.28, r.mat(0x8899aa), -0.25, 1.6, 0.0, r.freezerGroup);
  r.box(0.32, 0.16, 0.32, r.mat(0x667788), 0.28, 0.85, -0.05, r.freezerGroup);

  // Marco frontal (detrás de la puerta)
  r.box(1.12, 1.95, 0.05, r.mats.metalDark, 0, 1.05, 0.38, r.freezerGroup);

  // Puerta: pivot en el borde izquierdo de la cara frontal (+Z)
  r.freezerDoorPivot = new BABYLON.TransformNode("freezerDoorPivot", r.scene);
  r.freezerDoorPivot.position.set(-0.58, 1.05, 0.45);
  r.freezerDoorPivot.parent = r.freezerGroup;

  r.freezerDoor = r.box(1.16, 1.98, 0.08, r.mats.metal, 0.58, 0, 0, r.freezerDoorPivot, {
    cast: true, animated: true,
  });
  // Marco del cristal
  r.box(0.86, 1.12, 0.03, r.mats.metalDark, 0.58, 0.18, 0.05, r.freezerDoorPivot, {
    cast: false, animated: true,
  });
  // Cristal con hielo detrás (muy legible)
  r.box(0.72, 0.98, 0.04, r.mat(0xb8d8f0, { alpha: 0.45, emissive: 0x223344, specular: 0xffffff }), 0.58, 0.18, 0.07, r.freezerDoorPivot, {
    cast: false, animated: true,
  });
  // Manija grande en el borde (lado del local tras rotar π)
  r.box(0.09, 0.55, 0.12, r.mats.metalDark, 0.12, 0.05, 0.12, r.freezerDoorPivot, {
    animated: true,
  });
  r.box(0.12, 0.12, 0.14, r.mat(0xe8eef4, { specular: 0xffffff }), 0.12, -0.32, 0.14, r.freezerDoorPivot, {
    animated: true,
  });

  r.markInteractable(r.freezerDoor, "freezer");
  r.markInteractable(body, "freezer");
  for (const m of r.freezerDoorPivot.getChildMeshes?.(false) ?? [r.freezerDoor]) {
    m.unfreezeWorldMatrix();
    m.metadata = { ...(m.metadata || {}), animated: true, static: false };
  }

  r.makeLabel("CONGELADOR", 0, 1.2, 0.55, 0.13, 0xc8e0f0, r.freezerGroup);

  r.freezerLight = new BABYLON.PointLight("freezerL", new BABYLON.Vector3(0, 1.2, 0.1), r.scene);
  r.freezerLight.parent = r.freezerGroup;
  r.freezerLight.diffuse = hex3(0x88ccff);
  r.freezerLight.intensity = 0;
  r.freezerLight.range = 3;
  r.freezerMist = null;
}
