import React from 'react';

/**
 * Pustaka Pakem Motif Batik Nusantara
 * Dilengkapi dengan deskripsi filosofis, ikon SVG, dan fungsi render garis panduan titik-titik.
 */
export const BATIK_MOTIFS = [
    {
        id: 'polos',
        name: 'Tanpa Pola',
        origin: '',
        category: 'Polos / Bebas',
        description: 'Kanvas polos tanpa garis titik-titik panduan. Bebaskan kreativitas dan imajinasi Anda untuk melukis motif batik orisinal secara mandiri dengan pengulangan tanpa batas.',
        svgIcon: (
            <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-[#CDB988] fill-none" strokeWidth="1.8">
                {/* Frame Persegi Putus-putus Melambangkan Kanvas Polos Bebas */}
                <rect x="14" y="14" width="36" height="36" rx="8" strokeDasharray="3 3" opacity="0.6" />
                <line x1="22" y1="42" x2="42" y2="22" strokeDasharray="2 3" opacity="0.8" />
                <circle cx="32" cy="32" r="3" className="fill-[#CDB988]/30 stroke-[#CDB988]" />
            </svg>
        )
    },
    {
        id: 'kawung',
        name: 'Kawung',
        origin: 'Yogyakarta & Surakarta',
        category: 'Geometris',
        description: 'Melambangkan kesucian, keadilan, dan kesederhanaan hidup layaknya buah kolang-kaling yang tersusun empat penjuru.',
        svgIcon: (
            <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-[#CDB988] fill-none" strokeWidth="1.8">
                {/* 4 Petals */}
                <ellipse cx="32" cy="18" rx="8" ry="12" />
                <ellipse cx="32" cy="46" rx="8" ry="12" />
                <ellipse cx="18" cy="32" rx="12" ry="8" />
                <ellipse cx="46" cy="32" rx="12" ry="8" />
                {/* Central Diamond */}
                <polygon points="32,27 37,32 32,37 27,32" />
                {/* Inner Dots */}
                <circle cx="32" cy="15" r="1.5" className="fill-[#CDB988]" />
                <circle cx="32" cy="21" r="1.5" className="fill-[#CDB988]" />
                <circle cx="32" cy="43" r="1.5" className="fill-[#CDB988]" />
                <circle cx="32" cy="49" r="1.5" className="fill-[#CDB988]" />
                <circle cx="15" cy="32" r="1.5" className="fill-[#CDB988]" />
                <circle cx="21" cy="32" r="1.5" className="fill-[#CDB988]" />
                <circle cx="43" cy="32" r="1.5" className="fill-[#CDB988]" />
                <circle cx="49" cy="32" r="1.5" className="fill-[#CDB988]" />
            </svg>
        )
    },
    {
        id: 'parang',
        name: 'Parang',
        origin: 'Yogyakarta & Surakarta',
        category: 'Lereng / Non-Geometris',
        description: 'Bentuk ombak laut dan pedang melambangkan semangat pantang menyerah serta kesinambungan perjuangan hidup.',
        svgIcon: (
            <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-[#CDB988] fill-none" strokeWidth="1.8" strokeLinecap="round">
                {/* Diagonal Parang S-Curves */}
                <path d="M 8,56 Q 20,44 26,34 Q 30,26 24,18 Q 20,14 26,8" />
                <path d="M 24,60 Q 36,48 42,38 Q 46,30 40,22 Q 36,18 42,12" />
                <path d="M 40,64 Q 52,52 58,42 Q 62,34 56,26" />
                {/* Mlinjon Hook Accents */}
                <path d="M 26,34 Q 32,36 30,42" />
                <path d="M 42,38 Q 48,40 46,46" />
                {/* Parallel diagonal guideline */}
                <line x1="4" y1="40" x2="28" y2="64" strokeDasharray="2 3" opacity="0.6" />
                <line x1="20" y1="4" x2="60" y2="44" strokeDasharray="2 3" opacity="0.6" />
            </svg>
        )
    },
    {
        id: 'ceplok',
        name: 'Ceplok',
        origin: 'Jawa Tengah',
        category: 'Geometris',
        description: 'Pola melingkar menyerupai kuntum bunga teratai merepresentasikan keseimbangan batin, keteraturan alam semesta, dan kemurnian.',
        svgIcon: (
            <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-[#CDB988] fill-none" strokeWidth="1.8">
                {/* Outer Diamond */}
                <polygon points="32,8 56,32 32,56 8,32" />
                {/* 8-pointed star / Rosette */}
                <circle cx="32" cy="32" r="7" />
                <path d="M 32,15 L 34,25 L 44,22 L 39,30 L 49,32 L 39,34 L 44,42 L 34,39 L 32,49 L 30,39 L 20,42 L 25,34 L 15,32 L 25,30 L 20,22 L 30,25 Z" />
                <circle cx="32" cy="32" r="2.5" className="fill-[#CDB988]" />
            </svg>
        )
    },
    {
        id: 'truntum',
        name: 'Truntum',
        origin: 'Surakarta',
        category: 'Semen / Bertabur',
        description: 'Diciptakan Kanjeng Ratu Kencana bermakna cinta yang tulus, bersemi kembali (tumaruntum), serta harapan yang abadi.',
        svgIcon: (
            <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-[#CDB988] fill-none" strokeWidth="1.8">
                {/* Center Jasmine Star */}
                <path d="M 32,20 L 34,28 L 42,26 L 36,32 L 44,32 L 36,34 L 42,40 L 34,36 L 32,44 L 30,36 L 22,40 L 28,34 L 20,32 L 28,32 L 22,26 L 30,28 Z" />
                {/* Center dot */}
                <circle cx="32" cy="32" r="2" className="fill-[#CDB988]" />
                {/* Radiating dots (cecek) */}
                <circle cx="32" cy="14" r="1.5" className="fill-[#CDB988]" />
                <circle cx="32" cy="50" r="1.5" className="fill-[#CDB988]" />
                <circle cx="14" cy="32" r="1.5" className="fill-[#CDB988]" />
                <circle cx="50" cy="32" r="1.5" className="fill-[#CDB988]" />
                <circle cx="19" cy="19" r="1.5" className="fill-[#CDB988]" />
                <circle cx="45" cy="19" r="1.5" className="fill-[#CDB988]" />
                <circle cx="19" cy="45" r="1.5" className="fill-[#CDB988]" />
                <circle cx="45" cy="45" r="1.5" className="fill-[#CDB988]" />
                {/* Connecting Grid */}
                <line x1="32" y1="4" x2="60" y2="32" strokeDasharray="2 3" opacity="0.6" />
                <line x1="60" y1="32" x2="32" y2="60" strokeDasharray="2 3" opacity="0.6" />
                <line x1="32" y1="60" x2="4" y2="32" strokeDasharray="2 3" opacity="0.6" />
                <line x1="4" y1="32" x2="32" y2="4" strokeDasharray="2 3" opacity="0.6" />
            </svg>
        )
    },
    {
        id: 'sidomukti',
        name: 'Sidomukti',
        origin: 'Surakarta',
        category: 'Keraton / Upacara',
        description: 'Simbol harapan agar pemakainya memperoleh kemuliaan, kemakmuran, dan kebahagiaan lahir batin secara berkelanjutan.',
        svgIcon: (
            <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-[#CDB988] fill-none" strokeWidth="1.8">
                {/* Diamond Cartouche */}
                <polygon points="32,6 58,32 32,58 6,32" />
                <polygon points="32,12 52,32 32,52 12,32" strokeDasharray="2 2" opacity="0.7" />
                {/* Stylized Butterfly / Garuda Wings */}
                <path d="M 32,24 Q 44,16 48,26 Q 44,34 32,32" />
                <path d="M 32,24 Q 20,16 16,26 Q 20,34 32,32" />
                <path d="M 32,32 Q 42,36 44,44 Q 38,48 32,40" />
                <path d="M 32,32 Q 22,36 20,44 Q 26,48 32,40" />
                <circle cx="32" cy="27" r="1.5" className="fill-[#CDB988]" />
            </svg>
        )
    },
    {
        id: 'nitik',
        name: 'Nitik',
        origin: 'Yogyakarta',
        category: 'Anyaman / Nitik',
        description: 'Meniru teknik tenun patola dengan canting berbelah menghasilkan garis titik-titik (cecek) rapi yang mencerminkan ketelitian budi pekerti.',
        svgIcon: (
            <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-[#CDB988] fill-none" strokeWidth="1.8">
                {/* Diamond made of stitched dashes */}
                <polygon points="32,8 56,32 32,56 8,32" strokeDasharray="4 3" />
                <polygon points="32,16 48,32 32,48 16,32" strokeDasharray="3 3" opacity="0.7" />
                {/* Woven Cross Stitch */}
                <line x1="32" y1="20" x2="32" y2="44" strokeDasharray="3 2" />
                <line x1="20" y1="32" x2="44" y2="32" strokeDasharray="3 2" />
                <circle cx="32" cy="32" r="2" className="fill-[#CDB988]" />
                {/* 4 Corner Stitch Dots */}
                <circle cx="26" cy="26" r="1.2" className="fill-[#CDB988]" />
                <circle cx="38" cy="26" r="1.2" className="fill-[#CDB988]" />
                <circle cx="26" cy="38" r="1.2" className="fill-[#CDB988]" />
                <circle cx="38" cy="38" r="1.2" className="fill-[#CDB988]" />
            </svg>
        )
    }
];

/**
 * Render Garis Panduan Titik-Titik (Dotted Guidelines) pada Canvas Tile
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} motifId 
 * @param {number} S - Tile Size (e.g. 160)
 * @param {number} opacity - Nilai 0.0 sampai 1.0
 */
export function renderDottedGuide(ctx, motifId, S, opacity = 0.75) {
    if (!motifId || motifId === 'polos' || motifId === 'none') return;

    ctx.save();
    ctx.strokeStyle = `rgba(164, 140, 92, ${opacity})`;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]); // Garis titik-titik khas panduan membatik
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = S / 2;
    const cy = S / 2;

    switch (motifId) {
        case 'kawung': {
            // 4 Kelopak Oval Utama
            const rx = S * 0.22;
            const ry = S * 0.36;

            // Kelopak Atas
            ctx.beginPath();
            ctx.ellipse(cx, cy - ry * 0.55, rx, ry * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Kelopak Bawah
            ctx.beginPath();
            ctx.ellipse(cx, cy + ry * 0.55, rx, ry * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Kelopak Kiri
            ctx.beginPath();
            ctx.ellipse(cx - ry * 0.55, cy, ry * 0.55, rx, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Kelopak Kanan
            ctx.beginPath();
            ctx.ellipse(cx + ry * 0.55, cy, ry * 0.55, rx, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Diamond Belah Ketupat Pusat
            const d = S * 0.08;
            ctx.beginPath();
            ctx.moveTo(cx, cy - d);
            ctx.lineTo(cx + d, cy);
            ctx.lineTo(cx, cy + d);
            ctx.lineTo(cx - d, cy);
            ctx.closePath();
            ctx.stroke();

            // 4 Sudut Ubin (Kelopak sudut agar saat di-tile tersambung sempurna)
            const cornerR = S * 0.28;
            // Kiri-Atas (0, 0)
            ctx.beginPath();
            ctx.arc(0, 0, cornerR, 0, Math.PI / 2);
            ctx.stroke();
            // Kanan-Atas (S, 0)
            ctx.beginPath();
            ctx.arc(S, 0, cornerR, Math.PI / 2, Math.PI);
            ctx.stroke();
            // Kanan-Bawah (S, S)
            ctx.beginPath();
            ctx.arc(S, S, cornerR, Math.PI, 3 * Math.PI / 2);
            ctx.stroke();
            // Kiri-Bawah (0, S)
            ctx.beginPath();
            ctx.arc(0, S, cornerR, 3 * Math.PI / 2, Math.PI * 2);
            ctx.stroke();

            // Titik Panduan Isen (Cecek)
            ctx.fillStyle = `rgba(164, 140, 92, ${opacity * 0.9})`;
            const dots = [
                [cx, cy - ry * 0.7], [cx, cy - ry * 0.4],
                [cx, cy + ry * 0.4], [cx, cy + ry * 0.7],
                [cx - ry * 0.7, cy], [cx - ry * 0.4, cy],
                [cx + ry * 0.4, cy], [cx + ry * 0.7, cy]
            ];
            dots.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 2.2, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
        }

        case 'parang': {
            // Lereng Parang Diagonal 45 Derajat (Tersambung Mulus Antar Ubin)
            // Garis dasar diagonal 1: (0, S) ke (S, 0)
            // Garis dasar diagonal 2: (0, 0) ke (S, S)
            
            // Garis diagonal pembatas lereng
            ctx.beginPath();
            ctx.moveTo(0, S);
            ctx.lineTo(S, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(S, S);
            ctx.stroke();

            // Lengkungan Parang Lidah Api / Machete Blade
            const steps = 3;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = t * S;
                const py = (1 - t) * S;

                // S-curve lidah parang
                ctx.beginPath();
                ctx.moveTo(px - 15, py + 15);
                ctx.bezierCurveTo(px - 5, py - 5, px + 15, py - 10, px + 25, py);
                ctx.bezierCurveTo(px + 30, py + 10, px + 15, py + 20, px, py + 10);
                ctx.stroke();

                // Mlinjon hook (aksen kait belah ketupat kecil)
                ctx.beginPath();
                ctx.moveTo(px + 10, py - 4);
                ctx.lineTo(px + 18, py + 2);
                ctx.lineTo(px + 12, py + 8);
                ctx.stroke();
            }

            // Lengkungan lereng kedua
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = t * S;
                const py = t * S;

                ctx.beginPath();
                ctx.moveTo(px - 15, py - 15);
                ctx.bezierCurveTo(px - 5, py - 30, px + 15, py - 20, px + 20, py - 5);
                ctx.stroke();
            }
            break;
        }

        case 'ceplok': {
            // Geometris Bunga Mandala 8 Kelopak & Belah Ketupat
            // Belah Ketupat Bingkai Utama
            ctx.beginPath();
            ctx.moveTo(cx, S * 0.08);
            ctx.lineTo(S * 0.92, cy);
            ctx.lineTo(cx, S * 0.92);
            ctx.lineTo(S * 0.08, cy);
            ctx.closePath();
            ctx.stroke();

            // Lingkaran Konsentris Pusat
            ctx.beginPath();
            ctx.arc(cx, cy, S * 0.16, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, S * 0.28, 0, Math.PI * 2);
            ctx.stroke();

            // 8 Kelopak Teratai Radial
            for (let a = 0; a < 8; a++) {
                const angle = (a * Math.PI) / 4;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const tipX = cx + cosA * S * 0.38;
                const tipY = cy + sinA * S * 0.38;

                const leftAngle = angle - 0.22;
                const rightAngle = angle + 0.22;
                const lx = cx + Math.cos(leftAngle) * S * 0.24;
                const ly = cy + Math.sin(leftAngle) * S * 0.24;
                const rx = cx + Math.cos(rightAngle) * S * 0.24;
                const ry = cy + Math.sin(rightAngle) * S * 0.24;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.quadraticCurveTo(lx, ly, tipX, tipY);
                ctx.quadraticCurveTo(rx, ry, cx, cy);
                ctx.stroke();
            }

            // Aksen Sudut (agar menyatu dengan 4 sudut ubin lain)
            const cRadius = S * 0.12;
            [[0, 0], [S, 0], [S, S], [0, S]].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, cRadius, 0, Math.PI * 2);
                ctx.stroke();
            });
            break;
        }

        case 'truntum': {
            // Motif Bintang Kuntum Melati Bertabur
            const rStar = S * 0.18;
            
            // Kuntum Pusat
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
                const angle = (i * Math.PI) / 8;
                const dist = i % 2 === 0 ? rStar : rStar * 0.45;
                const px = cx + Math.cos(angle) * dist;
                const py = cy + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Titik Inti
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.stroke();

            // Garis jala diagonal penghubung
            ctx.beginPath();
            ctx.moveTo(cx, 0); ctx.lineTo(S, cy); ctx.lineTo(cx, S); ctx.lineTo(0, cy); ctx.closePath();
            ctx.stroke();

            // Cecek Kembang Melati Bertabur
            ctx.fillStyle = `rgba(164, 140, 92, ${opacity * 0.9})`;
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const d1 = S * 0.28;
                const d2 = S * 0.36;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(angle) * d1, cy + Math.sin(angle) * d1, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + Math.cos(angle) * d2, cy + Math.sin(angle) * d2, 1.8, 0, Math.PI * 2);
                ctx.fill();
            }

            // 4 Kuntum Sudut Mini
            [[0, 0], [S, 0], [S, S], [0, S]].forEach(([x, y]) => {
                ctx.beginPath();
                for (let i = 0; i < 16; i++) {
                    const angle = (i * Math.PI) / 8;
                    const dist = i % 2 === 0 ? rStar * 0.5 : rStar * 0.22;
                    const px = x + Math.cos(angle) * dist;
                    const py = y + Math.sin(angle) * dist;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            });
            break;
        }

        case 'sidomukti': {
            // Bingkai Belah Ketupat Sidomukti Ganda
            ctx.beginPath();
            ctx.moveTo(cx, S * 0.08); ctx.lineTo(S * 0.92, cy); ctx.lineTo(cx, S * 0.92); ctx.lineTo(S * 0.08, cy); ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, S * 0.16); ctx.lineTo(S * 0.84, cy); ctx.lineTo(cx, S * 0.84); ctx.lineTo(S * 0.16, cy); ctx.closePath();
            ctx.stroke();

            // Sayap Kupu-kupu / Lar Garuda di Tengah
            // Sayap Atas Kanan
            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.bezierCurveTo(cx + S * 0.2, cy - S * 0.22, cx + S * 0.32, cy - S * 0.05, cx + S * 0.12, cy + 4);
            ctx.stroke();

            // Sayap Atas Kiri
            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.bezierCurveTo(cx - S * 0.2, cy - S * 0.22, cx - S * 0.32, cy - S * 0.05, cx - S * 0.12, cy + 4);
            ctx.stroke();

            // Sayap Bawah Kanan
            ctx.beginPath();
            ctx.moveTo(cx, cy + 4);
            ctx.bezierCurveTo(cx + S * 0.25, cy + S * 0.12, cx + S * 0.18, cy + S * 0.26, cx, cy + S * 0.18);
            ctx.stroke();

            // Sayap Bawah Kiri
            ctx.beginPath();
            ctx.moveTo(cx, cy + 4);
            ctx.bezierCurveTo(cx - S * 0.25, cy + S * 0.12, cx - S * 0.18, cy + S * 0.26, cx, cy + S * 0.18);
            ctx.stroke();

            // Tubuh & Mahkota Lar
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.lineTo(cx, cy + 12);
            ctx.stroke();
            break;
        }

        case 'nitik': {
            // Pola Anyaman Anyar Berisi Garis Stik / Stitch Jahitan
            const dOuter = S * 0.42;
            const dInner = S * 0.24;

            // Belah ketupat luar
            ctx.beginPath();
            ctx.moveTo(cx, cy - dOuter); ctx.lineTo(cx + dOuter, cy); ctx.lineTo(cx, cy + dOuter); ctx.lineTo(cx - dOuter, cy); ctx.closePath();
            ctx.stroke();

            // Belah ketupat dalam
            ctx.beginPath();
            ctx.moveTo(cx, cy - dInner); ctx.lineTo(cx + dInner, cy); ctx.lineTo(cx, cy + dInner); ctx.lineTo(cx - dInner, cy); ctx.closePath();
            ctx.stroke();

            // Palang Stitch Anyaman Horizontal & Vertikal
            ctx.beginPath();
            ctx.moveTo(cx - S * 0.2, cy); ctx.lineTo(cx + S * 0.2, cy);
            ctx.moveTo(cx, cy - S * 0.2); ctx.lineTo(cx, cy + S * 0.2);
            ctx.stroke();

            // Cecek Sudut
            ctx.fillStyle = `rgba(164, 140, 92, ${opacity * 0.9})`;
            const nitikDots = [
                [cx - S * 0.12, cy - S * 0.12], [cx + S * 0.12, cy - S * 0.12],
                [cx - S * 0.12, cy + S * 0.12], [cx + S * 0.12, cy + S * 0.12]
            ];
            nitikDots.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
        }

        default:
            break;
    }

    ctx.restore();
}

/**
 * Jiplak Pola Otomatis Menggunakan Malam (Auto-Trace with Wax)
 * Menggambar pola preset ke dalam Tile Canvas pengguna sehingga tampak seperti lukisan lilin malam asli.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} motifId 
 * @param {number} S 
 * @param {string} waxColor 
 * @param {number} strokeWidth 
 */
export function autoTraceMotifWax(ctx, motifId, S, waxColor = '#CDB988', strokeWidth = 3) {
    if (!motifId || motifId === 'polos' || motifId === 'none') return;

    ctx.save();
    ctx.strokeStyle = waxColor;
    ctx.fillStyle = waxColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]); // Garis malam solid/utuh

    const cx = S / 2;
    const cy = S / 2;

    switch (motifId) {
        case 'kawung': {
            const rx = S * 0.22;
            const ry = S * 0.36;

            // 4 Kelopak Utama
            ctx.beginPath();
            ctx.ellipse(cx, cy - ry * 0.55, rx, ry * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(cx, cy + ry * 0.55, rx, ry * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(cx - ry * 0.55, cy, ry * 0.55, rx, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(cx + ry * 0.55, cy, ry * 0.55, rx, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Pusat Diamond
            const d = S * 0.08;
            ctx.beginPath();
            ctx.moveTo(cx, cy - d);
            ctx.lineTo(cx + d, cy);
            ctx.lineTo(cx, cy + d);
            ctx.lineTo(cx - d, cy);
            ctx.closePath();
            ctx.fill();

            // 4 Sudut Ubin
            const cornerR = S * 0.28;
            ctx.beginPath(); ctx.arc(0, 0, cornerR, 0, Math.PI / 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(S, 0, cornerR, Math.PI / 2, Math.PI); ctx.stroke();
            ctx.beginPath(); ctx.arc(S, S, cornerR, Math.PI, 3 * Math.PI / 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, S, cornerR, 3 * Math.PI / 2, Math.PI * 2); ctx.stroke();

            // Cecek Kawung
            const dots = [
                [cx, cy - ry * 0.7], [cx, cy - ry * 0.4],
                [cx, cy + ry * 0.4], [cx, cy + ry * 0.7],
                [cx - ry * 0.7, cy], [cx - ry * 0.4, cy],
                [cx + ry * 0.4, cy], [cx + ry * 0.7, cy]
            ];
            dots.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, strokeWidth * 0.9, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
        }

        case 'parang': {
            ctx.beginPath();
            ctx.moveTo(0, S);
            ctx.lineTo(S, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(S, S);
            ctx.stroke();

            const steps = 3;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = t * S;
                const py = (1 - t) * S;

                ctx.beginPath();
                ctx.moveTo(px - 15, py + 15);
                ctx.bezierCurveTo(px - 5, py - 5, px + 15, py - 10, px + 25, py);
                ctx.bezierCurveTo(px + 30, py + 10, px + 15, py + 20, px, py + 10);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(px + 10, py - 4);
                ctx.lineTo(px + 18, py + 2);
                ctx.lineTo(px + 12, py + 8);
                ctx.stroke();
            }

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = t * S;
                const py = t * S;

                ctx.beginPath();
                ctx.moveTo(px - 15, py - 15);
                ctx.bezierCurveTo(px - 5, py - 30, px + 15, py - 20, px + 20, py - 5);
                ctx.stroke();
            }
            break;
        }

        case 'ceplok': {
            ctx.beginPath();
            ctx.moveTo(cx, S * 0.08); ctx.lineTo(S * 0.92, cy); ctx.lineTo(cx, S * 0.92); ctx.lineTo(S * 0.08, cy); ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, S * 0.16, 0, Math.PI * 2);
            ctx.stroke();

            for (let a = 0; a < 8; a++) {
                const angle = (a * Math.PI) / 4;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const tipX = cx + cosA * S * 0.38;
                const tipY = cy + sinA * S * 0.38;

                const leftAngle = angle - 0.22;
                const rightAngle = angle + 0.22;
                const lx = cx + Math.cos(leftAngle) * S * 0.24;
                const ly = cy + Math.sin(leftAngle) * S * 0.24;
                const rx = cx + Math.cos(rightAngle) * S * 0.24;
                const ry = cy + Math.sin(rightAngle) * S * 0.24;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.quadraticCurveTo(lx, ly, tipX, tipY);
                ctx.quadraticCurveTo(rx, ry, cx, cy);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(cx, cy, strokeWidth * 1.5, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        case 'truntum': {
            const rStar = S * 0.18;
            ctx.beginPath();
            for (let i = 0; i < 16; i++) {
                const angle = (i * Math.PI) / 8;
                const dist = i % 2 === 0 ? rStar : rStar * 0.45;
                const px = cx + Math.cos(angle) * dist;
                const py = cy + Math.sin(angle) * dist;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, strokeWidth, 0, Math.PI * 2);
            ctx.fill();

            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4;
                const d1 = S * 0.28;
                const d2 = S * 0.36;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(angle) * d1, cy + Math.sin(angle) * d1, strokeWidth * 0.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + Math.cos(angle) * d2, cy + Math.sin(angle) * d2, strokeWidth * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        }

        case 'sidomukti': {
            ctx.beginPath();
            ctx.moveTo(cx, S * 0.08); ctx.lineTo(S * 0.92, cy); ctx.lineTo(cx, S * 0.92); ctx.lineTo(S * 0.08, cy); ctx.closePath();
            ctx.stroke();

            // Sayap
            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.bezierCurveTo(cx + S * 0.2, cy - S * 0.22, cx + S * 0.32, cy - S * 0.05, cx + S * 0.12, cy + 4);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy - 6);
            ctx.bezierCurveTo(cx - S * 0.2, cy - S * 0.22, cx - S * 0.32, cy - S * 0.05, cx - S * 0.12, cy + 4);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy + 4);
            ctx.bezierCurveTo(cx + S * 0.25, cy + S * 0.12, cx + S * 0.18, cy + S * 0.26, cx, cy + S * 0.18);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy + 4);
            ctx.bezierCurveTo(cx - S * 0.25, cy + S * 0.12, cx - S * 0.18, cy + S * 0.26, cx, cy + S * 0.18);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, strokeWidth * 1.2, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        case 'nitik': {
            const dOuter = S * 0.42;
            const dInner = S * 0.24;

            ctx.beginPath();
            ctx.moveTo(cx, cy - dOuter); ctx.lineTo(cx + dOuter, cy); ctx.lineTo(cx, cy + dOuter); ctx.lineTo(cx - dOuter, cy); ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy - dInner); ctx.lineTo(cx + dInner, cy); ctx.lineTo(cx, cy + dInner); ctx.lineTo(cx - dInner, cy); ctx.closePath();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx - S * 0.2, cy); ctx.lineTo(cx + S * 0.2, cy);
            ctx.moveTo(cx, cy - S * 0.2); ctx.lineTo(cx, cy + S * 0.2);
            ctx.stroke();

            const nitikDots = [
                [cx - S * 0.12, cy - S * 0.12], [cx + S * 0.12, cy - S * 0.12],
                [cx - S * 0.12, cy + S * 0.12], [cx + S * 0.12, cy + S * 0.12]
            ];
            nitikDots.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, strokeWidth * 0.8, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
        }

        default:
            break;
    }

    ctx.restore();
}
