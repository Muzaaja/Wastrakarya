import { useCallback, useEffect, useRef, useState } from "react";
import { DYE_COLORS, FABRIC_BASE_COLOR } from "../constants";
import { loadDyeingVat3D } from "../DyeingScenes";

const SOAK_TICK_MS = 100;
const SOAK_PROGRESS_PER_TICK = 2.5;

const getVisibleSourceRect = (sourceElement) => {
    const sourceRect = sourceElement.getBoundingClientRect();
    const viewport = sourceElement.closest("[data-canvas-viewport]");

    if (!viewport) {
        return sourceRect;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const left = Math.max(sourceRect.left, viewportRect.left);
    const top = Math.max(sourceRect.top, viewportRect.top);
    const right = Math.min(sourceRect.right, viewportRect.right);
    const bottom = Math.min(sourceRect.bottom, viewportRect.bottom);

    if (right <= left || bottom <= top) {
        return viewportRect;
    }

    return {
        left,
        top,
        width: right - left,
        height: bottom - top,
    };
};

export default function useDyeingProcess({ setStatusMessage }) {
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [stage, setStage] = useState("choosing");
    const [selectedDye, setSelectedDye] = useState(DYE_COLORS[0]);
    const [soakProgress, setSoakProgress] = useState(0);
    const [isClothSubmerged, setIsClothSubmerged] = useState(false);
    const [clothTextureUrl, setClothTextureUrl] = useState("");
    const [pencilTextureUrl, setPencilTextureUrl] = useState("");
    const [waxTextureUrl, setWaxTextureUrl] = useState("");
    const [fabricColor, setFabricColor] = useState(FABRIC_BASE_COLOR);
    const [isIntroComplete, setIsIntroComplete] = useState(false);
    const [isOverlayUiVisible, setIsOverlayUiVisible] = useState(false);
    const [morphDirection, setMorphDirection] = useState(null);
    const [morphSourceRect, setMorphSourceRect] = useState(null);
    const [morphTextureUrl, setMorphTextureUrl] = useState("");

    const backdropRef = useRef(null);
    const panelRef = useRef(null);
    const sceneRef = useRef(null);
    const originRectRef = useRef(null);
    const sourceElementRef = useRef(null);
    const sourceStyleRef = useRef(null);
    const isClosingRef = useRef(false);
    const closingStatusRef = useRef(null);

    const restoreSourceElement = useCallback(() => {
        const sourceElement = sourceElementRef.current;
        const sourceStyle = sourceStyleRef.current;

        if (sourceElement && sourceStyle) {
            sourceElement.style.opacity = sourceStyle.opacity;
            sourceElement.style.transition = sourceStyle.transition;
        }

        sourceElementRef.current = null;
        sourceStyleRef.current = null;
    }, []);

    const openDyeing = useCallback(
        ({
            sourceElement,
            textureUrl,
            pencilTextureUrl: nextPencilTextureUrl,
            waxTextureUrl: nextWaxTextureUrl,
            currentFabricColor,
        }) => {
            if (
                isOverlayOpen ||
                !sourceElement ||
                !textureUrl ||
                !nextPencilTextureUrl ||
                !nextWaxTextureUrl
            ) {
                return;
            }

            void loadDyeingVat3D();

            sourceElementRef.current = sourceElement;
            sourceStyleRef.current = {
                opacity: sourceElement.style.opacity,
                transition: sourceElement.style.transition,
            };
            const originRect = getVisibleSourceRect(sourceElement);
            originRectRef.current = originRect;
            isClosingRef.current = false;
            closingStatusRef.current = null;

            setClothTextureUrl(textureUrl);
            setPencilTextureUrl(nextPencilTextureUrl);
            setWaxTextureUrl(nextWaxTextureUrl);
            setFabricColor(currentFabricColor);
            setStage("choosing");
            setSoakProgress(0);
            setIsClothSubmerged(false);
            setIsIntroComplete(false);
            setIsOverlayUiVisible(false);
            setMorphSourceRect(originRect);
            setMorphTextureUrl(textureUrl);
            setMorphDirection("opening");
            setIsOverlayOpen(true);
            setStatusMessage(
                "Pilih warna pencelupan untuk memulai proses Ngelir atau Medel.",
            );
        },
        [isOverlayOpen, setStatusMessage],
    );

    const finishClosing = useCallback(() => {
        restoreSourceElement();
        isClosingRef.current = false;
        setIsOverlayUiVisible(false);
        setMorphDirection(null);
        setIsOverlayOpen(false);
        setIsClothSubmerged(false);
        setStatusMessage(
            closingStatusRef.current === "complete"
                ? "Pencelupan selesai. Warna kain telah diterapkan ke karya batik."
                : "Pencelupan ditutup. Kain kembali ke kanvas.",
        );
        closingStatusRef.current = null;
    }, [restoreSourceElement, setStatusMessage]);

    const closeDyeing = useCallback(() => {
        if (
            !isOverlayOpen ||
            isClosingRef.current ||
            morphDirection === "opening"
        ) {
            return;
        }

        isClosingRef.current = true;
        closingStatusRef.current = stage;

        const originRect = originRectRef.current;
        const sourceElement = sourceElementRef.current;
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (!originRect || !morphTextureUrl || prefersReducedMotion) {
            finishClosing();
            return;
        }

        if (sourceElement) {
            sourceElement.style.opacity = "0";
        }
        setIsOverlayUiVisible(false);
        setMorphDirection("closing");
    }, [
        finishClosing,
        isOverlayOpen,
        morphDirection,
        morphTextureUrl,
        stage,
    ]);

    const chooseDye = useCallback((dye) => {
        setStage((currentStage) => {
            if (currentStage === "choosing") {
                setSelectedDye(dye);
            }

            return currentStage;
        });
    }, []);

    const startDipping = useCallback(() => {
        setStage((currentStage) =>
            currentStage === "choosing" ? "dipping" : currentStage,
        );
        setStatusMessage(
            "Seret kain tiga dimensi ke bawah hingga masuk ke kuali pewarna.",
        );
    }, [setStatusMessage]);

    const handleSubmergedChange = useCallback(
        (isSubmerged) => {
            setIsClothSubmerged(isSubmerged);
            setStage((currentStage) => {
                if (currentStage === "dipping" && isSubmerged) {
                    setStatusMessage(
                        "Tahan kain tetap tercelup sampai warna meresap sempurna.",
                    );
                    return "soaking";
                }

                return currentStage;
            });
        },
        [setStatusMessage],
    );

    const handleClothLifted = useCallback(() => {
        setStage((currentStage) => {
            if (currentStage === "lifting") {
                setStatusMessage(
                    "Warna sudah meresap. Terapkan hasil pencelupan ke kanvas.",
                );
                return "complete";
            }

            return currentStage;
        });
    }, [setStatusMessage]);

    const prepareClosingCloth = useCallback(
        ({ textureUrl, currentFabricColor }) => {
            if (!textureUrl) {
                return;
            }

            setMorphTextureUrl(textureUrl);
            setFabricColor(currentFabricColor);
        },
        [],
    );

    const handleMorphReady = useCallback((direction) => {
        if (direction === "opening") {
            const sourceElement = sourceElementRef.current;
            if (sourceElement) {
                sourceElement.style.opacity = "0";
            }
            return;
        }

        setIsIntroComplete(false);
    }, []);

    const handleMorphHandoff = useCallback((direction) => {
        if (direction === "opening") {
            setIsIntroComplete(true);
        }
    }, []);

    const handleMorphComplete = useCallback(
        (direction) => {
            if (direction === "opening") {
                setIsIntroComplete(true);
                setMorphDirection(null);
                return;
            }

            finishClosing();
        },
        [finishClosing],
    );

    useEffect(() => {
        if (!isOverlayOpen) {
            return undefined;
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (prefersReducedMotion) {
            setIsOverlayUiVisible(true);
            return undefined;
        }

        let secondAnimationFrameId = null;
        const firstAnimationFrameId = window.requestAnimationFrame(() => {
            secondAnimationFrameId = window.requestAnimationFrame(() => {
                setIsOverlayUiVisible(true);
            });
        });

        return () => {
            window.cancelAnimationFrame(firstAnimationFrameId);
            if (secondAnimationFrameId !== null) {
                window.cancelAnimationFrame(secondAnimationFrameId);
            }
        };
    }, [isOverlayOpen]);

    useEffect(() => {
        if (
            !isOverlayOpen ||
            stage !== "soaking" ||
            !isClothSubmerged
        ) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setSoakProgress((currentProgress) =>
                Math.min(
                    100,
                    currentProgress + SOAK_PROGRESS_PER_TICK,
                ),
            );
        }, SOAK_TICK_MS);

        return () => window.clearInterval(intervalId);
    }, [isClothSubmerged, isOverlayOpen, stage]);

    useEffect(() => {
        if (stage !== "soaking" || soakProgress < 100) {
            return;
        }

        setStage("lifting");
        setStatusMessage(
            "Pencelupan cukup. Seret kain ke atas untuk mengangkatnya dari kuali.",
        );
    }, [setStatusMessage, soakProgress, stage]);

    useEffect(() => {
        if (!isOverlayOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closeDyeing();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closeDyeing, isOverlayOpen]);

    useEffect(() => restoreSourceElement, [restoreSourceElement]);

    return {
        backdropRef,
        chooseDye,
        clothTextureUrl,
        closeDyeing,
        colors: DYE_COLORS,
        fabricColor,
        handleClothLifted,
        handleMorphComplete,
        handleMorphHandoff,
        handleMorphReady,
        handleSubmergedChange,
        isClothSubmerged,
        isIntroComplete,
        isOverlayOpen,
        isOverlayUiVisible,
        morphDirection,
        morphSourceRect,
        morphTextureUrl,
        openDyeing,
        panelRef,
        pencilTextureUrl,
        prepareClosingCloth,
        sceneRef,
        selectedDye,
        soakProgress,
        stage,
        startDipping,
        waxTextureUrl,
    };
}
