import { useCallback, useRef, useState } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants";

const MAX_HISTORY_LAYER_UNITS = 30;

export default function useCanvasHistory({
    fabricColor,
    getPencilCanvas,
    getWaxCanvas,
    renderMainCanvasRef,
    setFabricColor,
    setHasUnsavedChanges,
}) {
    const historyStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const createLayerSnapshot = useCallback(
        (layers) => {
            const snapshot = { fabricColor, layers };

            if (layers.includes("pencil")) {
                snapshot.pencilImageData = getPencilCanvas()
                    .getContext("2d")
                    .getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            if (layers.includes("wax")) {
                snapshot.waxImageData = getWaxCanvas()
                    .getContext("2d")
                    .getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            return snapshot;
        },
        [fabricColor, getPencilCanvas, getWaxCanvas],
    );

    const restoreLayerSnapshot = useCallback(
        (snapshot) => {
            if (snapshot.pencilImageData) {
                getPencilCanvas()
                    .getContext("2d")
                    .putImageData(snapshot.pencilImageData, 0, 0);
            }
            if (snapshot.waxImageData) {
                getWaxCanvas()
                    .getContext("2d")
                    .putImageData(snapshot.waxImageData, 0, 0);
            }
        },
        [getPencilCanvas, getWaxCanvas],
    );

    const saveStateToHistory = useCallback((layers = ["pencil", "wax"]) => {
        historyStackRef.current.push(createLayerSnapshot(layers));

        let storedLayerUnits = historyStackRef.current.reduce(
            (total, snapshot) => total + snapshot.layers.length,
            0,
        );
        while (
            storedLayerUnits > MAX_HISTORY_LAYER_UNITS &&
            historyStackRef.current.length > 1
        ) {
            storedLayerUnits -= historyStackRef.current.shift().layers.length;
        }

        redoStackRef.current = [];
        setCanUndo(true);
        setCanRedo(false);
        setHasUnsavedChanges(true);
    }, [createLayerSnapshot, setHasUnsavedChanges]);

    const handleUndo = useCallback(() => {
        if (historyStackRef.current.length === 0) {
            return;
        }

        const previousState = historyStackRef.current.pop();
        redoStackRef.current.push(
            createLayerSnapshot(previousState.layers),
        );
        restoreLayerSnapshot(previousState);
        setFabricColor(previousState.fabricColor);
        window.requestAnimationFrame(() => {
            renderMainCanvasRef.current();
        });
        setCanUndo(historyStackRef.current.length > 0);
        setCanRedo(true);
    }, [
        createLayerSnapshot,
        renderMainCanvasRef,
        restoreLayerSnapshot,
        setFabricColor,
    ]);

    const handleRedo = useCallback(() => {
        if (redoStackRef.current.length === 0) {
            return;
        }

        const nextState = redoStackRef.current.pop();
        historyStackRef.current.push(createLayerSnapshot(nextState.layers));
        restoreLayerSnapshot(nextState);
        setFabricColor(nextState.fabricColor);
        window.requestAnimationFrame(() => {
            renderMainCanvasRef.current();
        });
        setCanUndo(true);
        setCanRedo(redoStackRef.current.length > 0);
    }, [
        createLayerSnapshot,
        renderMainCanvasRef,
        restoreLayerSnapshot,
        setFabricColor,
    ]);

    return {
        canRedo,
        canUndo,
        handleRedo,
        handleUndo,
        saveStateToHistory,
    };
}
