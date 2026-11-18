export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 960;
export const CANVAS_TILE_SIZE = 160;

export const CANTING_SIZE = 3.5;
export const PENCIL_SIZE = 1.5;
export const PENCIL_COLOR = "#c9c9c9";

export const CANVAS_SYNC_CHUNK_SIZE = 6000;
export const CANVAS_SYNC_MAX_CHUNKS = 2000;
export const CANVAS_SYNC_TIMEOUT_MS = 15000;

export const DRAWING_DURATION_SECONDS = 90;

export const WAX_COLORS = [
    { name: "Emas tua", hex: "#CDB988" },
    { name: "Putih Mori", hex: "#FAF7F2" },
    { name: "Hijau Lumut", hex: "#566C60" },
    { name: "Cokelat Sogan", hex: "#322115" },
];

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
        desc: "Malam cair sedang dituangkan ke reservoir canting. Tunggu hingga pengisian selesai.",
        target: "tour-pouring-status",
    },
    {
        title: "11. Tutup Popup",
        desc: 'Canting sudah siap digunakan. Tekan "Tutup Popup" untuk kembali ke kanvas.',
        target: "tour-close-heating",
    },
    {
        title: "12. Lukis di Kanvas",
        desc: "Setelah malam siap, lukis pada kanvas mengikuti goresan pensil. Malam akan mengeras seiring waktu.",
        target: "tour-canvas",
    },
];

export const FIRST_POPUP_TUTORIAL_STEP = 6;
export const LAST_POPUP_TUTORIAL_STEP = 10;
