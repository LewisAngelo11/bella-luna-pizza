/* global BABYLON */
import { hex3 } from "../utils.js";

export function buildMenuAndNeon(r) {
  r.box(1.85, 0.08, 0.08, r.mats.wood, 1.3, 2.7, 13.05);
  r.box(1.85, 0.08, 0.08, r.mats.wood, 1.3, 1.05, 13.05);
  r.box(0.08, 1.75, 0.08, r.mats.wood, 0.42, 1.88, 13.05);
  r.box(0.08, 1.75, 0.08, r.mats.wood, 2.18, 1.88, 13.05);

  r.box(1.7, 1.6, 0.06, r.mats.paper, 1.3, 1.85, 13.05);
  r.box(1.55, 1.45, 0.02, r.mat(0xe8d8b8), 1.3, 1.85, 13.09);
  r.makeLabel("BELLA LUNA", 1.3, 2.45, 13.12, 0.2, 0x3a2010);
  ["Margarita  ···", "Pepperoni ···", "Diavola   ···", "Funghi    ···"].forEach((l, i) => {
    r.makeLabel(l, 1.3, 2.15 - i * 0.22, 13.12, 0.14, 0x4a3020);
  });

  const neonMat = r.mat(0xff2222, { emissive: 0xff1111 });
  r.neon = r.makeLabel("ABIERTO", 0.15, 2.95, 13.12, 0.34, 0xff4444);
  r.box(1.35, 0.04, 0.04, neonMat, 0.15, 3.12, 13.1, r.root, { cast: false });
  r.box(1.35, 0.04, 0.04, neonMat, 0.15, 2.78, 13.1, r.root, { cast: false });

  r.neonLight = new BABYLON.PointLight("neonL", new BABYLON.Vector3(0.15, 2.8, 12.4), r.scene);
  r.neonLight.diffuse = hex3(0xff3b3b);
  r.neonLight.intensity = 0.45;
  r.neonLight.range = 6;
}
