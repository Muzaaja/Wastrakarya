import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { Head, usePage } from "@inertiajs/react";
import { BATIK_MOTIFS } from "@/Components/WastraCanvas/BatikMotifs";
import CanvasAnimationStyles from "@/Components/WastraCanvas/CanvasAnimationStyles";
import CanvasWorkspace from "@/Components/WastraCanvas/CanvasWorkspace";
import CollaborationPreviewBanner from "@/Components/WastraCanvas/CollaborationPreviewBanner";
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
} from "@/Components/WastraCanvas/constants";
import {
    getJsonRequestHeaders,
    getRequestHeaders,
} from "@/Components/WastraCanvas/http";
import useCanvasCollaboration from "@/Components/WastraCanvas/hooks/useCanvasCollaboration";
import useCanvasHistory from "@/Components/WastraCanvas/hooks/useCanvasHistory";
import useCanvasInteraction from "@/Components/WastraCanvas/hooks/useCanvasInteraction";
import useCanvasRenderer from "@/Components/WastraCanvas/hooks/useCanvasRenderer";
import useCanvasTutorial from "@/Components/WastraCanvas/hooks/useCanvasTutorial";
import useMalamProcess from "@/Components/WastraCanvas/hooks/useMalamProcess";
import useSavedDrawings from "@/Components/WastraCanvas/hooks/useSavedDrawings";
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
    const [showGuide, setShowGuide] = useState(true);
    const [guideOpacity] = useState(0.75);
    const [showTileGrid, setShowTileGrid] = useState(false);
    const [favorites, setFavorites] = useState(["kawung", "parang"]);
    const [activeTab, setActiveTab] = useState("all");

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
    const [saveNameInput, setSaveNameInput] = useState("");
    const [saveRedirect, setSaveRedirect] = useState(null);
    const [restoreDrawing, setRestoreDrawing] = useState(false);
    const [loadedDrawingId, setLoadedDrawingId] = useState(
        initialDrawing?.id || canvasId || null,
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

    const hasActiveSubscription = Boolean(
        user?.has_active_subscription ?? user?.is_subscribed,
    );

    const malam = useMalamProcess({ setStatusMessage });
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
        renderMainCanvasRef,
        scheduleMainCanvasRender,
    } = useCanvasRenderer({
        guideOpacity,
        pan,
        selectedMotif,
        showGuide,
        showTileGrid,
        zoom,
    });

    const {
        canRedo,
        canUndo,
        handleRedo,
        handleUndo,
        saveStateToHistory,
    } = useCanvasHistory({
        getArtworkCanvas,
        renderMainCanvasRef,
        setHasUnsavedChanges,
    });

    const interaction = useCanvasInteraction({
        canvasChannelRef,
        canvasRef,
        getArtworkCanvas,
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

    const {
        fetchSavedDrawings,
        handleDeleteDrawing,
        savedDrawings,
        savedLoading,
    } = useSavedDrawings({ showToast, user });

    const applyMotifSelection = useCallback(
        (
            motifId,
            { broadcastChange = false, markUnsaved = false } = {},
        ) => {
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

    const filteredMotifs = BATIK_MOTIFS.filter((motif) => {
        if (activeTab === "favorites") {
            return favorites.includes(motif.id);
        }

        return true;
    });

    const toggleFavorite = (motifId, event) => {
        event?.stopPropagation();

        if (favorites.includes(motifId)) {
            setFavorites((currentFavorites) =>
                currentFavorites.filter((favorite) => favorite !== motifId),
            );
            showToast("Motif dihapus dari Favorit");
        } else {
            setFavorites((currentFavorites) => [
                ...currentFavorites,
                motifId,
            ]);
            showToast("Motif ditambahkan ke Favorit");
        }
    };

    const handleClearCanvas = () => {
        const artwork = getArtworkCanvas();
        if (!artwork) {
            return;
        }

        saveStateToHistory();
        const context = artwork.getContext("2d");
        context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        renderMainCanvasRef.current();

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

    const handleSave = (redirectTo = null) => {
        if (user && loadedDrawingId && !isOwner) {
            showToast("Hanya pemilik kanvas yang dapat menyimpan perubahan");
            return;
        }

        const artwork = getArtworkCanvas();
        if (!artwork) {
            return;
        }

        setSaveRedirect(redirectTo);
        setSaveNameInput(projectTitle);
        setShowSaveDialog(true);
        setShowMoreMenu(false);
    };

    const handleConfirmSave = async (
        customTitle = null,
        openShareAfterSave = false,
    ) => {
        if (user && loadedDrawingId && !isOwner) {
            setShowSaveDialog(false);
            showToast("Hanya pemilik kanvas yang dapat menyimpan perubahan");
            return;
        }

        const artwork = getArtworkCanvas();
        if (!artwork) {
            return;
        }

        const title =
            typeof customTitle === "string" && customTitle.trim()
                ? customTitle.trim()
                : saveNameInput.trim() || projectTitle;
        const payload = {
            title,
            motif: selectedMotif,
            waxColor,
            waxColorName,
            cantingSize: CANTING_SIZE,
            data_url: artwork.toDataURL(),
            updated_at: new Date().toISOString(),
        };

        setProjectTitle(title);
        setShowSaveDialog(false);

        const persistDrawing = async (method, url) => {
            try {
                const response = await fetch(url, {
                    method,
                    headers: getJsonRequestHeaders(),
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    throw new Error("Gagal menyimpan ke akun");
                }

                const data = await response.json();
                setHasUnsavedChanges(false);
                await fetchSavedDrawings();

                if (data?.id) {
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

                showToast("Karya berhasil disimpan!");
                if (openShareAfterSave && data?.id) {
                    setShareModalOpen(true);
                }

                return data;
            } catch (error) {
                console.error(error);
                showToast("Gagal menyimpan ke akun");
                return null;
            }
        };

        if (user) {
            const isUpdate = loadedDrawingId != null;
            if (isUpdate) {
                await persistDrawing(
                    "PUT",
                    `/api/user-drawings/${loadedDrawingId}`,
                );
            } else {
                await persistDrawing("POST", "/api/user-drawings");
            }
        } else {
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
            } catch (error) {
                console.error(error);
                showToast("Gagal menyimpan ke penyimpanan lokal");
            }
        }

        try {
            localStorage.setItem(
                "wastrakarya_studio_session",
                JSON.stringify({
                    malamState,
                    heatingProgress: malam.heatingProgress,
                    drawingTimeLeft,
                    waxColor,
                    waxColorName,
                    title,
                    motif: selectedMotif,
                    showGuide,
                    activeTool,
                    cantingSize: CANTING_SIZE,
                    dataUrl: artwork.toDataURL(),
                    updatedAt: new Date().toISOString(),
                }),
            );
        } catch (_) {}

        try {
            localStorage.setItem(
                "wastrakarya_studio_save",
                JSON.stringify({
                    ...payload,
                    updatedAt: new Date().toISOString(),
                }),
            );
        } catch (_) {}

        if (typeof saveRedirect === "string" && saveRedirect) {
            window.location.href = saveRedirect;
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

    const handleLoadDrawing = useCallback(
        (drawing) => {
            const artwork = getArtworkCanvas();
            if (!artwork) {
                return;
            }

            saveStateToHistory();
            const context = artwork.getContext("2d");
            context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            const image = new Image();
            image.onload = () => {
                context.drawImage(image, 0, 0);
                renderMainCanvasRef.current();
            };
            image.src = drawing.data_url;

            if (drawing.title) {
                setProjectTitle(drawing.title);
            }
            if (drawing.motif) {
                applyMotifSelection(drawing.motif);
            }
            if (drawing.wax_color) {
                setWaxColor(drawing.wax_color);
            }
            if (drawing.wax_color_name) {
                setWaxColorName(drawing.wax_color_name);
            }

            setHasUnsavedChanges(false);
            setActiveTab("all");
            setLoadedDrawingId(drawing.id ?? null);

            if (drawing.share_type) {
                setShareType(drawing.share_type);
            }

            const drawingIsOwner =
                drawing.is_owner !== undefined
                    ? Boolean(drawing.is_owner)
                    : Number(drawing.user_id) === Number(user?.id);
            const drawingOwner =
                drawing.owner ||
                drawing.user ||
                (drawingIsOwner && user
                    ? { id: user.id, name: user.name }
                    : null);

            setIsOwner(drawingIsOwner);
            setCanvasOwner(drawingOwner);
            if (!drawingIsOwner) {
                setShareModalOpen(false);
            }

            showToast(`Karya "${drawing.title}" dimuat`);
        },
        [
            applyMotifSelection,
            getArtworkCanvas,
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
        context.fillStyle = "#F5EFEB";
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
            const session = localStorage.getItem(
                "wastrakarya_studio_session",
            );

            if (session) {
                const data = JSON.parse(session);
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
                if (data.dataUrl) {
                    const artwork = getArtworkCanvas();
                    const context = artwork.getContext("2d");
                    context.clearRect(
                        0,
                        0,
                        CANVAS_WIDTH,
                        CANVAS_HEIGHT,
                    );
                    const image = new Image();
                    image.onload = () => {
                        context.drawImage(image, 0, 0);
                        renderMainCanvasRef.current();
                        saveStateToHistory();
                    };
                    image.src = data.dataUrl;
                }

                localStorage.removeItem("wastrakarya_studio_session");
                return;
            }

            const saved = localStorage.getItem("wastrakarya_studio_save");
            if (saved) {
                const data = JSON.parse(saved);
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
                if (data.dataUrl) {
                    const artwork = getArtworkCanvas();
                    const context = artwork.getContext("2d");
                    context.clearRect(
                        0,
                        0,
                        CANVAS_WIDTH,
                        CANVAS_HEIGHT,
                    );
                    const image = new Image();
                    image.onload = () => {
                        context.drawImage(image, 0, 0);
                        renderMainCanvasRef.current();
                        saveStateToHistory();
                    };
                    image.src = data.dataUrl;
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
        const drawingId =
            parameters.get("drawing") || parameters.get("share");

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
        getArtworkCanvas,
        loadedDrawingId,
        projectTitle,
        renderMainCanvasRef,
        selectedMotif,
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
            await fetch(`/api/user-drawings/${loadedDrawingId}`, {
                method: "PUT",
                headers: getJsonRequestHeaders(),
                body: JSON.stringify({ title: projectTitle }),
            });
        } catch (_) {}
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

            <MotifDetailModal
                motif={detailMotifModal}
                onClose={() => setDetailMotifModal(null)}
                onUse={handleUseMotifFromDetails}
            />
            <SaveDrawingModal
                isOpen={showSaveDialog && isOwner}
                name={saveNameInput}
                onCancel={() => setShowSaveDialog(false)}
                onConfirm={() => handleConfirmSave()}
                onNameChange={setSaveNameInput}
            />

            <StudioHeader
                activeCollaborators={activeCollaborators}
                canvasOwner={canvasOwner}
                hasActiveSubscription={hasActiveSubscription}
                hasUnsavedChanges={hasUnsavedChanges}
                isEditingTitle={isEditingTitle}
                isOwner={isOwner}
                onOpenShare={handleOpenShare}
                onOpenThreeDimensionalMockup={() => handleSave("/mockup")}
                onSave={() => handleSave()}
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

            <div className="flex flex-1 overflow-hidden p-3 gap-3">
                <MalamToolPanel
                    activeTool={activeTool}
                    malam={malam}
                    malamWiggle={malamWiggle}
                    onSelectTool={selectTool}
                />
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
                    activeTab={activeTab}
                    favorites={favorites}
                    filteredMotifs={filteredMotifs}
                    onDeleteDrawing={handleDeleteDrawing}
                    onLoadDrawing={handleLoadDrawing}
                    onOpenMotifDetails={setDetailMotifModal}
                    onSelectMotif={handleSelectMotif}
                    onToggleFavorite={toggleFavorite}
                    savedDrawings={savedDrawings}
                    savedLoading={savedLoading}
                    selectedMotif={selectedMotif}
                    setActiveTab={setActiveTab}
                    setShowTileGrid={setShowTileGrid}
                    showTileGrid={showTileGrid}
                    user={user}
                />
            </div>

            <TutorialSpotlight
                isHeatingOverlayOpen={malam.isHeatingOverlayOpen}
                isPopupTutorialStep={tutorial.isPopupTutorialStep}
                onFinish={tutorial.stopTutorial}
                onNext={() => tutorial.setTutorialStep(3)}
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
