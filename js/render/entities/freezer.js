import * as THREE from "three";

export function buildFreezer(r) {
    r.freezerGroup = new THREE.Group();
    r.freezerGroup.position.set(-4.3, 0, 5.4);
    r.root.add(r.freezerGroup);

    const body = r.box(1.25, 2.1, 1.0, r.mats.metal, 0, 1.05, 0, r.freezerGroup);
    r.box(1.1, 1.9, 0.06, r.mats.metalDark, 0, 1.05, 0.22, r.freezerGroup);
    r.box(1.05, 1.75, 0.72, r.mats.ice, 0, 1.05, 0.02, r.freezerGroup);
    r.box(1.0, 0.04, 0.68, r.mats.metalDark, 0, 1.45, 0.02, r.freezerGroup);
    r.box(1.0, 0.04, 0.68, r.mats.metalDark, 0, 0.7, 0.02, r.freezerGroup);

    r.box(0.38, 0.22, 0.28, new THREE.MeshStandardMaterial({ color: 0x8899aa }), -0.25, 1.6, 0.02, r.freezerGroup);
    r.box(0.32, 0.16, 0.32, new THREE.MeshStandardMaterial({ color: 0x667788 }), 0.28, 0.85, 0.0, r.freezerGroup);
    r.box(0.25, 0.12, 0.2, new THREE.MeshStandardMaterial({ color: 0xaabbcc }), 0.15, 1.55, 0.1, r.freezerGroup);

    // Escarcha en estantes
    for (let i = 0; i < 12; i++) {
      const frost = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 6, 6),
        new THREE.MeshStandardMaterial({
          color: 0xd0e8f8, transparent: true, opacity: 0.45, roughness: 0.2, emissive: 0x88aacc, emissiveIntensity: 0.2,
        })
      );
      frost.position.set((Math.random() - 0.5) * 0.8, 0.55 + Math.random() * 1.2, 0.15 + Math.random() * 0.2);
      r.freezerGroup.add(frost);
    }

    r.freezerDoorPivot = new THREE.Group();
    r.freezerDoorPivot.position.set(-0.6, 1.05, 0.5);
    r.freezerGroup.add(r.freezerDoorPivot);

    r.freezerDoor = r.box(1.18, 2.0, 0.08, r.mats.metal, 0.6, 0, 0, r.freezerDoorPivot);
    r.box(0.72, 0.95, 0.03, r.mats.glass, 0.6, 0.15, 0.05, r.freezerDoorPivot, { cast: false });
    r.box(0.06, 0.4, 0.08, r.mats.metalDark, 1.08, 0, 0.08, r.freezerDoorPivot);
    r.box(0.08, 0.08, 0.1, r.mats.metal, 1.08, -0.25, 0.1, r.freezerDoorPivot);

    r.markInteractable(r.freezerDoor, "freezer");
    r.markInteractable(body, "freezer");

    r.makeLabel("CONGELADOR", -4.3, 2.3, 4.85, 0.15, 0xc8e0f0);

    // Niebla fría (partículas)
    const mistN = 40;
    const mistPos = new Float32Array(mistN * 3);
    for (let i = 0; i < mistN; i++) {
      mistPos[i * 3] = (Math.random() - 0.5) * 0.8;
      mistPos[i * 3 + 1] = 0.4 + Math.random() * 1.4;
      mistPos[i * 3 + 2] = 0.3 + Math.random() * 0.5;
    }
    const mistGeo = new THREE.BufferGeometry();
    mistGeo.setAttribute("position", new THREE.BufferAttribute(mistPos, 3));
    r.freezerMist = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({ color: 0xb8d8f0, size: 0.08, transparent: true, opacity: 0, depthWrite: false })
    );
    r.freezerGroup.add(r.freezerMist);

    r.freezerLight = new THREE.PointLight(0x88ccff, 0, 3);
    r.freezerLight.position.set(0, 1.2, 0.3);
    r.freezerGroup.add(r.freezerLight);
  }
