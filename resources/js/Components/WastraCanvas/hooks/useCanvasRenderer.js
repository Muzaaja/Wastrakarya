import { useCallback, useEffect, useRef } from "react";
import { renderDottedGuide } from "../BatikMotifs";
import {
    CANVAS_HEIGHT,
    CANVAS_TILE_SIZE,
    CANVAS_WIDTH,
} from "../constants";

export default function useCanvasRenderer({
    guideOpacity,
    pan,
    selectedMotif,
    showGuide,
    showTileGrid,
    zoom,
}) {
    const canvasRef = useRef(null);
    const artworkCanvasRef = useRef(null);
    const canvasBaseLayerRef = useRef(null);
    const canvasBaseLayerKeyRef = useRef("");
    const renderFrameRef = useRef(null);

    const getArtworkCanvas = useCallback(() => {
        if (!artworkCanvasRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;
            artworkCanvasRef.current = canvas;
        }

        return artworkCanvasRef.current;
    }, []);

    const getCanvasBaseLayer = useCallback(() => {
        if (!canvasBaseLayerRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = CANVAS_WIDTH;
            canvas.height = CANVAS_HEIGHT;
            canvasBaseLayerRef.current = canvas;
        }

        const baseLayer = canvasBaseLayerRef.current;
        const cacheKey = [
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            showGuide,
            selectedMotif,
            guideOpacity,
            showTileGrid,
        ].join(":");

        if (canvasBaseLayerKeyRef.current === cacheKey) {
            return baseLayer;
        }

        const context = baseLayer.getContext("2d");
        context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        context.fillStyle = "#F5EFEB";
        context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        context.fillStyle = "rgba(0, 0, 0, 0.012)";
        for (let x = 0; x < CANVAS_WIDTH; x += 4) {
            context.fillRect(x, 0, 1, CANVAS_HEIGHT);
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
            context.fillRect(0, y, CANVAS_WIDTH, 1);
        }

        if (
            showGuide &&
            selectedMotif &&
            selectedMotif !== "polos" &&
            selectedMotif !== "none"
        ) {
            const guideTile = document.createElement("canvas");
            guideTile.width = CANVAS_TILE_SIZE;
            guideTile.height = CANVAS_TILE_SIZE;
            renderDottedGuide(
                guideTile.getContext("2d"),
                selectedMotif,
                CANVAS_TILE_SIZE,
                guideOpacity,
            );

            const guidePattern = context.createPattern(guideTile, "repeat");
            if (guidePattern) {
                context.fillStyle = guidePattern;
                context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
        }

        if (showTileGrid) {
            context.save();
            context.strokeStyle = "rgba(164, 140, 92, 0.3)";
            context.lineWidth = 1;
            context.setLineDash([3, 4]);
            context.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            for (let x = 0; x <= CANVAS_WIDTH; x += CANVAS_TILE_SIZE) {
                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, CANVAS_HEIGHT);
                context.stroke();
            }
            for (let y = 0; y <= CANVAS_HEIGHT; y += CANVAS_TILE_SIZE) {
                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(CANVAS_WIDTH, y);
                context.stroke();
            }
            context.restore();
        }

        canvasBaseLayerKeyRef.current = cacheKey;

        return baseLayer;
    }, [guideOpacity, selectedMotif, showGuide, showTileGrid]);

    const renderMainCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext("2d");
        const artwork = getArtworkCanvas();
        const baseLayer = getCanvasBaseLayer();

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(pan.x, pan.y);
        context.scale(zoom, zoom);
        context.beginPath();
        context.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        context.clip();
        context.drawImage(baseLayer, 0, 0);
        context.drawImage(artwork, 0, 0);
        context.restore();
    }, [getArtworkCanvas, getCanvasBaseLayer, pan, zoom]);

    const renderMainCanvasRef = useRef(renderMainCanvas);
    useEffect(() => {
        renderMainCanvasRef.current = renderMainCanvas;
    }, [renderMainCanvas]);

    const scheduleMainCanvasRender = useCallback(() => {
        if (renderFrameRef.current !== null) {
            return;
        }

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

    return {
        canvasHeight: CANVAS_HEIGHT,
        canvasRef,
        canvasWidth: CANVAS_WIDTH,
        getArtworkCanvas,
        renderMainCanvas,
        renderMainCanvasRef,
        scheduleMainCanvasRender,
    };
}
