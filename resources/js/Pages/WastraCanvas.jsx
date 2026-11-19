import { useCallback, useEffect, useRef, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import { BATIK_MOTIFS } from "@/Components/WastraCanvas/BatikMotifs";
import CanvasAnimationStyles from "@/Components/WastraCanvas/CanvasAnimationStyles";
import CanvasWorkspace from "@/Components/WastraCanvas/CanvasWorkspace";
import CollaborationPreviewBanner from "@/Components/WastraCanvas/CollaborationPreviewBanner";
import DyeingOverlay from "@/Components/WastraCanvas/DyeingOverlay";
import HeatingOverlay from "@/Components/WastraCanvas/HeatingOverlay";
import MalamToolPanel from "@/Components/WastraCanvas/MalamToolPanel";
import MotifDetailModal from "@/Components/WastraCanvas/MotifDetailModal";
import MotifLibraryPanel from "@/Components/WastraCanvas/MotifLibraryPanel";
import SaveDrawingModal from "@/Components/WastraCanvas/SaveDrawingModal";
import ShareModal from "@/Components/WastraCanvas/ShareModal";
import StudioHeader from "@/Components/WastraCanvas/StudioHeader";
import SubscriptionModal from "@/Components/WastraCanvas/SubscriptionModal";
import ToastNotification from "@/Components/WastraCanvas/ToastNotification";
import TutorialSpotlight from "@/Components/WastraCanvas/TutorialSpotlight";
import {
    CANTING_SIZE,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    DRAWING_DURATION_SECONDS,
    FABRIC_BASE_COLOR,
    SAVED_CANVAS_IMAGE_QUALITY,
    SAVED_CANVAS_IMAGE_TYPE,
} from "@/Components/WastraCanvas/constants";
import { clearCanvas } from "@/Components/WastraCanvas/canvasPixels";
import {
    hasStoredArtwork,
    isStoredDrawingScopedTo,
    normalizeStoredDrawing,
    removeStoredDrawingIfMatching,
    shouldUseStoredDrawing,
} from "@/Components/WastraCanvas/drawingStorage";
import {
    getJsonRequestHeaders,
    getRequestHeaders,
} from "@/Components/WastraCanvas/http";
import useCanvasCollaboration from "@/Components/WastraCanvas/hooks/useCanvasCollaboration";
import useCanvasHistory from "@/Components/WastraCanvas/hooks/useCanvasHistory";
import useCanvasInteraction from "@/Components/WastraCanvas/hooks/useCanvasInteraction";
import useCanvasRenderer from "@/Components/WastraCanvas/hooks/useCanvasRenderer";
import useCanvasTutorial from "@/Components/WastraCanvas/hooks/useCanvasTutorial";
import useDyeingProcess from "@/Components/WastraCanvas/hooks/useDyeingProcess";
import useMalamProcess from "@/Components/WastraCanvas/hooks/useMalamProcess";
import useToast from "@/Components/WastraCanvas/hooks/useToast";

export default function WastraCanvas({
    initialDrawing = null,
    canvasId = null,
}) {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;

    const [, setStatusMessage] = useState(
        'Pilih warna malam, lalu tekan "Panaskan Malam" untuk memulai.',
    );
    const { toastMessage, showToast } = useToast();

    const [selectedMotif, setSelectedMotif] = useState(
        initialDrawing?.motif || "kawung",
    );
    const [fabricColor, setFabricColor] = useState(
        initialDrawing?.fabric_color || FABRIC_BASE_COLOR,
    );
    const [showGuide, setShowGuide] = useState(true);
    const [guideOpacity] = useState(0.75);
    const [showTileGrid, setShowTileGrid] = useState(false);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [detailMotifModal, setDetailMotifModal] = useState(null);
    const [projectTitle, setProjectTitle] = useState(
        initialDrawing?.title || "Karya tanpa judul",
    );
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");
    const [saveMode, setSaveMode] = useState("save");
    const [saveRedirect, setSaveRedirect] = useState(null);
    const [restoreDrawing, setRestoreDrawing] = useState(false);
    const [loadedDrawingId, setLoadedDrawingId] = useState(
        initialDrawing?.id || canvasId || null,
    );
    const [hasPersistedArtwork, setHasPersistedArtwork] = useState(
        Boolean(initialDrawing?.data_url),
    );

    const [shareType, setShareType] = useState(
        initialDrawing?.share_type || "private",
    );
    const [isOwner, setIsOwner] = useState(
        initialDrawing ? Boolean(initialDrawing.is_owner) : true,
    );
    const [canvasOwner, setCanvasOwner] = useState(
        initialDrawing?.owner || null,
    );
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const canvasChannelRef = useRef(null);
    const saveInProgressRef = useRef(false);
    const toolPanelBoundsRef = useRef(null);

    const hasActiveSubscription = Boolean(
        user?.has_active_subscription ?? user?.is_subscribed,
    );

    const malam = useMalamProcess({ setStatusMessage });
    const dyeing = useDyeingProcess({ setStatusMessage });
    const {
        drawingTimeLeft,
        malamState,
        setDrawingTimeLeft,
        setHeatingProgress,
        setMalamState,
        setWaxColor,
        setWaxColorName,
        startDrawingTimer,
        waxColor,
        waxColorName,
    } = malam;

    const {
        canvasHeight,
        canvasRef,
        canvasWidth,
        getArtworkCanvas,
        getPencilCanvas,
        getWaxCanvas,
        loadArtworkLayers,
        renderMainCanvasRef,
        scheduleMainCanvasRender,
    } = useCanvasRenderer({
        fabricColor,
        guideOpacity,
        pan,
        selectedMotif,
        showGuide,
        showTileGrid,
        zoom,
    });

    const { canRedo, canUndo, handleRedo, handleUndo, saveStateToHistory } =
        useCanvasHistory({
            fabricColor,
            getPencilCanvas,
            getWaxCanvas,
            renderMainCanvasRef,
            setFabricColor,
            setHasUnsavedChanges,
        });

    const interaction = useCanvasInteraction({
        canvasChannelRef,
        canvasRef,
        getPencilCanvas,
        getWaxCanvas,
        handleCantingDip: malam.handleCantingDip,
        handleRedo,
        handleUndo,
        hasActiveSubscription,
        isOwner,
        loadedDrawingId,
        malamState,
        onRequireSubscription: () => setShowSubscriptionModal(true),
        pan,
        saveStateToHistory,
        scheduleMainCanvasRender,
        selectedMotif,
        setPan,
        setStatusMessage,
        setZoom,
        showToast,
        startDrawing: malam.startDrawing,
        user,
        waxColor,
        zoom,
    });
    const {
        activeTool,
        cursorAngle,
        cursorPos,
        drawRemoteLineBetween,
        handleCanvasPointerDown,
        handleCanvasPointerMove,
        handleCanvasPointerUp,
        handleContainerPointerDown,
        handleResetZoom,
        handleZoomIn,
        handleZoomOut,
        isPressed,
        malamWiggle,
        selectTool,
        setActiveTool,
    } = interaction;

    const tutorial = useCanvasTutorial({
        activeTool,
        isMalamInPot: malam.isMalamInPot,
        isMalamPouringFinished: malam.isMalamPouringFinished,
        malamState,
        selectedMotif,
        user,
        waxColor,
    });

    const applyMotifSelection = useCallback(
        (motifId, { broadcastChange = false, markUnsaved = false } = {}) => {
            if (!motifId) {
                return;
            }

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

    const createFabricSnapshot = useCallback(
        (sourceArtwork = null) => {
            const artwork = sourceArtwork ?? getArtworkCanvas();
            if (!artwork) {
                return null;
            }

            const textureSize = 640;
            const snapshot = document.createElement("canvas");
            snapshot.width = textureSize;
            snapshot.height = textureSize;
            const context = snapshot.getContext("2d", { alpha: true });
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
            context.drawImage(
                artwork,
                0,
                0,
                artwork.width,
                artwork.height,
                0,
                0,
                textureSize,
                textureSize,
            );

            return snapshot.toDataURL("image/png");
        },
        [getArtworkCanvas],
    );

    const handleStartDyeing = useCallback(() => {
        const textureUrl = createFabricSnapshot();
        if (!textureUrl || !canvasRef.current) {
            showToast("Kanvas belum siap untuk proses pencelupan");
            return;
        }

        dyeing.openDyeing({
            sourceElement: canvasRef.current,
            textureUrl,
            pencilTextureUrl: createFabricSnapshot(getPencilCanvas()),
            waxTextureUrl: createFabricSnapshot(getWaxCanvas()),
            currentFabricColor: fabricColor,
        });
    }, [
        canvasRef,
        createFabricSnapshot,
        dyeing,
        fabricColor,
        getPencilCanvas,
        getWaxCanvas,
        showToast,
    ]);

    const handleApplyDye = useCallback(() => {
        saveStateToHistory();
        clearCanvas(getPencilCanvas());
        const dyedTextureUrl = createFabricSnapshot();
        if (dyedTextureUrl) {
            dyeing.prepareClosingCloth({
                textureUrl: dyedTextureUrl,
                currentFabricColor: dyeing.selectedDye.hex,
            });
        }
        setFabricColor(dyeing.selectedDye.hex);
        setShowGuide(false);
        setHasUnsavedChanges(true);
        scheduleMainCanvasRender();

        if (canvasChannelRef.current && loadedDrawingId) {
            try {
                canvasChannelRef.current.whisper("fabric-color", {
                    color: dyeing.selectedDye.hex,
                    userId: user?.id,
                    userName: user?.name,
                });
            } catch (_) {}
        }

        showToast(`Kain diwarnai ${dyeing.selectedDye.name}`);
        dyeing.closeDyeing();
    }, [
        dyeing,
        createFabricSnapshot,
        getPencilCanvas,
        loadedDrawingId,
        saveStateToHistory,
        scheduleMainCanvasRender,
        showToast,
        user?.id,
        user?.name,
    ]);

    const handleClearCanvas = () => {
        saveStateToHistory();
        clearCanvas(getPencilCanvas());
        clearCanvas(getWaxCanvas());
        setFabricColor(FABRIC_BASE_COLOR);
        scheduleMainCanvasRender();

        if (canvasChannelRef.current && loadedDrawingId) {
            try {
                canvasChannelRef.current.whisper("clear", {
                    fabricColor: FABRIC_BASE_COLOR,
                    userId: user?.id,
                    userName: user?.name,
                });
            } catch (_) {}
        }

        setStatusMessage("Kanvas dibersihkan. Siap untuk goresan baru.");
        showToast("Kanvas telah dibersihkan");
        setShowMoreMenu(false);
    };

    const handleSave = (redirectTo = null, mode = "save") => {
        if (user && loadedDrawingId && !isOwner) {
            showToast("Hanya pemilik kanvas yang dapat menyimpan perubahan");
            return;
        }

        if (
            mode === "save-as" &&
            (!user || !loadedDrawingId || !hasPersistedArtwork)
        ) {
            return;
        }

        setShowMoreMenu(false);

        if (
            mode === "save" &&
            user &&
            loadedDrawingId &&
            hasPersistedArtwork
        ) {
            void handleConfirmSave(projectTitle, false, {
                mode,
                redirectTo,
            });
            return;
        }

        setSaveMode(mode);
        setSaveRedirect(redirectTo);
        setSaveNameInput(
            mode === "save-as" ? `${projectTitle} - Salinan` : projectTitle,
        );
        setShowSaveDialog(true);
    };

    const handleCancelSave = () => {
        if (saveInProgressRef.current) {
            return;
        }

        setShowSaveDialog(false);
        setSaveMode("save");
        setSaveRedirect(null);
    };

    const clearMatchingRecoverySnapshots = useCallback(
        (drawingId) => {
            const scope = {
                canvasId: drawingId,
                userId: user?.id ?? null,
                ownerId: user?.id ?? null,
                allowLegacyGuest: !user,
            };

            removeStoredDrawingIfMatching(
                sessionStorage,
                "wastrakarya_mockup_snapshot",
                scope,
            );
            removeStoredDrawingIfMatching(
                localStorage,
                "wastrakarya_studio_session",
                scope,
            );
            removeStoredDrawingIfMatching(
                localStorage,
                "wastrakarya_studio_save",
                scope,
            );
        },
        [user],
    );

    const handleConfirmSave = async (
        customTitle = null,
        openShareAfterSave = false,
        saveOptions = {},
    ) => {
        if (saveInProgressRef.current) {
            return;
        }

        if (user && loadedDrawingId && !isOwner) {
            setShowSaveDialog(false);
            setSaveRedirect(null);
            showToast("Hanya pemilik kanvas yang dapat menyimpan perubahan");
            return;
        }

        saveInProgressRef.current = true;
        setIsSaving(true);
        const requestedRedirect = Object.prototype.hasOwnProperty.call(
            saveOptions,
            "redirectTo",
        )
            ? saveOptions.redirectTo
            : saveRedirect;
        const requestedSaveMode = saveOptions.mode ?? saveMode;
        const sourceDrawingId = loadedDrawingId;
        const shouldSaveAs =
            requestedSaveMode === "save-as" &&
            Boolean(user && sourceDrawingId && hasPersistedArtwork);
        setSaveRedirect(null);

        try {
            const artwork = getArtworkCanvas();
            const pencilCanvas = getPencilCanvas();
            const waxCanvas = getWaxCanvas();
            const artworkDataUrl = artwork.toDataURL(
                SAVED_CANVAS_IMAGE_TYPE,
                SAVED_CANVAS_IMAGE_QUALITY,
            );
            const pencilDataUrl = pencilCanvas.toDataURL(
                SAVED_CANVAS_IMAGE_TYPE,
                SAVED_CANVAS_IMAGE_QUALITY,
            );
            const waxDataUrl = waxCanvas.toDataURL(
                SAVED_CANVAS_IMAGE_TYPE,
                SAVED_CANVAS_IMAGE_QUALITY,
            );

            const title =
                typeof customTitle === "string" && customTitle.trim()
                    ? customTitle.trim()
                    : saveNameInput.trim() || projectTitle;
            const payload = {
                title,
                motif: selectedMotif,
                wax_color: waxColor,
                wax_color_name: waxColorName,
                fabric_color: fabricColor,
                canting_size: CANTING_SIZE,
                data_url: artworkDataUrl,
                pencil_data_url: pencilDataUrl,
                wax_data_url: waxDataUrl,
            };

            const persistDrawing = async (method, url) => {
                const response = await fetch(url, {
                    method,
                    headers: getJsonRequestHeaders(),
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(
                        errorData?.message ||
                            Object.values(errorData?.errors || {})
                                .flat()
                                .find(Boolean) ||
                            "Gagal menyimpan ke akun",
                    );
                }

                const data = await response.json();
                setProjectTitle(title);
                setHasUnsavedChanges(false);
                setHasPersistedArtwork(true);

                if (data?.id) {
                    if (sourceDrawingId == null || shouldSaveAs) {
                        window.history.replaceState(
                            window.history.state,
                            "",
                            `/canvas/${data.id}`,
                        );
                    }
                    setLoadedDrawingId(data.id);
                    if (data.share_type) {
                        setShareType(data.share_type);
                    }
                    if (data.is_owner !== undefined) {
                        setIsOwner(data.is_owner);
                    }
                    if (data.owner) {
                        setCanvasOwner(data.owner);
                    }
                }

                showToast(
                    shouldSaveAs
                        ? "Salinan karya berhasil dibuat!"
                        : "Karya berhasil disimpan!",
                );
                if (openShareAfterSave && data?.id) {
                    setShareModalOpen(true);
                }

                return data;
            };

            let persistedDrawing = null;

            if (user) {
                if (shouldSaveAs) {
                    persistedDrawing = await persistDrawing(
                        "POST",
                        "/api/user-drawings",
                    );
                } else if (sourceDrawingId != null) {
                    persistedDrawing = await persistDrawing(
                        "PUT",
                        `/api/user-drawings/${sourceDrawingId}`,
                    );
                } else {
                    persistedDrawing = await persistDrawing(
                        "POST",
                        "/api/user-drawings",
                    );
                }

                if (shouldSaveAs) {
                    clearMatchingRecoverySnapshots(sourceDrawingId);
                }
                clearMatchingRecoverySnapshots(persistedDrawing.id);
            } else {
                const savedAt = new Date().toISOString();
                const storedDrawing = {
                    canvasId: loadedDrawingId,
                    userId: null,
                    title,
                    motif: selectedMotif,
                    waxColor,
                    waxColorName,
                    fabricColor,
                    cantingSize: CANTING_SIZE,
                    data_url: artworkDataUrl,
                    dataUrl: artworkDataUrl,
                    pencilDataUrl,
                    waxDataUrl,
                    updatedAt: savedAt,
                };

                localStorage.setItem(
                    "wastrakarya_studio_save",
                    JSON.stringify(storedDrawing),
                );
                localStorage.setItem(
                    "wastrakarya_studio_session",
                    JSON.stringify({
                        canvasId: loadedDrawingId,
                        userId: null,
                        title,
                        motif: selectedMotif,
                        waxColor,
                        waxColorName,
                        fabricColor,
                        cantingSize: CANTING_SIZE,
                        malamState,
                        heatingProgress: malam.heatingProgress,
                        drawingTimeLeft,
                        showGuide,
                        activeTool,
                        updatedAt: savedAt,
                    }),
                );
                setProjectTitle(title);
                setHasUnsavedChanges(false);
                showToast(
                    "Karya disimpan secara lokal. Masuk untuk menyimpan ke akun Anda!",
                );
            }

            setShowSaveDialog(false);
            setSaveMode("save");

            if (typeof requestedRedirect === "string" && requestedRedirect) {
                const redirectDrawingId =
                    persistedDrawing?.id ?? loadedDrawingId;
                const redirectUrl =
                    requestedRedirect === "/mockup" && redirectDrawingId
                        ? `/mockup/${redirectDrawingId}`
                        : requestedRedirect;

                if (requestedRedirect === "/mockup" && !user) {
                    sessionStorage.setItem(
                        "wastrakarya_mockup_snapshot",
                        JSON.stringify({
                            canvasId: redirectDrawingId,
                            userId: user?.id ?? null,
                            title,
                            motif: selectedMotif,
                            fabricColor,
                            fabric_color: fabricColor,
                            dataUrl: artworkDataUrl,
                            data_url: artworkDataUrl,
                            updatedAt:
                                persistedDrawing?.updated_at ??
                                new Date().toISOString(),
                        }),
                    );
                }

                window.location.href = redirectUrl;
            }
        } catch (error) {
            console.error(error);
            setSaveRedirect(requestedRedirect);
            setHasUnsavedChanges(true);
            showToast(
                error.message ||
                    (user
                        ? "Gagal menyimpan ke akun"
                        : "Gagal menyimpan ke penyimpanan lokal"),
            );
        } finally {
            saveInProgressRef.current = false;
            setIsSaving(false);
        }
    };

    const handleOpenShare = async () => {
        if (!isOwner) {
            return;
        }

        if (!user) {
            showToast("Silakan masuk terlebih dahulu untuk membagikan kanvas.");
            return;
        }

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

    const getStoredDrawingSnapshot = useCallback(
        (drawing) => {
            if (!drawing?.id) {
                return null;
            }

            const storageItems = [
                [sessionStorage, "wastrakarya_mockup_snapshot"],
                [localStorage, "wastrakarya_studio_session"],
                [localStorage, "wastrakarya_studio_save"],
            ];

            for (const [storage, key] of storageItems) {
                try {
                    const storedValue = storage.getItem(key);
                    if (!storedValue) {
                        continue;
                    }

                    const snapshot = JSON.parse(storedValue);
                    if (
                        !isStoredDrawingScopedTo(snapshot, {
                            canvasId: drawing.id,
                            userId: user?.id ?? null,
                            ownerId:
                                drawing.user_id ?? drawing.owner?.id ?? null,
                            allowLegacyGuest: !user,
                        })
                    ) {
                        continue;
                    }

                    if (!shouldUseStoredDrawing(snapshot, drawing)) {
                        continue;
                    }

                    const normalizedSnapshot = normalizeStoredDrawing(snapshot);

                    return {
                        title: snapshot.title,
                        motif: snapshot.motif,
                        fabric_color: normalizedSnapshot.fabricColor,
                        data_url: normalizedSnapshot.dataUrl,
                        pencil_data_url: normalizedSnapshot.pencilDataUrl,
                        wax_data_url: normalizedSnapshot.waxDataUrl,
                        updated_at: normalizedSnapshot.updatedAt,
                    };
                } catch (error) {
                    console.error(`Gagal membaca snapshot ${key}`, error);
                }
            }

            return null;
        },
        [user],
    );

    const handleLoadDrawing = useCallback(
        async (drawing) => {
            let fullDrawing = drawing;
            let drawingHasPersistedArtwork = Boolean(drawing?.data_url);
            let restoredFromSnapshot = false;
            const artworkLayersNeedFetching =
                drawing?.id &&
                drawing.pencil_data_url === undefined &&
                drawing.wax_data_url === undefined;

            if (artworkLayersNeedFetching) {
                try {
                    const response = await fetch(
                        `/api/user-drawings/${drawing.id}`,
                        { headers: getRequestHeaders() },
                    );
                    if (!response.ok) {
                        throw new Error("Gagal memuat layer karya");
                    }
                    fullDrawing = await response.json();
                    drawingHasPersistedArtwork = Boolean(fullDrawing.data_url);
                } catch (error) {
                    console.error(error);
                    showToast("Gagal memuat layer karya terpilih");
                    return;
                }
            }

            if (fullDrawing.id) {
                const storedSnapshot = getStoredDrawingSnapshot(fullDrawing);

                if (storedSnapshot) {
                    fullDrawing = {
                        ...fullDrawing,
                        ...storedSnapshot,
                    };
                    restoredFromSnapshot = true;
                }
            }

            const hasLoadableArtwork = hasStoredArtwork(fullDrawing);

            if (!hasLoadableArtwork) {
                showToast(
                    "Karya ini belum memiliki gambar tersimpan. Kanvas saat ini tidak diubah.",
                );
                return;
            }

            saveStateToHistory();
            try {
                await loadArtworkLayers({
                    compositeDataUrl: fullDrawing.data_url,
                    pencilDataUrl: fullDrawing.pencil_data_url,
                    waxDataUrl: fullDrawing.wax_data_url,
                });
                renderMainCanvasRef.current();
            } catch (error) {
                console.error(error);
                showToast("Data gambar karya tidak dapat dimuat");
                return;
            }

            if (fullDrawing.title) {
                setProjectTitle(fullDrawing.title);
            }
            if (fullDrawing.motif) {
                applyMotifSelection(fullDrawing.motif);
            }
            if (fullDrawing.wax_color) {
                setWaxColor(fullDrawing.wax_color);
            }
            if (fullDrawing.wax_color_name) {
                setWaxColorName(fullDrawing.wax_color_name);
            }
            setFabricColor(fullDrawing.fabric_color || FABRIC_BASE_COLOR);

            setHasUnsavedChanges(restoredFromSnapshot);
            setHasPersistedArtwork(drawingHasPersistedArtwork);
            setLoadedDrawingId(fullDrawing.id ?? null);

            if (fullDrawing.share_type) {
                setShareType(fullDrawing.share_type);
            }

            const drawingIsOwner =
                fullDrawing.is_owner !== undefined
                    ? Boolean(fullDrawing.is_owner)
                    : Number(fullDrawing.user_id) === Number(user?.id);
            const drawingOwner =
                fullDrawing.owner ||
                fullDrawing.user ||
                (drawingIsOwner && user
                    ? { id: user.id, name: user.name }
                    : null);

            setIsOwner(drawingIsOwner);
            setCanvasOwner(drawingOwner);
            if (!drawingIsOwner) {
                setShareModalOpen(false);
            }

            showToast(
                restoredFromSnapshot
                    ? `Karya "${fullDrawing.title}" dipulihkan. Simpan kembali untuk memperbarui database.`
                    : `Karya "${fullDrawing.title}" dimuat`,
            );
        },
        [
            applyMotifSelection,
            getStoredDrawingSnapshot,
            loadArtworkLayers,
            renderMainCanvasRef,
            saveStateToHistory,
            setWaxColor,
            setWaxColorName,
            showToast,
            user,
        ],
    );

    const handleExportFullFabric = () => {
        const artwork = getArtworkCanvas();
        if (!artwork) {
            return;
        }

        const output = document.createElement("canvas");
        output.width = CANVAS_WIDTH;
        output.height = CANVAS_HEIGHT;
        const context = output.getContext("2d");
        context.fillStyle = fabricColor;
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.drawImage(artwork, 0, 0);

        const link = document.createElement("a");
        link.download = `${projectTitle
            .toLowerCase()
            .replace(/\s+/g, "-")}-kain-batik.png`;
        link.href = output.toDataURL("image/png");
        link.click();
        showToast("Kain batik berhasil diunduh (PNG)");
        setShowMoreMenu(false);
    };
    useEffect(() => {
        if (initialDrawing) {
            handleLoadDrawing(initialDrawing);
            return;
        }

        try {
            const session = localStorage.getItem("wastrakarya_studio_session");

            if (session) {
                const data = JSON.parse(session);
                if (
                    !isStoredDrawingScopedTo(data, {
                        canvasId: null,
                        userId: user?.id ?? null,
                        allowLegacyGuest: !user,
                    })
                ) {
                    return;
                }
                if (data.malamState) {
                    setMalamState(data.malamState);
                }
                if (data.heatingProgress !== undefined) {
                    setHeatingProgress(data.heatingProgress);
                }
                if (data.drawingTimeLeft !== undefined) {
                    setDrawingTimeLeft(data.drawingTimeLeft);
                }
                if (data.waxColor) {
                    setWaxColor(data.waxColor);
                }
                if (data.waxColorName) {
                    setWaxColorName(data.waxColorName);
                }
                if (data.fabricColor) {
                    setFabricColor(data.fabricColor);
                }
                if (data.title) {
                    setProjectTitle(data.title);
                }
                if (data.motif) {
                    setSelectedMotif(data.motif);
                }
                if (data.showGuide !== undefined) {
                    setShowGuide(data.showGuide);
                }
                if (data.activeTool !== undefined) {
                    setActiveTool(data.activeTool);
                } else if (data.isEraser !== undefined) {
                    setActiveTool(data.isEraser ? "eraser" : "canting");
                }
                if (data.malamState === "drawing") {
                    setDrawingTimeLeft(DRAWING_DURATION_SECONDS);
                    setRestoreDrawing(true);
                }
                if (data.dataUrl || data.pencilDataUrl || data.waxDataUrl) {
                    void loadArtworkLayers({
                        compositeDataUrl: data.dataUrl,
                        pencilDataUrl: data.pencilDataUrl,
                        waxDataUrl: data.waxDataUrl,
                    }).then(() => {
                        renderMainCanvasRef.current();
                        saveStateToHistory();
                    });
                }

                localStorage.removeItem("wastrakarya_studio_session");
            }

            const saved = localStorage.getItem("wastrakarya_studio_save");
            if (saved) {
                const data = JSON.parse(saved);
                if (
                    !isStoredDrawingScopedTo(data, {
                        canvasId: null,
                        userId: user?.id ?? null,
                        allowLegacyGuest: !user,
                    })
                ) {
                    return;
                }
                if (data.title) {
                    setProjectTitle(data.title);
                }
                if (data.motif) {
                    setSelectedMotif(data.motif);
                }
                if (data.waxColor) {
                    setWaxColor(data.waxColor);
                }
                if (data.waxColorName) {
                    setWaxColorName(data.waxColorName);
                }
                if (data.fabricColor) {
                    setFabricColor(data.fabricColor);
                }
                if (data.dataUrl || data.pencilDataUrl || data.waxDataUrl) {
                    void loadArtworkLayers({
                        compositeDataUrl: data.dataUrl,
                        pencilDataUrl: data.pencilDataUrl,
                        waxDataUrl: data.waxDataUrl,
                    }).then(() => {
                        renderMainCanvasRef.current();
                        saveStateToHistory();
                    });
                }
            }
        } catch (error) {
            console.error("Error loading saved canvas", error);
        }
    }, []);

    useEffect(() => {
        if (restoreDrawing && malamState === "drawing") {
            startDrawingTimer();
            setRestoreDrawing(false);
        }
    }, [malamState, restoreDrawing, startDrawingTimer]);

    useEffect(() => {
        const parameters = new URLSearchParams(window.location.search);
        const drawingId = parameters.get("drawing") || parameters.get("share");

        if (!drawingId) {
            return;
        }

        if (!user) {
            showToast("Silakan masuk terlebih dahulu untuk membuka karya ini.");
            return;
        }

        let cancelled = false;

        void (async () => {
            try {
                const response = await fetch(
                    `/api/user-drawings/${drawingId}`,
                    { headers: getRequestHeaders() },
                );

                if (response.status === 403) {
                    if (!cancelled) {
                        showToast(
                            "Akses ditolak: Anda tidak memiliki izin untuk membuka kanvas ini.",
                        );
                    }
                    return;
                }

                if (!response.ok) {
                    throw new Error("Gagal memuat karya");
                }

                const data = await response.json();
                if (!cancelled) {
                    handleLoadDrawing(data);
                }
            } catch (error) {
                console.error(error);
                if (!cancelled) {
                    showToast("Gagal memuat karya terpilih");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [handleLoadDrawing, showToast, user]);

    const { activeCollaborators, remoteCursors } = useCanvasCollaboration({
        applyMotifSelection,
        canvasChannelRef,
        cantingSize: CANTING_SIZE,
        drawRemoteLineBetween,
        getPencilCanvas,
        getWaxCanvas,
        loadArtworkLayers,
        fabricColor,
        loadedDrawingId,
        projectTitle,
        renderMainCanvasRef,
        selectedMotif,
        setFabricColor,
        setProjectTitle,
        setShareType,
        showToast,
        user,
        waxColor,
    });

    const handleProjectTitleCommit = async () => {
        if (!loadedDrawingId || !isOwner || !user) {
            return;
        }

        try {
            const response = await fetch(
                `/api/user-drawings/${loadedDrawingId}`,
                {
                    method: "PUT",
                    headers: getJsonRequestHeaders(),
                    body: JSON.stringify({ title: projectTitle }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                    errorData?.message || "Gagal menyimpan nama karya",
                );
            }
        } catch (error) {
            console.error(error);
            setHasUnsavedChanges(true);
            showToast(error.message || "Gagal menyimpan nama karya");
        }
    };

    const handleSelectMotif = (motif) => {
        applyMotifSelection(motif.id, {
            broadcastChange: true,
            markUnsaved: true,
        });

        if (motif.id === "polos") {
            showToast("Mode Kanvas Polos (Tanpa Panduan) aktif");
        } else {
            showToast(`Panduan pola ${motif.name} diaktifkan`);
        }
    };

    const handleUseMotifFromDetails = (motif) => {
        handleSelectMotif(motif);
        setDetailMotifModal(null);
    };

    const handleStartTutorial = () => {
        malam.resetMalamForTutorial();
        tutorial.startTutorial();
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#07130E] text-[#D8C7A5] select-none font-sans overflow-hidden">
            <Head title="Wastrakarya Studio - Ruang Kreasi Melukis Batik" />
            <CanvasAnimationStyles />
            <ToastNotification message={toastMessage} />
            <HeatingOverlay malam={malam} tutorial={tutorial} />
            <DyeingOverlay dyeing={dyeing} onApply={handleApplyDye} />

            <MotifDetailModal
                motif={detailMotifModal}
                onClose={() => setDetailMotifModal(null)}
                onUse={handleUseMotifFromDetails}
            />
            <SaveDrawingModal
                isOpen={showSaveDialog && isOwner}
                isSaving={isSaving}
                mode={saveMode}
                name={saveNameInput}
                onCancel={handleCancelSave}
                onConfirm={() => handleConfirmSave()}
                onNameChange={setSaveNameInput}
            />

            <StudioHeader
                activeCollaborators={activeCollaborators}
                canvasOwner={canvasOwner}
                canSaveAs={Boolean(
                    user && loadedDrawingId && hasPersistedArtwork,
                )}
                hasActiveSubscription={hasActiveSubscription}
                hasUnsavedChanges={hasUnsavedChanges}
                isEditingTitle={isEditingTitle}
                isOwner={isOwner}
                onOpenShare={handleOpenShare}
                onOpenThreeDimensionalMockup={() => handleSave("/mockup")}
                onSave={() => handleSave()}
                onSaveAs={() => handleSave(null, "save-as")}
                onStartTutorial={handleStartTutorial}
                onTitleChange={setProjectTitle}
                onTitleCommit={handleProjectTitleCommit}
                projectTitle={projectTitle}
                setIsEditingTitle={setIsEditingTitle}
                shareType={shareType}
            />

            {!isOwner && !hasActiveSubscription && (
                <CollaborationPreviewBanner
                    onSubscribe={() => setShowSubscriptionModal(true)}
                />
            )}

            <div
                ref={toolPanelBoundsRef}
                className="relative flex flex-1 gap-3 overflow-hidden p-3"
            >
                <CanvasWorkspace
                    canvas={{
                        canvasHeight,
                        canvasRef,
                        canvasWidth,
                    }}
                    collaboration={{ remoteCursors }}
                    drawing={{
                        activeTool,
                        cursorAngle,
                        cursorPos,
                        isPressed,
                        onContainerPointerDown: handleContainerPointerDown,
                        onPointerDown: handleCanvasPointerDown,
                        onPointerMove: handleCanvasPointerMove,
                        onPointerUp: handleCanvasPointerUp,
                    }}
                    dyeing={{
                        color: fabricColor,
                        onStart: handleStartDyeing,
                    }}
                    history={{
                        canRedo,
                        canUndo,
                        onRedo: handleRedo,
                        onUndo: handleUndo,
                    }}
                    malam={{
                        drawingTimeLeft,
                        malamState,
                    }}
                    menu={{
                        onClear: handleClearCanvas,
                        onExport: handleExportFullFabric,
                        setShowMoreMenu,
                        showMoreMenu,
                    }}
                    viewport={{
                        onResetZoom: handleResetZoom,
                        onZoomIn: handleZoomIn,
                        onZoomOut: handleZoomOut,
                        pan,
                        zoom,
                    }}
                />
                <MotifLibraryPanel
                    motifs={BATIK_MOTIFS}
                    onOpenMotifDetails={setDetailMotifModal}
                    onSelectMotif={handleSelectMotif}
                    selectedMotif={selectedMotif}
                    setShowTileGrid={setShowTileGrid}
                    showTileGrid={showTileGrid}
                    user={user}
                />
                <MalamToolPanel
                    activeTool={activeTool}
                    containerRef={toolPanelBoundsRef}
                    forceExpanded={tutorial.showTutorial}
                    malam={malam}
                    malamWiggle={malamWiggle}
                    onSelectTool={selectTool}
                />
            </div>

            <TutorialSpotlight
                isHeatingOverlayOpen={malam.isHeatingOverlayOpen}
                isPopupTutorialStep={tutorial.isPopupTutorialStep}
                onFinish={tutorial.stopTutorial}
                onNext={() =>
                    tutorial.setTutorialStep(
                        (currentStep) => currentStep + 1,
                    )
                }
                onSkip={tutorial.stopTutorial}
                showTutorial={tutorial.showTutorial}
                spotRect={tutorial.spotRect}
                tutorialStep={tutorial.tutorialStep}
            />

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
                onShareUpdated={setShareType}
                showToast={showToast}
            />

            <SubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />
        </div>
    );
}
