import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    Undo2, 
    Redo2, 
    Minus, 
    Plus, 
    Maximize2, 
    MoreHorizontal, 
    Search, 
    Heart, 
    Info, 
    Save, 
    Download, 
    Trash2, 
    Eye, 
    EyeOff, 
    Paintbrush, 
    Eraser, 
    Check, 
    Sparkles, 
    Grid, 
    Layers, 
    HelpCircle,
    X,
    Palette,
    SquareDashed,
    Shirt
} from 'lucide-react';
import { BATIK_MOTIFS, renderDottedGuide, autoTraceMotifWax } from '@/Components/WastraCanvas/BatikMotifs';
import { executeBatikFloodFill } from '@/Components/WastraCanvas/BatikFloodFill';

export default function WastraCanvas() {
    // Canvas ref & Context
    const canvasRef = useRef(null);
    const tileCanvasRef = useRef(null); // Offscreen canvas untuk unit tile batik (160x160)
    const containerRef = useRef(null);

    // Konfigurasi Kanvas
    const CANVAS_WIDTH = 960;
    const CANVAS_HEIGHT = 784;
    const [tileSize, setTileSize] = useState(160);

    // State Peralatan & Lilin Malam
    const [tool, setTool] = useState('canting'); // 'canting', 'kuas', 'penghapus'
    const [cantingSize, setCantingSize] = useState(12);
    const [waxColor, setWaxColor] = useState('#CDB988');
    const [waxColorName, setWaxColorName] = useState('Emas tua');

    // Preset Warna Malam
    const WAX_COLORS = [
        { name: 'Emas tua', hex: '#CDB988' },
        { name: 'Putih Mori', hex: '#FAF7F2' },
        { name: 'Hijau Lumut', hex: '#566C60' },
        { name: 'Cokelat Sogan', hex: '#322115' },
    ];

    // State Preset Motif Batik & Garis Panduan Titik-Titik
    // 'polos' = Tidak memakai preset pola sama sekali (kanvas polos/bebas)
    const [selectedMotif, setSelectedMotif] = useState('kawung');
    const [showGuide, setShowGuide] = useState(true);
    const [guideOpacity, setGuideOpacity] = useState(0.75);
    const [showTileGrid, setShowTileGrid] = useState(false);
    const [favorites, setFavorites] = useState(['kawung', 'parang']);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'favorites'
    const [searchQuery, setSearchQuery] = useState('');

    // State Zoom & Pan
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    // Drawing State
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef(null);
    const [cursorPos, setCursorPos] = useState(null);

    // History (Undo / Redo)
    const historyStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Status UI, Modal & Notifikasi
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Kanvas kosong. Mulai ceritamu dengan satu goresan.');
    const [toastMessage, setToastMessage] = useState(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showToolInfo, setShowToolInfo] = useState(false);
    const [detailMotifModal, setDetailMotifModal] = useState(null);
    const [projectTitle, setProjectTitle] = useState('Karya tanpa judul');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Helper Toast
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Filter motif berdasarkan pencarian & tab
    const filteredMotifs = BATIK_MOTIFS.filter((motif) => {
        const matchesSearch = motif.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              motif.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              motif.category.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'favorites') {
            return matchesSearch && favorites.includes(motif.id);
        }
        return matchesSearch;
    });

    const toggleFavorite = (id, e) => {
        e.stopPropagation();
        if (favorites.includes(id)) {
            setFavorites(favorites.filter(fav => fav !== id));
            showToast(`Motif dihapus dari Favorit`);
        } else {
            setFavorites([...favorites, id]);
            showToast(`Motif ditambahkan ke Favorit`);
        }
    };

    // Inisialisasi Offscreen Tile Canvas (160x160 px)
    useEffect(() => {
        if (!tileCanvasRef.current) {
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = tileSize;
            tileCanvas.height = tileSize;
            tileCanvasRef.current = tileCanvas;
        } else if (tileCanvasRef.current.width !== tileSize) {
            const oldCanvas = tileCanvasRef.current;
            const newCanvas = document.createElement('canvas');
            newCanvas.width = tileSize;
            newCanvas.height = tileSize;
            const nCtx = newCanvas.getContext('2d');
            nCtx.drawImage(oldCanvas, 0, 0, tileSize, tileSize);
            tileCanvasRef.current = newCanvas;
        }
        renderMainCanvas();
    }, [tileSize]);

    // Simpan Snapshot ke Undo History
    const saveStateToHistory = () => {
        if (!tileCanvasRef.current) return;
        const ctx = tileCanvasRef.current.getContext('2d');
        const imgData = ctx.getImageData(0, 0, tileSize, tileSize);
        historyStackRef.current.push(imgData);
        if (historyStackRef.current.length > 30) {
            historyStackRef.current.shift();
        }
        redoStackRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
        setHasUnsavedChanges(true);
    };

    // Undo Action
    const handleUndo = () => {
        if (historyStackRef.current.length === 0 || !tileCanvasRef.current) return;
        const ctx = tileCanvasRef.current.getContext('2d');
        const currentState = ctx.getImageData(0, 0, tileSize, tileSize);
        redoStackRef.current.push(currentState);

        const prevState = historyStackRef.current.pop();
        ctx.putImageData(prevState, 0, 0);

        setCanUndo(historyStackRef.current.length > 0);
        setCanRedo(true);
        renderMainCanvas();
        showToast('Tindakan dibatalkan (Undo)');
    };

    // Redo Action
    const handleRedo = () => {
        if (redoStackRef.current.length === 0 || !tileCanvasRef.current) return;
        const ctx = tileCanvasRef.current.getContext('2d');
        const currentState = ctx.getImageData(0, 0, tileSize, tileSize);
        historyStackRef.current.push(currentState);

        const nextState = redoStackRef.current.pop();
        ctx.putImageData(nextState, 0, 0);

        setCanUndo(true);
        setCanRedo(redoStackRef.current.length > 0);
        renderMainCanvas();
        showToast('Tindakan dipulihkan (Redo)');
    };

    // Bersihkan Kanvas
    const handleClearCanvas = () => {
        if (!tileCanvasRef.current) return;
        saveStateToHistory();
        const ctx = tileCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, tileSize, tileSize);
        renderMainCanvas();
        setStatusMessage('Kanvas dibersihkan. Siap untuk goresan baru.');
        showToast('Kanvas telah dibersihkan');
        setShowMoreMenu(false);
    };

    // Jiplak Pola Otomatis Menggunakan Lilin Malam
    const handleAutoTrace = () => {
        if (!tileCanvasRef.current || !selectedMotif || selectedMotif === 'polos' || selectedMotif === 'none') {
            showToast('Pilih salah satu motif pakem di panel kanan terlebih dahulu');
            setShowMoreMenu(false);
            return;
        }
        saveStateToHistory();
        const ctx = tileCanvasRef.current.getContext('2d');
        autoTraceMotifWax(ctx, selectedMotif, tileSize, waxColor, cantingSize);
        renderMainCanvas();
        setStatusMessage(`Pola ${selectedMotif} berhasil dijiplak dengan lilin malam.`);
        showToast(`Pola ${selectedMotif} berhasil dijiplak!`);
        setShowMoreMenu(false);
    };

    // Simpan Karya ke LocalStorage
    const handleSave = () => {
        if (!tileCanvasRef.current) return;
        try {
            const dataUrl = tileCanvasRef.current.toDataURL();
            const projectData = {
                title: projectTitle,
                motif: selectedMotif,
                waxColor,
                waxColorName,
                cantingSize,
                tileSize,
                dataUrl,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('wastrakarya_studio_save', JSON.stringify(projectData));
            setHasUnsavedChanges(false);
            showToast('Karya berhasil disimpan ke Studio!');
        } catch (e) {
            console.error(e);
            showToast('Gagal menyimpan ke penyimpanan lokal');
        }
    };

    // Unduh Hasil Kain Batik Penuh (PNG 960x784)
    const handleExportFullFabric = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = `${projectTitle.toLowerCase().replace(/\s+/g, '-')}-kain-batik.png`;
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
        showToast('Kain batik berhasil diunduh (PNG)');
        setShowMoreMenu(false);
    };

    // Unduh Ubin Pola Seamless (Tile PNG)
    const handleExportTile = () => {
        if (!tileCanvasRef.current) return;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = tileSize;
        exportCanvas.height = tileSize;
        const eCtx = exportCanvas.getContext('2d');
        eCtx.fillStyle = '#F5EFEB';
        eCtx.fillRect(0, 0, tileSize, tileSize);
        eCtx.drawImage(tileCanvasRef.current, 0, 0);

        const link = document.createElement('a');
        link.download = `pola-seamless-${selectedMotif || 'bebas'}-${tileSize}px.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
        showToast('Pola seamless ubin berhasil diunduh (PNG)');
        setShowMoreMenu(false);
    };

    // Render Utama Kanvas (Kain Mori + Garis Panduan Titik-Titik + Tiled Wax Painting)
    const renderMainCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const tileCanvas = tileCanvasRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Transformasi Pan & Zoom
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        // 1. Latar Kain Mori Khas Batik (Warna Krem Halus & Tekstur Tenun Serat)
        ctx.fillStyle = '#F5EFEB';
        ctx.fillRect(-CANVAS_WIDTH, -CANVAS_HEIGHT, CANVAS_WIDTH * 3, CANVAS_HEIGHT * 3);

        // Tekstur Tenun Halus Kain Mori
        ctx.fillStyle = 'rgba(0, 0, 0, 0.012)';
        for (let x = 0; x < CANVAS_WIDTH; x += 4) {
            ctx.fillRect(x, 0, 1, CANVAS_HEIGHT);
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
            ctx.fillRect(0, y, CANVAS_WIDTH, 1);
        }

        // Hitung jangkauan ubin yang terlihat dalam kanvas
        const minCol = Math.floor((-pan.x / zoom - tileSize) / tileSize) - 1;
        const maxCol = Math.ceil(((CANVAS_WIDTH - pan.x) / zoom + tileSize) / tileSize) + 1;
        const minRow = Math.floor((-pan.y / zoom - tileSize) / tileSize) - 1;
        const maxRow = Math.ceil(((CANVAS_HEIGHT - pan.y) / zoom + tileSize) / tileSize) + 1;

        // 2. Garis Panduan Titik-Titik (Hanya jika preset pola dipilih dan BUKAN 'polos')
        if (showGuide && selectedMotif && selectedMotif !== 'polos' && selectedMotif !== 'none') {
            for (let c = minCol; c <= maxCol; c++) {
                for (let r = minRow; r <= maxRow; r++) {
                    ctx.save();
                    ctx.translate(c * tileSize, r * tileSize);
                    renderDottedGuide(ctx, selectedMotif, tileSize, guideOpacity);
                    ctx.restore();
                }
            }
        }

        // 3. Tiling Hasil Lukisan Malam Secara Infinite
        if (tileCanvas) {
            const pattern = ctx.createPattern(tileCanvas, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                const startX = minCol * tileSize;
                const startY = minRow * tileSize;
                const w = (maxCol - minCol + 1) * tileSize;
                const h = (maxRow - minRow + 1) * tileSize;
                ctx.fillRect(startX, startY, w, h);
            }
        }

        // 4. Garis Batas Ubin (Jika Diaktifkan)
        if (showTileGrid) {
            ctx.save();
            ctx.strokeStyle = 'rgba(164, 140, 92, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            for (let c = minCol; c <= maxCol; c++) {
                ctx.beginPath();
                ctx.moveTo(c * tileSize, minRow * tileSize);
                ctx.lineTo(c * tileSize, (maxRow + 1) * tileSize);
                ctx.stroke();
            }
            for (let r = minRow; r <= maxRow; r++) {
                ctx.beginPath();
                ctx.moveTo(minCol * tileSize, r * tileSize);
                ctx.lineTo((maxCol + 1) * tileSize, r * tileSize);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.restore();
    }, [pan, zoom, tileSize, showGuide, selectedMotif, guideOpacity, showTileGrid]);

    useEffect(() => {
        renderMainCanvas();
    }, [renderMainCanvas]);

    // Goresan Stamp Lilin Malam dengan 9-Patch Bleed Seamless Wrapping
    const drawStamp = (tx, ty, r, currentTool, color) => {
        if (!tileCanvasRef.current) return;
        const ctx = tileCanvasRef.current.getContext('2d');
        const S = tileSize;

        ctx.save();
        if (currentTool === 'penghapus') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = color;
        }

        // 9-Patch Bleed Wrapping: Jika goresan menyentuh tepi ubin, menembus mulus ke sisi seberang
        const xOffsets = [0];
        if (tx - r < 0) xOffsets.push(S);
        if (tx + r > S) xOffsets.push(-S);

        const yOffsets = [0];
        if (ty - r < 0) yOffsets.push(S);
        if (ty + r > S) yOffsets.push(-S);

        xOffsets.forEach((ox) => {
            yOffsets.forEach((oy) => {
                ctx.beginPath();
                ctx.arc(tx + ox, ty + oy, r, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        ctx.restore();
    };

    // Interpolasi Goresan Antar Dua Titik agar Halus dan Bebas Putus
    const drawLineBetween = (p1, p2) => {
        const S = tileSize;
        const r = tool === 'kuas' ? (cantingSize * 1.5) / 2 : cantingSize / 2;
        const color = waxColor;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const stepSize = Math.max(1, r / 3);
        const steps = Math.ceil(dist / stepSize);

        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const wx = p1.x + dx * t;
            const wy = p1.y + dy * t;

            const tx = ((wx % S) + S) % S;
            const ty = ((wy % S) + S) % S;

            drawStamp(tx, ty, r, tool, color);
        }
    };

    // Konversi Posisi Layar ke Titik Dunia Kanvas dengan Validasi Batas Kain
    const getCanvasCoords = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();

        // Skala perbandingan resolusi internal (960x784) dengan ukuran CSS
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const screenX = (e.clientX - rect.left) * scaleX;
        const screenY = (e.clientY - rect.top) * scaleY;

        // Cek ketat apakah berada dalam bidang kain kanvas
        const isInside = screenX >= 0 && screenX <= CANVAS_WIDTH && screenY >= 0 && screenY <= CANVAS_HEIGHT;

        // Clamp posisi ke dalam bidang kanvas agar goresan tidak bocor keluar kain
        const clampedScreenX = Math.max(0, Math.min(CANVAS_WIDTH, screenX));
        const clampedScreenY = Math.max(0, Math.min(CANVAS_HEIGHT, screenY));

        const worldX = (clampedScreenX - pan.x) / zoom;
        const worldY = (clampedScreenY - pan.y) / zoom;

        return { x: worldX, y: worldY, isInside, screenX, screenY };
    };

    // Pointer Event Handlers KHUSUS pada Elemen <canvas> (Mencegah sentuhan di luar kanvas ikut melukis)
    const handleCanvasPointerDown = (e) => {
        // Tombol tengah / Alt / Spasi -> Panning
        if (e.button === 1 || e.spaceKey || e.altKey) {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            return;
        }

        if (e.button !== 0 && e.pointerType === 'mouse') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        // PERLINDUNGAN UTAMA: Tolak sentuhan/klik jika terjadi di luar batas kanvas kain
        if (
            e.clientX < rect.left || 
            e.clientX > rect.right || 
            e.clientY < rect.top || 
            e.clientY > rect.bottom
        ) {
            return;
        }

        const pos = getCanvasCoords(e);
        if (!pos || !pos.isInside) return;

        // FUNGSI KUAS (FLOOD FILL / NEMBOK): Mengisi area tertutup dengan warna malam yang dipilih
        if (tool === 'kuas') {
            saveStateToHistory();
            const filled = executeBatikFloodFill(
                tileCanvasRef.current,
                pos.x,
                pos.y,
                tileSize,
                waxColor,
                selectedMotif,
                autoTraceMotifWax
            );
            if (filled) {
                renderMainCanvas();
                setStatusMessage(`Area berhasil diisi warna malam ${waxColorName} (Nembok / Flood Fill).`);
                showToast(`Area terisi warna ${waxColorName}`);
            }
            return;
        }

        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}

        saveStateToHistory();
        isDrawingRef.current = true;
        lastPosRef.current = pos;

        drawLineBetween(pos, pos);
        const motifLabel = selectedMotif && selectedMotif !== 'polos' ? `motif ${selectedMotif}` : 'bebas';
        setStatusMessage(`Sedang melukis ${motifLabel} dengan ${tool === 'canting' ? 'Canting' : 'Penghapus'} (${cantingSize} px)...`);
        renderMainCanvas();
    };

    const handleCanvasPointerMove = (e) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y
            });
            return;
        }

        const currentPos = getCanvasCoords(e);
        if (!currentPos) return;
        setCursorPos(currentPos);

        if (tool === 'kuas' || !isDrawingRef.current || !lastPosRef.current) return;

        // Jika stylus/kursor melayang terlalu jauh dari kanvas, hentikan goresan
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            if (
                e.clientX < rect.left - 12 || 
                e.clientX > rect.right + 12 || 
                e.clientY < rect.top - 12 || 
                e.clientY > rect.bottom + 12
            ) {
                isDrawingRef.current = false;
                lastPosRef.current = null;
                return;
            }
        }

        drawLineBetween(lastPosRef.current, currentPos);
        lastPosRef.current = currentPos;
        renderMainCanvas();
    };

    const handleCanvasPointerUp = (e) => {
        if (isPanning) {
            setIsPanning(false);
        }
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            lastPosRef.current = null;
            setStatusMessage(`Goresan malam diterapkan. Men-tiling secara infinite.`);
        }
        try {
            if (e && e.currentTarget && e.pointerId) {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        } catch (_) {}
    };

    // Handler Pointer Down di Area Luar Kanvas (Container Background) - HANYA untuk Panning
    const handleContainerPointerDown = (e) => {
        if (e.target !== canvasRef.current) {
            // Jika mengklik background di luar kanvas, hanya aktifkan pan jika drag
            if (e.button === 0 || e.button === 1 || e.spaceKey || e.altKey) {
                setIsPanning(true);
                panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            }
        }
    };

    // Global Pointer Up listener agar tidak macet
    useEffect(() => {
        const handleGlobalUp = () => {
            if (isDrawingRef.current) {
                isDrawingRef.current = false;
                lastPosRef.current = null;
            }
            if (isPanning) {
                setIsPanning(false);
            }
        };
        window.addEventListener('pointerup', handleGlobalUp);
        return () => window.removeEventListener('pointerup', handleGlobalUp);
    }, [isPanning]);

    // Keyboard Shortcuts (C = Canting, B = Kuas, E = Penghapus, Ctrl+Z / Ctrl+Y)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleRedo();
            } else if (e.key.toLowerCase() === 'c') {
                setTool('canting');
                showToast('Alat: Canting');
            } else if (e.key.toLowerCase() === 'b') {
                setTool('kuas');
                showToast('Alat: Kuas');
            } else if (e.key.toLowerCase() === 'e') {
                setTool('penghapus');
                showToast('Alat: Penghapus');
            } else if (e.key === '=' || e.key === '+') {
                handleZoomIn();
            } else if (e.key === '-' || e.key === '_') {
                handleZoomOut();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo]);

    // Zoom Controls
    const handleZoomIn = () => {
        setZoom(prev => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(0.4, Math.round((prev - 0.15) * 100) / 100));
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        showToast('Tampilan dikembalikan ke 100%');
    };

    // Pulihkan Karya dari LocalStorage saat Awal
    useEffect(() => {
        try {
            const saved = localStorage.getItem('wastrakarya_studio_save');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.title) setProjectTitle(data.title);
                if (data.motif) setSelectedMotif(data.motif);
                if (data.waxColor) setWaxColor(data.waxColor);
                if (data.waxColorName) setWaxColorName(data.waxColorName);
                if (data.cantingSize) setCantingSize(data.cantingSize);
                if (data.tileSize) setTileSize(data.tileSize);

                if (data.dataUrl && tileCanvasRef.current) {
                    const img = new Image();
                    img.onload = () => {
                        const ctx = tileCanvasRef.current.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        renderMainCanvas();
                    };
                    img.src = data.dataUrl;
                }
            }
        } catch (err) {
            console.error('Error loading saved canvas', err);
        }
    }, []);

    return (
        <div className="flex flex-col h-screen w-screen bg-[#07130E] text-[#D8C7A5] select-none font-sans overflow-hidden">
            <Head title="Wastrakarya Studio - Ruang Kreasi Melukis Batik" />

            {/* TOAST NOTIFIKASI */}
            {toastMessage && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#162B21] border border-[#CDB988]/60 text-[#F5EFEB] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm backdrop-blur-md transition-all">
                    <Sparkles size={16} className="text-[#CDB988]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* MODAL DETAIL FILOSOFI MOTIF */}
            {detailMotifModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0B1813] border border-[#2A473A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#D8C7A5]">
                        <button
                            onClick={() => setDetailMotifModal(null)}
                            className="absolute top-4 right-4 text-[#7E9385] hover:text-[#F5EFEB] transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl bg-[#08130E] border border-[#182C24] flex items-center justify-center p-2">
                                {detailMotifModal.svgIcon}
                            </div>
                            <div>
                                <h3 className="font-heading text-2xl font-bold text-[#E2CEAB]">{detailMotifModal.name}</h3>
                                <p className="text-xs text-[#7E9385]">{detailMotifModal.origin} · {detailMotifModal.category}</p>
                            </div>
                        </div>
                        <div className="bg-[#08130E] border border-[#182C24] rounded-xl p-4 mb-5 text-sm leading-relaxed text-[#BACDC2]">
                            <p className="font-medium text-[#E2CEAB] mb-1">Makna & Filosofi:</p>
                            {detailMotifModal.description}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    if (detailMotifModal.id === 'polos') {
                                        setSelectedMotif('polos');
                                        setShowGuide(false);
                                        setDetailMotifModal(null);
                                        showToast(`Mode Kanvas Polos (Tanpa Panduan) aktif`);
                                    } else {
                                        setSelectedMotif(detailMotifModal.id);
                                        setShowGuide(true);
                                        setDetailMotifModal(null);
                                        showToast(`Panduan pola ${detailMotifModal.name} diaktifkan`);
                                    }
                                }}
                                className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-xs px-5 py-2.5 rounded-xl transition-all"
                            >
                                Gunakan Mode Ini
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOP BAR / NAVBAR HEADER */}
            <header className="h-16 px-6 bg-[#091611] border-b border-[#182C24] flex items-center justify-between shrink-0 z-30">
                {/* Logo & Judul Studio */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-baseline gap-2 group">
                        <span className="font-heading text-2xl font-bold tracking-wide text-[#E2CEAB] group-hover:text-[#F3E5C8] transition-colors">
                            Wastrakarya
                        </span>
                        <span className="text-[10px] tracking-widest text-[#7E9385] font-semibold uppercase">
                            STUDIO
                        </span>
                    </Link>
                </div>

                {/* Status Dokumen & Nama Proyek */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0E1E18] border border-[#1E362C] flex items-center justify-center text-[#CDB988]">
                        <Layers size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#F5EFEB]">Ruang Kreasi</span>
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                autoFocus
                                className="bg-[#0B1813] border border-[#CDB988]/40 text-xs text-[#BACDC2] px-1.5 py-0.5 rounded outline-none w-48"
                            />
                        ) : (
                            <span 
                                onClick={() => setIsEditingTitle(true)}
                                title="Klik untuk mengubah nama karya"
                                className="text-xs text-[#7E9385] hover:text-[#CDB988] cursor-pointer transition-colors"
                            >
                                {projectTitle}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status Simpan & Tombol Aksi */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-[#7E9385] mr-2">
                        {hasUnsavedChanges ? 'Perubahan belum disimpan' : 'Perubahan tersimpan'}
                    </span>
                    <button
                        onClick={handleSave}
                        className="bg-[#D5BD8A] hover:bg-[#C4AC79] active:scale-95 text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all duration-150 flex items-center gap-2"
                    >
                        <Save size={15} />
                        <span>Simpan</span>
                    </button>
                    <Link
                        href="/mockup"
                        onClick={handleSave}
                        title="Lihat simulasi 3D desain batik pada kemeja"
                        className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2"
                    >
                        <Shirt size={15} className="text-[#CDB988]" />
                        <span>Simulasi 3D</span>
                    </Link>
                </div>
            </header>

            {/* MAIN WORKSPACE LAYOUT (3 KOLOM) */}
            <div className="flex flex-1 overflow-hidden p-3 gap-3">
                {/* 1. PANEL SEBELAH KIRI (PERALATAN, WARNA MALAM, UKURAN CANTING) */}
                <aside className="w-64 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-lg">
                    <div className="flex flex-col gap-5">
                        {/* Bagian: Peralatan */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-heading font-semibold text-lg text-[#E2CEAB]">Peralatan</h3>
                            </div>
                            <p className="text-[10px] tracking-wider font-semibold text-[#7E9385] uppercase mb-3">
                                PILIH ALAT GAMBAR
                            </p>

                            <div className="flex flex-col gap-2">
                                {/* Alat: Canting */}
                                <button
                                    onClick={() => setTool('canting')}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                                        tool === 'canting'
                                            ? 'bg-[#142920] border-[#CDB988] text-[#F5EFEB] shadow-sm'
                                            : 'bg-[#08130E] border-[#182C24] text-[#9CB0A4] hover:border-[#2A473A] hover:text-[#E2CEAB]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 4l-9 9m0 0l-3-1m3 1l-1 3" />
                                            <path d="M15 3a2 2 0 0 1 3 3l-1 1-3-3 1-1z" />
                                            <circle cx="6" cy="18" r="2" />
                                        </svg>
                                        <span className="font-medium">Canting</span>
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setShowToolInfo(!showToolInfo); }}
                                            className="text-[#7E9385] hover:text-[#CDB988] transition-colors"
                                            title="Info Canting"
                                        >
                                            <Info size={13} />
                                        </button>
                                    </div>
                                    <span className="text-[11px] text-[#7E9385] font-mono px-1.5 py-0.5 rounded bg-[#091510] border border-[#162720]">
                                        C
                                    </span>
                                </button>

                                {/* Tooltip Info Canting */}
                                {showToolInfo && (
                                    <div className="p-2.5 bg-[#12231B] border border-[#CDB988]/30 rounded-xl text-xs text-[#D8C7A5] leading-relaxed">
                                        <strong>Canting:</strong> Alat tradisional penampung lilin malam panas untuk melukis goresan motif batik secara presisi di atas kain mori.
                                    </div>
                                )}

                                {/* Alat: Kuas (Flood Fill) */}
                                <button
                                    onClick={() => {
                                        setTool('kuas');
                                        showToast('Alat: Kuas (Flood Fill / Nembok)');
                                        setStatusMessage('Alat Kuas aktif. Klik pada area tertutup untuk mengisi warna (Flood Fill / Nembok).');
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                                        tool === 'kuas'
                                            ? 'bg-[#142920] border-[#CDB988] text-[#F5EFEB] shadow-sm'
                                            : 'bg-[#08130E] border-[#182C24] text-[#9CB0A4] hover:border-[#2A473A] hover:text-[#E2CEAB]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Paintbrush size={16} />
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-medium">Kuas</span>
                                            <span className="text-[10px] text-[#7E9385] font-normal">Fill</span>
                                        </div>
                                    </div>
                                    <span className="text-[11px] text-[#7E9385] font-mono px-1.5 py-0.5 rounded bg-[#091510] border border-[#162720]">
                                        B
                                    </span>
                                </button>

                                {/* Alat: Penghapus */}
                                <button
                                    onClick={() => setTool('penghapus')}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all ${
                                        tool === 'penghapus'
                                            ? 'bg-[#142920] border-[#CDB988] text-[#F5EFEB] shadow-sm'
                                            : 'bg-[#08130E] border-[#182C24] text-[#9CB0A4] hover:border-[#2A473A] hover:text-[#E2CEAB]'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Eraser size={16} />
                                        <span className="font-medium">Penghapus</span>
                                    </div>
                                    <span className="text-[11px] text-[#7E9385] font-mono px-1.5 py-0.5 rounded bg-[#091510] border border-[#162720]">
                                        E
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#182C24] my-1" />

                        {/* Bagian: Warna Malam */}
                        <div>
                            <h4 className="text-sm font-medium text-[#E2CEAB] mb-3">Warna Malam</h4>
                            <div className="flex items-center gap-3 mb-3">
                                {WAX_COLORS.map((swatch) => {
                                    const isSelected = waxColor.toLowerCase() === swatch.hex.toLowerCase();
                                    return (
                                        <button
                                            key={swatch.hex}
                                            onClick={() => {
                                                setWaxColor(swatch.hex);
                                                setWaxColorName(swatch.name);
                                            }}
                                            style={{ backgroundColor: swatch.hex }}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center relative ${
                                                isSelected 
                                                    ? 'border-[#E2CEAB] scale-110 shadow-md ring-2 ring-[#CDB988]/40' 
                                                    : 'border-[#182C24] hover:scale-105'
                                            }`}
                                            title={swatch.name}
                                        >
                                            {isSelected && (
                                                <Check 
                                                    size={14} 
                                                    className={swatch.hex === '#FAF7F2' ? 'text-black' : 'text-white'} 
                                                    strokeWidth={3} 
                                                />
                                            )}
                                        </button>
                                    );
                                })}

                                {/* Custom Color Picker */}
                                <label 
                                    className="w-8 h-8 rounded-full border-2 border-[#182C24] hover:border-[#CDB988] flex items-center justify-center cursor-pointer text-[#7E9385] hover:text-[#E2CEAB] transition-colors"
                                    title="Pilih warna kustom"
                                >
                                    <Palette size={14} />
                                    <input
                                        type="color"
                                        value={waxColor}
                                        onChange={(e) => {
                                            setWaxColor(e.target.value);
                                            setWaxColorName('Kustom');
                                        }}
                                        className="sr-only"
                                    />
                                </label>
                            </div>

                            {/* Label & Hex Warna Terpilih */}
                            <div className="flex items-center justify-between text-xs text-[#9CB0A4]">
                                <span>{waxColorName}</span>
                                <span className="font-mono text-[11px] text-[#7E9385] uppercase">{waxColor}</span>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-[#182C24] my-1" />

                        {/* Bagian: Ukuran Canting */}
                        <div>
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-medium text-[#E2CEAB]">Ukuran Canting</span>
                                <span className="font-semibold text-[#D5BD8A]">{cantingSize} px</span>
                            </div>

                            <input
                                type="range"
                                min="1"
                                max="48"
                                value={cantingSize}
                                onChange={(e) => setCantingSize(Number(e.target.value))}
                                className="w-full h-1.5 bg-[#182C24] rounded-lg appearance-none cursor-pointer accent-[#D5BD8A]"
                            />

                            <div className="flex items-center justify-between text-[11px] text-[#7E9385] mt-1.5">
                                <span>1 px</span>
                                <span>48 px</span>
                            </div>
                        </div>
                    </div>

                    {/* Informasi Footer Kiri */}
                    <div className="pt-3 border-t border-[#182C24] text-[10px] text-[#5C7265] tracking-wider uppercase font-semibold">
                        WASTRAKARYA STUDIO
                    </div>
                </aside>

                {/* 2. PANEL TENGAH (KANVAS LUKIS BATIK DENGAN INFINITE TILING) */}
                <main className="flex-1 flex flex-col bg-[#08140F] border border-[#182C24] rounded-2xl p-3 shadow-xl overflow-hidden relative">
                    {/* Header Bar Kanvas */}
                    <div className="flex items-center justify-between pb-3 shrink-0">
                        {/* Info Kain */}
                        <div className="flex items-baseline gap-3">
                            <h2 className="font-heading text-xl font-bold text-[#E2CEAB]">Kain baru</h2>
                            <span className="text-xs text-[#7E9385]">120 × 100 cm</span>
                        </div>

                        {/* Toolbar Aksi Atas */}
                        <div className="bg-[#0B1712] border border-[#182C24] rounded-xl px-3 py-1.5 flex items-center gap-3 text-[#9CB0A4] shadow-sm">
                            {/* Undo */}
                            <button
                                onClick={handleUndo}
                                disabled={!canUndo}
                                title="Batalkan (Ctrl+Z)"
                                className={`p-1 rounded hover:bg-[#162B21] transition-colors ${
                                    canUndo ? 'text-[#E2CEAB] cursor-pointer' : 'opacity-40 cursor-not-allowed'
                                }`}
                            >
                                <Undo2 size={16} />
                            </button>

                            {/* Redo */}
                            <button
                                onClick={handleRedo}
                                disabled={!canRedo}
                                title="Ulangi (Ctrl+Y)"
                                className={`p-1 rounded hover:bg-[#162B21] transition-colors ${
                                    canRedo ? 'text-[#E2CEAB] cursor-pointer' : 'opacity-40 cursor-not-allowed'
                                }`}
                            >
                                <Redo2 size={16} />
                            </button>

                            <div className="w-px h-4 bg-[#182C24]" />

                            {/* Zoom Out */}
                            <button
                                onClick={handleZoomOut}
                                title="Perkecil (-)"
                                className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                            >
                                <Minus size={15} />
                            </button>

                            {/* Indikator Zoom */}
                            <button 
                                onClick={handleResetZoom}
                                title="Kembalikan ke 100%"
                                className="text-xs font-mono font-medium text-[#E2CEAB] min-w-12 text-center hover:underline"
                            >
                                {Math.round(zoom * 100)}%
                            </button>

                            {/* Zoom In */}
                            <button
                                onClick={handleZoomIn}
                                title="Perbesar (+)"
                                className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                            >
                                <Plus size={15} />
                            </button>

                            <div className="w-px h-4 bg-[#182C24]" />

                            {/* Reset Zoom & Fit */}
                            <button
                                onClick={handleResetZoom}
                                title="Pusatkan Tampilan"
                                className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                            >
                                <Maximize2 size={15} />
                            </button>

                            {/* Menu Opsi Lainnya */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                    title="Opsi Kanvas Lainnya"
                                    className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                                >
                                    <MoreHorizontal size={16} />
                                </button>

                                {/* Dropdown Menu Opsi */}
                                {showMoreMenu && (
                                    <div className="absolute right-0 top-8 w-60 bg-[#0E1F18] border border-[#223E31] rounded-xl shadow-2xl py-2 z-40 text-xs text-[#D8C7A5]">
                                        <button
                                            onClick={handleAutoTrace}
                                            disabled={!selectedMotif || selectedMotif === 'polos'}
                                            className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 ${
                                                selectedMotif && selectedMotif !== 'polos'
                                                    ? 'hover:bg-[#183327] text-[#E2CEAB]'
                                                    : 'opacity-40 cursor-not-allowed text-[#7E9385]'
                                            }`}
                                        >
                                            <Sparkles size={14} className="text-[#CDB988]" />
                                            <span>Jiplak Pola Otomatis (Lilin)</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedMotif('polos');
                                                setShowGuide(false);
                                                setShowMoreMenu(false);
                                                showToast('Mode Kanvas Polos (Tanpa Panduan) aktif');
                                            }}
                                            className="w-full px-3.5 py-2 text-left hover:bg-[#183327] flex items-center gap-2.5"
                                        >
                                            <SquareDashed size={14} />
                                            <span>Pakai Kanvas Polos (Tanpa Pola)</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowGuide(!showGuide);
                                                setShowMoreMenu(false);
                                            }}
                                            disabled={!selectedMotif || selectedMotif === 'polos'}
                                            className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 ${
                                                selectedMotif && selectedMotif !== 'polos'
                                                    ? 'hover:bg-[#183327]'
                                                    : 'opacity-40 cursor-not-allowed'
                                            }`}
                                        >
                                            {showGuide ? <EyeOff size={14} /> : <Eye size={14} />}
                                            <span>{showGuide ? 'Sembunyikan Panduan' : 'Tampilkan Panduan'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowTileGrid(!showTileGrid);
                                                setShowMoreMenu(false);
                                            }}
                                            className="w-full px-3.5 py-2 text-left hover:bg-[#183327] flex items-center gap-2.5"
                                        >
                                            <Grid size={14} />
                                            <span>{showTileGrid ? 'Sembunyikan Grid Ubin' : 'Tampilkan Grid Ubin'}</span>
                                        </button>
                                        <div className="h-px bg-[#182C24] my-1" />
                                        <Link
                                            href="/mockup"
                                            onClick={handleSave}
                                            className="w-full px-3.5 py-2 text-left hover:bg-[#183327] flex items-center gap-2.5 text-[#E2CEAB]"
                                        >
                                            <Shirt size={14} className="text-[#CDB988]" />
                                            <span>Lihat Mockup 3D Kemeja</span>
                                        </Link>
                                        <button
                                            onClick={handleExportFullFabric}
                                            className="w-full px-3.5 py-2 text-left hover:bg-[#183327] flex items-center gap-2.5"
                                        >
                                            <Download size={14} />
                                            <span>Unduh Kain Penuh (PNG)</span>
                                        </button>
                                        <button
                                            onClick={handleExportTile}
                                            className="w-full px-3.5 py-2 text-left hover:bg-[#183327] flex items-center gap-2.5"
                                        >
                                            <Layers size={14} />
                                            <span>Unduh Ubin Seamless (PNG)</span>
                                        </button>
                                        <div className="h-px bg-[#182C24] my-1" />
                                        <button
                                            onClick={handleClearCanvas}
                                            className="w-full px-3.5 py-2 text-left hover:bg-red-950/40 text-red-300 flex items-center gap-2.5"
                                        >
                                            <Trash2 size={14} />
                                            <span>Bersihkan Kanvas</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AREA KANVAS KAIN MORI (WORKSPACE DENGAN INFINITE TILING) */}
                    <div 
                        ref={containerRef}
                        className="flex-1 bg-[#06100B] border border-[#182C24] rounded-xl overflow-hidden relative flex items-center justify-center shadow-inner cursor-default"
                        onPointerDown={handleContainerPointerDown}
                        onPointerMove={(e) => {
                            if (isPanning) {
                                setPan({
                                    x: e.clientX - panStartRef.current.x,
                                    y: e.clientY - panStartRef.current.y
                                });
                            }
                        }}
                        onPointerUp={() => {
                            if (isPanning) setIsPanning(false);
                        }}
                        style={{ touchAction: 'none' }}
                    >
                        {/* ELEMEN KANVAS UTAMA: Seluruh event goresan hanya terpasang langsung di sini */}
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_WIDTH}
                            height={CANVAS_HEIGHT}
                            onPointerDown={handleCanvasPointerDown}
                            onPointerMove={handleCanvasPointerMove}
                            onPointerUp={handleCanvasPointerUp}
                            className={`max-h-full max-w-full object-contain rounded shadow-2xl ${
                                tool === 'kuas' ? 'cursor-cell' : 'cursor-crosshair'
                            }`}
                        />

                        {/* Floating Control: Status Panduan Pola atau Mode Kanvas Polos */}
                        {selectedMotif && selectedMotif !== 'polos' ? (
                            <div className="absolute top-4 right-4 bg-[#091611]/90 backdrop-blur-md border border-[#182C24] rounded-xl px-3 py-2 flex items-center gap-3 text-xs shadow-lg">
                                <div className="flex items-center gap-2">
                                    <span className="text-[#CDB988] font-medium capitalize">
                                        Panduan {selectedMotif}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-[#7E9385]">Opasitas:</span>
                                    <input 
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.05"
                                        value={guideOpacity}
                                        onChange={(e) => setGuideOpacity(parseFloat(e.target.value))}
                                        className="w-16 h-1 bg-[#182C24] rounded cursor-pointer accent-[#D5BD8A]"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowGuide(!showGuide)}
                                    title={showGuide ? "Sembunyikan garis panduan" : "Tampilkan garis panduan"}
                                    className="p-1 rounded text-[#9CB0A4] hover:text-[#CDB988] transition-colors"
                                >
                                    {showGuide ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <div className="w-px h-3.5 bg-[#182C24]" />
                                <button
                                    onClick={() => {
                                        setSelectedMotif('polos');
                                        setShowGuide(false);
                                        setStatusMessage('Mode kanvas polos aktif. Melukis tanpa garis panduan.');
                                        showToast('Garis panduan dinonaktifkan (Kanvas Polos)');
                                    }}
                                    title="Nonaktifkan preset pola (kembali ke polos)"
                                    className="p-1 rounded text-[#7E9385] hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <X size={14} />
                                    <span className="text-[10px]">Hapus</span>
                                </button>
                            </div>
                        ) : (
                            <div className="absolute top-4 right-4 bg-[#091611]/90 backdrop-blur-md border border-[#182C24] rounded-xl px-3 py-2 flex items-center gap-2.5 text-xs shadow-lg">
                                <span className="w-2 h-2 rounded-full bg-[#7E9385]" />
                                <span className="text-[#9CB0A4]">Mode Bebas (Tanpa Panduan)</span>
                            </div>
                        )}
                    </div>

                    {/* Footer Bar Kanvas (Status & Dimensi) */}
                    <div className="flex items-center justify-between pt-2.5 px-1 text-xs text-[#7E9385] shrink-0">
                        <span className="italic">{statusMessage}</span>
                        <span className="font-mono">{CANVAS_WIDTH} × {CANVAS_HEIGHT} px · 300 DPI</span>
                    </div>
                </main>

                {/* 3. PANEL SEBELAH KANAN (PUSTAKA PAKEM BATIK NUSANTARA) */}
                <aside className="w-72 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-lg">
                    <div className="flex flex-col gap-4">
                        {/* Header Pustaka Pakem */}
                        <div>
                            <h3 className="font-heading font-semibold text-xl text-[#E2CEAB]">Pustaka Pakem</h3>
                            <p className="text-xs text-[#7E9385] mt-0.5">Temukan akar dari setiap pola.</p>
                        </div>

                        {/* Kotak Pencarian Motif */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7E9385]" />
                            <input
                                type="text"
                                placeholder="Cari motif Nusantara"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#08140F] border border-[#182C24] rounded-xl pl-8 pr-3 py-2 text-xs text-[#D8C7A5] placeholder-[#5C7265] focus:outline-none focus:border-[#CDB988]/60 transition-colors"
                            />
                        </div>

                        {/* Tab: Semua Motif | Favorit */}
                        <div className="flex border-b border-[#182C24]">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`pb-2 px-3 text-xs font-medium transition-colors relative ${
                                    activeTab === 'all'
                                        ? 'text-[#E2CEAB]'
                                        : 'text-[#7E9385] hover:text-[#9CB0A4]'
                                }`}
                            >
                                <span>Semua Motif</span>
                                {activeTab === 'all' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CDB988]" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                className={`pb-2 px-3 text-xs font-medium transition-colors relative ${
                                    activeTab === 'favorites'
                                        ? 'text-[#E2CEAB]'
                                        : 'text-[#7E9385] hover:text-[#9CB0A4]'
                                }`}
                            >
                                <span>Favorit</span>
                                {activeTab === 'favorites' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CDB988]" />
                                )}
                            </button>
                        </div>

                        {/* Tombol Aksi Cepat: Opsi Tanpa Pola Sama Sekali */}
                        <button
                            onClick={() => {
                                setSelectedMotif('polos');
                                setShowGuide(false);
                                setStatusMessage('Mode kanvas polos aktif. Melukis bebas tanpa garis panduan.');
                                showToast('Mode Kanvas Polos (Tanpa Panduan) dipilih');
                            }}
                            className={`w-full py-2.5 px-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                selectedMotif === 'polos' || !selectedMotif
                                    ? 'bg-[#142920] border-[#CDB988] text-[#F5EFEB] font-semibold ring-1 ring-[#CDB988]/50 shadow-sm'
                                    : 'bg-[#08140F] border-[#182C24] text-[#9CB0A4] hover:border-[#2C483A] hover:text-[#E2CEAB]'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded border border-dashed border-[#CDB988]/60 flex items-center justify-center bg-[#091510]">
                                    <span className="text-[11px] text-[#CDB988]">∅</span>
                                </div>
                                <span>Tanpa Pola (Kanvas Polos)</span>
                            </div>
                            {(selectedMotif === 'polos' || !selectedMotif) && (
                                <span className="text-[10px] text-[#CDB988] bg-[#0E1F17] px-2 py-0.5 rounded-full border border-[#CDB988]/30 font-medium">
                                    Aktif
                                </span>
                            )}
                        </button>

                        {/* Grid Kartu Motif Batik (2 Kolom Presisi seperti di Foto) */}
                        <div className="grid grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                            {filteredMotifs.map((motif) => {
                                const isSelected = selectedMotif === motif.id;
                                const isFav = favorites.includes(motif.id);
                                return (
                                    <div
                                        key={motif.id}
                                        onClick={() => {
                                            if (motif.id === 'polos') {
                                                setSelectedMotif('polos');
                                                setShowGuide(false);
                                                setStatusMessage('Mode kanvas polos aktif. Melukis motif batik karyamu sendiri secara bebas.');
                                                showToast('Mode Kanvas Polos (Tanpa Panduan) aktif');
                                            } else {
                                                setSelectedMotif(motif.id);
                                                setShowGuide(true);
                                                setStatusMessage(`Preset pola panduan '${motif.name}' dipilih. Lukis mengikuti garis titik-titik.`);
                                                showToast(`Panduan pola ${motif.name} aktif`);
                                            }
                                        }}
                                        className={`group relative rounded-xl border p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-[#142920] border-[#CDB988] shadow-md ring-1 ring-[#CDB988]/50'
                                                : 'bg-[#08140F] border-[#182C24] hover:border-[#2C483A] hover:bg-[#0E1E17]'
                                        }`}
                                    >
                                        {/* Tombol Info Filosofi Motif */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDetailMotifModal(motif);
                                            }}
                                            className="absolute top-2 left-2 p-1 text-[#5C7265] opacity-0 group-hover:opacity-100 hover:text-[#CDB988] transition-all"
                                            title="Filosofi motif"
                                        >
                                            <Info size={12} />
                                        </button>

                                        {/* Tombol Favorit */}
                                        {motif.id !== 'polos' && (
                                            <button
                                                onClick={(e) => toggleFavorite(motif.id, e)}
                                                className={`absolute top-2 right-2 p-1 transition-colors ${
                                                    isFav ? 'text-red-400' : 'text-[#5C7265] opacity-0 group-hover:opacity-100 hover:text-red-300'
                                                }`}
                                                title={isFav ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                                            >
                                                <Heart size={12} fill={isFav ? "currentColor" : "none"} />
                                            </button>
                                        )}

                                        {/* Ikon Motif SVG */}
                                        <div className="w-14 h-14 flex items-center justify-center transition-transform group-hover:scale-105">
                                            {motif.svgIcon}
                                        </div>

                                        {/* Nama Motif */}
                                        <span className={`text-xs font-medium text-center ${
                                            isSelected ? 'text-[#F5EFEB] font-semibold' : 'text-[#D8C7A5]'
                                        }`}>
                                            {motif.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Callout Info di Bagian Bawah Panel Kanan */}
                    <div className="bg-[#08140F] border border-[#182C24] rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-[#7E9385] leading-relaxed">
                        <Info size={15} className="shrink-0 text-[#CDB988] mt-0.5" />
                        <span>Pilih motif untuk mulai menyusun pola di kainmu, atau pilih Tanpa Pola untuk berkreasi bebas.</span>
                    </div>
                </aside>
            </div>

            {/* FOOTER BAWAH */}
            <footer className="h-8 px-6 bg-[#06100B] border-t border-[#12231B] flex items-center justify-between text-[11px] text-[#7E9385] shrink-0">
                <span className="uppercase tracking-widest text-[#4A5D52] font-semibold">
                    WASTRAKARYA STUDIO
                </span>
                <span>Tradisi di tanganmu, Imajinasi tanpa batas.</span>
            </footer>
        </div>
    );
}
