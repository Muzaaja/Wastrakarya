import React, {
    useState,
    useRef,
    useEffect,
    useLayoutEffect,
    useCallback,
} from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
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
    Share2,
    Users,
    Lock,
    Globe,
    Crown,
} from "lucide-react";
import {
    BATIK_MOTIFS,
    renderDottedGuide,
    autoTraceMotifWax,
} from "@/Components/WastraCanvas/BatikMotifs";
import getEcho from "@/echo";
import ShareModal from "@/Components/WastraCanvas/ShareModal";
import SubscriptionModal from "@/Components/WastraCanvas/SubscriptionModal";

const loadMalamPouring3D = () =>
    import("@/Components/WastraCanvas/MalamPouring3D");
const MalamPouring3D = React.lazy(loadMalamPouring3D);
const loadMalamHardening3D = () =>
    import("@/Components/WastraCanvas/MalamHardening3D");
const MalamHardening3D = React.lazy(loadMalamHardening3D);

const CANVAS_SYNC_CHUNK_SIZE = 6000;
const CANVAS_SYNC_MAX_CHUNKS = 2000;
const CANVAS_SYNC_TIMEOUT_MS = 15000;
const DRAWING_DURATION_SECONDS = 90;
const TUTORIAL_STEPS = [
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

const FIRST_POPUP_TUTORIAL_STEP = 6;
const LAST_POPUP_TUTORIAL_STEP = 10;

export default function WastraCanvas({ initialDrawing = null, canvasId = null }) {
    // Canvas ref & Context
    const canvasRef = useRef(null); // visible display canvas
    const containerRef = useRef(null);
    const artworkCanvasRef = useRef(null); // offscreen artwork store (world coords)
    const canvasBaseLayerRef = useRef(null); // cached cloth, motif guide, and grid
    const canvasBaseLayerKeyRef = useRef("");
    const renderFrameRef = useRef(null);
    const malamCardRef = useRef(null);
    const heatingDialogRef = useRef(null);
    const heatingBackdropRef = useRef(null);
    const heatingOriginRectRef = useRef(null);
    const shouldAnimateHeatingOpenRef = useRef(false);
    const isClosingHeatingOverlayRef = useRef(false);

    // Konfigurasi Kanvas
    const canvasWidth = 960;
    const canvasHeight = 960;

    // State Peralatan & Lilin Malam - NEW WORKFLOW
    const [malamState, setMalamState] = useState("cold"); // 'cold', 'preparing', 'heating', 'pouring', 'ready', 'drawing', 'hardened'
    const [heatingProgress, setHeatingProgress] = useState(0); // 0-100 for 5 seconds
    const [isMalamInPot, setIsMalamInPot] = useState(false);
    const [isDraggingMalam, setIsDraggingMalam] = useState(false);
    const [isPotDragOver, setIsPotDragOver] = useState(false);
    const [isMalamPouringFinished, setIsMalamPouringFinished] =
        useState(false);
    const [drawingTimeLeft, setDrawingTimeLeft] = useState(
        DRAWING_DURATION_SECONDS,
    );
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
    const [selectedMotif, setSelectedMotif] = useState(
        initialDrawing?.motif || "kawung",
    );
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
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [detailMotifModal, setDetailMotifModal] = useState(null);
    const [projectTitle, setProjectTitle] = useState(
        initialDrawing?.title || "Karya tanpa judul",
    );
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");
    const [saveRedirect, setSaveRedirect] = useState(null);
    const [restoreDrawing, setRestoreDrawing] = useState(false);
    const [loadedDrawingId, setLoadedDrawingId] = useState(
        initialDrawing?.id || canvasId || null,
    );

    // State Kolaborasi Realtime & Berbagi
    const [shareType, setShareType] = useState(
        initialDrawing?.share_type || "private",
    );
    const [shareToken, setShareToken] = useState(
        initialDrawing?.share_token || null,
    );
    const [isOwner, setIsOwner] = useState(
        initialDrawing ? Boolean(initialDrawing.is_owner) : true,
    );
    const [canvasOwner, setCanvasOwner] = useState(
        initialDrawing?.owner || null,
    );
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [activeCollaborators, setActiveCollaborators] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState({});
    const canvasChannelRef = useRef(null);
    const currentChannelDrawingId = useRef(null);
    const incomingCanvasSyncsRef = useRef(new Map());
    const lastCursorBroadcastRef = useRef(0);

    const hasActiveSubscription = Boolean(
        user?.has_active_subscription ?? user?.is_subscribed,
    );

    const applyMotifSelection = useCallback(
        (
            motifId,
            { broadcastChange = false, markUnsaved = false } = {},
        ) => {
            if (!motifId) return;

            setSelectedMotif(motifId);
            setShowGuide(motifId !== "polos" && motifId !== "none");

            if (markUnsaved) {
                setHasUnsavedChanges(true);
            }

            if (
                broadcastChange &&
                canvasChannelRef.current &&
                loadedDrawingId
            ) {
                try {
                    canvasChannelRef.current.whisper("motif", {
                        motif: motifId,
                        userId: user?.id,
                        userName: user?.name,
                    });
                } catch (_) {}
            }
        },
        [loadedDrawingId, user?.id, user?.name],
    );

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
            if (Array.isArray(data)) {
                setSavedDrawings(data);
            } else if (data && Array.isArray(data.own)) {
                setSavedDrawings([...data.own, ...(data.shared || [])]);
            } else {
                setSavedDrawings([]);
            }
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
        if (canvasChannelRef.current && loadedDrawingId) {
            try {
                canvasChannelRef.current.whisper("clear", {
                    userId: user?.id,
                    userName: user?.name,
                });
            } catch (_) {}
        }
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
        if (canvasChannelRef.current && loadedDrawingId) {
            try {
                canvasChannelRef.current.whisper("trace", {
                    motif: selectedMotif,
                    color: waxColor,
                    size: cantingSize,
                    userId: user?.id,
                    userName: user?.name,
                });
            } catch (_) {}
        }
        setStatusMessage(
            `Pola ${selectedMotif} berhasil dijiplak dengan lilin malam.`,
        );
        showToast(`Pola ${selectedMotif} berhasil dijiplak!`);
        setShowMoreMenu(false);
    };

    // Simpan Karya ke Database (User yang login) atau LocalStorage (tamu)
    const handleSave = async (redirectTo = null) => {
        if (user && loadedDrawingId && !isOwner) {
            showToast("Hanya pemilik kanvas yang dapat menyimpan perubahan");
            return;
        }

        const artwork = getArtworkCanvas();
        if (!artwork) return;
        setSaveRedirect(redirectTo);
        setSaveNameInput(projectTitle);
        setShowSaveDialog(true);
        setShowMoreMenu(false);
    };

    // Konfirmasi simpan dengan nama karya dari popup
    const handleConfirmSave = async (customTitle = null, openShareAfterSave = false) => {
        if (user && loadedDrawingId && !isOwner) {
            setShowSaveDialog(false);
            showToast("Hanya pemilik kanvas yang dapat menyimpan perubahan");
            return;
        }

        const artwork = getArtworkCanvas();
        if (!artwork) return;

        const title = (typeof customTitle === "string" && customTitle.trim())
            ? customTitle.trim()
            : (saveNameInput.trim() || projectTitle);
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
                if (data?.id) {
                    setLoadedDrawingId(data.id);
                    if (data.share_type) setShareType(data.share_type);
                    if (data.share_token) setShareToken(data.share_token);
                    if (data.is_owner !== undefined) setIsOwner(data.is_owner);
                    if (data.owner) setCanvasOwner(data.owner);
                }
                showToast("Karya berhasil disimpan!");
                if (openShareAfterSave && data?.id) {
                    setShareModalOpen(true);
                }
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

    // Buka Modal Berbagi & Kolaborasi
    const handleOpenShare = async () => {
        if (!isOwner) return;

        if (!user) {
            showToast("Silakan masuk terlebih dahulu untuk membagikan kanvas.");
            return;
        }

        // Gatekeep fitur kolaborasi hanya untuk pengguna dengan paket langganan aktif
        if (!hasActiveSubscription) {
            setShowSubscriptionModal(true);
            return;
        }

        if (!loadedDrawingId) {
            showToast("Menyiapkan dan menyimpan kanvas terlebih dahulu...");
            await handleConfirmSave(null, true);
            return;
        }
        setShareModalOpen(true);
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
        if (drawing.motif) applyMotifSelection(drawing.motif);
        if (drawing.wax_color) setWaxColor(drawing.wax_color);
        if (drawing.wax_color_name) setWaxColorName(drawing.wax_color_name);
        setHasUnsavedChanges(false);
        setActiveTab("all");
        setLoadedDrawingId(drawing.id ?? null);
        if (drawing.share_type) setShareType(drawing.share_type);
        if (drawing.share_token) setShareToken(drawing.share_token);
        const drawingIsOwner = drawing.is_owner !== undefined
            ? Boolean(drawing.is_owner)
            : Number(drawing.user_id) === Number(user?.id);
        const drawingOwner = drawing.owner || drawing.user || (
            drawingIsOwner && user
                ? { id: user.id, name: user.name }
                : null
        );
        setIsOwner(drawingIsOwner);
        setCanvasOwner(drawingOwner);
        if (!drawingIsOwner) setShareModalOpen(false);
        showToast(`Karya "${drawing.title}" dimuat`);
    }, [applyMotifSelection, user?.id]);

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

        void loadMalamPouring3D();
        shouldAnimateHeatingOpenRef.current = false;
        const malamCardRect = malamCardRef.current?.getBoundingClientRect();
        if (malamCardRect) {
            heatingOriginRectRef.current = {
                left: malamCardRect.left,
                top: malamCardRect.top,
                width: malamCardRect.width,
                height: malamCardRect.height,
            };
            shouldAnimateHeatingOpenRef.current = true;
        }

        setMalamState("preparing");
        setHeatingProgress(0);
        setIsMalamInPot(false);
        setIsDraggingMalam(false);
        setIsPotDragOver(false);
        setIsMalamPouringFinished(false);
        setStatusMessage(
            "Masukkan malam ke dalam kuali, lalu nyalakan api untuk mulai memanaskan.",
        );
    };

    const placeMalamInPot = () => {
        if (malamState !== "preparing" || isMalamInPot) return;

        setIsMalamInPot(true);
        setIsDraggingMalam(false);
        setIsPotDragOver(false);
        setStatusMessage(
            "Malam sudah berada di dalam kuali. Nyalakan api untuk mulai memanaskan.",
        );
    };

    const handleMalamDragStart = (event) => {
        if (malamState !== "preparing" || isMalamInPot) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", "malam");
        setIsDraggingMalam(true);
    };

    const handleMalamDrop = (event) => {
        event.preventDefault();

        if (event.dataTransfer.getData("text/plain") !== "malam") return;

        placeMalamInPot();
    };

    const completeMalamPouring = useCallback(() => {
        setIsMalamPouringFinished(true);
        setStatusMessage(
            "Canting terisi malam! Tutup popup untuk kembali ke kanvas.",
        );
    }, []);

    const closeHeatingOverlay = () => {
        if (
            malamState !== "pouring" ||
            !isMalamPouringFinished ||
            isClosingHeatingOverlayRef.current
        ) {
            return;
        }

        isClosingHeatingOverlayRef.current = true;

        const dialog = heatingDialogRef.current;
        const backdrop = heatingBackdropRef.current;
        const sourceCard = malamCardRef.current;
        const destinationRect =
            heatingOriginRectRef.current ??
            sourceCard?.getBoundingClientRect();
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        const finishClosing = () => {
            if (sourceCard) {
                sourceCard.style.opacity = "";
                sourceCard.style.minHeight = "";
            }
            if (dialog) {
                dialog.style.willChange = "auto";
            }
            if (backdrop) {
                backdrop.style.willChange = "auto";
            }

            isClosingHeatingOverlayRef.current = false;
            setMalamState("ready");
            setStatusMessage(
                'Canting terisi malam! Tekan "Mulai Melukis" untuk mulai membatik.',
            );
        };

        if (
            !dialog ||
            !backdrop ||
            !destinationRect ||
            prefersReducedMotion ||
            typeof dialog.animate !== "function"
        ) {
            finishClosing();
            return;
        }

        const dialogRect = dialog.getBoundingClientRect();
        const destinationCenterX =
            destinationRect.left + destinationRect.width / 2;
        const destinationCenterY =
            destinationRect.top + destinationRect.height / 2;
        const dialogCenterX = dialogRect.left + dialogRect.width / 2;
        const dialogCenterY = dialogRect.top + dialogRect.height / 2;
        const translateX = destinationCenterX - dialogCenterX;
        const translateY = destinationCenterY - dialogCenterY;
        const scale = Math.max(
            0.2,
            Math.min(
                0.9,
                Math.min(
                    destinationRect.width / dialogRect.width,
                    destinationRect.height / dialogRect.height,
                ),
            ),
        );

        dialog.style.willChange = "transform, opacity";
        backdrop.style.willChange = "opacity";
        if (sourceCard) {
            sourceCard.style.opacity = "0";
            sourceCard.style.minHeight = `${destinationRect.height}px`;
        }

        const dialogAnimation = dialog.animate(
            [
                {
                    transform: "translate3d(0, 0, 0) scale(1)",
                    opacity: 1,
                },
                {
                    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                    opacity: 0.45,
                },
            ],
            {
                duration: 460,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "forwards",
            },
        );
        const backdropAnimation = backdrop.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            {
                duration: 360,
                easing: "ease-out",
                fill: "forwards",
            },
        );

        void Promise.allSettled([
            dialogAnimation.finished,
            backdropAnimation.finished,
        ]).then(finishClosing);
    };

    const igniteHeatingFire = () => {
        if (malamState !== "preparing" || !isMalamInPot) return;

        setMalamState("heating");
        setHeatingProgress(0);
        setStatusMessage(
            "Memanas malam... Tunggu 5 detik hingga lilin meleleh sempurna.",
        );

        let nextProgress = 0;
        heatingTimerRef.current = setInterval(() => {
            nextProgress = Math.min(100, nextProgress + 20);
            setHeatingProgress(nextProgress);

            if (nextProgress < 100) return;

            clearInterval(heatingTimerRef.current);
            setMalamState("pouring");
            setStatusMessage("Menuangkan malam cair ke dalam canting...");
        }, 1000);
    };

    const startDrawingTimer = () => {
        setMalamState("drawing");
        setDrawingTimeLeft(DRAWING_DURATION_SECONDS);

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
        void loadMalamHardening3D();
        startDrawingTimer();
    };

    // Reheat to change color - resets to cold state
    const reheatForColorChange = () => {
        // Clear timers
        if (heatingTimerRef.current) clearInterval(heatingTimerRef.current);
        if (drawingTimerRef.current) clearInterval(drawingTimerRef.current);

        setMalamState("cold");
        setHeatingProgress(0);
        setIsMalamInPot(false);
        setIsDraggingMalam(false);
        setIsPotDragOver(false);
        setIsMalamPouringFinished(false);
        setDrawingTimeLeft(DRAWING_DURATION_SECONDS);
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

    // Trigger tutorial on page load
    useEffect(() => {
        if (user) return;
        const t = setTimeout(() => setShowTutorial(true), 600);
        return () => clearTimeout(t);
    }, [user]);

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

    const getCanvasBaseLayer = useCallback(() => {
        if (!canvasBaseLayerRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvasBaseLayerRef.current = canvas;
        }

        const baseLayer = canvasBaseLayerRef.current;
        const cacheKey = [
            canvasWidth,
            canvasHeight,
            showGuide,
            selectedMotif,
            guideOpacity,
            showTileGrid,
        ].join(":");

        if (canvasBaseLayerKeyRef.current === cacheKey) {
            return baseLayer;
        }

        const ctx = baseLayer.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Latar kain dan teksturnya bersifat statis, sehingga cukup diraster sekali.
        ctx.fillStyle = "#F5EFEB";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = "rgba(0, 0, 0, 0.012)";
        for (let x = 0; x < canvasWidth; x += 4) {
            ctx.fillRect(x, 0, 1, canvasHeight);
        }
        for (let y = 0; y < canvasHeight; y += 4) {
            ctx.fillRect(0, y, canvasWidth, 1);
        }

        if (
            showGuide &&
            selectedMotif &&
            selectedMotif !== "polos" &&
            selectedMotif !== "none"
        ) {
            const guideTile = document.createElement("canvas");
            guideTile.width = TILE_SIZE;
            guideTile.height = TILE_SIZE;
            renderDottedGuide(
                guideTile.getContext("2d"),
                selectedMotif,
                TILE_SIZE,
                guideOpacity,
            );

            const guidePattern = ctx.createPattern(guideTile, "repeat");
            if (guidePattern) {
                ctx.fillStyle = guidePattern;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
        }

        if (showTileGrid) {
            ctx.save();
            ctx.strokeStyle = "rgba(164, 140, 92, 0.3)";
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
            ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

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

        canvasBaseLayerKeyRef.current = cacheKey;

        return baseLayer;
    }, [
        canvasWidth,
        canvasHeight,
        showGuide,
        selectedMotif,
        guideOpacity,
        showTileGrid,
    ]);

    const renderMainCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const artwork = getArtworkCanvas();
        const baseLayer = getCanvasBaseLayer();

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

        // Static layers are cached; only the artwork changes while drawing.
        ctx.drawImage(baseLayer, 0, 0);
        ctx.drawImage(artwork, 0, 0);

        ctx.restore();
    }, [
        pan,
        zoom,
        canvasWidth,
        canvasHeight,
        getArtworkCanvas,
        getCanvasBaseLayer,
    ]);

    const renderMainCanvasRef = useRef(renderMainCanvas);
    useEffect(() => {
        renderMainCanvasRef.current = renderMainCanvas;
    }, [renderMainCanvas]);

    const scheduleMainCanvasRender = useCallback(() => {
        if (renderFrameRef.current !== null) return;

        renderFrameRef.current = window.requestAnimationFrame(() => {
            renderFrameRef.current = null;
            renderMainCanvasRef.current();
        });
    }, []);

    useEffect(() => {
        scheduleMainCanvasRender();
    }, [renderMainCanvas, scheduleMainCanvasRender]);

    useEffect(() => {
        return () => {
            if (renderFrameRef.current !== null) {
                window.cancelAnimationFrame(renderFrameRef.current);
            }
        };
    }, []);

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

    // Menggambar goresan dari kolaborator remote
    const drawRemoteStamp = (x, y, r, color, erase) => {
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

    const drawRemoteLineBetween = (p1, p2, size, color, erase) => {
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
            drawRemoteStamp(wx, wy, r, color, erase);
        }

        scheduleMainCanvasRender();
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

        // Siarkan goresan ke kolaborator secara realtime
        if (canvasChannelRef.current && loadedDrawingId) {
            try {
                canvasChannelRef.current.whisper("stroke", {
                    p1: { x: p1.x, y: p1.y },
                    p2: { x: p2.x, y: p2.y },
                    size,
                    color,
                    erase,
                    userId: user?.id,
                    userName: user?.name,
                });
            } catch (_) {}
        }

        // Repaint display so the new stroke is visible immediately
        scheduleMainCanvasRender();
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

        // Gatekeep editing: jika bukan pemilik, hanya user berlangganan yang dapat mengedit bersama
        if (!isOwner && !hasActiveSubscription) {
            showToast("Kolaborasi pengeditan membutuhkan paket langganan aktif.");
            setShowSubscriptionModal(true);
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

        // Siarkan posisi kursor ke kolaborator secara realtime (throttled)
        if (canvasChannelRef.current && loadedDrawingId && currentPos && user) {
            const now = Date.now();
            if (now - lastCursorBroadcastRef.current > 40) {
                lastCursorBroadcastRef.current = now;
                try {
                    canvasChannelRef.current.whisper("cursor", {
                        userId: user.id,
                        userName: user.name,
                        x: currentPos.x,
                        y: currentPos.y,
                        tool: activeTool,
                        color: waxColor,
                    });
                } catch (_) {}
            }
        }

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

    // Pulihkan Karya dari Initial Props (Dedicated Link /canvas/{id}) atau LocalStorage
    useEffect(() => {
        if (initialDrawing) {
            handleLoadDrawing(initialDrawing);
            return;
        }

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
                    setDrawingTimeLeft(DRAWING_DURATION_SECONDS);
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

    // Mulai ulang timer pengerasan saat pulih dari Mockup dalam status melukis
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

    // Muat motif yang dipilih dari URL (/canvas?drawing=ID atau /canvas?share=TOKEN)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const drawingId = params.get("drawing") || params.get("share");
        if (!drawingId) return;

        if (!user) {
            showToast("Silakan masuk terlebih dahulu untuk membuka karya ini.");
            return;
        }

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
                if (res.status === 403) {
                    if (!cancelled)
                        showToast(
                            "Akses ditolak: Anda tidak memiliki izin untuk membuka kanvas ini.",
                        );
                    return;
                }
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

    // Ref untuk data dinamis agar listener kolaborasi tidak menjadi stale
    // saat effect presence-channel tidak perlu dijalankan ulang.
    const collabStateRef = useRef({
        userId: user?.id ?? null,
        userName: user?.name ?? null,
        projectTitle,
        cantingSize,
        waxColor,
        selectedMotif,
    });
    useEffect(() => {
        collabStateRef.current = {
            userId: user?.id ?? null,
            userName: user?.name ?? null,
            projectTitle,
            cantingSize,
            waxColor,
            selectedMotif,
        };
    }, [
        user?.id,
        user?.name,
        projectTitle,
        cantingSize,
        waxColor,
        selectedMotif,
    ]);

    // Sesi Kolaborasi Realtime via Laravel Echo (Reverb Presence Channel)
    useEffect(() => {
        const userId = user?.id ?? null;
        if (!userId || !loadedDrawingId) {
            if (canvasChannelRef.current) {
                const echo = getEcho();
                if (echo && currentChannelDrawingId.current) {
                    echo.leave(`canvas.${currentChannelDrawingId.current}`);
                }
                canvasChannelRef.current = null;
                currentChannelDrawingId.current = null;
            }
            setActiveCollaborators([]);
            setRemoteCursors({});
            return;
        }

        const echo = getEcho();
        if (!echo) return;

        const channelName = `canvas.${loadedDrawingId}`;
        if (
            canvasChannelRef.current &&
            currentChannelDrawingId.current === loadedDrawingId
        ) {
            return;
        }

        if (canvasChannelRef.current && currentChannelDrawingId.current) {
            echo.leave(`canvas.${currentChannelDrawingId.current}`);
            canvasChannelRef.current = null;
        }

        currentChannelDrawingId.current = loadedDrawingId;
        const channel = echo.join(channelName);
        canvasChannelRef.current = channel;

        const applySyncedCanvas = (dataUrl) => {
            const artwork = getArtworkCanvas();
            if (!artwork || !dataUrl) return;

            const ctx = artwork.getContext("2d");
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                ctx.drawImage(img, 0, 0);
                renderMainCanvasRef.current();
            };
            img.src = dataUrl;
        };

        channel
            .here((members) => {
                const activeMembers = members || [];
                setActiveCollaborators(activeMembers);

                const syncSource =
                    activeMembers.find(
                        (member) =>
                            String(member.id) !== String(userId) &&
                            member.is_owner,
                    ) ||
                    activeMembers.find(
                        (member) => String(member.id) !== String(userId),
                    );

                if (syncSource) {
                    channel.whisper("request_sync", {
                        requesterId: userId,
                        sourceUserId: syncSource.id,
                    });
                }
            })
            .joining((member) => {
                setActiveCollaborators((prev) => {
                    const nextMembers = [
                        ...prev.filter((m) => m.id !== member.id),
                        member,
                    ];

                    return nextMembers;
                });
                showToast(`${member.name} bergabung ke sesi kolaborasi`);
            })
            .leaving((member) => {
                setActiveCollaborators((prev) => {
                    const nextMembers = prev.filter(
                        (m) => m.id !== member.id,
                    );

                    return nextMembers;
                });
                setRemoteCursors((prev) => {
                    const copy = { ...prev };
                    delete copy[member.id];
                    return copy;
                });
                showToast(`${member.name} meninggalkan sesi kolaborasi`);
            })
            .listenForWhisper("stroke", (data) => {
                if (!data || !data.p1 || !data.p2) return;
                const { cantingSize: fallbackSize, waxColor: fallbackColor } =
                    collabStateRef.current;
                drawRemoteLineBetween(
                    data.p1,
                    data.p2,
                    data.size || fallbackSize,
                    data.color || fallbackColor || "#CDB988",
                    Boolean(data.erase),
                );
            })
            .listenForWhisper("cursor", (data) => {
                if (
                    !data ||
                    !data.userId ||
                    data.userId === collabStateRef.current.userId
                )
                    return;
                setRemoteCursors((prev) => ({
                    ...prev,
                    [data.userId]: {
                        x: data.x,
                        y: data.y,
                        userName: data.userName,
                        tool: data.tool,
                        color: data.color,
                        updatedAt: Date.now(),
                    },
                }));
            })
            .listenForWhisper("clear", (data) => {
                const artwork = getArtworkCanvas();
                if (!artwork) return;
                const ctx = artwork.getContext("2d");
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                renderMainCanvasRef.current();
                showToast(
                    `${data?.userName || "Kolaborator"} membersihkan kanvas`,
                );
            })
            .listenForWhisper("trace", (data) => {
                const artwork = getArtworkCanvas();
                if (!artwork || !data?.motif) return;
                const { cantingSize: fallbackSize, waxColor: fallbackColor } =
                    collabStateRef.current;
                const ctx = artwork.getContext("2d");
                const cx = canvasWidth / 2;
                const cy = canvasHeight / 2;
                const scale = Math.min(canvasWidth, canvasHeight) / 160;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(scale, scale);
                ctx.translate(-80, -80);
                autoTraceMotifWax(
                    ctx,
                    data.motif,
                    160,
                    data.color || fallbackColor,
                    data.size || fallbackSize,
                );
                ctx.restore();
                renderMainCanvasRef.current();
                showToast(
                    `${data?.userName || "Kolaborator"} menjiplak motif ${data.motif}`,
                );
            })
            .listenForWhisper("motif", (data) => {
                if (
                    !data?.motif ||
                    String(data.userId) === String(userId) ||
                    (data.targetUserId &&
                        String(data.targetUserId) !== String(userId)) ||
                    !BATIK_MOTIFS.some((motif) => motif.id === data.motif)
                ) {
                    return;
                }

                applyMotifSelection(data.motif, { markUnsaved: true });
                showToast(
                    `${data.userName || "Kolaborator"} mengganti motif menjadi ${data.motif}`,
                );
            })
            .listenForWhisper("request_sync", (data) => {
                if (
                    !data?.requesterId ||
                    String(data.requesterId) === String(userId) ||
                    (data.sourceUserId &&
                        String(data.sourceUserId) !== String(userId))
                ) {
                    return;
                }

                channel.whisper("motif", {
                    motif: collabStateRef.current.selectedMotif,
                    userId,
                    userName: collabStateRef.current.userName,
                    targetUserId: data.requesterId,
                });

                const artwork = getArtworkCanvas();
                if (!artwork) return;

                const dataUrl = artwork.toDataURL();
                const totalChunks = Math.ceil(
                    dataUrl.length / CANVAS_SYNC_CHUNK_SIZE,
                );

                if (
                    totalChunks === 0 ||
                    totalChunks > CANVAS_SYNC_MAX_CHUNKS
                ) {
                    console.warn(
                        "Canvas snapshot is too large to synchronize safely.",
                    );
                    return;
                }

                const syncId = `${loadedDrawingId}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                    const start = chunkIndex * CANVAS_SYNC_CHUNK_SIZE;
                    channel.whisper("sync_state_chunk", {
                        syncId,
                        targetUserId: data.requesterId,
                        chunkIndex,
                        totalChunks,
                        chunk: dataUrl.slice(
                            start,
                            start + CANVAS_SYNC_CHUNK_SIZE,
                        ),
                    });
                }
            })
            .listenForWhisper("sync_state_chunk", (data) => {
                if (
                    typeof data?.syncId !== "string" ||
                    data.syncId.length > 128 ||
                    String(data.targetUserId) !== String(userId) ||
                    typeof data.chunk !== "string"
                ) {
                    return;
                }

                const chunkIndex = Number(data.chunkIndex);
                const totalChunks = Number(data.totalChunks);

                if (
                    !Number.isInteger(chunkIndex) ||
                    !Number.isInteger(totalChunks) ||
                    chunkIndex < 0 ||
                    totalChunks < 1 ||
                    totalChunks > CANVAS_SYNC_MAX_CHUNKS ||
                    chunkIndex >= totalChunks ||
                    data.chunk.length > CANVAS_SYNC_CHUNK_SIZE
                ) {
                    return;
                }

                let syncState = incomingCanvasSyncsRef.current.get(
                    data.syncId,
                );

                if (!syncState) {
                    const timeoutId = setTimeout(() => {
                        incomingCanvasSyncsRef.current.delete(data.syncId);
                    }, CANVAS_SYNC_TIMEOUT_MS);

                    syncState = {
                        chunks: new Array(totalChunks),
                        receivedChunks: 0,
                        timeoutId,
                    };
                    incomingCanvasSyncsRef.current.set(data.syncId, syncState);
                }

                if (
                    syncState.chunks.length !== totalChunks ||
                    syncState.chunks[chunkIndex] !== undefined
                ) {
                    return;
                }

                syncState.chunks[chunkIndex] = data.chunk;
                syncState.receivedChunks += 1;

                if (syncState.receivedChunks === totalChunks) {
                    clearTimeout(syncState.timeoutId);
                    incomingCanvasSyncsRef.current.delete(data.syncId);
                    applySyncedCanvas(syncState.chunks.join(""));
                }
            })
            .listen("CanvasUpdated", (e) => {
                const accessRulesChanged =
                    e.action === "share_type_changed" ||
                    e.action === "collaborator_removed";

                if (accessRulesChanged) {
                    if (e.action === "share_type_changed") {
                        setShareType(e.share_type);
                    }

                    const authorizedCollaboratorIds = Array.isArray(
                        e.authorized_collaborator_ids,
                    )
                        ? e.authorized_collaborator_ids
                        : [];
                    const isUnauthorizedForEmailSharing =
                        e.share_type === "specific_users" &&
                        !authorizedCollaboratorIds.some(
                            (authorizedUserId) =>
                                String(authorizedUserId) === String(userId),
                        );

                    if (
                        (e.disconnect_collaborators === true ||
                            isUnauthorizedForEmailSharing) &&
                        String(e.user_id) !== String(userId)
                    ) {
                        echo.leave(channelName);
                        canvasChannelRef.current = null;
                        currentChannelDrawingId.current = null;
                        setActiveCollaborators([]);
                        setRemoteCursors({});
                        router.reload({
                            replace: true,
                            preserveState: false,
                            preserveScroll: false,
                        });

                        return;
                    }

                    if (e.action === "share_type_changed") {
                        showToast(
                            "Pengaturan izin berbagi diperbarui oleh pemilik",
                        );
                    }
                } else if (e.action === "updated" || e.action === "saved") {
                    if (e.title && e.title !== collabStateRef.current.projectTitle) {
                        setProjectTitle(e.title);
                    }
                    if (
                        e.motif &&
                        BATIK_MOTIFS.some((motif) => motif.id === e.motif)
                    ) {
                        applyMotifSelection(e.motif);
                    }
                    showToast(
                        `Kanvas diperbarui oleh ${e.user_name || "kolaborator"}`,
                    );
                }
            });

        return () => {
            for (const syncState of incomingCanvasSyncsRef.current.values()) {
                clearTimeout(syncState.timeoutId);
            }
            incomingCanvasSyncsRef.current.clear();

            const currentEcho = getEcho();
            if (currentEcho) {
                currentEcho.leave(channelName);
            }
            if (canvasChannelRef.current === channel) {
                canvasChannelRef.current = null;
            }
            if (currentChannelDrawingId.current === loadedDrawingId) {
                currentChannelDrawingId.current = null;
            }
        };
    }, [applyMotifSelection, user?.id, loadedDrawingId]);

    // Bersihkan kursor kolaborator yang sudah idle lebih dari 3 detik
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setRemoteCursors((prev) => {
                let changed = false;
                const next = {};
                for (const [id, c] of Object.entries(prev)) {
                    if (now - c.updatedAt < 3000) {
                        next[id] = c;
                    } else {
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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
            case "pouring":
                return {
                    label: "Mengisi canting",
                    color: "text-[#E2B86B]",
                    bgColor: "bg-[#1A2E20]",
                    borderColor: "border-[#CDB988]/50",
                    icon: <Sparkles size={18} className="text-[#E2B86B]" />,
                    actionLabel: "Menunggu...",
                    actionColor:
                        "bg-[#142920] border-[#2A473A] text-[#7E9385] cursor-not-allowed",
                    description: "Malam cair sedang dituangkan ke canting.",
                    showColorPicker: false,
                };
            case "preparing":
                return {
                    label: "Menyiapkan pemanasan",
                    color: "text-[#E2B86B]",
                    bgColor: "bg-[#1A2E20]",
                    borderColor: "border-[#CDB988]/50",
                    icon: <Flame size={18} className="text-[#E2B86B]" />,
                    actionLabel: "Menunggu...",
                    actionColor:
                        "bg-[#142920] border-[#2A473A] text-[#7E9385] cursor-not-allowed",
                    description: "Masukkan malam ke kuali dan nyalakan api.",
                    showColorPicker: false,
                };
            case "ready":
                return {
                    label: "Canting siap!",
                    color: "text-[#D5BD8A]",
                    bgColor: "bg-[#142920]",
                    borderColor: "border-[#CDB988]",
                    icon: <InfoIcon size={18} text="#7E9385" />,
                    actionLabel: "Mulai Melukis",
                    actionColor:
                        "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                    description:
                        "Canting telah terisi malam cair, waktunya melukis!",
                    showColorPicker: false,
                    showReheatButton: true,
                };
            case "drawing":
                return {
                    label: `Malam mendingin • ${drawingTimeLeft}s`,
                    color: "text-[#A8D5BA]",
                    bgColor: "bg-[#0F2A1E]",
                    borderColor: "border-[#56C87A]/50",
                    icon: <Timer size={18} className="text-[#A8D5BA]" />,
                    actionLabel: `Sisa`,
                    actionColor:
                        "bg-[#142920] border-[#56C87A]/50 text-[#A8D5BA] cursor-not-allowed",
                    description:
                        "Kilau dan aliran malam mereda perlahan hingga padat.",
                    showColorPicker: false,
                    showReheatButton: true,
                };
            case "hardened":
                return {
                    label: "Malam telah padat",
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
    const malamHardeningProgress = Math.min(
        1,
        Math.max(
            0,
            malamState === "hardened"
                ? 1
                : 1 - drawingTimeLeft / DRAWING_DURATION_SECONDS,
        ),
    );
    const isPreparingMalam = malamState === "preparing";
    const isPouringMalam = malamState === "pouring";
    const isHeatingOverlayOpen =
        isPreparingMalam || malamState === "heating" || isPouringMalam;
    const heatingSecondsRemaining = Math.max(
        0,
        Math.ceil((100 - heatingProgress) / 20),
    );
    const heatingStage =
        heatingProgress < 40
            ? "Malam mulai melunak"
            : heatingProgress < 80
              ? "Malam sedang mencair"
              : "Menstabilkan suhu malam";

    useLayoutEffect(() => {
        if (
            !isHeatingOverlayOpen ||
            !shouldAnimateHeatingOpenRef.current
        ) {
            return;
        }

        shouldAnimateHeatingOpenRef.current = false;

        const dialog = heatingDialogRef.current;
        const backdrop = heatingBackdropRef.current;
        const sourceCard = malamCardRef.current;
        const originRect = heatingOriginRectRef.current;
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (
            !dialog ||
            !backdrop ||
            !originRect ||
            prefersReducedMotion ||
            typeof dialog.animate !== "function"
        ) {
            return;
        }

        const targetRect = dialog.getBoundingClientRect();
        const originCenterX = originRect.left + originRect.width / 2;
        const originCenterY = originRect.top + originRect.height / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        const translateX = originCenterX - targetCenterX;
        const translateY = originCenterY - targetCenterY;
        const scale = Math.max(
            0.2,
            Math.min(
                0.9,
                Math.min(
                    originRect.width / targetRect.width,
                    originRect.height / targetRect.height,
                ),
            ),
        );

        dialog.style.willChange = "transform, opacity";
        backdrop.style.willChange = "opacity";
        if (sourceCard) {
            sourceCard.style.opacity = "0";
            sourceCard.style.minHeight = `${originRect.height}px`;
        }

        const dialogAnimation = dialog.animate(
            [
                {
                    transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
                    opacity: 0.45,
                },
                {
                    transform: "translate3d(0, 0, 0) scale(1)",
                    opacity: 1,
                },
            ],
            {
                duration: 460,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "both",
            },
        );
        const backdropAnimation = backdrop.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            {
                duration: 260,
                easing: "ease-out",
                fill: "both",
            },
        );

        const clearAnimationHints = () => {
            dialogAnimation.cancel();
            backdropAnimation.cancel();
            dialog.style.willChange = "auto";
            backdrop.style.willChange = "auto";
            if (sourceCard) {
                sourceCard.style.opacity = "";
                sourceCard.style.minHeight = "";
            }
        };

        dialogAnimation.addEventListener("finish", clearAnimationHints, {
            once: true,
        });

        return () => {
            dialogAnimation.removeEventListener(
                "finish",
                clearAnimationHints,
            );
            clearAnimationHints();
        };
    }, [isHeatingOverlayOpen]);

    // Auto-advance tutorial on completed actions
    useEffect(() => {
        if (!showTutorial) return;
        if (tutorialStep === 0 && activeTool === "pencil") {
            setTutorialStep(1);
        } else if (
            tutorialStep === 1 &&
            selectedMotif !== tutorialInitRef.current.motif
        ) {
            setTutorialStep(2);
        } else if (tutorialStep === 3 && activeTool === "canting") {
            setTutorialStep(4);
        } else if (tutorialStep === 4 && waxColor !== tutorialInitRef.current.color) {
            setTutorialStep(5);
        } else if (tutorialStep === 5 && malamState === "preparing") {
            setTutorialStep(6);
        } else if (tutorialStep === 6 && isMalamInPot) {
            setTutorialStep(7);
        } else if (tutorialStep === 7 && malamState === "heating") {
            setTutorialStep(8);
        } else if (tutorialStep === 8 && malamState === "pouring") {
            setTutorialStep(9);
        } else if (tutorialStep === 9 && isMalamPouringFinished) {
            setTutorialStep(10);
        } else if (tutorialStep === 10 && malamState === "ready") {
            setTutorialStep(11);
        }
    }, [
        showTutorial,
        tutorialStep,
        activeTool,
        malamState,
        selectedMotif,
        waxColor,
        isMalamInPot,
        isMalamPouringFinished,
    ]);

    const tutorialInitRef = useRef({ motif: null, color: null });
    useEffect(() => {
        if (!showTutorial) return;
        tutorialInitRef.current = { motif: selectedMotif, color: waxColor };
    }, [showTutorial]);

    const isPopupTutorialStep =
        tutorialStep >= FIRST_POPUP_TUTORIAL_STEP &&
        tutorialStep <= LAST_POPUP_TUTORIAL_STEP;

    const [spotRect, setSpotRect] = useState(null);
    useEffect(() => {
        if (!showTutorial || isPopupTutorialStep) {
            setSpotRect(null);
            return;
        }

        const update = () => {
            const targetId = TUTORIAL_STEPS[tutorialStep]?.target;
            const element = document.getElementById(targetId);

            setSpotRect(element?.getBoundingClientRect() ?? null);
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [showTutorial, tutorialStep, isPopupTutorialStep]);

    useEffect(() => {
        if (!showTutorial || !isPopupTutorialStep) return;

        const animationFrame = window.requestAnimationFrame(() => {
            const targetId = TUTORIAL_STEPS[tutorialStep]?.target;
            const element = document.getElementById(targetId);
            const prefersReducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;

            element?.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "center",
            });
        });

        return () => window.cancelAnimationFrame(animationFrame);
    }, [showTutorial, tutorialStep, isPopupTutorialStep]);

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
                @keyframes steamRise {
                    0% { opacity: 0; transform: translateY(10px) scale(0.75); }
                    30% { opacity: 0.5; }
                    100% { opacity: 0; transform: translateY(-58px) scale(1.35); }
                }
                .steam-wisp {
                    animation: steamRise 2.3s ease-out infinite;
                }
                @keyframes waxSimmer {
                    0%, 100% { transform: translateX(-50%) translateY(0) scaleX(1); filter: brightness(0.95); }
                    50% { transform: translateX(-50%) translateY(-2px) scaleX(1.04); filter: brightness(1.12); }
                }
                .animate-wax-simmer {
                    animation: waxSimmer 1.4s ease-in-out infinite;
                }
            `}</style>

            {/* TOAST NOTIFIKASI */}
            {toastMessage && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#162B21] border border-[#CDB988]/60 text-[#F5EFEB] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm backdrop-blur-md transition-all">
                    <Sparkles size={16} className="text-[#CDB988]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* FULL-SCREEN PEMANASAN MALAM */}
            {isHeatingOverlayOpen && (
                <div
                    className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="heating-malam-title"
                    aria-describedby="heating-malam-description"
                >
                    <div
                        ref={heatingBackdropRef}
                        className="pointer-events-none fixed inset-0 bg-[#020705]/90"
                    />
                    <div
                        ref={heatingDialogRef}
                        id="tour-malam-card"
                        className="relative z-10 my-auto w-full max-w-2xl transform-gpu overflow-hidden rounded-3xl border border-[#CDB988]/40 bg-[#091611] shadow-[0_30px_100px_rgba(0,0,0,0.75),0_0_80px_rgba(226,139,43,0.08)]"
                    >
                        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#A95325]/15 to-transparent" />
                        <div className="relative flex flex-col items-center px-5 py-7 text-center sm:px-10 sm:py-9">
                            <div
                                className={`mb-2 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                                    isMalamPouringFinished
                                        ? "border-[#56C87A]/30 bg-[#56C87A]/10 text-[#A8D5BA]"
                                        : "border-[#E2B86B]/25 bg-[#E2B86B]/10 text-[#E2B86B]"
                                }`}
                            >
                                {isPreparingMalam ? (
                                    <Flame size={13} />
                                ) : isMalamPouringFinished ? (
                                    <Check size={13} strokeWidth={3} />
                                ) : isPouringMalam ? (
                                    <Sparkles size={13} />
                                ) : (
                                    <Loader2
                                        size={13}
                                        className="animate-spin"
                                    />
                                )}
                                {isPreparingMalam
                                    ? "Persiapan pemanasan"
                                    : isMalamPouringFinished
                                      ? "Proses selesai"
                                    : isPouringMalam
                                      ? "Pengisian canting"
                                    : "Proses pemanasan"}
                            </div>
                            <h2
                                id="heating-malam-title"
                                className="font-heading text-2xl font-bold text-[#F3E5C8] sm:text-3xl"
                            >
                                {isPreparingMalam
                                    ? "Siapkan Malam"
                                    : isMalamPouringFinished
                                      ? "Canting Siap Digunakan"
                                    : isPouringMalam
                                      ? "Mengisi Canting"
                                    : "Memanaskan Malam"}
                            </h2>
                            <p
                                id="heating-malam-description"
                                className="mt-2 max-w-md text-sm leading-relaxed text-[#9CB0A4]"
                            >
                                {isPreparingMalam
                                    ? "Masukkan malam ke dalam kuali terlebih dahulu, kemudian nyalakan api untuk mulai melelehkannya."
                                    : isMalamPouringFinished
                                      ? "Malam telah selesai dituangkan ke dalam reservoir canting. Tutup popup untuk kembali ke kanvas."
                                    : isPouringMalam
                                      ? "Malam sudah meleleh sempurna dan sedang dituangkan perlahan ke dalam reservoir canting."
                                    : "Malam sedang dilelehkan perlahan hingga mencapai kekentalan yang tepat untuk mengalir melalui canting."}
                            </p>

                            {showTutorial && isPopupTutorialStep && (
                                <div
                                    className="mt-4 w-full max-w-lg rounded-2xl border border-[#CDB988]/45 bg-[#0E1E18] p-4 text-left shadow-[0_16px_45px_rgba(0,0,0,0.35)]"
                                    aria-live="polite"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#CDB988]">
                                            Tutorial WastraCanvas
                                        </span>
                                        <span className="text-xs text-[#7E9385]">
                                            {tutorialStep + 1}/
                                            {TUTORIAL_STEPS.length}
                                        </span>
                                    </div>
                                    <h3 className="mt-2 font-heading text-lg font-bold text-[#E2CEAB]">
                                        {TUTORIAL_STEPS[tutorialStep].title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-[#BACDC2]">
                                        {TUTORIAL_STEPS[tutorialStep].desc}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowTutorial(false);
                                            setTutorialStep(0);
                                        }}
                                        className="mt-3 text-xs font-medium text-[#7E9385] transition-colors hover:text-[#F5EFEB]"
                                    >
                                        Lewati tutorial
                                    </button>
                                </div>
                            )}

                            <div className="mt-5 grid w-full max-w-lg grid-cols-4 gap-2 text-left">
                                {[
                                    {
                                        number: 1,
                                        label: "Masukkan malam",
                                        isComplete:
                                            isMalamInPot ||
                                            malamState === "heating" ||
                                            isPouringMalam,
                                        isActive:
                                            isPreparingMalam && !isMalamInPot,
                                    },
                                    {
                                        number: 2,
                                        label: "Nyalakan api",
                                        isComplete:
                                            malamState === "heating" ||
                                            isPouringMalam,
                                        isActive:
                                            isPreparingMalam && isMalamInPot,
                                    },
                                    {
                                        number: 3,
                                        label: "Panaskan",
                                        isComplete: isPouringMalam,
                                        isActive: malamState === "heating",
                                    },
                                    {
                                        number: 4,
                                        label: "Isi canting",
                                        isComplete: isMalamPouringFinished,
                                        isActive:
                                            isPouringMalam &&
                                            !isMalamPouringFinished,
                                    },
                                ].map((step) => (
                                    <div
                                        key={step.number}
                                        className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors sm:px-3 ${
                                            step.isActive
                                                ? "border-[#E2B86B]/60 bg-[#E2B86B]/10 text-[#F3E5C8]"
                                                : step.isComplete
                                                  ? "border-[#56C87A]/30 bg-[#56C87A]/10 text-[#A8D5BA]"
                                                  : "border-[#182C24] bg-[#07130E]/60 text-[#5C7265]"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                                step.isComplete
                                                    ? "bg-[#56C87A] text-[#07130E]"
                                                    : step.isActive
                                                      ? "bg-[#E2B86B] text-[#07130E]"
                                                      : "bg-[#142920] text-[#7E9385]"
                                            }`}
                                        >
                                            {step.isComplete ? (
                                                <Check size={13} strokeWidth={3} />
                                            ) : (
                                                step.number
                                            )}
                                        </span>
                                        <span className="hidden text-[11px] font-semibold leading-tight sm:block">
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div
                                id="tour-malam-transfer"
                                className={`relative mt-4 h-[250px] w-full max-w-md select-none rounded-2xl transition-shadow sm:h-[270px] ${
                                    showTutorial && tutorialStep === 6
                                        ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611] shadow-[0_0_35px_rgba(226,184,107,0.22)]"
                                        : ""
                                }`}
                            >
                                {isPouringMalam && (
                                    <>
                                        <React.Suspense
                                            fallback={
                                                <div className="absolute inset-0 flex items-center justify-center bg-[#07130E] text-[#CDB988]">
                                                    <Loader2
                                                        size={24}
                                                        className="animate-spin"
                                                    />
                                                </div>
                                            }
                                        >
                                            <MalamPouring3D
                                                waxColor={waxColor}
                                                onComplete={
                                                    completeMalamPouring
                                                }
                                            />
                                        </React.Suspense>

                                        <div
                                            className={`absolute bottom-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border bg-[#07130E]/85 px-3 py-1.5 text-[10px] font-semibold ${
                                                isMalamPouringFinished
                                                    ? "border-[#56C87A]/30 text-[#A8D5BA]"
                                                    : "border-[#CDB988]/25 text-[#E2CEAB]"
                                            }`}
                                        >
                                            {isMalamPouringFinished
                                                ? "Canting telah terisi malam"
                                                : "Menuangkan malam ke reservoir canting"}
                                        </div>
                                    </>
                                )}

                                {malamState === "heating" && (
                                    <div className="absolute inset-x-10 bottom-2 h-20 rounded-full bg-[#E2452B]/10 blur-3xl" />
                                )}

                                {/* Malam yang harus dipindahkan ke kuali */}
                                {isPreparingMalam && !isMalamInPot && (
                                    <div
                                        draggable
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Malam ${waxColorName}. Seret ke dalam kuali.`}
                                        aria-grabbed={isDraggingMalam}
                                        onDragStart={handleMalamDragStart}
                                        onDragEnd={() => {
                                            setIsDraggingMalam(false);
                                            setIsPotDragOver(false);
                                        }}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();
                                                placeMalamInPot();
                                            }
                                        }}
                                        className={`absolute left-0 top-3 z-50 flex w-24 cursor-grab flex-col items-center gap-1 rounded-2xl border border-[#CDB988]/35 bg-[#0E1E18]/95 p-2.5 shadow-xl transition-all active:cursor-grabbing sm:left-2 ${
                                            isDraggingMalam
                                                ? "scale-95 opacity-45"
                                                : "hover:-translate-y-1 hover:border-[#CDB988]"
                                        }`}
                                    >
                                        <div
                                            className="h-14 w-14 drop-shadow-[0_5px_8px_rgba(0,0,0,0.45)]"
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
                                        />
                                        <span className="text-[10px] font-semibold text-[#E2CEAB]">
                                            Seret malam
                                        </span>
                                    </div>
                                )}

                                {/* Uap panas */}
                                {malamState === "heating" && (
                                    <div className="absolute left-1/2 top-10 z-40 h-20 w-36 -translate-x-1/2">
                                        {[20, 50, 80].map((left, index) => (
                                            <span
                                                key={left}
                                                className="steam-wisp absolute bottom-0 h-12 w-4 rounded-full border-l-2 border-white/20 blur-[1px]"
                                                style={{
                                                    left: `${left}%`,
                                                    animationDelay: `${index * 0.55}s`,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Malam di dalam kuali */}
                                {malamState === "heating" ? (
                                    <div
                                        className="animate-wax-simmer absolute left-1/2 top-[78px] z-30 h-10 w-52 -translate-x-1/2 rounded-[50%] border border-white/20 shadow-[inset_0_8px_15px_rgba(255,255,255,0.18),0_0_25px_rgba(226,184,107,0.25)] sm:top-[86px] sm:w-60"
                                        style={{ backgroundColor: waxColor }}
                                    >
                                        <span className="absolute left-[28%] top-[28%] h-2 w-2 rounded-full bg-white/30" />
                                        <span className="absolute right-[24%] top-[48%] h-3 w-3 rounded-full border border-white/25" />
                                    </div>
                                ) : (
                                    isPreparingMalam &&
                                    isMalamInPot && (
                                        <div
                                            className="absolute left-1/2 top-[66px] z-30 h-20 w-20 -translate-x-1/2 drop-shadow-[0_0_12px_rgba(226,184,107,0.35)]"
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
                                        />
                                    )
                                )}

                                {/* Area jatuhkan malam dan kuali */}
                                {isPreparingMalam && !isMalamInPot && (
                                    <div
                                        onDragEnter={(event) => {
                                            event.preventDefault();
                                            setIsPotDragOver(true);
                                        }}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            event.dataTransfer.dropEffect =
                                                "move";
                                            setIsPotDragOver(true);
                                        }}
                                        onDragLeave={() =>
                                            setIsPotDragOver(false)
                                        }
                                        onDrop={handleMalamDrop}
                                        className={`absolute left-1/2 top-14 z-40 h-28 w-60 -translate-x-1/2 rounded-[50%] border-2 border-dashed transition-all ${
                                            isPotDragOver
                                                ? "scale-105 border-[#E2B86B] bg-[#E2B86B]/15 shadow-[0_0_35px_rgba(226,184,107,0.3)]"
                                                : "border-[#CDB988]/45 bg-[#CDB988]/5"
                                        }`}
                                    >
                                        <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#07130E]/90 px-2.5 py-1 text-[10px] font-semibold text-[#E2CEAB]">
                                            Jatuhkan di sini
                                        </span>
                                    </div>
                                )}

                                {!isPouringMalam && (
                                    <img
                                        src="/pot.png"
                                        alt={`Kuali pemanas malam ${waxColorName}`}
                                        draggable={false}
                                        className="absolute left-1/2 top-16 z-20 w-[310px] -translate-x-1/2 pointer-events-none sm:w-[360px]"
                                    />
                                )}

                                {/* Tungku mati atau api menyala */}
                                {!isPouringMalam && (
                                    malamState === "heating" ? (
                                        <div className="absolute bottom-0 left-1/2 z-10 h-[76px] w-[170px] -translate-x-1/2">
                                            <div
                                                className="absolute bottom-0 left-1/2 h-10 w-36 rounded-[50%] blur-xl"
                                                style={{
                                                    background:
                                                        "radial-gradient(ellipse at center, rgba(255,176,64,0.9) 0%, rgba(226,69,43,0.38) 55%, rgba(226,69,43,0) 76%)",
                                                    animation:
                                                        "emberGlow 1.4s ease-in-out infinite",
                                                }}
                                            />
                                            <span
                                                className="flame-shape"
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    marginLeft: -28,
                                                    background:
                                                        "radial-gradient(circle at 50% 72%, #F6A02A 0%, #E2452B 72%)",
                                                    filter: "blur(1.5px)",
                                                    animationDuration: "0.62s",
                                                }}
                                            />
                                            <span
                                                className="flame-shape"
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    marginLeft: -18,
                                                    background:
                                                        "radial-gradient(circle at 50% 72%, #FFF3B0 0%, #F07C1E 78%)",
                                                    animationDuration: "0.45s",
                                                    animationDelay: "0.1s",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="absolute bottom-2 left-1/2 z-10 flex h-10 w-32 -translate-x-1/2 items-center justify-center rounded-[50%] border border-[#2A352F] bg-[#050B08] shadow-inner">
                                            <Flame
                                                size={18}
                                                className="text-[#34433C]"
                                            />
                                        </div>
                                    )
                                )}
                            </div>

                            {isPreparingMalam ? (
                                <div
                                    className="mt-3 w-full max-w-lg"
                                    aria-live="polite"
                                >
                                    <div
                                        className={`mb-3 flex items-center gap-3 rounded-xl border p-3 text-left ${
                                            isMalamInPot
                                                ? "border-[#56C87A]/35 bg-[#56C87A]/10"
                                                : "border-[#CDB988]/25 bg-[#07130E]/70"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                isMalamInPot
                                                    ? "bg-[#56C87A] text-[#07130E]"
                                                    : "bg-[#142920] text-[#CDB988]"
                                            }`}
                                        >
                                            {isMalamInPot ? (
                                                <Check
                                                    size={16}
                                                    strokeWidth={3}
                                                />
                                            ) : (
                                                <SquareDashed size={16} />
                                            )}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-[#E2CEAB]">
                                                {isMalamInPot
                                                    ? "Malam sudah di dalam kuali"
                                                    : "Seret malam ke mulut kuali"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#7E9385]">
                                                {isMalamInPot
                                                    ? "Langkah berikutnya: nyalakan api tungku."
                                                    : "Tahan malam, lalu lepaskan pada area bergaris di atas kuali."}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        id="tour-ignite-fire"
                                        onClick={igniteHeatingFire}
                                        disabled={!isMalamInPot}
                                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all ${
                                            isMalamInPot
                                                ? "bg-[#D5BD8A] text-[#0A1612] shadow-[0_0_24px_rgba(213,189,138,0.22)] hover:bg-[#E2CEAB] active:scale-[0.98]"
                                                : "cursor-not-allowed border border-[#182C24] bg-[#0E1E18] text-[#4E6257]"
                                        } ${
                                            showTutorial && tutorialStep === 7
                                                ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611]"
                                                : ""
                                        }`}
                                    >
                                        <Flame size={17} />
                                        Nyalakan Api
                                    </button>
                                </div>
                            ) : isPouringMalam ? (
                                <div
                                    id="tour-pouring-status"
                                    className={`mt-4 w-full max-w-lg rounded-xl border p-3.5 ${
                                        isMalamPouringFinished
                                            ? "border-[#56C87A]/35 bg-[#56C87A]/10"
                                            : "border-[#CDB988]/30 bg-[#CDB988]/10"
                                    } ${
                                        showTutorial && tutorialStep === 9
                                            ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611]"
                                            : ""
                                    }`}
                                    aria-live="polite"
                                    role="status"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0A1612] ${
                                                isMalamPouringFinished
                                                    ? "bg-[#56C87A] shadow-[0_0_18px_rgba(86,200,122,0.25)]"
                                                    : "bg-[#D5BD8A] shadow-[0_0_18px_rgba(213,189,138,0.3)]"
                                            }`}
                                        >
                                            {isMalamPouringFinished ? (
                                                <Check
                                                    size={17}
                                                    strokeWidth={3}
                                                />
                                            ) : (
                                                <Sparkles size={17} />
                                            )}
                                        </span>
                                        <div className="flex-1">
                                            <p
                                                className={`text-sm font-semibold ${
                                                    isMalamPouringFinished
                                                        ? "text-[#A8D5BA]"
                                                        : "text-[#F3E5C8]"
                                                }`}
                                            >
                                                {isMalamPouringFinished
                                                    ? "Canting siap digunakan"
                                                    : "Mengisi reservoir canting"}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#9CB0A4]">
                                                {isMalamPouringFinished
                                                    ? "Animasi selesai. Tutup popup untuk kembali ke kanvas."
                                                    : "Malam cair dituangkan perlahan agar canting siap digunakan."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#07130E]">
                                        <div
                                            className={`h-full w-full origin-left rounded-full ${
                                                isMalamPouringFinished
                                                    ? "bg-[#56C87A]"
                                                    : "animate-pulse bg-gradient-to-r from-[#C95F32] via-[#E2B86B] to-[#F3D69A]"
                                            }`}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    id="tour-heating-progress"
                                    className={`mt-4 w-full max-w-lg rounded-xl transition-shadow ${
                                        showTutorial && tutorialStep === 8
                                            ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611] shadow-[0_0_35px_rgba(226,184,107,0.18)]"
                                            : ""
                                    }`}
                                    aria-live="polite"
                                >
                                    <div className="mb-2 flex items-end justify-between gap-4">
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-[#E2CEAB]">
                                                {heatingStage}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#7E9385]">
                                                Jangan angkat kuali selama proses
                                                berlangsung.
                                            </p>
                                        </div>
                                        <span className="font-mono text-2xl font-bold tabular-nums text-[#E2B86B]">
                                            {heatingProgress}%
                                        </span>
                                    </div>
                                    <div
                                        className="h-3 overflow-hidden rounded-full border border-[#2A473A] bg-[#06100C] p-0.5"
                                        role="progressbar"
                                        aria-label="Kemajuan pemanasan malam"
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                        aria-valuenow={heatingProgress}
                                    >
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#C95F32] via-[#E2B86B] to-[#F3D69A] shadow-[0_0_14px_rgba(226,184,107,0.55)] transition-all duration-700 ease-out"
                                            style={{
                                                width: `${heatingProgress}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="mt-3 text-xs text-[#7E9385]">
                                        Sekitar {heatingSecondsRemaining} detik
                                        lagi hingga malam siap digunakan.
                                    </p>
                                </div>
                            )}
                            {isMalamPouringFinished && (
                                <button
                                    type="button"
                                    id="tour-close-heating"
                                    onClick={closeHeatingOverlay}
                                    className={`mt-4 flex w-full max-w-lg items-center justify-center gap-2 rounded-xl border border-[#D5BD8A] bg-[#D5BD8A] px-5 py-3.5 text-sm font-bold text-[#0A1612] shadow-[0_0_24px_rgba(213,189,138,0.22)] transition-all hover:bg-[#E2CEAB] active:scale-[0.98] ${
                                        showTutorial && tutorialStep === 10
                                            ? "ring-2 ring-[#F3E5C8] ring-offset-4 ring-offset-[#091611]"
                                            : ""
                                    }`}
                                >
                                    <X size={17} />
                                    Tutup Popup
                                </button>
                            )}
                        </div>
                    </div>
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
                                    applyMotifSelection(
                                        detailMotifModal.id,
                                        {
                                            broadcastChange: true,
                                            markUnsaved: true,
                                        },
                                    );
                                    setDetailMotifModal(null);

                                    if (detailMotifModal.id === "polos") {
                                        showToast(
                                            `Mode Kanvas Polos (Tanpa Panduan) aktif`,
                                        );
                                    } else {
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
            {showSaveDialog && isOwner && (
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
                        <img width={40} src="/logo-wastrakarya.svg" />
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
                                onBlur={async () => {
                                    setIsEditingTitle(false);
                                    if (loadedDrawingId && isOwner && user) {
                                        try {
                                            await fetch(`/api/user-drawings/${loadedDrawingId}`, {
                                                method: "PUT",
                                                headers: {
                                                    Accept: "application/json",
                                                    "Content-Type": "application/json",
                                                    "X-Requested-With": "XMLHttpRequest",
                                                    ...(getCsrfToken() ? { "X-XSRF-TOKEN": getCsrfToken() } : {}),
                                                },
                                                body: JSON.stringify({ title: projectTitle }),
                                            });
                                        } catch (_) {}
                                    }
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                        setIsEditingTitle(false);
                                        if (loadedDrawingId && isOwner && user) {
                                            try {
                                                await fetch(`/api/user-drawings/${loadedDrawingId}`, {
                                                    method: "PUT",
                                                    headers: {
                                                        Accept: "application/json",
                                                        "Content-Type": "application/json",
                                                        "X-Requested-With": "XMLHttpRequest",
                                                        ...(getCsrfToken() ? { "X-XSRF-TOKEN": getCsrfToken() } : {}),
                                                    },
                                                    body: JSON.stringify({ title: projectTitle }),
                                                });
                                            } catch (_) {}
                                        }
                                    }
                                }}
                                autoFocus
                                className="bg-[#0B1813] border border-[#CDB988]/40 text-xs text-[#BACDC2] px-1.5 py-0.5 rounded outline-none w-48"
                            />
                        ) : (
                            <span
                                onClick={() => {
                                    if (isOwner) setIsEditingTitle(true);
                                }}
                                title={
                                    isOwner
                                        ? "Klik untuk mengubah nama karya"
                                        : "Hanya pemilik yang dapat mengubah nama karya"
                                }
                                className={`text-xs text-[#7E9385] transition-colors ${
                                    isOwner
                                        ? "hover:text-[#CDB988] cursor-pointer"
                                        : "cursor-default"
                                }`}
                            >
                                {projectTitle}
                            </span>
                        )}
                        {!isOwner && canvasOwner?.name && (
                            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                                <Crown size={11} className="text-amber-400" />
                                Pemilik: {canvasOwner.name}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Active Collaborators Online Presence */}
                    {activeCollaborators.length > 0 && (
                        <div
                            className="flex items-center -space-x-2 mr-1 bg-[#0E1E18] px-2.5 py-1.5 rounded-xl border border-[#182C24]"
                            title={`Sedang mengedit bersama: ${activeCollaborators.map((c) => c.name).join(", ")}`}
                        >
                            {activeCollaborators.slice(0, 3).map((c, i) => (
                                <div
                                    key={c.id || i}
                                    className="w-6 h-6 rounded-full bg-[#142920] border-2 border-[#091611] flex items-center justify-center text-[10px] font-bold text-[#CDB988] shadow relative"
                                    title={`${c.name} (${c.is_owner ? "Pemilik" : "Kolaborator"})`}
                                >
                                    {(c.name || "U").charAt(0).toUpperCase()}
                                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[#091611]"></span>
                                </div>
                            ))}
                            {activeCollaborators.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-[#142920] border-2 border-[#091611] flex items-center justify-center text-[9px] font-bold text-[#E2CEAB] shadow">
                                    +{activeCollaborators.length - 3}
                                </div>
                            )}
                            <span className="ml-3 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                {activeCollaborators.length} aktif
                            </span>
                        </div>
                    )}

                    <span className="text-xs text-[#7E9385] mr-1 hidden sm:inline">
                        {!isOwner
                            ? "Hanya pemilik dapat menyimpan"
                            : hasUnsavedChanges
                              ? "Perubahan belum disimpan"
                              : "Perubahan tersimpan"}
                    </span>

                    {/* Tombol Bagikan */}
                    {isOwner && (
                        <button
                            onClick={handleOpenShare}
                            title={
                                hasActiveSubscription
                                    ? "Bagikan kanvas dan kolaborasi real-time"
                                    : "Fitur kolaborasi (eksklusif pengguna berlangganan)"
                            }
                            className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2 active:scale-95"
                        >
                            {hasActiveSubscription ? (
                                <Share2 size={15} className="text-[#CDB988]" />
                            ) : (
                                <Crown size={15} className="text-amber-400" />
                            )}
                            <span>Bagikan</span>
                            {hasActiveSubscription ? (
                                shareType && shareType !== "private" && (
                                    <span
                                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                        title="Berbagi aktif"
                                    ></span>
                                )
                            ) : (
                                <span className="text-[10px] text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded-md border border-amber-400/30 font-medium">
                                    Pro
                                </span>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setMalamState("cold");
                            setHeatingProgress(0);
                            setDrawingTimeLeft(DRAWING_DURATION_SECONDS);
                            tutorialInitRef.current = {
                                motif: selectedMotif,
                                color: waxColor,
                            };
                            setTutorialStep(0);
                            setShowTutorial(true);
                        }}
                        title="Tutorial Membatik"
                        className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-3 py-2.5 rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2"
                    >
                        <HelpCircle size={15} className="text-[#CDB988]" />
                        <span>Bantuan</span>
                    </button>
                    {isOwner && (
                        <button
                            onClick={() => handleSave()}
                            className="bg-[#D5BD8A] hover:bg-[#C4AC79] active:scale-95 text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all duration-150 flex items-center gap-2"
                        >
                            <Save size={15} />
                            <span>Simpan</span>
                        </button>
                    )}
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

            {/* Banner Mode Pratinjau Kolaborasi jika bukan pemilik & belum berlangganan */}
            {!isOwner && !hasActiveSubscription && (
                <div className="bg-gradient-to-r from-amber-950/80 to-[#142920] border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 z-20 shrink-0">
                    <div className="flex items-center gap-2">
                        <Crown size={15} className="text-amber-400 shrink-0" />
                        <span>
                            <strong>Mode Pratinjau Kanvas:</strong> Anda dapat melihat karya ini, namun memerlukan akun dengan paket langganan aktif untuk mengedit bersama secara real-time.
                        </span>
                    </div>
                    <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-3 py-1 rounded-lg text-[11px] shadow transition-all active:scale-95 shrink-0 ml-4"
                    >
                        Aktifkan Langganan
                    </button>
                </div>
            )}

            {/* MAIN WORKSPACE LAYOUT (3 KOLOM) */}
            <div className="flex flex-1 overflow-hidden p-3 gap-3">
                {/* 1. PANEL SEBELAH KIRI (PERALATAN, WARNA MALAM, STATUS MALAM) */}
                <aside className="w-64 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col justify-between shrink-0 shadow-lg">
                    <div className="flex flex-col gap-5">
                        {/* Bagian: Status Malam & Aksi Utama */}
                        <div
                            ref={malamCardRef}
                            className={`bg-[#0E1E18] border border-[#182C24] rounded-xl p-4 ${malamWiggle ? "animate-wiggle border-[#E88D8D] shadow-[0_0_0_6px_rgba(232,141,141,0.35)]" : "border-[#182C24]"}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-heading font-semibold text-lg text-[#E2CEAB]">
                                    Malam
                                </h3>
                            </div>

                            {/* Status Indicator */}
                            {!isHeatingOverlayOpen && (
                                <div
                                    id="tour-malam-card"
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

                                    {(malamState === "drawing" ||
                                        malamState === "hardened") && (
                                        <div className="relative mt-3 h-32 overflow-hidden rounded-lg border border-[#CDB988]/20 bg-[#08130E]">
                                            <React.Suspense
                                                fallback={
                                                    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(226,184,107,0.2),transparent_62%)]" />
                                                }
                                            >
                                                <MalamHardening3D
                                                    progress={
                                                        malamHardeningProgress
                                                    }
                                                    waxColor={waxColor}
                                                />
                                            </React.Suspense>

                                            <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full border border-white/10 bg-[#06100C]/75 px-2 py-1 backdrop-blur-sm">
                                                <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#F0B96A]">
                                                    Cair
                                                </span>
                                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-[#F2A85A] via-[#CDB988] to-[#8FA395] transition-[width] duration-1000 ease-linear"
                                                        style={{
                                                            width: `${malamHardeningProgress * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#AFC0B5]">
                                                    Padat
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Main Action Button */}
                            {malamInfo.actionLabel != "Menunggu..." &&
                                malamInfo.actionLabel != "Mulai Melukis" &&
                                malamInfo.actionLabel != "Sisa" && (
                                    <button
                                        onClick={handleCantingDip}
                                        id="tour-heat"
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
                                <div id="tour-color">
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
                                            id={
                                                tool.id === "canting"
                                                    ? "tour-canting"
                                                    : tool.id === "pencil"
                                                      ? "tour-pencil"
                                                      : undefined
                                            }
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
                    id="tour-canvas"
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

                        {/* Remote Collaborators Cursors + Tool Overlay */}
                        {Object.entries(remoteCursors).map(([rUserId, rCursor]) => {
                            const rx = pan.x + rCursor.x * zoom;
                            const ry = pan.y + rCursor.y * zoom;
                            if (
                                rx < -40 ||
                                rx > canvasWidth + 40 ||
                                ry < -40 ||
                                ry > canvasHeight + 40
                            ) {
                                return null;
                            }
                            const remoteColor = rCursor.color || "#CDB988";
                            return (
                                <div
                                    key={rUserId}
                                    className="absolute pointer-events-none z-20 transition-all duration-75 select-none"
                                    style={{
                                        left: rx,
                                        top: ry,
                                    }}
                                >
                                    {/* Tool overlay: shows the collaborator's active tool (canting/pencil/eraser) at their cursor */}
                                    {rCursor.tool === "canting" && (
                                        <img
                                            src="/canting.png"
                                            alt=""
                                            className="select-none"
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                width: 110,
                                                height: "auto",
                                                transform:
                                                    "translate(0px, -34px)",
                                                filter: `drop-shadow(0 0 9px ${remoteColor}aa) drop-shadow(0 2px 5px rgba(0,0,0,0.4))`,
                                            }}
                                            draggable={false}
                                        />
                                    )}
                                    {rCursor.tool === "pencil" && (
                                        <img
                                            src="/pensil.png"
                                            alt=""
                                            className="select-none"
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                width: 110,
                                                height: "auto",
                                                transform:
                                                    "translate(-9px, -2px)",
                                                filter: `drop-shadow(0 0 9px ${remoteColor}aa) drop-shadow(0 2px 5px rgba(0,0,0,0.4))`,
                                            }}
                                            draggable={false}
                                        />
                                    )}
                                    {rCursor.tool === "eraser" && (
                                        <img
                                            src="/penghapus.png"
                                            alt=""
                                            className="select-none"
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                width: 64,
                                                height: "auto",
                                                transform:
                                                    "translate(0, -31px)",
                                                filter: `drop-shadow(0 0 9px ${remoteColor}aa) drop-shadow(0 2px 5px rgba(0,0,0,0.4))`,
                                            }}
                                            draggable={false}
                                        />
                                    )}
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill={remoteColor}
                                        stroke="#091611"
                                        strokeWidth="1.5"
                                        className="drop-shadow-lg"
                                    >
                                        <path d="M3 3l7 18 3-7 7-3L3 3z" />
                                    </svg>
                                    <div
                                        className="absolute left-3.5 top-2.5 text-[10px] font-semibold text-[#0A1612] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-[#091611]/30 flex items-center gap-1.5"
                                        style={{
                                            backgroundColor: remoteColor,
                                        }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A1612]/70"></span>
                                        <span>
                                            {rCursor.userName || "Kolaborator"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

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
                <aside id="tour-motif" className="w-72 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col shrink-0 shadow-lg">
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
                                                applyMotifSelection(motif.id, {
                                                    broadcastChange: true,
                                                    markUnsaved: true,
                                                });
                                                if (motif.id === "polos") {
                                                    showToast(
                                                        `Mode Kanvas Polos (Tanpa Panduan) aktif`,
                                                    );
                                                } else {
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

                        {!user ? (
                            <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3 shrink-0 text-[11px] text-[#7E9385] leading-relaxed">
                                <p className="font-medium text-[#E2CEAB] mb-1">
                                    Masuk untuk Fitur Lengkap
                                </p>
                                <p className="text-[#9CB0A4]">
                                    Daftar/masuk untuk menyimpan banyak karya,
                                    mengakses tab Simpanan, dan fitur penuh
                                    WastraCanvas. Tanpa masuk, karya hanya
                                    tersimpan lokal dan tidak dapat memiliki
                                    banyak simpanan.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </aside>
            </div>
            {/* TUTORIAL SPOTLIGHT */}
            {showTutorial &&
                !isPopupTutorialStep &&
                !(tutorialStep === 5 && isHeatingOverlayOpen) && (
                    <div className="fixed inset-0 z-[100] pointer-events-none">
                        {spotRect && (
                            <>
                                {/* Blocker bars around spotlight */}
                                <div
                                    className="fixed top-0 left-0 right-0 pointer-events-auto bg-black/78"
                                    style={{
                                        height: Math.max(0, spotRect.top - 8),
                                    }}
                                />
                                <div
                                    className="fixed bottom-0 left-0 right-0 pointer-events-auto bg-black/78"
                                    style={{
                                        height: Math.max(
                                            0,
                                            window.innerHeight -
                                                (spotRect.bottom + 8),
                                        ),
                                    }}
                                />
                                <div
                                    className="fixed pointer-events-auto bg-black/78"
                                    style={{
                                        top: Math.max(0, spotRect.top - 8),
                                        left: 0,
                                        width: Math.max(
                                            0,
                                            spotRect.left - 8,
                                        ),
                                        height: spotRect.height + 16,
                                    }}
                                />
                                <div
                                    className="fixed pointer-events-auto bg-black/78"
                                    style={{
                                        top: Math.max(0, spotRect.top - 8),
                                        left: spotRect.right + 8,
                                        width: Math.max(
                                            0,
                                            window.innerWidth -
                                                (spotRect.right + 8),
                                        ),
                                        height: spotRect.height + 16,
                                    }}
                                />
                                <div
                                    className="absolute rounded-xl ring-2 ring-[#CDB988] pointer-events-none"
                                    style={{
                                        top: spotRect.top - 8,
                                        left: spotRect.left - 8,
                                        width: spotRect.width + 16,
                                        height: spotRect.height + 16,
                                        boxShadow:
                                            "0 0 0 9999px rgba(0,0,0,0.78)",
                                    }}
                                />
                            </>
                        )}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(560px,90vw)] bg-[#0B1813] border border-[#CDB988]/40 rounded-2xl p-6 shadow-2xl text-[#D8C7A5] pointer-events-auto">
                            <h3 className="font-heading text-xl font-bold text-[#E2CEAB] mb-2">
                                {TUTORIAL_STEPS[tutorialStep].title}
                            </h3>
                            <p className="text-sm leading-relaxed text-[#BACDC2] mb-4">
                                {TUTORIAL_STEPS[tutorialStep].desc}
                            </p>
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        setShowTutorial(false);
                                        setTutorialStep(0);
                                    }}
                                    className="text-xs text-[#7E9385] hover:text-[#F5EFEB]"
                                >
                                    Lewati
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-[#7E9385]">
                                        {tutorialStep + 1}/
                                        {TUTORIAL_STEPS.length}
                                    </span>
                                    {tutorialStep === 2 && (
                                        <button
                                            onClick={() => setTutorialStep(3)}
                                            className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all"
                                        >
                                            Selanjutnya
                                        </button>
                                    )}
                                    {tutorialStep === 11 && (
                                        <button
                                            onClick={() =>
                                                setShowTutorial(false)
                                            }
                                            className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all"
                                        >
                                            Selesai
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* Modal Berbagi & Kolaborasi Real-Time */}
            <ShareModal
                isOpen={isOwner && shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                drawingId={loadedDrawingId}
                isOwner={isOwner}
                initialShareType={shareType}
                shareUrl={
                    loadedDrawingId
                        ? `${window.location.origin}/canvas/${loadedDrawingId}`
                        : ""
                }
                onShareUpdated={(newType) => setShareType(newType)}
                showToast={showToast}
            />

            {/* Modal Eksklusif Langganan untuk Kolaborasi */}
            <SubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />
        </div>
    );
}
