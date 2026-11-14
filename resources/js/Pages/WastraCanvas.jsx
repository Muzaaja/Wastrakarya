import React, { useState, useRef, useEffect, useCallback } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
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
    Eraser,
    Pencil,
    Check,
    Sparkles,
    Grid,
    Layers,
    HelpCircle,
    X,
    Palette,
    SquareDashed,
    Shirt,
    Flame,
    Timer,
    AlertTriangle,
    Loader2,
    RotateCcw,
    InfoIcon,
} from "lucide-react";
import {
    BATIK_MOTIFS,
    renderDottedGuide,
    autoTraceMotifWax,
} from "@/Components/WastraCanvas/BatikMotifs";

export default function WastraCanvas() {
    // Canvas ref & Context
    const canvasRef = useRef(null); // visible display canvas
    const containerRef = useRef(null);
    const artworkCanvasRef = useRef(null); // offscreen artwork store (world coords)

    // Konfigurasi Kanvas
    const canvasWidth = 960;
    const canvasHeight = 960;

    // State Peralatan & Lilin Malam - NEW WORKFLOW
    const [malamState, setMalamState] = useState("cold"); // 'cold', 'heating', 'ready', 'drawing', 'hardened'
    const [heatingProgress, setHeatingProgress] = useState(0); // 0-100 for 5 seconds
    const [drawingTimeLeft, setDrawingTimeLeft] = useState(60); // 60 seconds drawing time
    const [waxColor, setWaxColor] = useState("#CDB988");
    const [waxColorName, setWaxColorName] = useState("Emas tua");
    const cantingSize = 3.5; // Fixed size in world units
    const pencilSize = 1.5; // Fixed size in world units
    const pencilColor = "#c9c9c9"; // Graphite abu-abu tua

    // Preset Warna Malam
    const WAX_COLORS = [
        { name: "Emas tua", hex: "#CDB988" },
        { name: "Putih Mori", hex: "#FAF7F2" },
        { name: "Hijau Lumut", hex: "#566C60" },
        { name: "Cokelat Sogan", hex: "#322115" },
    ];

    // State Preset Motif Batik & Garis Panduan Titik-Titik
    const [selectedMotif, setSelectedMotif] = useState("kawung");
    const [showGuide, setShowGuide] = useState(true);
    const [guideOpacity, setGuideOpacity] = useState(0.75);
    const [showTileGrid, setShowTileGrid] = useState(false);
    const [favorites, setFavorites] = useState(["kawung", "parang"]);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Auth & Saved Drawings (database, connected to logged in User)
    const { auth } = usePage().props;
    const user = auth?.user ?? null;
    const [savedDrawings, setSavedDrawings] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);

    // State Zoom & Pan
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    // Drawing State
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef(null);
    const [activeTool, setActiveTool] = useState("canting"); // 'canting' | 'pencil' | 'eraser'
    const [cursorPos, setCursorPos] = useState(null);
    const [malamWiggle, setMalamWiggle] = useState(false);
    const [hasRequestedMalamHeat, setHasRequestedMalamHeat] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [cursorAngle, setCursorAngle] = useState(0);
    const prevCursorRef = useRef(null);

    // History (Undo / Redo) - store full canvas snapshots
    const historyStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    // Timers
    const heatingTimerRef = useRef(null);
    const drawingTimerRef = useRef(null);

    // Status UI, Modal & Notifikasi
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [statusMessage, setStatusMessage] = useState(
        'Pilih warna malam, lalu tekan "Panaskan Malam" untuk memulai.',
    );
    const [toastMessage, setToastMessage] = useState(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [detailMotifModal, setDetailMotifModal] = useState(null);
    const [projectTitle, setProjectTitle] = useState("Karya tanpa judul");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");
    const [saveRedirect, setSaveRedirect] = useState(null);
    const [restoreDrawing, setRestoreDrawing] = useState(false);
    const [loadedDrawingId, setLoadedDrawingId] = useState(null);

    // Helper Toast
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // CSRF token helper for Laravel API calls from Inertia pages
    const getCsrfToken = () => {
        const match = document.cookie.match(/(?:^|; )\s*XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    };

    // Muat simpanan karya dari database (berdasarkan User yang login)
    const fetchSavedDrawings = useCallback(async () => {
        if (!user) return;
        setSavedLoading(true);
        try {
            const res = await fetch("/api/user-drawings", {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    ...(getCsrfToken()
                        ? { "X-XSRF-TOKEN": getCsrfToken() }
                        : {}),
                },
            });
            if (!res.ok) throw new Error("Gagal memuat simpanan karya");
            const data = await res.json();
            setSavedDrawings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            showToast("Gagal memuat simpanan karya");
        } finally {
            setSavedLoading(false);
        }
    }, [user]);

    // Filter motif
    const filteredMotifs = BATIK_MOTIFS.filter((motif) => {
        const matchesSearch =
            motif.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            motif.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            motif.category.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === "favorites") {
            return matchesSearch && favorites.includes(motif.id);
        }
        return matchesSearch;
    });

    const toggleFavorite = (id, e) => {
        e.stopPropagation();
        if (favorites.includes(id)) {
            setFavorites(favorites.filter((fav) => fav !== id));
            showToast(`Motif dihapus dari Favorit`);
        } else {
            setFavorites([...favorites, id]);
            showToast(`Motif ditambahkan ke Favorit`);
        }
    };

    // Simpan Snapshot ke Undo History (snapshot artwork canvas, not display)
    const saveStateToHistory = () => {
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        const ctx = artwork.getContext("2d");
        const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
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
        if (historyStackRef.current.length === 0) return;
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        const ctx = artwork.getContext("2d");
        const currentState = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        redoStackRef.current.push(currentState);

        const prevState = historyStackRef.current.pop();
        ctx.putImageData(prevState, 0, 0);

        renderMainCanvas();
        setCanUndo(historyStackRef.current.length > 0);
        setCanRedo(true);
    };

    // Redo Action
    const handleRedo = () => {
        if (redoStackRef.current.length === 0) return;
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        const ctx = artwork.getContext("2d");
        const currentState = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        historyStackRef.current.push(currentState);

        const nextState = redoStackRef.current.pop();
        ctx.putImageData(nextState, 0, 0);

        renderMainCanvas();
        setCanUndo(true);
        setCanRedo(redoStackRef.current.length > 0);
    };

    // Bersihkan Kanvas
    const handleClearCanvas = () => {
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        saveStateToHistory();
        const ctx = artwork.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        renderMainCanvas();
        setStatusMessage("Kanvas dibersihkan. Siap untuk goresan baru.");
        showToast("Kanvas telah dibersihkan");
        setShowMoreMenu(false);
    };

    // Jiplak Pola Otomatis Menggunakan Lilin Malam
    const handleAutoTrace = () => {
        const artwork = getArtworkCanvas();
        if (
            !artwork ||
            !selectedMotif ||
            selectedMotif === "polos" ||
            selectedMotif === "none"
        ) {
            showToast(
                "Pilih salah satu motif pakem di panel kanan terlebih dahulu",
            );
            setShowMoreMenu(false);
            return;
        }
        saveStateToHistory();
        const ctx = artwork.getContext("2d");
        // Draw the motif centered on canvas
        const cx = canvasWidth / 2;
        const cy = canvasHeight / 2;
        const scale = Math.min(canvasWidth, canvasHeight) / 160; // Scale from tile size
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-80, -80); // Center of 160x160 tile
        autoTraceMotifWax(ctx, selectedMotif, 160, waxColor, cantingSize);
        ctx.restore();
        renderMainCanvas();
        setStatusMessage(
            `Pola ${selectedMotif} berhasil dijiplak dengan lilin malam.`,
        );
        showToast(`Pola ${selectedMotif} berhasil dijiplak!`);
        setShowMoreMenu(false);
    };

    // Simpan Karya ke Database (User yang login) atau LocalStorage (tamu)
    const handleSave = async (redirectTo = null) => {
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        setSaveRedirect(redirectTo);
        setSaveNameInput(projectTitle);
        setShowSaveDialog(true);
        setShowMoreMenu(false);
    };

    // Konfirmasi simpan dengan nama karya dari popup
    const handleConfirmSave = async () => {
        const artwork = getArtworkCanvas();
        if (!artwork) return;

        const title = saveNameInput.trim() || projectTitle;
        const payload = {
            title,
            motif: selectedMotif,
            waxColor,
            waxColorName,
            cantingSize,
            data_url: artwork.toDataURL(),
            updated_at: new Date().toISOString(),
        };

        setProjectTitle(title);
        setShowSaveDialog(false);

        const doSave = async (method, url) => {
            try {
                const res = await fetch(url, {
                    method,
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        ...(getCsrfToken()
                            ? { "X-XSRF-TOKEN": getCsrfToken() }
                            : {}),
                    },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Gagal menyimpan ke akun");
                const data = await res.json();
                setHasUnsavedChanges(false);
                await fetchSavedDrawings();
                if (data?.id) setLoadedDrawingId(data.id); // catatan baru jadi motif aktif
                showToast("Karya berhasil disimpan!");
                return data;
            } catch (e) {
                console.error(e);
                showToast("Gagal menyimpan ke akun");
                return null;
            }
        };

        if (user) {
            // Simpan biasa memperbarui motif yang dimuat (PUT), atau buat baru (POST)
            const isUpdate = loadedDrawingId != null;
            if (isUpdate) {
                await doSave("PUT", `/api/user-drawings/${loadedDrawingId}`);
            } else {
                await doSave("POST", "/api/user-drawings");
            }
        } else {
            // Fallback tamu: simpan ke penyimpanan lokal
            try {
                localStorage.setItem(
                    "wastrakarya_studio_save",
                    JSON.stringify({
                        ...payload,
                        updatedAt: new Date().toISOString(),
                    }),
                );
                setHasUnsavedChanges(false);
                showToast(
                    "Karya disimpan secara lokal. Masuk untuk menyimpan ke akun Anda!",
                );
            } catch (e) {
                console.error(e);
                showToast("Gagal menyimpan ke penyimpanan lokal");
            }
        }

        // Simpan snapshot sesi (malam, warna, kanvas, dll) untuk dipulihkan saat kembali dari Mockup
        try {
            const sessionSnapshot = {
                malamState,
                heatingProgress,
                drawingTimeLeft,
                waxColor,
                waxColorName,
                title,
                motif: selectedMotif,
                showGuide,
                activeTool,
                cantingSize,
                dataUrl: artwork.toDataURL(),
                updatedAt: new Date().toISOString(),
            };
            localStorage.setItem(
                "wastrakarya_studio_session",
                JSON.stringify(sessionSnapshot),
            );
        } catch (_) {}

        // Simpan juga ke lokal untuk dipakai WastraMockup segera
        try {
            localStorage.setItem(
                "wastrakarya_studio_save",
                JSON.stringify({
                    ...payload,
                    updatedAt: new Date().toISOString(),
                }),
            );
        } catch (_) {}

        // Arahkan ke halaman tujuan setelah tersimpan (mis. /mockup)
        if (typeof saveRedirect === "string" && saveRedirect) {
            window.location.href = saveRedirect;
        }
    };

    // Muat simpanan karya ke kanvas
    const handleLoadDrawing = useCallback((drawing) => {
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        saveStateToHistory();
        const actx = artwork.getContext("2d");
        actx.clearRect(0, 0, canvasWidth, canvasHeight);
        const img = new Image();
        img.onload = () => {
            actx.drawImage(img, 0, 0);
            renderMainCanvas();
        };
        img.src = drawing.data_url;
        if (drawing.title) setProjectTitle(drawing.title);
        if (drawing.motif) setSelectedMotif(drawing.motif);
        if (drawing.wax_color) setWaxColor(drawing.wax_color);
        if (drawing.wax_color_name) setWaxColorName(drawing.wax_color_name);
        if (drawing.motif === "polos") {
            setShowGuide(false);
        } else {
            setShowGuide(true);
        }
        setHasUnsavedChanges(false);
        setActiveTab("all");
        setLoadedDrawingId(drawing.id ?? null);
        showToast(`Karya "${drawing.title}" dimuat`);
    }, []);

    // Hapus simpanan karya dari database
    const handleDeleteDrawing = useCallback(
        async (id) => {
            if (!window.confirm("Yakin ingin menghapus simpanan karya ini?"))
                return;
            try {
                const res = await fetch(`/api/user-drawings/${id}`, {
                    method: "DELETE",
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        ...(getCsrfToken()
                            ? { "X-XSRF-TOKEN": getCsrfToken() }
                            : {}),
                    },
                });
                if (!res.ok) throw new Error("Gagal menghapus");
                await fetchSavedDrawings();
                showToast("Karya berhasil dihapus dari simpanan.");
            } catch (err) {
                console.error(err);
                showToast("Gagal menghapus karya");
            }
        },
        [fetchSavedDrawings],
    );

    // Unduh Hasil Kain Batik Penuh (PNG 960x784)
    const handleExportFullFabric = () => {
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        // Composite background + artwork into a temporary canvas for full-fabric export
        const out = document.createElement("canvas");
        out.width = canvasWidth;
        out.height = canvasHeight;
        const octx = out.getContext("2d");
        octx.fillStyle = "#F5EFEB";
        octx.fillRect(0, 0, canvasWidth, canvasHeight);
        octx.drawImage(artwork, 0, 0);

        const link = document.createElement("a");
        link.download = `${projectTitle.toLowerCase().replace(/\s+/g, "-")}-kain-batik.png`;
        link.href = out.toDataURL("image/png");
        link.click();
        showToast("Kain batik berhasil diunduh (PNG)");
        setShowMoreMenu(false);
    };

    // Malam Heating Logic
    const startHeating = () => {
        if (malamState !== "cold" && malamState !== "hardened") return;

        setMalamState("heating");
        setHeatingProgress(0);
        setStatusMessage(
            "Memanas malam... Tunggu 5 detik hingga lilin meleleh sempurna.",
        );

        heatingTimerRef.current = setInterval(() => {
            setHeatingProgress((prev) => {
                const newProgress = prev + 20;
                if (newProgress >= 100) {
                    clearInterval(heatingTimerRef.current);
                    setMalamState("ready");
                    setHeatingProgress(100);
                    setStatusMessage(
                        'Malam siap! Tekan "Mulai Melukis" untuk memasukkan canting.',
                    );
                    return 100;
                }
                return newProgress;
            });
        }, 1000);
    };

    const startDrawingTimer = () => {
        setMalamState("drawing");
        setDrawingTimeLeft(90);
        // setStatusMessage("Melukis dengan canting... Waktu tersisa: 60 detik.");
        // showToast("Mulai melukis! Waktu 1 menit sebelum malam mengeras.");

        drawingTimerRef.current = setInterval(() => {
            setDrawingTimeLeft((prev) => {
                const newTime = prev - 1;
                if (newTime <= 0) {
                    clearInterval(drawingTimerRef.current);
                    setMalamState("hardened");
                    setDrawingTimeLeft(0);
                    setStatusMessage(
                        "Malam telah mengeras. Panaskan kembali untuk melanjutkan melukis.",
                    );
                    return 0;
                }
                setStatusMessage(
                    `Melukis dengan canting... Waktu tersisa: ${newTime} detik.`,
                );
                return newTime;
            });
        }, 1000);
    };

    const startDrawing = () => {
        if (malamState !== "ready") return;
        startDrawingTimer();
    };

    // Reheat to change color - resets to cold state
    const reheatForColorChange = () => {
        // Clear timers
        if (heatingTimerRef.current) clearInterval(heatingTimerRef.current);
        if (drawingTimerRef.current) clearInterval(drawingTimerRef.current);

        setMalamState("cold");
        setHeatingProgress(0);
        setDrawingTimeLeft(60);
        setStatusMessage(
            'Malam direset. Pilih warna baru, lalu tekan "Panaskan Malam" untuk memulai.',
        );
    };

    const handleCantingDip = () => {
        if (malamState === "ready") {
            startDrawing();
        } else if (malamState === "cold" || malamState === "hardened") {
            startHeating();
        }
    };

    const selectTool = (tool) => {
        setActiveTool(tool);
        if (
            tool === "canting" &&
            (malamState === "cold" || malamState === "hardened")
        ) {
            setHasRequestedMalamHeat(true);
        }
    };

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (heatingTimerRef.current) clearInterval(heatingTimerRef.current);
            if (drawingTimerRef.current) clearInterval(drawingTimerRef.current);
        };
    }, []);

    // Render Utama Kanvas (Display: composite background + artwork + guide with pan/zoom)
    const TILE_SIZE = 160; // Tile size for guide tiling

    // Lazily create the offscreen artwork canvas (world-resolution, never zoomed)
    const getArtworkCanvas = useCallback(() => {
        if (!artworkCanvasRef.current) {
            const c = document.createElement("canvas");
            c.width = canvasWidth;
            c.height = canvasHeight;
            artworkCanvasRef.current = c;
        }
        return artworkCanvasRef.current;
    }, [canvasWidth, canvasHeight]);

    const renderMainCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const artwork = getArtworkCanvas();

        // Clear display canvas fully
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Transformasi Pan & Zoom
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        // Clip all world-space rendering to the canvas boundary so nothing
        // (background, guide, artwork) leaks outside the kain area when zoomed out.
        ctx.beginPath();
        ctx.rect(0, 0, canvasWidth, canvasHeight);
        ctx.clip();

        // 1. Latar Kain Mori Khas Batik (Warna Krem Halus & Tekstur Tenun Serat)
        ctx.fillStyle = "#F5EFEB";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Tekstur Tenun Halus Kain Mori
        ctx.fillStyle = "rgba(0, 0, 0, 0.012)";
        for (let x = 0; x < canvasWidth; x += 4) {
            ctx.fillRect(x, 0, 1, canvasHeight);
        }
        for (let y = 0; y < canvasHeight; y += 4) {
            ctx.fillRect(0, y, canvasWidth, 1);
        }

        // 2. Garis Panduan Titik-Titik (tiled, clipped to canvas bounds)
        if (
            showGuide &&
            selectedMotif &&
            selectedMotif !== "polos" &&
            selectedMotif !== "none"
        ) {
            const minCol = Math.floor(-pan.x / zoom / TILE_SIZE) - 1;
            const maxCol =
                Math.ceil((canvasWidth - pan.x) / zoom / TILE_SIZE) + 1;
            const minRow = Math.floor(-pan.y / zoom / TILE_SIZE) - 1;
            const maxRow =
                Math.ceil((canvasHeight - pan.y) / zoom / TILE_SIZE) + 1;

            for (let c = minCol; c <= maxCol; c++) {
                for (let r = minRow; r <= maxRow; r++) {
                    ctx.save();
                    ctx.translate(c * TILE_SIZE, r * TILE_SIZE);
                    renderDottedGuide(
                        ctx,
                        selectedMotif,
                        TILE_SIZE,
                        guideOpacity,
                    );
                    ctx.restore();
                }
            }
        }

        // 3. Garis Batas Kanvas (Jika Diaktifkan)
        if (showTileGrid) {
            ctx.save();
            ctx.strokeStyle = "rgba(164, 140, 92, 0.3)";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

            // Also show tile grid lines
            for (let x = 0; x <= canvasWidth; x += TILE_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvasHeight);
                ctx.stroke();
            }
            for (let y = 0; y <= canvasHeight; y += TILE_SIZE) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvasWidth, y);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 4. Lukisan Lilin (artwork) di atas latar & panduan
        ctx.drawImage(artwork, 0, 0);

        ctx.restore();
    }, [
        pan,
        zoom,
        canvasWidth,
        canvasHeight,
        showGuide,
        selectedMotif,
        guideOpacity,
        showTileGrid,
        getArtworkCanvas,
    ]);

    useEffect(() => {
        renderMainCanvas();
    }, [renderMainCanvas]);

    // Konfigurasi stroke berdasarkan alat aktif
    const getActiveToolConfig = useCallback(() => {
        if (activeTool === "pencil") {
            return { size: pencilSize, color: pencilColor, erase: false };
        }
        if (activeTool === "eraser") {
            return { size: cantingSize, color: "#000000", erase: true };
        }
        return { size: cantingSize, color: waxColor, erase: false };
    }, [activeTool, waxColor]);

    // Simple drawing — draws onto the offscreen artwork canvas (world coords, zoom-independent)
    const drawStamp = (x, y, r, color, erase) => {
        const artwork = getArtworkCanvas();
        if (!artwork) return;
        const ctx = artwork.getContext("2d");

        ctx.save();
        ctx.globalCompositeOperation = erase
            ? "destination-out"
            : "source-over";
        ctx.fillStyle = erase ? "#000000" : color;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const drawLineBetween = (p1, p2) => {
        const { size, color, erase } = getActiveToolConfig();
        const r = size / 2;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const stepSize = Math.max(1, r / 3);
        const steps = Math.ceil(dist / stepSize);

        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const wx = p1.x + dx * t;
            const wy = p1.y + dy * t;
            drawStamp(wx, wy, r, color, erase);
        }

        // Repaint display so the new stroke is visible immediately
        renderMainCanvas();
    };

    // Konversi Posisi Layar ke Titik Dunia Kanvas
    const getCanvasCoords = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const screenX = (e.clientX - rect.left) * scaleX;
        const screenY = (e.clientY - rect.top) * scaleY;

        const isInside =
            screenX >= 0 &&
            screenX <= canvasWidth &&
            screenY >= 0 &&
            screenY <= canvasHeight;

        const clampedScreenX = Math.max(0, Math.min(canvasWidth, screenX));
        const clampedScreenY = Math.max(0, Math.min(canvasHeight, screenY));

        const worldX = (clampedScreenX - pan.x) / zoom;
        const worldY = (clampedScreenY - pan.y) / zoom;

        return { x: worldX, y: worldY, isInside, screenX, screenY };
    };

    // Pointer Event Handlers
    const handleCanvasPointerDown = (e) => {
        if (e.button === 1 || e.spaceKey || e.altKey) {
            setIsPanning(true);
            panStartRef.current = {
                x: e.clientX - pan.x,
                y: e.clientY - pan.y,
            };
            return;
        }

        if (e.button !== 0 && e.pointerType === "mouse") return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

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

        // Canting membutuhkan malam yang telah dilelehkan; Pencil dan Eraser siap kapan saja.
        if (activeTool === "canting" && malamState !== "drawing") {
            if (malamState === "ready") {
                startDrawing();
            } else if (malamState === "cold" || malamState === "hardened") {
                setMalamWiggle(true);
                setTimeout(() => setMalamWiggle(false), 600);
                // showToast("Malam belum siap. Panaskan malam terlebih dahulu!");
            } else if (malamState === "heating") {
                // showToast("Malam masih dipanaskan. Tunggu sebentar...");
            }
            return;
        }

        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}

        setIsPressed(true);
        saveStateToHistory();
        isDrawingRef.current = true;
        lastPosRef.current = pos;

        drawLineBetween(pos, pos);
        const motifLabel =
            selectedMotif && selectedMotif !== "polos"
                ? `motif ${selectedMotif}`
                : "bebas";
        const action = activeTool === "eraser" ? "menghapus" : "menggambar";
        const toolLabel =
            activeTool === "canting"
                ? "Canting"
                : activeTool === "pencil"
                  ? "Pencil"
                  : "Eraser";
        setStatusMessage(
            `Sedang ${action} dengan ${toolLabel} ${motifLabel ? `(${motifLabel})` : ""}...`,
        );
    };

    const handleCanvasPointerMove = (e) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStartRef.current.x,
                y: e.clientY - panStartRef.current.y,
            });
            return;
        }

        const currentPos = getCanvasCoords(e);
        if (!currentPos) return;
        setCursorPos(currentPos);

        // Calculate cursor angle for swing effect (rotation based on movement direction)
        if (prevCursorRef.current) {
            const dx = currentPos.screenX - prevCursorRef.current.screenX;
            const dy = currentPos.screenY - prevCursorRef.current.screenY;
            if (dx !== 0 || dy !== 0) {
                // Calculate angle: cursor moving left -> rotate right (positive), moving right -> rotate left (negative)
                const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                // Swing in opposite direction of movement
                setCursorAngle((prev) => {
                    const targetAngle = -angle * 0.3; // damping factor
                    return prev + (targetAngle - prev) * 0.15; // smooth interpolation
                });
            } else {
                // Return to center when not moving
                setCursorAngle((prev) => prev * 0.9);
            }
        } else {
            setCursorAngle((prev) => prev * 0.95);
        }
        prevCursorRef.current = currentPos;

        if (!isDrawingRef.current || !lastPosRef.current) return;

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
    };

    const handleCanvasPointerUp = (e) => {
        if (isPanning) {
            setIsPanning(false);
        }
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            lastPosRef.current = null;
            setStatusMessage(`Goresan malam diterapkan.`);
        }
        setIsPressed(false);
        // Smoothly return angle to center on release
        setCursorAngle((prev) => prev * 0.9);
        try {
            if (e && e.currentTarget && e.pointerId) {
                e.currentTarget.releasePointerCapture(e.pointerId);
            }
        } catch (_) {}
    };

    const handleContainerPointerDown = (e) => {
        if (e.target !== canvasRef.current) {
            if (e.button === 0 || e.button === 1 || e.spaceKey || e.altKey) {
                setIsPanning(true);
                panStartRef.current = {
                    x: e.clientX - pan.x,
                    y: e.clientY - pan.y,
                };
            }
        }
    };

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
        window.addEventListener("pointerup", handleGlobalUp);
        return () => window.removeEventListener("pointerup", handleGlobalUp);
    }, [isPanning]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === "INPUT") return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if (
                (e.ctrlKey || e.metaKey) &&
                e.key.toLowerCase() === "y"
            ) {
                e.preventDefault();
                handleRedo();
            } else if (e.key === "=" || e.key === "+") {
                handleZoomIn();
            } else if (e.key === "-" || e.key === "_") {
                handleZoomOut();
            } else if (e.key.toLowerCase() === "h") {
                handleCantingDip();
            } else if (e.key.toLowerCase() === "p") {
                e.preventDefault();
                selectTool("pencil");
            } else if (e.key.toLowerCase() === "e") {
                e.preventDefault();
                selectTool("eraser");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canUndo, canRedo, activeTool]);

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(0.4, Math.round((prev - 0.15) * 100) / 100));
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Pulihkan Karya dari LocalStorage (sesi kembali dari Mockup maupun simpanan tamu)
    useEffect(() => {
        try {
            // Prioritaskan snapshot sesi (malam, warna, status kanvas) dari kembali Mockup
            const session = localStorage.getItem("wastrakarya_studio_session");
            if (session) {
                const data = JSON.parse(session);
                if (data.malamState) setMalamState(data.malamState);
                if (data.heatingProgress !== undefined)
                    setHeatingProgress(data.heatingProgress);
                if (data.drawingTimeLeft !== undefined)
                    setDrawingTimeLeft(data.drawingTimeLeft);
                if (data.waxColor) setWaxColor(data.waxColor);
                if (data.waxColorName) setWaxColorName(data.waxColorName);
                if (data.title) setProjectTitle(data.title);
                if (data.motif) setSelectedMotif(data.motif);
                if (data.showGuide !== undefined) setShowGuide(data.showGuide);
                if (data.activeTool !== undefined)
                    setActiveTool(data.activeTool);
                else if (data.isEraser !== undefined)
                    setActiveTool(data.isEraser ? "eraser" : "canting");
                if (data.malamState === "drawing") {
                    setDrawingTimeLeft(60);
                    setRestoreDrawing(true);
                }
                if (data.dataUrl) {
                    const artwork = getArtworkCanvas();
                    const actx = artwork.getContext("2d");
                    actx.clearRect(0, 0, canvasWidth, canvasHeight);
                    const img = new Image();
                    img.onload = () => {
                        actx.drawImage(img, 0, 0);
                        renderMainCanvas();
                        // Seeded snapshot untuk Undo setelah pulih
                        saveStateToHistory();
                    };
                    img.src = data.dataUrl;
                }
                localStorage.removeItem("wastrakarya_studio_session");
                return;
            }

            // Fallback simpanan tamu (hanya artwork & metadata dasar)
            const saved = localStorage.getItem("wastrakarya_studio_save");
            if (saved) {
                const data = JSON.parse(saved);
                if (data.title) setProjectTitle(data.title);
                if (data.motif) setSelectedMotif(data.motif);
                if (data.waxColor) setWaxColor(data.waxColor);
                if (data.waxColorName) setWaxColorName(data.waxColorName);
                if (data.dataUrl) {
                    const artwork = getArtworkCanvas();
                    const actx = artwork.getContext("2d");
                    actx.clearRect(0, 0, canvasWidth, canvasHeight);
                    const img = new Image();
                    img.onload = () => {
                        actx.drawImage(img, 0, 0);
                        renderMainCanvas();
                        saveStateToHistory();
                    };
                    img.src = data.dataUrl;
                }
            }
        } catch (err) {
            console.error("Error loading saved canvas", err);
        }
    }, []);

    // Mulai ulang timer 1 menit saat pulih dari Mockup dalam status melukis
    useEffect(() => {
        if (restoreDrawing && malamState === "drawing") {
            startDrawingTimer();
            setRestoreDrawing(false);
        }
    }, [restoreDrawing, malamState]);

    // Muat simpanan dari database saat halaman dibuka (user yang login)
    useEffect(() => {
        if (user) {
            fetchSavedDrawings();
        }
    }, [user, fetchSavedDrawings]);

    // Muat motif yang dipilih dari halaman Welcome (/canvas?drawing=ID)
    useEffect(() => {
        if (!user) return;
        const params = new URLSearchParams(window.location.search);
        const drawingId = params.get("drawing");
        if (!drawingId) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/user-drawings/${drawingId}`, {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        ...(getCsrfToken()
                            ? { "X-XSRF-TOKEN": getCsrfToken() }
                            : {}),
                    },
                });
                if (!res.ok) throw new Error("Gagal memuat karya");
                const data = await res.json();
                if (!cancelled) {
                    handleLoadDrawing(data);
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) showToast("Gagal memuat karya terpilih");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user, handleLoadDrawing]);

    // Malam State UI Helpers
    const getMalamStateInfo = () => {
        switch (malamState) {
            case "cold":
                return {
                    label: "",
                    color: "text-[#7E9385]",
                    bgColor: "bg-[#0E1E18]",
                    borderColor: "border-[#182C24]",
                    icon: <InfoIcon size={18} text="#7E9385" />,
                    actionLabel: "Lelehkan Malam",
                    actionColor:
                        "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                    description:
                        "Lelehkan malam dahulu untuk menggunakan canting!",
                    showColorPicker: true,
                };
            case "heating":
                return {
                    label: `Memanas.. ${heatingProgress}%`,
                    color: "text-[#E2B86B]",
                    bgColor: "bg-[#1A2E20]",
                    borderColor: "border-[#CDB988]/50",
                    icon: (
                        <Loader2
                            size={18}
                            className="text-[#E2B86B] animate-spin"
                        />
                    ),
                    actionLabel: "Menunggu...",
                    actionColor:
                        "bg-[#142920] border-[#2A473A] text-[#7E9385] cursor-not-allowed",
                    description: `Silahkan tunggu sampai malam meleleh.`,
                    showColorPicker: false,
                };
            case "ready":
                return {
                    label: "Hore!",
                    color: "text-[#D5BD8A]",
                    bgColor: "bg-[#142920]",
                    borderColor: "border-[#CDB988]",
                    icon: <InfoIcon size={18} text="#7E9385" />,
                    actionLabel: "Mulai Melukis",
                    actionColor:
                        "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                    description: "Malam sudah meleleh, waktunya melukis!",
                    showColorPicker: false,
                    showReheatButton: true,
                };
            case "drawing":
                return {
                    label: `Waktu: ${drawingTimeLeft}s`,
                    color: "text-[#A8D5BA]",
                    bgColor: "bg-[#0F2A1E]",
                    borderColor: "border-[#56C87A]/50",
                    icon: <Timer size={18} className="text-[#A8D5BA]" />,
                    actionLabel: `Sisa`,
                    actionColor:
                        "bg-[#142920] border-[#56C87A]/50 text-[#A8D5BA] cursor-not-allowed",
                    description: `Malam akan mengeras sebelum waktu habis.`,
                    showColorPicker: false,
                    showReheatButton: true,
                };
            case "hardened":
                return {
                    label: "Mengeras",
                    color: "text-[#E88D8D]",
                    bgColor: "bg-[#2A1414]",
                    borderColor: "border-[#E88D8D]/50",
                    icon: (
                        <AlertTriangle size={18} className="text-[#E88D8D]" />
                    ),
                    actionLabel: "Panaskan Ulang",
                    actionColor:
                        "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                    description:
                        "Malam telah mengeras. Harus dipanaskan ulang 5 detik.",
                    showColorPicker: true,
                    showReheatButton: true,
                };
            default:
                return {
                    label: "",
                    color: "",
                    bgColor: "",
                    borderColor: "",
                    icon: null,
                    actionLabel: "",
                    actionColor: "",
                    description: "",
                    showColorPicker: false,
                    showReheatButton: false,
                };
        }
    };

    const malamInfo = getMalamStateInfo();

    return (
        <div className="flex flex-col h-screen w-screen bg-[#07130E] text-[#D8C7A5] select-none font-sans overflow-hidden">
            <Head title="Wastrakarya Studio - Ruang Kreasi Melukis Batik" />
            <style>{`
                @keyframes wiggle {
                    0%, 100% { transform: translateX(0) rotate(0deg); box-shadow: 0 0 0 0 rgba(232,141,141,0); }
                    25% { transform: translateX(-5px) rotate(-2deg); box-shadow: 0 0 0 6px rgba(232,141,141,0.5); }
                    75% { transform: translateX(5px) rotate(2deg); box-shadow: 0 0 0 6px rgba(232,141,141,0.5); }
                }
                .animate-wiggle {
                    animation: wiggle 0.5s ease-in-out;
                }

                /* Grafis Pemanasan Malam: kuali + api */
                @keyframes malamHeatBob {
                    0%, 100% { transform: translateY(0) rotate(-1.5deg); }
                    50% { transform: translateY(-4px) rotate(1.5deg); }
                }
                .animate-malam-bob {
                    animation: malamHeatBob 2.4s ease-in-out infinite;
                }
                @keyframes flameFlicker {
                    0%, 100% { transform: rotate(-45deg) scale(1, 1); opacity: 0.95; }
                    35% { transform: rotate(-45deg) scale(0.9, 1.16); opacity: 1; }
                    65% { transform: rotate(-45deg) scale(1.08, 0.94); opacity: 0.86; }
                }
                .flame-shape {
                    position: absolute;
                    left: 50%;
                    bottom: 0;
                    transform-origin: 50% 50%;
                    border-radius: 0 50% 50% 50%;
                    animation: flameFlicker 0.6s ease-in-out infinite;
                }
                @keyframes emberGlow {
                    0%, 100% { opacity: 0.55; transform: translateX(-50%) scale(1); }
                    50% { opacity: 0.95; transform: translateX(-50%) scale(1.18); }
                }
            `}</style>

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
                                <h3 className="font-heading text-2xl font-bold text-[#E2CEAB]">
                                    {detailMotifModal.name}
                                </h3>
                                <p className="text-xs text-[#7E9385]">
                                    {detailMotifModal.origin} ·{" "}
                                    {detailMotifModal.category}
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#08130E] border border-[#182C24] rounded-xl p-4 mb-5 text-sm leading-relaxed text-[#BACDC2]">
                            <p className="font-medium text-[#E2CEAB] mb-1">
                                Makna & Filosofi:
                            </p>
                            {detailMotifModal.description}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    if (detailMotifModal.id === "polos") {
                                        setSelectedMotif("polos");
                                        setShowGuide(false);
                                        setDetailMotifModal(null);
                                        showToast(
                                            `Mode Kanvas Polos (Tanpa Panduan) aktif`,
                                        );
                                    } else {
                                        setSelectedMotif(detailMotifModal.id);
                                        setShowGuide(true);
                                        setDetailMotifModal(null);
                                        showToast(
                                            `Panduan pola ${detailMotifModal.name} diaktifkan`,
                                        );
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

            {/* MODAL SIMPAN KARYA */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0B1813] border border-[#2A473A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#D8C7A5]">
                        <button
                            onClick={() => setShowSaveDialog(false)}
                            className="absolute top-4 right-4 text-[#7E9385] hover:text-[#F5EFEB] transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="font-heading text-xl font-bold text-[#E2CEAB] mb-4 text-center">
                            Beri Nama Karya
                        </h3>
                        <div className="bg-[#08130E] border border-[#182C24] rounded-xl p-4 mb-6">
                            <label className="block text-xs text-[#7E9385] mb-2 font-medium">
                                Nama Karya
                            </label>
                            <input
                                autoFocus
                                value={saveNameInput}
                                onChange={(e) =>
                                    setSaveNameInput(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleConfirmSave()
                                }
                                className="w-full bg-[#0E1E18] border border-[#CDB988]/40 text-[#BACDC2] text-sm px-4 py-2.5 rounded outline-none focus:ring-2 focus:ring-[#CDB988] transition-colors"
                                placeholder="Karya tanpa judul"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-[#7E9385] hover:text-[#F5EFEB] hover:bg-[#08130E] transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all duration-150"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOP BAR / NAVBAR HEADER */}
            <header className="h-16 px-6 bg-[#091611] border-b border-[#182C24] flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2 group">
                        <img width={40} src="logo-wastrakarya.svg" />
                        <span className="font-heading text-2xl font-bold tracking-wide text-[#E2CEAB] group-hover:text-[#F3E5C8] transition-colors">
                            Wastrakarya
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0E1E18] border border-[#1E362C] flex items-center justify-center text-[#CDB988]">
                        <Layers size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#F5EFEB]">
                            Kanvas
                        </span>
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={(e) =>
                                    setProjectTitle(e.target.value)
                                }
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    setIsEditingTitle(false)
                                }
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

                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-[#7E9385] mr-2">
                        {hasUnsavedChanges
                            ? "Perubahan belum disimpan"
                            : "Perubahan tersimpan"}
                    </span>
                    <button
                        onClick={() => handleSave()}
                        className="bg-[#D5BD8A] hover:bg-[#C4AC79] active:scale-95 text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all duration-150 flex items-center gap-2"
                    >
                        <Save size={15} />
                        <span>Simpan</span>
                    </button>
                    <button
                        onClick={() => handleSave("/mockup")}
                        title="Lihat simulasi 3D desain batik pada kemeja"
                        className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2"
                    >
                        <Shirt size={15} className="text-[#CDB988]" />
                        <span>Simulasi 3D</span>
                    </button>
                </div>
            </header>

            {/* MAIN WORKSPACE LAYOUT (3 KOLOM) */}
            <div className="flex flex-1 overflow-hidden p-3 gap-3">
                {/* 1. PANEL SEBELAH KIRI (PERALATAN, WARNA MALAM, STATUS MALAM) */}
                <aside className="w-64 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-lg">
                    <div className="flex flex-col gap-5">
                        {/* Bagian: Status Malam & Aksi Utama */}
                        <div
                            className={`bg-[#0E1E18] border border-[#182C24] rounded-xl p-4 ${malamWiggle ? "animate-wiggle border-[#E88D8D] shadow-[0_0_0_6px_rgba(232,141,141,0.35)]" : "border-[#182C24]"}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-heading font-semibold text-lg text-[#E2CEAB]">
                                    Malam
                                </h3>
                            </div>

                            {/* Status Indicator */}
                            <div
                                className={`${malamInfo.bgColor} ${malamInfo.borderColor} rounded-xl p-4 mb-3 transition-all duration-300`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    {malamInfo.icon}
                                    <div className="flex-1">
                                        <p
                                            className={`font-semibold text-sm ${malamInfo.color}`}
                                        >
                                            {malamInfo.label}
                                        </p>
                                        <p className="text-xs text-[#7E9385] mt-0.5">
                                            {malamInfo.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Grafis Animasi Pemanasan: Malam (atas) + Kuali (tengah) + Api (bawah) */}
                                {malamState === "heating" && (
                                    <div className="relative w-full h-[122px] flex flex-col items-center justify-end select-none">
                                        {/* Api di bawah kuali */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[92px] h-[36px] z-0">
                                            <div
                                                className="absolute bottom-0 left-1/2 w-[72px] h-[22px] rounded-[50%] blur-md"
                                                style={{
                                                    background:
                                                        "radial-gradient(ellipse at center, rgba(255,176,64,0.8) 0%, rgba(226,69,43,0.35) 55%, rgba(226,69,43,0) 76%)",
                                                    animation:
                                                        "emberGlow 1.4s ease-in-out infinite",
                                                }}
                                            />
                                            <span
                                                className="flame-shape"
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    marginLeft: -14,
                                                    background:
                                                        "radial-gradient(circle at 50% 72%, #F6A02A 0%, #E2452B 72%)",
                                                    filter: "blur(1.4px)",
                                                    opacity: 0.85,
                                                    animationDuration: "0.62s",
                                                }}
                                            />
                                            <span
                                                className="flame-shape"
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    marginLeft: -9,
                                                    background:
                                                        "radial-gradient(circle at 50% 72%, #FFC24A 0%, #F07C1E 75%)",
                                                    filter: "blur(0.6px)",
                                                    animationDuration: "0.48s",
                                                    animationDelay: "0.1s",
                                                }}
                                            />
                                            <span
                                                className="flame-shape"
                                                style={{
                                                    width: 11,
                                                    height: 11,
                                                    marginLeft: -5.5,
                                                    background:
                                                        "radial-gradient(circle at 50% 72%, #FFF6D0 0%, #FFC24A 80%)",
                                                    animationDuration: "0.36s",
                                                    animationDelay: "0.18s",
                                                }}
                                            />
                                        </div>

                                        {/* Malam yang dipanaskan (di atas) */}
                                        <div
                                            className="relative z-20 animate-malam-bob"
                                            style={{
                                                width: 46,
                                                height: 46,
                                                marginBottom: -6,
                                                filter: `drop-shadow(0 0 7px ${waxColor}99)`,
                                            }}
                                            title={`Malam ${waxColorName}`}
                                        >
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    backgroundColor: waxColor,
                                                    WebkitMaskImage:
                                                        "url('/malam.png')",
                                                    maskImage:
                                                        "url('/malam.png')",
                                                    WebkitMaskRepeat:
                                                        "no-repeat",
                                                    maskRepeat: "no-repeat",
                                                    WebkitMaskPosition:
                                                        "center",
                                                    maskPosition: "center",
                                                    WebkitMaskSize: "contain",
                                                    maskSize: "contain",
                                                }}
                                            />
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background:
                                                        "linear-gradient(150deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%)",
                                                    WebkitMaskImage:
                                                        "url('/malam.png')",
                                                    maskImage:
                                                        "url('/malam.png')",
                                                    WebkitMaskRepeat:
                                                        "no-repeat",
                                                    maskRepeat: "no-repeat",
                                                    WebkitMaskPosition:
                                                        "center",
                                                    maskPosition: "center",
                                                    WebkitMaskSize: "contain",
                                                    maskSize: "contain",
                                                }}
                                            />
                                        </div>

                                        {/* Kuali (tengah) */}
                                        <img
                                            src="/pot.png"
                                            alt="Kuali pemanas malam"
                                            draggable={false}
                                            className="relative z-10 w-[100px] pointer-events-none"
                                            style={{ marginBottom: 26 }}
                                        />
                                    </div>
                                )}

                                {/* Progress Bar for Drawing Time */}
                                {malamState === "drawing" && (
                                    <div className="h-2 bg-[#08130E] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#56C87A] to-[#A8D5BA] transition-all duration-1000"
                                            style={{
                                                width: `${(drawingTimeLeft / 60) * 100}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Main Action Button */}
                            {malamInfo.actionLabel != "Menunggu..." &&
                                malamInfo.actionLabel != "Mulai Melukis" &&
                                malamInfo.actionLabel != "Sisa" && (
                                    <button
                                        onClick={handleCantingDip}
                                        disabled={
                                            malamState === "heating" ||
                                            malamState === "drawing"
                                        }
                                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${malamInfo.actionColor}`}
                                    >
                                        {malamState === "heating" && (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        )}
                                        {malamState === "drawing" && (
                                            <Timer size={16} />
                                        )}
                                        {malamState !== "heating" &&
                                            malamState !== "drawing" && (
                                                <Flame size={16} />
                                            )}
                                        <span>{malamInfo.actionLabel}</span>
                                    </button>
                                )}

                            {/* Reheat Button for Color Change */}
                            {malamInfo.showReheatButton && (
                                <button
                                    onClick={reheatForColorChange}
                                    className="w-full mt-2 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-[#142920] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#D5BD8A] hover:bg-[#1A3A2E]"
                                >
                                    <RotateCcw size={14} />
                                    <span>Panaskan Ulang (Ganti Warna)</span>
                                </button>
                            )}
                        </div>

                        {/* Bagian: Warna Malam - Only show when allowed */}
                        {malamInfo.showColorPicker && (
                            <div>
                                <h4 className="text-sm font-medium text-[#E2CEAB] mb-3">
                                    Pilih Warna Malam
                                </h4>
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                    {WAX_COLORS.map((swatch) => {
                                        const isSelected =
                                            waxColor.toLowerCase() ===
                                            swatch.hex.toLowerCase();
                                        return (
                                            <button
                                                key={swatch.hex}
                                                onClick={() => {
                                                    setWaxColor(swatch.hex);
                                                    setWaxColorName(
                                                        swatch.name,
                                                    );
                                                }}
                                                className={`relative w-12 h-12 rounded-xl border-2 transition-transform flex items-center justify-center overflow-hidden bg-[#08130E] ${
                                                    isSelected
                                                        ? "border-[#E2CEAB] scale-110 shadow-md ring-2 ring-[#CDB988]/40"
                                                        : "border-[#182C24] hover:scale-105 hover:border-[#2A473A]"
                                                }`}
                                                title={swatch.name}
                                            >
                                                <div
                                                    className="w-10 h-10"
                                                    style={{
                                                        backgroundColor:
                                                            swatch.hex,
                                                        WebkitMaskImage:
                                                            "url('/malam.png')",
                                                        maskImage:
                                                            "url('/malam.png')",
                                                        WebkitMaskRepeat:
                                                            "no-repeat",
                                                        maskRepeat: "no-repeat",
                                                        WebkitMaskPosition:
                                                            "center",
                                                        maskPosition: "center",
                                                        WebkitMaskSize:
                                                            "contain",
                                                        maskSize: "contain",
                                                    }}
                                                />
                                                {isSelected && (
                                                    <Check
                                                        size={14}
                                                        className="absolute bottom-0.5 right-0.5 text-[#E2CEAB] drop-shadow"
                                                        strokeWidth={3}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}

                                    <label
                                        className="w-12 h-12 rounded-xl border-2 border-[#182C24] hover:border-[#CDB988] flex flex-col items-center justify-center cursor-pointer text-[#7E9385] hover:text-[#E2CEAB] transition-colors bg-[#08130E]"
                                        title="Pilih warna kustom"
                                    >
                                        <Palette size={14} />
                                        <span className="text-[9px] mt-0.5">
                                            Kustom
                                        </span>
                                        <input
                                            type="color"
                                            value={waxColor}
                                            onChange={(e) => {
                                                setWaxColor(e.target.value);
                                                setWaxColorName("Kustom");
                                            }}
                                            className="sr-only"
                                        />
                                    </label>
                                </div>

                                <div className="flex items-center justify-between text-xs text-[#9CB0A4]">
                                    <span>{waxColorName}</span>
                                    <span className="font-mono text-[11px] text-[#7E9385] uppercase">
                                        {waxColor}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Show locked color when not in cold/hardened state */}
                        {!malamInfo.showColorPicker && (
                            <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="font-medium text-[#E2CEAB]">
                                        Warna Malam
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 flex-shrink-0"
                                        style={{
                                            backgroundColor: waxColor,
                                            WebkitMaskImage:
                                                "url('/malam.png')",
                                            maskImage: "url('/malam.png')",
                                            WebkitMaskRepeat: "no-repeat",
                                            maskRepeat: "no-repeat",
                                            WebkitMaskPosition: "center",
                                            maskPosition: "center",
                                            WebkitMaskSize: "contain",
                                            maskSize: "contain",
                                        }}
                                        title={waxColorName}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[#E2CEAB] truncate">
                                            {waxColorName}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[11px] opacity-70 text-[#E2CEAB] mt-2">
                                    Panaskan ulang malam untuk mengganti warna.
                                </p>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="h-px bg-[#182C24] my-1" />

                        {/* Bagian: Alat Lukis */}
                        <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C7265] mb-3 block">
                                Alat Lukis
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                                {[
                                    {
                                        id: "canting",
                                        label: "Canting",
                                        icon: (
                                            <img
                                                alt=""
                                                className="select-none"
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    transform:
                                                        "translate(10px, -10px) scale(4) rotate(-55deg)",
                                                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                                                }}
                                                draggable={false}
                                                src="/canting.png"
                                            />
                                        ),
                                    },
                                    {
                                        id: "pencil",
                                        label: "Pensil",
                                        icon: (
                                            <img
                                                alt=""
                                                className="select-none"
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    transform:
                                                        "translate(10px, -15px) scale(4) rotate(-90deg)",
                                                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                                                }}
                                                draggable={false}
                                                src="/pensil.png"
                                            />
                                        ),
                                    },
                                    {
                                        id: "eraser",
                                        label: "Penghapus",
                                        icon: (
                                            <img
                                                alt=""
                                                className="select-none"
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    transform:
                                                        "translate(10px, -15px) scale(4) rotate(-70deg)",
                                                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                                                }}
                                                draggable={false}
                                                src="/penghapus.png"
                                            />
                                        ),
                                    },
                                ].map((tool) => {
                                    const active = activeTool === tool.id;
                                    return (
                                        <button
                                            key={tool.id}
                                            onClick={() => selectTool(tool.id)}
                                            title={tool.label}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all [clip-path:inset(0)] ${
                                                active
                                                    ? "bg-[#142920] border-[#CDB988] text-[#E2CEAB] shadow-sm"
                                                    : "bg-[#08130E] border-[#182C24] text-[#7E9385] hover:bg-[#0E1E18] hover:border-[#2A473A] hover:text-[#E2CEAB]"
                                            }`}
                                        >
                                            <div
                                                className={`w-6 h-6 flex items-center justify-center ${active ? "text-[#D5BD8A]" : "text-[#9CB0A4]"}`}
                                            >
                                                {tool.icon}
                                            </div>
                                            <span className="text-[10px] font-medium leading-none">
                                                {tool.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 2. PANEL TENGAH (KANVAS LUKIS BATIK) */}
                <main
                    className="flex-1 flex flex-col bg-[#08140F] border border-[#182C24] rounded-2xl p-3 shadow-xl overflow-hidden relative"
                    ref={containerRef}
                    onPointerDown={handleContainerPointerDown}
                >
                    {/* Header Bar Kanvas */}
                    <div className="flex items-center justify-between pb-3 shrink-0">
                        <div className="flex items-baseline gap-3">
                            <h2 className="font-heading text-xl font-bold text-[#E2CEAB]">
                                Kain
                            </h2>
                        </div>

                        <div className="bg-[#0B1712] border border-[#182C24] rounded-xl px-3 py-1.5 flex items-center gap-3 text-[#9CB0A4] shadow-sm">
                            <button
                                onClick={handleUndo}
                                disabled={!canUndo}
                                title="Batalkan (Ctrl+Z)"
                                className={`p-1 rounded hover:bg-[#162B21] transition-colors ${
                                    canUndo
                                        ? "text-[#E2CEAB] cursor-pointer"
                                        : "opacity-40 cursor-not-allowed"
                                }`}
                            >
                                <Undo2 size={16} />
                            </button>

                            <button
                                onClick={handleRedo}
                                disabled={!canRedo}
                                title="Ulangi (Ctrl+Y)"
                                className={`p-1 rounded hover:bg-[#162B21] transition-colors ${
                                    canRedo
                                        ? "text-[#E2CEAB] cursor-pointer"
                                        : "opacity-40 cursor-not-allowed"
                                }`}
                            >
                                <Redo2 size={16} />
                            </button>

                            <div className="w-px h-4 bg-[#182C24]" />

                            <button
                                onClick={handleZoomOut}
                                title="Perkecil (-)"
                                className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                            >
                                <Minus size={15} />
                            </button>

                            <button
                                onClick={handleResetZoom}
                                title="Kembalikan ke 100%"
                                className="text-xs font-mono font-medium text-[#E2CEAB] min-w-12 text-center hover:underline"
                            >
                                {Math.round(zoom * 100)}%
                            </button>

                            <button
                                onClick={handleZoomIn}
                                title="Perbesar (+)"
                                className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                            >
                                <Plus size={15} />
                            </button>

                            <div className="w-px h-4 bg-[#182C24]" />

                            <button
                                onClick={handleResetZoom}
                                title="Pusatkan Tampilan"
                                className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                            >
                                <Maximize2 size={15} />
                            </button>

                            <div className="w-px h-4 bg-[#182C24]" />

                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setShowMoreMenu(!showMoreMenu)
                                    }
                                    title="Opsi Kanvas Lainnya"
                                    className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                                >
                                    <MoreHorizontal size={16} />
                                </button>

                                {showMoreMenu && (
                                    <div className="absolute right-0 top-8 w-60 bg-[#0E1F18] border border-[#223E31] rounded-xl shadow-2xl py-2 z-40 text-xs text-[#D8C7A5]">
                                        <button
                                            onClick={handleClearCanvas}
                                            className="w-full px-3.5 py-2 text-left hover:bg-[#3E1E1E] flex items-center gap-2.5 text-[#E88D8D]"
                                        >
                                            <Trash2 size={14} />
                                            <span>Bersihkan Kanvas</span>
                                        </button>
                                        <button
                                            onClick={handleExportFullFabric}
                                            className="w-full px-3.5 py-2 text-left hover:bg-[#183327] flex items-center gap-2.5"
                                        >
                                            <Download size={14} />
                                            <span>Unduh Kain Penuh (PNG)</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Kanvas Utama */}
                    <div
                        className="flex-1 relative overflow-hidden"
                        style={{ touchAction: "none" }}
                        ref={containerRef}
                    >
                        <canvas
                            ref={canvasRef}
                            width={canvasWidth}
                            height={canvasHeight}
                            className={`block ${activeTool !== "canting" || malamState === "ready" || malamState === "drawing" ? "cursor-none" : "cursor-crosshair"}`}
                            style={{ touchAction: "none" }}
                            onPointerDown={handleCanvasPointerDown}
                            onPointerMove={handleCanvasPointerMove}
                            onPointerUp={handleCanvasPointerUp}
                            onPointerLeave={handleCanvasPointerUp}
                            onPointerOut={handleCanvasPointerUp}
                            onContextMenu={(e) => e.preventDefault()}
                        />

                        {/* Tool overlay that follows cursor (always for Pencil/Eraser; Canting when malam ready/drawing) */}
                        {cursorPos &&
                            cursorPos.isInside &&
                            (activeTool !== "canting" ||
                                malamState === "ready" ||
                                malamState === "drawing") && (
                                <div
                                    className="absolute pointer-events-none transition-transform duration-75 z-10"
                                    style={{
                                        left: cursorPos.screenX,
                                        top: cursorPos.screenY,
                                        transformOrigin: "top left",
                                        transform: `rotate(${cursorAngle}deg) ${isPressed ? "scale(0.85)" : "scale(1)"}`,
                                        opacity: isPressed ? 0.6 : 1,
                                        willChange: "transform, opacity",
                                    }}
                                >
                                    {activeTool === "canting" ? (
                                        <img
                                            src="/canting.png"
                                            alt=""
                                            className="select-none"
                                            style={{
                                                width: 120,
                                                height: "auto",
                                                transform:
                                                    "translate(0px, -37px)",
                                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                                            }}
                                            draggable={false}
                                        />
                                    ) : activeTool === "eraser" ? (
                                        <img
                                            src="/penghapus.png"
                                            alt=""
                                            className="select-none"
                                            style={{
                                                width: 70,
                                                height: "auto",
                                                transform:
                                                    "translate(0, -35px)",
                                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                                            }}
                                            draggable={false}
                                        />
                                    ) : (
                                        <img
                                            src="/pensil.png"
                                            alt=""
                                            className="select-none"
                                            style={{
                                                width: 120,
                                                height: "auto",
                                                transform:
                                                    "translate(-10px, 0px)",
                                                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                                            }}
                                            draggable={false}
                                        />
                                    )}
                                </div>
                            )}

                        {/* Drawing Time Warning */}
                        {malamState === "drawing" &&
                            drawingTimeLeft <= 10 &&
                            drawingTimeLeft > 0 && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-pulse">
                                    <div className="bg-[#E88D8D]/90 border border-[#E88D8D] rounded-xl px-4 py-2 flex items-center gap-2 text-white text-sm font-medium shadow-xl">
                                        <AlertTriangle size={16} />
                                        <span>
                                            Waktu tersisa: {drawingTimeLeft}{" "}
                                            detik!
                                        </span>
                                    </div>
                                </div>
                            )}
                    </div>

                    <div className="h-10 px-3 bg-[#0B1712] border-t border-[#182C24] flex items-center justify-between text-xs text-[#7E9385] shrink-0">
                        {/* <span>{statusMessage}</span> */}
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-[#9CB0A4]">
                                {Math.round(canvasWidth / 8)} ×{" "}
                                {Math.round(canvasHeight / 8)} cm
                            </span>
                            <span>|</span>
                            <span className="font-mono text-[#9CB0A4]">
                                {canvasWidth}×{canvasHeight}
                            </span>
                        </div>
                    </div>
                </main>

                {/* 3. PANEL SEBELAH KANAN (PRESET MOTIF BATIK & PANDUAN) */}
                <aside className="w-72 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col shrink-0 shadow-lg">
                    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <h3 className="font-heading font-semibold text-lg text-[#E2CEAB]">
                                Pakem Motif Batik
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() =>
                                        setShowTileGrid(!showTileGrid)
                                    }
                                    className={`p-1.5 rounded transition-colors ${showTileGrid ? "bg-[#142920] border-[#CDB988] text-[#D5BD8A]" : "bg-[#08130E] border-[#182C24] text-[#7E9385] hover:border-[#2A473A]"}`}
                                    title={
                                        showTileGrid
                                            ? "Sembunyikan garis batas kanvas"
                                            : "Tampilkan garis batas kanvas"
                                    }
                                >
                                    <Grid size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-1 bg-[#0E1E18] border border-[#182C24] rounded-xl p-1 shrink-0">
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    activeTab === "all"
                                        ? "bg-[#142920] text-[#E2CEAB] shadow-sm"
                                        : "text-[#7E9385] hover:text-[#E2CEAB]"
                                }`}
                            >
                                Panduan
                            </button>
                            <button
                                onClick={() => setActiveTab("favorites")}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    activeTab === "favorites"
                                        ? "bg-[#142920] text-[#E2CEAB] shadow-sm"
                                        : "text-[#7E9385] hover:text-[#E2CEAB]"
                                }`}
                            >
                                <Heart
                                    size={12}
                                    className="inline-block mr-1"
                                />{" "}
                                Favorit
                            </button>
                            <button
                                onClick={() => setActiveTab("saved")}
                                disabled={!user}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    activeTab === "saved"
                                        ? "bg-[#142920] text-[#E2CEAB] shadow-sm"
                                        : !user
                                          ? "opacity-40 cursor-not-allowed text-[#7E9385]"
                                          : "text-[#7E9385] hover:text-[#E2CEAB]"
                                }`}
                                title={
                                    !user
                                        ? "Masuk untuk melihat simpanan karya"
                                        : "Simpanan Karya"
                                }
                            >
                                <Save size={12} className="inline-block mr-1" />{" "}
                                Simpanan
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1">
                            {activeTab === "saved" ? (
                                <div className="flex flex-col gap-2">
                                    {savedLoading ? (
                                        <div className="text-center py-8 text-[#5C7265] text-sm">
                                            Memuat simpanan...
                                        </div>
                                    ) : savedDrawings.length === 0 ? (
                                        <div className="text-center py-8 text-[#5C7265] text-sm">
                                            {user
                                                ? "Belum ada karyaan disimpan"
                                                : "Masuk untuk melihat simpanan karya Anda"}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {savedDrawings.map((drawing) => (
                                                <div
                                                    key={drawing.id}
                                                    className="flex items-center gap-3 p-2 bg-[#08130E] border border-[#182C24] rounded-xl group"
                                                >
                                                    <img
                                                        src={drawing.data_url}
                                                        alt={drawing.title}
                                                        className="w-16 h-12 object-cover rounded-lg border border-[#182C24] bg-[#0E1E18]"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium text-[#E2CEAB] truncate">
                                                                {drawing.title}
                                                            </span>
                                                            <span className="text-[10px] text-[#7E9385]">
                                                                {new Date(
                                                                    drawing.updated_at,
                                                                ).toLocaleDateString(
                                                                    "id-ID",
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-[#5C7265] truncate">
                                                            Motif:{" "}
                                                            {drawing.motif ||
                                                                "-"}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() =>
                                                                handleLoadDrawing(
                                                                    drawing,
                                                                )
                                                            }
                                                            className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                                                            title="Muat karya ke kanvas"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteDrawing(
                                                                    drawing.id,
                                                                );
                                                            }}
                                                            className="p-1 rounded hover:bg-[#3E1E1E] text-[#E88D8D] hover:text-[#F5EFEB] transition-colors"
                                                            title="Hapus simpanan"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : filteredMotifs.length === 0 ? (
                                <div className="text-center py-8 text-[#5C7265] text-sm">
                                    Tidak ada motif ditemukan
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {filteredMotifs.map((motif) => (
                                        <button
                                            key={motif.id}
                                            onClick={() => {
                                                if (motif.id === "polos") {
                                                    setSelectedMotif("polos");
                                                    setShowGuide(false);
                                                    showToast(
                                                        `Mode Kanvas Polos (Tanpa Panduan) aktif`,
                                                    );
                                                } else {
                                                    setSelectedMotif(motif.id);
                                                    setShowGuide(true);
                                                    showToast(
                                                        `Panduan pola ${motif.name} diaktifkan`,
                                                    );
                                                }
                                            }}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                toggleFavorite(motif.id, e);
                                            }}
                                            className={`relative group flex flex-col items-center p-3 rounded-xl border transition-all ${
                                                selectedMotif === motif.id
                                                    ? "bg-[#142920] border-[#CDB988] shadow-md ring-1 ring-[#CDB988]/30"
                                                    : "bg-[#08130E] border-[#182C24] hover:border-[#2A473A] hover:bg-[#0E1E18]"
                                            }`}
                                        >
                                            <div className="w-14 h-14 rounded-lg bg-[#0E1E18] border border-[#182C24] flex items-center justify-center mb-2 relative overflow-hidden">
                                                {motif.svgIcon}
                                                {favorites.includes(
                                                    motif.id,
                                                ) && (
                                                    <div className="absolute top-1 right-1">
                                                        <Heart
                                                            size={12}
                                                            className="text-[#E88D8D] fill-current"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-[#E2CEAB] text-center truncate w-full px-1">
                                                {motif.name}
                                            </span>
                                            <span className="text-[10px] text-[#7E9385] text-center truncate w-full px-1">
                                                {motif.origin}
                                            </span>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetailMotifModal(motif);
                                                }}
                                                className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#7E9385] hover:text-[#CDB988]"
                                                title="Lihat detail filosofi motif"
                                            >
                                                <Info size={12} />
                                            </button>

                                            <button
                                                onClick={(e) =>
                                                    toggleFavorite(motif.id, e)
                                                }
                                                className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#7E9385] hover:text-[#E88D8D]"
                                                title={
                                                    favorites.includes(motif.id)
                                                        ? "Hapus dari favorit"
                                                        : "Tambah ke favorit"
                                                }
                                            >
                                                <Heart
                                                    size={12}
                                                    className={
                                                        favorites.includes(
                                                            motif.id,
                                                        )
                                                            ? "fill-current text-[#E88D8D]"
                                                            : "text-[#7E9385]"
                                                    }
                                                />
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3 shrink-0 text-[11px] text-[#7E9385] leading-relaxed">
                            <p className="font-medium text-[#E2CEAB] mb-1">
                                Tutorial Membatik
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-[#9CB0A4]">
                                <li>Gambar motif dengan pensil</li>
                                <li>Pilih warna malam</li>
                                <li>Panaskan malam selama 5 detik</li>
                                <li>Lukis malam di kanvas</li>
                                <li>
                                    Panaskan ulang malam apabila mengeras
                                </li>
                            </ol>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
