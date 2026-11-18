import { useCallback, useRef, useState } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants";

export default function useCanvasHistory({
    getArtworkCanvas,
    renderMainCanvasRef,
    setHasUnsavedChanges,
}) {
    const historyStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const saveStateToHistory = useCallback(() => {
        const artwork = getArtworkCanvas();
        if (!artwork) {
            return;
        }

        const context = artwork.getContext("2d");
        const imageData = context.getImageData(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
        );
        historyStackRef.current.push(imageData);

        if (historyStackRef.current.length > 30) {
            historyStackRef.current.shift();
        }

        redoStackRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
        setHasUnsavedChanges(true);
    }, [getArtworkCanvas, setHasUnsavedChanges]);

    const handleUndo = useCallback(() => {
        if (historyStackRef.current.length === 0) {
            return;
        }

        const artwork = getArtworkCanvas();
        if (!artwork) {
            return;
        }

        const context = artwork.getContext("2d");
        const currentState = context.getImageData(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
        );
        redoStackRef.current.push(currentState);

        const previousState = historyStackRef.current.pop();
        context.putImageData(previousState, 0, 0);
        renderMainCanvasRef.current();
        setCanUndo(historyStackRef.current.length > 0);
        setCanRedo(true);
    }, [getArtworkCanvas, renderMainCanvasRef]);

    const handleRedo = useCallback(() => {
        if (redoStackRef.current.length === 0) {
            return;
        }

        const artwork = getArtworkCanvas();
        if (!artwork) {
            return;
        }

        const context = artwork.getContext("2d");
        const currentState = context.getImageData(
            0,
            0,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
        );
        historyStackRef.current.push(currentState);

        const nextState = redoStackRef.current.pop();
        context.putImageData(nextState, 0, 0);
        renderMainCanvasRef.current();
        setCanUndo(true);
        setCanRedo(redoStackRef.current.length > 0);
    }, [getArtworkCanvas, renderMainCanvasRef]);

    return {
        canRedo,
        canUndo,
        handleRedo,
        handleUndo,
        saveStateToHistory,
    };
}
