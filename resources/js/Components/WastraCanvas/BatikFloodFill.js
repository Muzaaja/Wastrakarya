/**
 * Toroidal Flood Fill Engine untuk Kanvas Batik Wastrakarya
 * Mendukung pengisian area tertutup (Nembok) baik pada goresan canting pengguna
 * maupun pada kontur preset motif pakem, dengan pembungkusan toroidal (seamless tile).
 */

/**
 * Konversi warna hex / CSS string ke objek RGBA { r, g, b, a }
 */
export function parseColorToRgba(colorStr) {
    if (!colorStr) return { r: 205, g: 185, b: 136, a: 255 };
    
    if (colorStr.startsWith('#')) {
        let hex = colorStr.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const num = parseInt(hex, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
            a: 255
        };
    }
    
    // Fallback jika format rgba / rgb
    const match = colorStr.match(/\d+/g);
    if (match && match.length >= 3) {
        return {
            r: parseInt(match[0], 10),
            g: parseInt(match[1], 10),
            b: parseInt(match[2], 10),
            a: match[3] !== undefined ? Math.round(parseFloat(match[3]) * (match[3] <= 1 ? 255 : 1)) : 255
        };
    }

    return { r: 205, g: 185, b: 136, a: 255 };
}

/**
 * Lakukan Flood Fill pada Unit Tile Batik
 * @param {HTMLCanvasElement} tileCanvas - Canvas ubin lilin malam
 * @param {number} clickWorldX - Titik klik koordinat dunia X
 * @param {number} clickWorldY - Titik klik koordinat dunia Y
 * @param {number} S - Ukuran ubin (misal 160)
 * @param {string} fillColorStr - Warna malam pengisi (misal '#CDB988')
 * @param {string} selectedMotif - ID motif aktif (misal 'kawung' atau 'polos')
 * @param {Function} autoTraceFn - Fungsi pembantu untuk menggambar kontur batas motif
 */
export function executeBatikFloodFill(tileCanvas, clickWorldX, clickWorldY, S, fillColorStr, selectedMotif, autoTraceFn) {
    if (!tileCanvas) return false;

    const tileCtx = tileCanvas.getContext('2d');
    const fillColor = parseColorToRgba(fillColorStr);

    // Hitung posisi awal modulo ubin S
    let sx = Math.floor(((clickWorldX % S) + S) % S);
    let sy = Math.floor(((clickWorldY % S) + S) % S);

    // 1. Buat kanvas batas komposit (menggabungkan garis kontur motif dan goresan canting)
    const boundaryCanvas = document.createElement('canvas');
    boundaryCanvas.width = S;
    boundaryCanvas.height = S;
    const bCtx = boundaryCanvas.getContext('2d');

    // Jika ada motif preset aktif, gambar kontur batasnya sebagai pembatas solid
    if (selectedMotif && selectedMotif !== 'polos' && selectedMotif !== 'none' && typeof autoTraceFn === 'function') {
        autoTraceFn(bCtx, selectedMotif, S, '#000000', 3);
    }

    // Gambar juga goresan lilin malam yang sudah ada di tileCanvas sebagai pembatas
    bCtx.drawImage(tileCanvas, 0, 0);

    const boundaryImgData = bCtx.getImageData(0, 0, S, S);
    const boundaryData = boundaryImgData.data;

    const tileImgData = tileCtx.getImageData(0, 0, S, S);
    const tileData = tileImgData.data;

    let startIdx = (sy * S + sx) * 4;

    // Jika titik klik jatuh tepat di atas garis pembatas (alpha tinggi), cari piksel tetangga yang kosong
    if (boundaryData[startIdx + 3] > 180) {
        let found = false;
        for (let r = 1; r <= 4 && !found; r++) {
            const offsets = [
                [0, -r], [0, r], [-r, 0], [r, 0],
                [-r, -r], [r, -r], [-r, r], [r, r]
            ];
            for (const [ox, oy] of offsets) {
                const nx = (sx + ox + S) % S;
                const ny = (sy + oy + S) % S;
                const nIdx = (ny * S + nx) * 4;
                if (boundaryData[nIdx + 3] < 120) {
                    sx = nx;
                    sy = ny;
                    startIdx = nIdx;
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            // Semua sekitarnya adalah garis pembatas tebal
            return false;
        }
    }

    // Warna target pada tileCanvas saat ini
    const targetR = tileData[startIdx];
    const targetG = tileData[startIdx + 1];
    const targetB = tileData[startIdx + 2];
    const targetA = tileData[startIdx + 3];

    // Jika warna target sudah sama persis dengan warna pengisi, hentikan
    if (
        Math.abs(targetR - fillColor.r) < 5 &&
        Math.abs(targetG - fillColor.g) < 5 &&
        Math.abs(targetB - fillColor.b) < 5 &&
        Math.abs(targetA - fillColor.a) < 5
    ) {
        return false;
    }

    const isTargetEmpty = targetA < 40;

    /**
     * Memeriksa apakah suatu piksel boleh diisi
     */
    function canFill(idx) {
        // Cek apakah piksel ini adalah garis pembatas pada boundaryCanvas
        const bAlpha = boundaryData[idx + 3];
        if (bAlpha > 170) {
            return false; // Tertahan oleh garis pembatas
        }

        const a = tileData[idx + 3];
        if (isTargetEmpty) {
            // Jika mengisi area kain kosong: piksel pada kanvas ubin juga harus kosong/transparan
            return a < 60;
        } else {
            // Jika me-recolor area warna yang sudah ada: warna harus mendekati warna target
            const dr = Math.abs(tileData[idx] - targetR);
            const dg = Math.abs(tileData[idx + 1] - targetG);
            const db = Math.abs(tileData[idx + 2] - targetB);
            const da = Math.abs(a - targetA);
            return (dr + dg + db + da) < 60;
        }
    }

    // BFS Queue Flood Fill dengan Toroidal Wrapping
    const visited = new Uint8Array(S * S);
    const queue = [sx + sy * S];
    visited[sx + sy * S] = 1;

    let head = 0;
    while (head < queue.length) {
        const curr = queue[head++];
        const cx = curr % S;
        const cy = Math.floor(curr / S);
        const idx = curr * 4;

        // Beri warna malam pada tileData
        tileData[idx] = fillColor.r;
        tileData[idx + 1] = fillColor.g;
        tileData[idx + 2] = fillColor.b;
        tileData[idx + 3] = fillColor.a;

        // 4 Arah Mata Angin dengan Toroidal Modulo
        const neighbors = [
            ((cx + 1) % S) + cy * S,                   // Kanan
            ((cx - 1 + S) % S) + cy * S,               // Kiri
            cx + (((cy + 1) % S) * S),                 // Bawah
            cx + (((cy - 1 + S) % S) * S)              // Atas
        ];

        for (let i = 0; i < 4; i++) {
            const nPos = neighbors[i];
            if (!visited[nPos]) {
                const nIdx = nPos * 4;
                if (canFill(nIdx)) {
                    visited[nPos] = 1;
                    queue.push(nPos);
                }
            }
        }
    }

    // Tulis kembali data piksel yang telah terisi ke tileCanvas
    tileCtx.putImageData(tileImgData, 0, 0);
    return true;
}
