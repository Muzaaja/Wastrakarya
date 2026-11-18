import { useCallback, useEffect, useRef, useState } from "react";
import {
    CANTING_SIZE,
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    PENCIL_COLOR,
    PENCIL_SIZE,
} from "../constants";

export default function useCanvasInteraction({
    canvasChannelRef,
    canvasRef,
    getArtworkCanvas,
    handleCantingDip,
    handleRedo,
    handleUndo,
    hasActiveSubscription,
    loadedDrawingId,
    malamState,
    onRequireSubscription,
    pan,
    saveStateToHistory,
    scheduleMainCanvasRender,
    selectedMotif,
    setPan,
    setStatusMessage,
    setZoom,
    showToast,
    startDrawing,
    user,
    waxColor,
    zoom,
    isOwner,
}) {
    const [activeTool, setActiveTool] = useState("canting");
    const [cursorPos, setCursorPos] = useState(null);
    const [malamWiggle, setMalamWiggle] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [cursorAngle, setCursorAngle] = useState(0);
    const [isPanning, setIsPanning] = useState(false);

    const isDrawingRef = useRef(false);
    const lastPositionRef = useRef(null);
    const panStartRef = useRef({ x: 0, y: 0 });
    const previousCursorRef = useRef(null);
    const lastCursorBroadcastRef = useRef(0);

    const selectTool = useCallback((tool) => {
        setActiveTool(tool);
    }, []);

    const getActiveToolConfig = useCallback(() => {
        if (activeTool === "pencil") {
            return {
                size: PENCIL_SIZE,
                color: PENCIL_COLOR,
                erase: false,
            };
        }
        if (activeTool === "eraser") {
            return {
                size: CANTING_SIZE,
                color: "#000000",
                erase: true,
            };
        }

        return { size: CANTING_SIZE, color: waxColor, erase: false };
    }, [activeTool, waxColor]);

    const drawStamp = useCallback(
        (x, y, radius, color, erase) => {
            const artwork = getArtworkCanvas();
            if (!artwork) {
                return;
            }

            const context = artwork.getContext("2d");
            context.save();
            context.globalCompositeOperation = erase
                ? "destination-out"
                : "source-over";
            context.fillStyle = erase ? "#000000" : color;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
            context.restore();
        },
        [getArtworkCanvas],
    );

    const drawRemoteLineBetween = useCallback(
        (pointOne, pointTwo, size, color, erase) => {
            const radius = size / 2;
            const deltaX = pointTwo.x - pointOne.x;
            const deltaY = pointTwo.y - pointOne.y;
            const distance = Math.hypot(deltaX, deltaY);
            const stepSize = Math.max(1, radius / 3);
            const steps = Math.ceil(distance / stepSize);

            for (let index = 0; index <= steps; index++) {
                const progress = steps === 0 ? 0 : index / steps;
                drawStamp(
                    pointOne.x + deltaX * progress,
                    pointOne.y + deltaY * progress,
                    radius,
                    color,
                    erase,
                );
            }

            scheduleMainCanvasRender();
        },
        [drawStamp, scheduleMainCanvasRender],
    );

    const drawLineBetween = useCallback(
        (pointOne, pointTwo) => {
            const { size, color, erase } = getActiveToolConfig();
            const radius = size / 2;
            const deltaX = pointTwo.x - pointOne.x;
            const deltaY = pointTwo.y - pointOne.y;
            const distance = Math.hypot(deltaX, deltaY);
            const stepSize = Math.max(1, radius / 3);
            const steps = Math.ceil(distance / stepSize);

            for (let index = 0; index <= steps; index++) {
                const progress = steps === 0 ? 0 : index / steps;
                drawStamp(
                    pointOne.x + deltaX * progress,
                    pointOne.y + deltaY * progress,
                    radius,
                    color,
                    erase,
                );
            }

            if (canvasChannelRef.current && loadedDrawingId) {
                try {
                    canvasChannelRef.current.whisper("stroke", {
                        p1: { x: pointOne.x, y: pointOne.y },
                        p2: { x: pointTwo.x, y: pointTwo.y },
                        size,
                        color,
                        erase,
                        userId: user?.id,
                        userName: user?.name,
                    });
                } catch (_) {}
            }

            scheduleMainCanvasRender();
        },
        [
            canvasChannelRef,
            drawStamp,
            getActiveToolConfig,
            loadedDrawingId,
            scheduleMainCanvasRender,
            user?.id,
            user?.name,
        ],
    );

    const getCanvasCoordinates = useCallback(
        (event) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return null;
            }

            const rectangle = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rectangle.width;
            const scaleY = canvas.height / rectangle.height;
            const screenX = (event.clientX - rectangle.left) * scaleX;
            const screenY = (event.clientY - rectangle.top) * scaleY;
            const isInside =
                screenX >= 0 &&
                screenX <= CANVAS_WIDTH &&
                screenY >= 0 &&
                screenY <= CANVAS_HEIGHT;
            const clampedScreenX = Math.max(
                0,
                Math.min(CANVAS_WIDTH, screenX),
            );
            const clampedScreenY = Math.max(
                0,
                Math.min(CANVAS_HEIGHT, screenY),
            );

            return {
                x: (clampedScreenX - pan.x) / zoom,
                y: (clampedScreenY - pan.y) / zoom,
                isInside,
                screenX,
                screenY,
            };
        },
        [canvasRef, pan.x, pan.y, zoom],
    );

    const handleCanvasPointerDown = useCallback(
        (event) => {
            if (event.button === 1 || event.spaceKey || event.altKey) {
                setIsPanning(true);
                panStartRef.current = {
                    x: event.clientX - pan.x,
                    y: event.clientY - pan.y,
                };
                return;
            }

            if (event.button !== 0 && event.pointerType === "mouse") {
                return;
            }

            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }

            const rectangle = canvas.getBoundingClientRect();
            if (
                event.clientX < rectangle.left ||
                event.clientX > rectangle.right ||
                event.clientY < rectangle.top ||
                event.clientY > rectangle.bottom
            ) {
                return;
            }

            const position = getCanvasCoordinates(event);
            if (!position || !position.isInside) {
                return;
            }

            if (activeTool === "canting" && malamState !== "drawing") {
                if (malamState === "ready") {
                    startDrawing();
                } else if (
                    malamState === "cold" ||
                    malamState === "hardened"
                ) {
                    setMalamWiggle(true);
                    window.setTimeout(() => setMalamWiggle(false), 600);
                }
                return;
            }

            if (!isOwner && !hasActiveSubscription) {
                showToast(
                    "Kolaborasi pengeditan membutuhkan paket langganan aktif.",
                );
                onRequireSubscription();
                return;
            }

            try {
                event.currentTarget.setPointerCapture(event.pointerId);
            } catch (_) {}

            setIsPressed(true);
            saveStateToHistory();
            isDrawingRef.current = true;
            lastPositionRef.current = position;
            drawLineBetween(position, position);

            const motifLabel =
                selectedMotif && selectedMotif !== "polos"
                    ? `motif ${selectedMotif}`
                    : "bebas";
            const action =
                activeTool === "eraser" ? "menghapus" : "menggambar";
            const toolLabel =
                activeTool === "canting"
                    ? "Canting"
                    : activeTool === "pencil"
                      ? "Pencil"
                      : "Eraser";
            setStatusMessage(
                `Sedang ${action} dengan ${toolLabel} ${
                    motifLabel ? `(${motifLabel})` : ""
                }...`,
            );
        },
        [
            activeTool,
            canvasRef,
            drawLineBetween,
            getCanvasCoordinates,
            hasActiveSubscription,
            isOwner,
            malamState,
            onRequireSubscription,
            pan.x,
            pan.y,
            saveStateToHistory,
            selectedMotif,
            setStatusMessage,
            showToast,
            startDrawing,
        ],
    );

    const handleCanvasPointerMove = useCallback(
        (event) => {
            if (isPanning) {
                setPan({
                    x: event.clientX - panStartRef.current.x,
                    y: event.clientY - panStartRef.current.y,
                });
                return;
            }

            const currentPosition = getCanvasCoordinates(event);
            if (!currentPosition) {
                return;
            }

            setCursorPos(currentPosition);

            if (
                canvasChannelRef.current &&
                loadedDrawingId &&
                user
            ) {
                const now = Date.now();
                if (now - lastCursorBroadcastRef.current > 40) {
                    lastCursorBroadcastRef.current = now;
                    try {
                        canvasChannelRef.current.whisper("cursor", {
                            userId: user.id,
                            userName: user.name,
                            x: currentPosition.x,
                            y: currentPosition.y,
                            tool: activeTool,
                            color: waxColor,
                        });
                    } catch (_) {}
                }
            }

            if (previousCursorRef.current) {
                const deltaX =
                    currentPosition.screenX -
                    previousCursorRef.current.screenX;
                const deltaY =
                    currentPosition.screenY -
                    previousCursorRef.current.screenY;

                if (deltaX !== 0 || deltaY !== 0) {
                    const angle =
                        Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
                    setCursorAngle((previousAngle) => {
                        const targetAngle = -angle * 0.3;
                        return (
                            previousAngle +
                            (targetAngle - previousAngle) * 0.15
                        );
                    });
                } else {
                    setCursorAngle((previousAngle) => previousAngle * 0.9);
                }
            } else {
                setCursorAngle((previousAngle) => previousAngle * 0.95);
            }
            previousCursorRef.current = currentPosition;

            if (!isDrawingRef.current || !lastPositionRef.current) {
                return;
            }

            const canvas = canvasRef.current;
            if (canvas) {
                const rectangle = canvas.getBoundingClientRect();
                if (
                    event.clientX < rectangle.left - 12 ||
                    event.clientX > rectangle.right + 12 ||
                    event.clientY < rectangle.top - 12 ||
                    event.clientY > rectangle.bottom + 12
                ) {
                    isDrawingRef.current = false;
                    lastPositionRef.current = null;
                    return;
                }
            }

            drawLineBetween(lastPositionRef.current, currentPosition);
            lastPositionRef.current = currentPosition;
        },
        [
            activeTool,
            canvasChannelRef,
            canvasRef,
            drawLineBetween,
            getCanvasCoordinates,
            isPanning,
            loadedDrawingId,
            setPan,
            user,
            waxColor,
        ],
    );

    const handleCanvasPointerUp = useCallback(
        (event) => {
            if (isPanning) {
                setIsPanning(false);
            }
            if (isDrawingRef.current) {
                isDrawingRef.current = false;
                lastPositionRef.current = null;
                setStatusMessage("Goresan malam diterapkan.");
            }

            setIsPressed(false);
            setCursorAngle((previousAngle) => previousAngle * 0.9);

            try {
                if (event?.currentTarget && event.pointerId) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                }
            } catch (_) {}
        },
        [isPanning, setStatusMessage],
    );

    const handleContainerPointerDown = useCallback(
        (event) => {
            if (
                event.target !== canvasRef.current &&
                (event.button === 0 ||
                    event.button === 1 ||
                    event.spaceKey ||
                    event.altKey)
            ) {
                setIsPanning(true);
                panStartRef.current = {
                    x: event.clientX - pan.x,
                    y: event.clientY - pan.y,
                };
            }
        },
        [canvasRef, pan.x, pan.y],
    );

    const handleZoomIn = useCallback(() => {
        setZoom((currentZoom) =>
            Math.min(2.5, Math.round((currentZoom + 0.15) * 100) / 100),
        );
    }, [setZoom]);

    const handleZoomOut = useCallback(() => {
        setZoom((currentZoom) =>
            Math.max(0.4, Math.round((currentZoom - 0.15) * 100) / 100),
        );
    }, [setZoom]);

    const handleResetZoom = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [setPan, setZoom]);

    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (isDrawingRef.current) {
                isDrawingRef.current = false;
                lastPositionRef.current = null;
            }
            if (isPanning) {
                setIsPanning(false);
            }
        };

        window.addEventListener("pointerup", handleGlobalPointerUp);
        return () =>
            window.removeEventListener("pointerup", handleGlobalPointerUp);
    }, [isPanning]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.target.tagName === "INPUT") {
                return;
            }

            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "z"
            ) {
                event.preventDefault();
                if (event.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "y"
            ) {
                event.preventDefault();
                handleRedo();
            } else if (event.key === "=" || event.key === "+") {
                handleZoomIn();
            } else if (event.key === "-" || event.key === "_") {
                handleZoomOut();
            } else if (event.key.toLowerCase() === "h") {
                handleCantingDip();
            } else if (event.key.toLowerCase() === "p") {
                event.preventDefault();
                selectTool("pencil");
            } else if (event.key.toLowerCase() === "e") {
                event.preventDefault();
                selectTool("eraser");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        handleCantingDip,
        handleRedo,
        handleUndo,
        handleZoomIn,
        handleZoomOut,
        selectTool,
    ]);

    return {
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
    };
}
