import * as THREE from "three";

export function setupCustomer(r) {
    r.customerGroup = new THREE.Group();
    r.customerGroup.visible = false;
    r.customerGroup.position.set(0, 0, 2.2);

    const cloth = new THREE.MeshStandardMaterial({ color: 0x5a4038, roughness: 0.85 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd4a888, roughness: 0.55 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9 });

    r.customerBody = r.box(0.62, 1.05, 0.4, cloth, 0, 0.95, 0, r.customerGroup);
    r.box(0.78, 0.3, 0.38, cloth, 0, 1.42, 0, r.customerGroup);
    // Brazos
    r.box(0.14, 0.55, 0.14, cloth, -0.42, 1.05, 0.05, r.customerGroup);
    r.box(0.14, 0.55, 0.14, cloth, 0.42, 1.05, 0.05, r.customerGroup);
    r.box(0.12, 0.12, 0.12, skin, -0.42, 0.72, 0.08, r.customerGroup);
    r.box(0.12, 0.12, 0.12, skin, 0.42, 0.72, 0.08, r.customerGroup);

    r.customerHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), skin);
    r.customerHead.position.set(0, 1.72, 0);
    r.customerHead.castShadow = true;
    r.customerGroup.add(r.customerHead);

    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 16), hair);
    hairMesh.scale.set(1.05, 0.7, 1.05);
    hairMesh.position.set(0, 1.82, -0.02);
    r.customerGroup.add(hairMesh);

    r.eyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x1a1010 })
    );
    r.eyeR = r.eyeL.clone();
    r.eyeL.position.set(-0.08, 1.75, 0.22);
    r.eyeR.position.set(0.08, 1.75, 0.22);
    r.customerGroup.add(r.eyeL, r.eyeR);

    // Brillo de ojos
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const hr = hl.clone();
    hl.position.set(-0.07, 1.76, 0.255);
    hr.position.set(0.09, 1.76, 0.255);
    r.customerGroup.add(hl, hr);

    r.box(0.05, 0.06, 0.05, skin, 0, 1.68, 0.24, r.customerGroup);
    r.customerMouth = r.box(
      0.12, 0.03, 0.02,
      new THREE.MeshStandardMaterial({ color: 0x8a4050 }),
      0, 1.58, 0.23, r.customerGroup
    );

    r.customerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 22),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
    );
    r.customerShadow.rotation.x = -Math.PI / 2;
    r.customerShadow.position.y = 0.02;
    r.customerGroup.add(r.customerShadow);

    r.teethGroup = new THREE.Group();
    r.teethGroup.visible = false;
    for (let i = 0; i < 12; i++) {
      r.box(0.025, 0.08, 0.02, new THREE.MeshStandardMaterial({ color: 0xfff5e6 }), -0.14 + i * 0.025, 1.56, 0.24, r.teethGroup);
    }
    r.customerGroup.add(r.teethGroup);
    r.root.add(r.customerGroup);
  }

export function applyCustomer(r, c) {
    r.customer = c;
    if (!c) {
      r.customerGroup.visible = false;
      if (r.customerLight) r.customerLight.intensity = 0;
      return;
    }
    r.customerGroup.visible = true;
    if (r.customerLight) r.customerLight.intensity = 3.2;
    const traits = c.traits || {};
    r.customerShadow.visible = traits.shadow !== false;
    if (traits.redEyes) {
      const m = new THREE.MeshStandardMaterial({ color: 0xff1111, emissive: 0xff0000, emissiveIntensity: 1.5 });
      r.eyeL.material = m;
      r.eyeR.material = m;
    } else {
      const m = new THREE.MeshStandardMaterial({ color: 0x1a1010 });
      r.eyeL.material = m;
      r.eyeR.material = m;
    }
    r.teethGroup.visible = !!traits.tooManyTeeth;
    if (r.customerMouth) r.customerMouth.visible = !traits.tooManyTeeth;
  }
