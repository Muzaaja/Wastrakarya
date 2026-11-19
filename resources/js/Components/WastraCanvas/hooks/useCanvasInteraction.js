import { useCallback, useEffect, useRef, useState } from "react";
import {
    CANTING_SIZE,
    CANVAS_HEIGHT,
    CANVAS_TILE_SIZE,
    CANVAS_WIDTH,
    PENCIL_COLOR,
    PENCIL_SIZE,
    shouldTileDrawingForMotif,
} from "../constants";
import { removePencilBeneathWax } from "../canvasPixels";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const TRACKPAD_ZOOM_SENSITIVITY = 0.002;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const getStrokeTranslations = (pointOne, pointTwo, radius, shouldTile) => {
    if (!shouldTile) {
        return [{ x: 0, y: 0 }];
    }

    const minX = Math.min(pointOne.x, pointTwo.x) - radius;
    const maxX = Math.max(pointOne.x, pointTwo.x) + radius;
    const minY = Math.min(pointOne.y, pointTwo.y) - radius;
    const maxY = Math.max(pointOne.y, pointTwo.y) + radius;
    const firstOffsetX =
        Math.ceil(-maxX / CANVAS_TILE_SIZE) * CANVAS_TILE_SIZE;
    const lastOffsetX =
        Math.floor((CANVAS_WIDTH - minX) / CANVAS_TILE_SIZE) *
        CANVAS_TILE_SIZE;
    const firstOffsetY =
        Math.ceil(-maxY / CANVAS_TILE_SIZE) * CANVAS_TILE_SIZE;
    const lastOffsetY =
        Math.floor((CANVAS_HEIGHT - minY) / CANVAS_TILE_SIZE) *
        CANVAS_TILE_SIZE;
    const translations = [];

    for (
        let offsetX = firstOffsetX;
        offsetX <= lastOffsetX;
        offsetX += CANVAS_TILE_SIZE
    ) {
        for (
            let offsetY = firstOffsetY;
            offsetY <= lastOffsetY;
            offsetY += CANVAS_TILE_SIZE
        ) {
            translations.push({ x: offsetX, y: offsetY });
        }
    }

    return translations;
};

export default function useCanvasInteraction({
    canvasChannelRef,
    canvasRef,
    getPencilCanvas,
    getWaxCanvas,
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
    const panStartRef = useRef(null);
    const previousCursorRef = useRef(null);
    const lastCursorBroadcastRef = useRef(0);
    const activeTouchPointersRef = useRef(new Map());
    const touchGestureRef = useRef(null);
    const isTouchGestureActiveRef = useRef(false);
    const zoomRef = useRef(zoom);
    const panRef = useRef(pan);
    const pendingZoomScrollRef = useRef(null);
    const zoomScrollFrameRef = useRef(null);

    zoomRef.current = zoom;
    panRef.current = pan;

    const selectTool = useCallback((tool) => {
        setActiveTool(tool);
    }, []);

    const getActiveToolConfig = useCallback(() => {
        if (activeTool === "pencil") {
            return {
                size: PENCIL_SIZE,
                color: PENCIL_COLOR,
                erase: false,
                tool: "pencil",
            };
        }
        if (activeTool === "eraser") {
            return {
                size: CANTING_SIZE,
                color: "#000000",
                erase: true,
                tool: "eraser",
            };
        }

        return {
            size: CANTING_SIZE,
            color: waxColor,
            erase: false,
            tool: "canting",
        };
    }, [activeTool, waxColor]);

    const drawStamp = useCallback(
        (x, y, radius, color, erase, tool, translations) => {
            const pencilCanvas = getPencilCanvas();
            const waxCanvas = getWaxCanvas();
            const targetCanvases = erase
                ? [pencilCanvas, waxCanvas]
                : [tool === "pencil" ? pencilCanvas : waxCanvas];

            for (const targetCanvas of targetCanvases) {
                const context = targetCanvas.getContext("2d");
                context.save();
                context.globalCompositeOperation = erase
                    ? "destination-out"
                    : "source-over";
                context.fillStyle = erase ? "#000000" : color;
                context.beginPath();

                for (const translation of translations) {
                    const translatedX = x + translation.x;
                    const translatedY = y + translation.y;
                    context.moveTo(translatedX + radius, translatedY);
                    context.arc(
                        translatedX,
                        translatedY,
                        radius,
                        0,
                        Math.PI * 2,
                    );
                }

                context.fill();
                context.restore();
            }
        },
        [getPencilCanvas, getWaxCanvas],
    );

    const removePencilForStroke = useCallback(
        (pointOne, pointTwo, radius, isTiled) => {
            const pencilCanvas = getPencilCanvas();
            const waxCanvas = getWaxCanvas();

            if (isTiled) {
                const translations = getStrokeTranslations(
                    pointOne,
                    pointTwo,
                    radius,
                    true,
                );
                const padding = radius + 2;

                for (const translation of translations) {
                    const minX =
                        Math.min(pointOne.x, pointTwo.x) +
                        translation.x -
                        padding;
                    const minY =
                        Math.min(pointOne.y, pointTwo.y) +
                        translation.y -
                        padding;
                    const maxX =
                        Math.max(pointOne.x, pointTwo.x) +
                        translation.x +
                        padding;
                    const maxY =
                        Math.max(pointOne.y, pointTwo.y) +
                        translation.y +
                        padding;

                    removePencilBeneathWax(
                        pencilCanvas,
                        waxCanvas,
                        minX,
                        minY,
                        maxX - minX,
                        maxY - minY,
                    );
                }

                return;
            }

            const padding = radius + 2;
            const minX = Math.min(pointOne.x, pointTwo.x) - padding;
            const minY = Math.min(pointOne.y, pointTwo.y) - padding;
            const maxX = Math.max(pointOne.x, pointTwo.x) + padding;
            const maxY = Math.max(pointOne.y, pointTwo.y) + padding;
            removePencilBeneathWax(
                pencilCanvas,
                waxCanvas,
                minX,
                minY,
                maxX - minX,
                maxY - minY,
            );
        },
        [getPencilCanvas, getWaxCanvas],
    );

    const drawRemoteLineBetween = useCallback(
        (
            pointOne,
            pointTwo,
            size,
            color,
            erase,
            tool = "canting",
            isTiled = false,
        ) => {
            const radius = size / 2;
            const deltaX = pointTwo.x - pointOne.x;
            const deltaY = pointTwo.y - pointOne.y;
            const distance = Math.hypot(deltaX, deltaY);
            const stepSize = Math.max(1, radius / 3);
            const steps = Math.ceil(distance / stepSize);
            const translations = getStrokeTranslations(
                pointOne,
                pointTwo,
                radius,
                isTiled,
            );

            for (let index = 0; index <= steps; index++) {
                const progress = steps === 0 ? 0 : index / steps;
                drawStamp(
                    pointOne.x + deltaX * progress,
                    pointOne.y + deltaY * progress,
                    radius,
                    color,
                    erase,
                    tool,
                    translations,
                );
            }

            if (!erase) {
                removePencilForStroke(
                    pointOne,
                    pointTwo,
                    radius,
                    isTiled,
                );
            }

            scheduleMainCanvasRender();
        },
        [drawStamp, removePencilForStroke, scheduleMainCanvasRender],
    );

    const drawLineBetween = useCallback(
        (pointOne, pointTwo) => {
            const { size, color, erase, tool } = getActiveToolConfig();
            const radius = size / 2;
            const deltaX = pointTwo.x - pointOne.x;
            const deltaY = pointTwo.y - pointOne.y;
            const distance = Math.hypot(deltaX, deltaY);
            const stepSize = Math.max(1, radius / 3);
            const steps = Math.ceil(distance / stepSize);
            const isTiled = shouldTileDrawingForMotif(selectedMotif);
            const translations = getStrokeTranslations(
                pointOne,
                pointTwo,
                radius,
                isTiled,
            );

            for (let index = 0; index <= steps; index++) {
                const progress = steps === 0 ? 0 : index / steps;
                drawStamp(
                    pointOne.x + deltaX * progress,
                    pointOne.y + deltaY * progress,
                    radius,
                    color,
                    erase,
                    tool,
                    translations,
                );
            }

            if (!erase) {
                removePencilForStroke(
                    pointOne,
                    pointTwo,
                    radius,
                    isTiled,
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
                        tool,
                        tiled: isTiled,
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
            removePencilForStroke,
            scheduleMainCanvasRender,
            selectedMotif,
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
            const worldX = (screenX - pan.x) / zoom;
            const worldY = (screenY - pan.y) / zoom;
            const isInside =
                worldX >= 0 &&
                worldX <= CANVAS_WIDTH &&
                worldY >= 0 &&
                worldY <= CANVAS_HEIGHT;

            return {
                x: Math.max(0, Math.min(CANVAS_WIDTH, worldX)),
                y: Math.max(0, Math.min(CANVAS_HEIGHT, worldY)),
                isInside,
                screenX,
                screenY,
            };
        },
        [canvasRef, pan.x, pan.y, zoom],
    );

    const getCanvasScreenPoint = useCallback(
        (clientX, clientY) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return null;
            }

            const rectangle = canvas.getBoundingClientRect();
            if (rectangle.width === 0 || rectangle.height === 0) {
                return null;
            }

            return {
                x: (clientX - rectangle.left) * (canvas.width / rectangle.width),
                y:
                    (clientY - rectangle.top) *
                    (canvas.height / rectangle.height),
            };
        },
        [canvasRef],
    );

    const startTouchGesture = useCallback(() => {
        const touchPointers = Array.from(
            activeTouchPointersRef.current.values(),
        );
        if (touchPointers.length < 2) {
            return;
        }

        const [firstPointer, secondPointer] = touchPointers;
        const center = getCanvasScreenPoint(
            (firstPointer.clientX + secondPointer.clientX) / 2,
            (firstPointer.clientY + secondPointer.clientY) / 2,
        );
        if (!center) {
            return;
        }

        const distance = Math.hypot(
            secondPointer.clientX - firstPointer.clientX,
            secondPointer.clientY - firstPointer.clientY,
        );

        isDrawingRef.current = false;
        lastPositionRef.current = null;
        isTouchGestureActiveRef.current = true;
        setIsPressed(false);
        touchGestureRef.current = {
            distance: Math.max(distance, 1),
            worldX: (center.x - pan.x) / zoom,
            worldY: (center.y - pan.y) / zoom,
            zoom,
        };
    }, [getCanvasScreenPoint, pan.x, pan.y, zoom]);

    const updateTouchGesture = useCallback(() => {
        const gesture = touchGestureRef.current;
        const touchPointers = Array.from(
            activeTouchPointersRef.current.values(),
        );
        if (!gesture || touchPointers.length < 2) {
            return;
        }

        const [firstPointer, secondPointer] = touchPointers;
        const center = getCanvasScreenPoint(
            (firstPointer.clientX + secondPointer.clientX) / 2,
            (firstPointer.clientY + secondPointer.clientY) / 2,
        );
        if (!center) {
            return;
        }

        const distance = Math.hypot(
            secondPointer.clientX - firstPointer.clientX,
            secondPointer.clientY - firstPointer.clientY,
        );
        const nextZoom = clampZoom(
            gesture.zoom * (Math.max(distance, 1) / gesture.distance),
        );

        setZoom(nextZoom);
        setPan({
            x: center.x - gesture.worldX * nextZoom,
            y: center.y - gesture.worldY * nextZoom,
        });
    }, [getCanvasScreenPoint, setPan, setZoom]);

    const handleCanvasPointerDown = useCallback(
        (event) => {
            if (event.pointerType === "touch") {
                event.preventDefault();
                activeTouchPointersRef.current.set(event.pointerId, {
                    clientX: event.clientX,
                    clientY: event.clientY,
                });

                try {
                    event.currentTarget.setPointerCapture(event.pointerId);
                } catch (_) {}

                if (activeTouchPointersRef.current.size >= 2) {
                    startTouchGesture();
                    return;
                }

                if (isTouchGestureActiveRef.current) {
                    return;
                }
            }

            if (event.button === 1) {
                const viewport = event.currentTarget.closest(
                    "[data-canvas-viewport]",
                );
                if (!viewport) {
                    return;
                }

                event.preventDefault();
                setIsPanning(true);
                panStartRef.current = {
                    mode: "viewport",
                    clientX: event.clientX,
                    clientY: event.clientY,
                    scrollLeft: viewport.scrollLeft,
                    scrollTop: viewport.scrollTop,
                    viewport,
                };

                try {
                    event.currentTarget.setPointerCapture(event.pointerId);
                } catch (_) {}

                return;
            }

            if (event.spaceKey || event.altKey) {
                setIsPanning(true);
                panStartRef.current = {
                    mode: "transform",
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
            saveStateToHistory(
                activeTool === "pencil"
                    ? ["pencil"]
                    : ["pencil", "wax"],
            );
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
            startTouchGesture,
            startDrawing,
        ],
    );

    const handleCanvasPointerMove = useCallback(
        (event) => {
            if (event.pointerType === "touch") {
                if (activeTouchPointersRef.current.has(event.pointerId)) {
                    activeTouchPointersRef.current.set(event.pointerId, {
                        clientX: event.clientX,
                        clientY: event.clientY,
                    });
                }

                if (isTouchGestureActiveRef.current) {
                    event.preventDefault();
                    updateTouchGesture();
                    return;
                }
            }

            if (isPanning) {
                if (panStartRef.current?.mode === "viewport") {
                    const panStart = panStartRef.current;
                    panStart.viewport.scrollTo({
                        left:
                            panStart.scrollLeft -
                            (event.clientX - panStart.clientX),
                        top:
                            panStart.scrollTop -
                            (event.clientY - panStart.clientY),
                    });
                    return;
                }

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
            updateTouchGesture,
            user,
            waxColor,
        ],
    );

    const handleCanvasPointerUp = useCallback(
        (event) => {
            if (event?.pointerType === "touch") {
                activeTouchPointersRef.current.delete(event.pointerId);

                if (isTouchGestureActiveRef.current) {
                    isDrawingRef.current = false;
                    lastPositionRef.current = null;
                    setIsPressed(false);

                    if (activeTouchPointersRef.current.size < 2) {
                        touchGestureRef.current = null;
                    }
                    if (activeTouchPointersRef.current.size === 0) {
                        isTouchGestureActiveRef.current = false;
                    }

                    try {
                        event.currentTarget?.releasePointerCapture(
                            event.pointerId,
                        );
                    } catch (_) {}

                    return;
                }
            }

            if (isPanning) {
                setIsPanning(false);
                panStartRef.current = null;
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
            if (event.pointerType === "touch") {
                return;
            }

            if (
                event.target !== canvasRef.current &&
                event.button === 1
            ) {
                const viewport = event.target.closest?.(
                    "[data-canvas-viewport]",
                );
                if (!viewport) {
                    return;
                }

                event.preventDefault();
                setIsPanning(true);
                panStartRef.current = {
                    mode: "viewport",
                    clientX: event.clientX,
                    clientY: event.clientY,
                    scrollLeft: viewport.scrollLeft,
                    scrollTop: viewport.scrollTop,
                    viewport,
                };

                try {
                    event.currentTarget.setPointerCapture(event.pointerId);
                } catch (_) {}

                return;
            }

            if (
                event.target !== canvasRef.current &&
                (event.button === 0 ||
                    event.spaceKey ||
                    event.altKey)
            ) {
                setIsPanning(true);
                panStartRef.current = {
                    mode: "transform",
                    x: event.clientX - pan.x,
                    y: event.clientY - pan.y,
                };
            }
        },
        [canvasRef, pan.x, pan.y],
    );

    const handleZoomIn = useCallback(() => {
        setZoom((currentZoom) =>
            Math.min(
                MAX_ZOOM,
                Math.round((currentZoom + 0.15) * 100) / 100,
            ),
        );
    }, [setZoom]);

    const handleZoomOut = useCallback(() => {
        setZoom((currentZoom) =>
            Math.max(
                MIN_ZOOM,
                Math.round((currentZoom - 0.15) * 100) / 100,
            ),
        );
    }, [setZoom]);

    const handleResetZoom = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        canvasRef.current
            ?.closest("[data-canvas-viewport]")
            ?.scrollTo({ left: 0, top: 0 });
    }, [canvasRef, setPan, setZoom]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const viewport = canvas?.closest("[data-canvas-viewport]");
        if (!viewport) {
            return;
        }

        const handleWheel = (event) => {
            const deltaMultiplier =
                event.deltaMode === WheelEvent.DOM_DELTA_LINE
                    ? 16
                    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                      ? viewport.clientHeight
                      : 1;

            if (!event.ctrlKey && !event.metaKey) {
                event.preventDefault();

                const horizontalDelta =
                    event.shiftKey && event.deltaX === 0
                        ? event.deltaY
                        : event.deltaX;
                const verticalDelta = event.shiftKey ? 0 : event.deltaY;

                viewport.scrollBy({
                    left: horizontalDelta * deltaMultiplier,
                    top: verticalDelta * deltaMultiplier,
                });
                return;
            }

            event.preventDefault();

            const viewportRectangle = viewport.getBoundingClientRect();
            const pointerOffsetX = event.clientX - viewportRectangle.left;
            const pointerOffsetY = event.clientY - viewportRectangle.top;
            const currentZoom = zoomRef.current;
            const currentPan = panRef.current;
            const currentScrollLeft =
                pendingZoomScrollRef.current?.left ?? viewport.scrollLeft;
            const currentScrollTop =
                pendingZoomScrollRef.current?.top ?? viewport.scrollTop;

            const nextZoom = clampZoom(
                currentZoom *
                    Math.exp(
                        -event.deltaY *
                            deltaMultiplier *
                            TRACKPAD_ZOOM_SENSITIVITY,
                    ),
            );
            const worldX =
                (currentScrollLeft + pointerOffsetX - currentPan.x) /
                currentZoom;
            const worldY =
                (currentScrollTop + pointerOffsetY - currentPan.y) /
                currentZoom;
            const nextScrollPosition = {
                left: Math.max(0, worldX * nextZoom - pointerOffsetX),
                top: Math.max(0, worldY * nextZoom - pointerOffsetY),
            };

            zoomRef.current = nextZoom;
            panRef.current = { x: 0, y: 0 };
            pendingZoomScrollRef.current = nextScrollPosition;
            setZoom(nextZoom);
            setPan({ x: 0, y: 0 });

            if (zoomScrollFrameRef.current !== null) {
                window.cancelAnimationFrame(zoomScrollFrameRef.current);
            }
            zoomScrollFrameRef.current = window.requestAnimationFrame(() => {
                const scrollPosition = pendingZoomScrollRef.current;
                if (scrollPosition) {
                    viewport.scrollTo(scrollPosition);
                }

                pendingZoomScrollRef.current = null;
                zoomScrollFrameRef.current = null;
            });
        };

        viewport.addEventListener("wheel", handleWheel, { passive: false });

        return () => viewport.removeEventListener("wheel", handleWheel);
    }, [canvasRef, setPan, setZoom]);

    useEffect(() => {
        return () => {
            if (zoomScrollFrameRef.current !== null) {
                window.cancelAnimationFrame(zoomScrollFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleGlobalPointerUp = (event) => {
            if (event.pointerType === "touch") {
                activeTouchPointersRef.current.delete(event.pointerId);
                if (activeTouchPointersRef.current.size < 2) {
                    touchGestureRef.current = null;
                }
                if (activeTouchPointersRef.current.size === 0) {
                    isTouchGestureActiveRef.current = false;
                }
            }

            if (isDrawingRef.current) {
                isDrawingRef.current = false;
                lastPositionRef.current = null;
            }
            if (isPanning) {
                setIsPanning(false);
                panStartRef.current = null;
            }
        };

        window.addEventListener("pointerup", handleGlobalPointerUp);
        window.addEventListener("pointercancel", handleGlobalPointerUp);
        return () => {
            window.removeEventListener("pointerup", handleGlobalPointerUp);
            window.removeEventListener("pointercancel", handleGlobalPointerUp);
        };
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
