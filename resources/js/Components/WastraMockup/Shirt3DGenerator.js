import * as THREE from 'three';

/**
 * Membuat Geometri Kemeja Lengan Panjang 3D yang Presisi & Realistis
 */
export function createShirt3DObject(material) {
    const shirtGroup = new THREE.Group();
    shirtGroup.name = "ShirtModel";

    // ==========================================
    // 1. BADAN KEMEJA (TORSO)
    // ==========================================
    // Menggunakan Cylinder segmented lalu dideformasi sesuai siluet kemeja pria
    const torsoGeom = new THREE.CylinderGeometry(1.2, 1.35, 3.2, 48, 36, true);
    const pos = torsoGeom.attributes.position;
    const uvs = torsoGeom.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Normalized height [-1 .. 1]
        const ny = y / 1.6;

        // Sudut horizontal theta
        const theta = Math.atan2(z, x);

        // Siluet bahu dan dada:
        // Di bagian atas (ny > 0.4), lebarkan bahu ke samping (sumbu X)
        const shoulderExpansion = 1.0 + Math.max(0, ny - 0.2) * 0.45 * Math.abs(Math.cos(theta));
        x *= shoulderExpansion;

        // Ketebalan dada vs punggung: dada sedikit melengkung ke depan
        const chestCurve = z > 0 ? 1.0 + Math.sin((ny + 1) * Math.PI * 0.5) * 0.15 : 0.95;
        z *= chestCurve * 0.65; // Kemeja lebih pipih di sumbu Z (depan-belakang)

        // Pinggang sedikit ramping di tengah
        const waistTaper = 1.0 - Math.exp(-Math.pow((ny + 0.1) * 2.2, 2)) * 0.08;
        x *= waistTaper;
        z *= waistTaper;

        // Kelim bawah kemeja (Curved Shirttail Hem):
        // Bagian samping melengkung naik, depan & belakang melengkung turun
        if (ny < -0.7) {
            const hemCurve = Math.cos(theta * 2) * 0.18;
            y += ((-0.7 - ny) / 0.3) * hemCurve;
        }

        pos.setXYZ(i, x, y, z);

        // Sesuaikan UV mapping agar motif batik mengalir alami
        const u = ((theta + Math.PI) / (Math.PI * 2)) * 2.5;
        const v = (y + 1.6) / 3.2 * 2.0;
        uvs.setXY(i, u, v);
    }

    torsoGeom.computeVertexNormals();
    const torsoMesh = new THREE.Mesh(torsoGeom, material);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    shirtGroup.add(torsoMesh);

    // ==========================================
    // 2. PLACKET DEPAN (LIDAH KANCING VERTIKAL)
    // ==========================================
    const placketGeom = new THREE.PlaneGeometry(0.22, 2.9, 1, 16);
    const placketMesh = new THREE.Mesh(placketGeom, material);
    placketMesh.position.set(0, -0.05, 0.47);
    placketMesh.castShadow = true;
    shirtGroup.add(placketMesh);

    // Kancing-kancing kemeja kecil
    const buttonMat = new THREE.MeshStandardMaterial({
        color: 0x1E2B23,
        roughness: 0.3,
        metalness: 0.2
    });
    for (let b = 0; b < 6; b++) {
        const buttonGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 16);
        const buttonMesh = new THREE.Mesh(buttonGeom, buttonMat);
        buttonMesh.rotation.x = Math.PI / 2;
        buttonMesh.position.set(0, 1.1 - b * 0.42, 0.485);
        shirtGroup.add(buttonMesh);
    }

    // ==========================================
    // 3. KERAH KEMEJA (COLLAR)
    // ==========================================
    // Stand kerah (leher bagian dalam)
    const collarStandGeom = new THREE.CylinderGeometry(0.68, 0.78, 0.35, 32, 1, true);
    const collarStandMesh = new THREE.Mesh(collarStandGeom, material);
    collarStandMesh.position.set(0, 1.62, -0.05);
    collarStandMesh.scale.set(1.0, 1.0, 0.85);
    shirtGroup.add(collarStandMesh);

    // Daun kerah luar terlipat (Wings & Lapel Collar)
    const collarLeafGeom = new THREE.RingGeometry(0.72, 1.05, 32, 1, 0, Math.PI * 1.85);
    const collarPos = collarLeafGeom.attributes.position;
    for (let i = 0; i < collarPos.count; i++) {
        let x = collarPos.getX(i);
        let y = collarPos.getY(i);
        let z = collarPos.getZ(i);

        // Miringkan ujung daun kerah ke depan dan ke bawah
        if (x > 0.4 && y < 0) {
            y -= 0.25;
            z += 0.2;
        } else if (x < -0.4 && y < 0) {
            y -= 0.25;
            z += 0.2;
        }
        collarPos.setXYZ(i, x, y, z);
    }
    collarLeafGeom.computeVertexNormals();

    const collarLeafMesh = new THREE.Mesh(collarLeafGeom, material);
    collarLeafMesh.rotation.x = -Math.PI / 2 + 0.35;
    collarLeafMesh.position.set(0, 1.68, -0.02);
    collarLeafMesh.scale.set(0.95, 0.95, 0.85);
    collarLeafMesh.castShadow = true;
    shirtGroup.add(collarLeafMesh);

    // ==========================================
    // 4. LENGAN KIRI & KANAN (LONG SLEEVES)
    // ==========================================
    function createSleeve(isLeft = true) {
        const sleeveGroup = new THREE.Group();
        const side = isLeft ? -1 : 1;

        // Kurva lengkungan tangan alami (bahu -> siku sedikit menekuk -> pergelangan)
        const sleeveCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(side * 1.35, 1.3, -0.02),
            new THREE.Vector3(side * 1.85, 0.5, 0.05),
            new THREE.Vector3(side * 2.15, -0.4, 0.12),
            new THREE.Vector3(side * 2.35, -1.35, 0.2)
        ]);

        const sleeveGeom = new THREE.TubeGeometry(sleeveCurve, 28, 0.38, 24, false);
        
        // Tapering pergelangan tangan (mengecil dari pangkal lengan ke pergelangan)
        const sPos = sleeveGeom.attributes.position;
        const sUvs = sleeveGeom.attributes.uv;

        for (let i = 0; i < sPos.count; i++) {
            let px = sPos.getX(i);
            let py = sPos.getY(i);
            let pz = sPos.getZ(i);

            // Jarak vertikal dari bahu ke pergelangan
            const progress = (1.4 - py) / 2.75;
            const taper = 1.0 - progress * 0.35; // mengecil hingga 65% di manset

            // Offset terhadap kurva
            const ptOnCurve = sleeveCurve.getPointAt(Math.max(0, Math.min(1, progress)));
            px = ptOnCurve.x + (px - ptOnCurve.x) * taper;
            pz = ptOnCurve.z + (pz - ptOnCurve.z) * taper;

            sPos.setXYZ(i, px, py, pz);
        }

        sleeveGeom.computeVertexNormals();
        const sleeveMesh = new THREE.Mesh(sleeveGeom, material);
        sleeveMesh.castShadow = true;
        sleeveMesh.receiveShadow = true;
        sleeveGroup.add(sleeveMesh);

        // Manset Kemeja (Cuff) di ujung lengan
        const cuffGeom = new THREE.CylinderGeometry(0.26, 0.28, 0.22, 24);
        const cuffMesh = new THREE.Mesh(cuffGeom, material);
        cuffMesh.position.set(side * 2.35, -1.42, 0.2);
        cuffMesh.rotation.z = side * 0.15;
        cuffMesh.castShadow = true;
        sleeveGroup.add(cuffMesh);

        return sleeveGroup;
    }

    const leftSleeve = createSleeve(true);
    const rightSleeve = createSleeve(false);
    shirtGroup.add(leftSleeve);
    shirtGroup.add(rightSleeve);

    // ==========================================
    // 5. INTERIOR LEHER GELAP (HOLLOW SHADOW)
    // ==========================================
    const innerNeckGeom = new THREE.CircleGeometry(0.65, 24);
    const innerNeckMat = new THREE.MeshBasicMaterial({ color: 0x07110C });
    const innerNeckMesh = new THREE.Mesh(innerNeckGeom, innerNeckMat);
    innerNeckMesh.rotation.x = -Math.PI / 2;
    innerNeckMesh.position.set(0, 1.48, -0.05);
    shirtGroup.add(innerNeckMesh);

    // Sedikit turunkan posisi keseluruhan agar tepat di tengah viewport
    shirtGroup.position.set(0, 0.15, 0);

    return shirtGroup;
}

/**
 * Membuat Tekstur Batik Otomatis / Default (Kawung Picis Khas Keraton)
 * Menggunakan canvas 1024x1024 dengan warna hijau zaitun malam sogan & ornamen emas
 */
export function createDefaultKawungPicisTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 1. Warna Latar Kain Mori Sage / Zaitun Gelap Khas Kemeja Batik Pria
    ctx.fillStyle = '#223329';
    ctx.fillRect(0, 0, 1024, 1024);

    // Tekstur Tenun Serat Kain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let x = 0; x < 1024; x += 4) ctx.fillRect(x, 0, 1, 1024);
    for (let y = 0; y < 1024; y += 4) ctx.fillRect(0, y, 1024, 1);

    // 2. Render Pola Kawung Picis Berulang Rapi
    const tileSize = 64; // Motif picis berukuran kecil dan berulang rapat
    const rows = 1024 / tileSize;
    const cols = 1024 / tileSize;

    ctx.strokeStyle = '#D4C097'; // Warna malam emas tua
    ctx.fillStyle = '#D4C097';
    ctx.lineWidth = 1.4;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = c * tileSize + tileSize / 2;
            const cy = r * tileSize + tileSize / 2;
            const rx = tileSize * 0.22;
            const ry = tileSize * 0.34;

            // 4 Kelopak Oval Kawung
            ctx.beginPath();
            ctx.ellipse(cx, cy - ry * 0.55, rx, ry * 0.55, 0, 0, Math.PI * 2);
            ctx.ellipse(cx, cy + ry * 0.55, rx, ry * 0.55, 0, 0, Math.PI * 2);
            ctx.ellipse(cx - ry * 0.55, cy, ry * 0.55, rx, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + ry * 0.55, cy, ry * 0.55, rx, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Diamond Belah Ketupat Tengah
            const d = tileSize * 0.08;
            ctx.beginPath();
            ctx.moveTo(cx, cy - d);
            ctx.lineTo(cx + d, cy);
            ctx.lineTo(cx, cy + d);
            ctx.lineTo(cx - d, cy);
            ctx.closePath();
            ctx.stroke();

            // Cecek Kawung Picis
            ctx.beginPath();
            ctx.arc(cx, cy - ry * 0.55, 1.2, 0, Math.PI * 2);
            ctx.arc(cx, cy + ry * 0.55, 1.2, 0, Math.PI * 2);
            ctx.arc(cx - ry * 0.55, cy, 1.2, 0, Math.PI * 2);
            ctx.arc(cx + ry * 0.55, cy, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Sudut Pertemuan Ubin
            const cornerR = tileSize * 0.28;
            ctx.beginPath();
            ctx.arc(c * tileSize, r * tileSize, cornerR, 0, Math.PI / 2);
            ctx.arc((c + 1) * tileSize, r * tileSize, cornerR, Math.PI / 2, Math.PI);
            ctx.arc((c + 1) * tileSize, (r + 1) * tileSize, cornerR, Math.PI, 3 * Math.PI / 2);
            ctx.arc(c * tileSize, (r + 1) * tileSize, cornerR, 3 * Math.PI / 2, Math.PI * 2);
            ctx.stroke();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.needsUpdate = true;
    return texture;
}

/**
 * Membuat Tekstur dari Desain Kanvas yang Dilukis Pengguna
 * @param {string} tileDataUrl - Data URL dari tile canvas pengguna
 */
export function createCustomBatikTexture(tileDataUrl, callback) {
    if (!tileDataUrl) return;

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Latar kain mori lembut
        ctx.fillStyle = '#F5EFEB';
        ctx.fillRect(0, 0, 1024, 1024);

        // Pattern repeat dari ubin lukisan pengguna
        const pattern = ctx.createPattern(img, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, 1024, 1024);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        texture.needsUpdate = true;
        callback(texture);
    };
    img.src = tileDataUrl;
}
