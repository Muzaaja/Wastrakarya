export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 960;
export const CANVAS_TILE_SIZE = 160;

export const shouldTileDrawingForMotif = (motifId, tileFreeDrawing = false) =>
    motifId === "polos" || motifId === "none"
        ? tileFreeDrawing
        : Boolean(motifId);

export const CANTING_SIZE = 3.5;
export const PENCIL_SIZE = 1.5;
export const PENCIL_COLOR = "#c9c9c9";

export const DRAWING_TOOLS = [
    {
        id: "canting",
        label: "Canting",
        image: "/canting.png",
        compactImageStyle: {
            width: 18,
            height: 18,
            transform: "translate(15px, -10px) scale(4) rotate(-55deg)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        },
        paletteImageStyle: {
            width: 24,
            height: 24,
            transform: "translateY(9px) scale(4.7) rotate(65deg)",
            filter: "drop-shadow(0 7px 8px rgba(0,0,0,0.38))",
        },
    },
    {
        id: "eraser",
        label: "Penghapus",
        image: "/penghapus.png",
        compactImageStyle: {
            width: 18,
            height: 18,
            transform: "translate(12px, -15px) scale(4) rotate(-70deg)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        },
        paletteImageStyle: {
            width: 24,
            height: 24,
            transform: "translateY(9px) scale(4.8) rotate(58deg)",
            filter: "drop-shadow(0 7px 8px rgba(0,0,0,0.38))",
        },
    },
    {
        id: "pencil",
        label: "Pensil",
        image: "/pensil.png",
        compactImageStyle: {
            width: 18,
            height: 18,
            transform: "translate(16px, -15px) scale(4) rotate(-90deg)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        },
        paletteImageStyle: {
            width: 24,
            height: 24,
            transform: "translateY(9px) scale(4.9) rotate(54deg)",
            filter: "drop-shadow(0 7px 8px rgba(0,0,0,0.38))",
        },
    },
];

export const CANVAS_SYNC_CHUNK_SIZE = 6000;
export const CANVAS_SYNC_MAX_CHUNKS = 2000;
export const CANVAS_SYNC_TIMEOUT_MS = 15000;

export const DRAWING_DURATION_SECONDS = 90;

export const FABRIC_BASE_COLOR = "#F5EFEB";
export const SAVED_CANVAS_IMAGE_TYPE = "image/webp";
export const SAVED_CANVAS_IMAGE_QUALITY = 0.92;

export const DYE_COLORS = [
    { name: "Biru Nila", hex: "#315B74" },
    { name: "Soga Jawa", hex: "#8A4B2A" },
    { name: "Merah Mengkudu", hex: "#963F43" },
    { name: "Hijau Tarum", hex: "#426B59" },
    { name: "Ungu Secang", hex: "#684B67" },
];

export const WAX_COLORS = [
    { name: "Emas tua", hex: "#CDB988" },
    { name: "Putih Mori", hex: "#FAF7F2" },
    { name: "Hijau Lumut", hex: "#566C60" },
    { name: "Cokelat Sogan", hex: "#322115" },
];

export const isWaxColorEditable = (malamState) =>
    malamState === "cold" || malamState === "hardened";

export const TUTORIAL_STEPS = [
    {
        title: "1. Gunakan Pensil",
        desc: "Pensil dipakai untuk menggambar garis panduan pada kanvas, yang mana digunakan sebagai acuan untuk nantinya dilukis dengan canting.",
        target: "tour-pencil",
    },
    {
        title: "2. Pilih Panduan Motif",
        desc: "Pilih salah satu motif dari Pakem Motif Batik di panel kanan. Panduan titik-titik akan muncul di kanvas sebagai acuan pola.",
        target: "tour-motif",
    },
    {
        title: "3. Gambar di Kanvas",
        desc: 'Ikuti panduan motif dengan pensil pada kanvas. Tekan "Selanjutnya" setelah selesai memberi panduan.',
        target: "tour-canvas",
    },
    {
        title: "4. Gunakan Canting",
        desc: "Canting dipakai untuk mengaplikasikan lilin malam cair di atas goresan pensil.",
        target: "tour-canting",
    },
    {
        title: "5. Pilih Warna Malam",
        desc: "Pilih warna malam yang diinginkan sebelum dipanaskan, karena warna akan terkunci saat malam dipanaskan.",
        target: "tour-color",
    },
    {
        title: "6. Lelehkan Malam",
        desc: 'Tekan "Lelehkan Malam" untuk membuka proses persiapan malam.',
        target: "tour-heat",
    },
    {
        title: "7. Masukkan Malam ke Kuali",
        desc: "Seret malam ke area bergaris di atas kuali. Anda juga dapat memilih malam lalu menekan Enter atau Spasi.",
        target: "tour-malam-transfer",
    },
    {
        title: "8. Nyalakan Api",
        desc: 'Setelah malam berada di dalam kuali, tekan "Nyalakan Api" untuk mulai melelehkannya.',
        target: "tour-ignite-fire",
    },
    {
        title: "9. Tunggu Malam Meleleh",
        desc: "Tunggu hingga proses pemanasan mencapai 100%. Tutorial akan berlanjut secara otomatis.",
        target: "tour-heating-progress",
    },
    {
        title: "10. Isi Canting",
        desc: "Malam cair sedang dituangkan ke canting. Tunggu hingga pengisian selesai.",
        target: "tour-pouring-status",
    },
    {
        title: "11. Tutup Popup",
        desc: 'Canting sudah siap digunakan.',
        target: "tour-close-heating",
    },
    {
        title: "12. Lukis di Kanvas",
        desc: 'Setelah malam siap, lukis pada kanvas mengikuti goresan pensil. Setelah selesai, tekan "Selanjutnya" untuk masuk ke proses Ngelir.',
        target: "tour-canvas",
    },
    {
        title: "13. Lakukan Proses Ngelir",
        desc: 'Tekan "Ngelir", pilih warna pencelupan, lalu celupkan, rendam, dan angkat kain hingga warna siap diterapkan ke kanvas.',
        target: "tour-dyeing",
    },
];

export const FIRST_POPUP_TUTORIAL_STEP = 6;
export const LAST_POPUP_TUTORIAL_STEP = 10;
