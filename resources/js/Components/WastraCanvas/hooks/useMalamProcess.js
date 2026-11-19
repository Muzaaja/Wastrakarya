import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { DRAWING_DURATION_SECONDS } from "../constants";
import {
    loadMalamHardening3D,
    loadMalamHeating3D,
    loadMalamPouring3D,
} from "../MalamScenes";

export default function useMalamProcess({ setStatusMessage }) {
    const [malamState, setMalamState] = useState("cold");
    const [heatingProgress, setHeatingProgress] = useState(0);
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

    const malamCardRef = useRef(null);
    const heatingDialogRef = useRef(null);
    const heatingBackdropRef = useRef(null);
    const heatingOriginRectRef = useRef(null);
    const shouldAnimateHeatingOpenRef = useRef(false);
    const isClosingHeatingOverlayRef = useRef(false);
    const heatingTimerRef = useRef(null);
    const drawingTimerRef = useRef(null);

    const clearHeatingTimer = useCallback(() => {
        if (heatingTimerRef.current) {
            window.clearInterval(heatingTimerRef.current);
            heatingTimerRef.current = null;
        }
    }, []);

    const clearDrawingTimer = useCallback(() => {
        if (drawingTimerRef.current) {
            window.clearInterval(drawingTimerRef.current);
            drawingTimerRef.current = null;
        }
    }, []);

    const startHeating = useCallback(() => {
        if (malamState !== "cold" && malamState !== "hardened") {
            return;
        }

        void loadMalamHeating3D();
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
    }, [malamState, setStatusMessage]);

    const placeMalamInPot = useCallback(() => {
        if (malamState !== "preparing" || isMalamInPot) {
            return;
        }

        setIsMalamInPot(true);
        setIsDraggingMalam(false);
        setIsPotDragOver(false);
        setStatusMessage(
            "Malam sudah berada di dalam kuali. Nyalakan api untuk mulai memanaskan.",
        );
    }, [isMalamInPot, malamState, setStatusMessage]);

    const completeMalamPouring = useCallback(() => {
        setIsMalamPouringFinished(true);
        setStatusMessage(
            "Canting terisi malam!",
        );
    }, [setStatusMessage]);

    const closeHeatingOverlay = useCallback(() => {
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
    }, [isMalamPouringFinished, malamState, setStatusMessage]);

    const igniteHeatingFire = useCallback(() => {
        if (malamState !== "preparing" || !isMalamInPot) {
            return;
        }

        clearHeatingTimer();
        setMalamState("heating");
        setHeatingProgress(0);
        setStatusMessage(
            "Memanas malam... Tunggu 5 detik hingga lilin meleleh sempurna.",
        );

        let nextProgress = 0;
        heatingTimerRef.current = window.setInterval(() => {
            nextProgress = Math.min(100, nextProgress + 20);
            setHeatingProgress(nextProgress);

            if (nextProgress < 100) {
                return;
            }

            clearHeatingTimer();
            setMalamState("pouring");
            setStatusMessage("Menuangkan malam cair ke dalam canting...");
        }, 1000);
    }, [
        clearHeatingTimer,
        isMalamInPot,
        malamState,
        setStatusMessage,
    ]);

    const startDrawingTimer = useCallback(() => {
        clearDrawingTimer();
        setMalamState("drawing");
        setDrawingTimeLeft(DRAWING_DURATION_SECONDS);

        drawingTimerRef.current = window.setInterval(() => {
            setDrawingTimeLeft((previousTime) => {
                const newTime = previousTime - 1;
                if (newTime <= 0) {
                    clearDrawingTimer();
                    setMalamState("hardened");
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
    }, [clearDrawingTimer, setStatusMessage]);

    const startDrawing = useCallback(() => {
        if (malamState !== "ready") {
            return;
        }

        void loadMalamHardening3D();
        startDrawingTimer();
    }, [malamState, startDrawingTimer]);

    const reheatForColorChange = useCallback(() => {
        clearHeatingTimer();
        clearDrawingTimer();
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
    }, [clearDrawingTimer, clearHeatingTimer, setStatusMessage]);

    const resetMalamForTutorial = useCallback(() => {
        clearHeatingTimer();
        clearDrawingTimer();
        setMalamState("cold");
        setHeatingProgress(0);
        setIsMalamInPot(false);
        setIsDraggingMalam(false);
        setIsPotDragOver(false);
        setIsMalamPouringFinished(false);
        setDrawingTimeLeft(DRAWING_DURATION_SECONDS);
    }, [clearDrawingTimer, clearHeatingTimer]);

    const handleCantingDip = useCallback(() => {
        if (malamState === "ready") {
            startDrawing();
        } else if (malamState === "cold" || malamState === "hardened") {
            startHeating();
        }
    }, [malamState, startDrawing, startHeating]);

    const isPreparingMalam = malamState === "preparing";
    const isPouringMalam = malamState === "pouring";
    const isHeatingOverlayOpen =
        isPreparingMalam || malamState === "heating" || isPouringMalam;
    const malamHardeningProgress = Math.min(
        1,
        Math.max(
            0,
            malamState === "hardened"
                ? 1
                : 1 - drawingTimeLeft / DRAWING_DURATION_SECONDS,
        ),
    );
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

    useEffect(() => {
        return () => {
            clearHeatingTimer();
            clearDrawingTimer();
        };
    }, [clearDrawingTimer, clearHeatingTimer]);

    return {
        closeHeatingOverlay,
        completeMalamPouring,
        drawingTimeLeft,
        handleCantingDip,
        heatingBackdropRef,
        heatingDialogRef,
        heatingProgress,
        heatingSecondsRemaining,
        heatingStage,
        igniteHeatingFire,
        isDraggingMalam,
        isHeatingOverlayOpen,
        isMalamInPot,
        isMalamPouringFinished,
        isPotDragOver,
        isPouringMalam,
        isPreparingMalam,
        malamCardRef,
        malamHardeningProgress,
        malamState,
        placeMalamInPot,
        reheatForColorChange,
        resetMalamForTutorial,
        setDrawingTimeLeft,
        setHeatingProgress,
        setIsDraggingMalam,
        setIsPotDragOver,
        setMalamState,
        setWaxColor,
        setWaxColorName,
        startDrawing,
        startDrawingTimer,
        startHeating,
        waxColor,
        waxColorName,
    };
}
