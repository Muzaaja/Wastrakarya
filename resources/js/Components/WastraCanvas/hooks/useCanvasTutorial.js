import { useCallback, useEffect, useRef, useState } from "react";
import {
    FIRST_POPUP_TUTORIAL_STEP,
    LAST_POPUP_TUTORIAL_STEP,
    TUTORIAL_STEPS,
} from "../constants";

export default function useCanvasTutorial({
    activeTool,
    isMalamInPot,
    isMalamPouringFinished,
    malamState,
    selectedMotif,
    user,
    waxColor,
}) {
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [spotRect, setSpotRect] = useState(null);
    const tutorialInitRef = useRef({ motif: null, color: null });
    const latestSelectionRef = useRef({
        motif: selectedMotif,
        color: waxColor,
    });

    latestSelectionRef.current = {
        motif: selectedMotif,
        color: waxColor,
    };

    const startTutorial = useCallback(() => {
        tutorialInitRef.current = latestSelectionRef.current;
        setTutorialStep(0);
        setShowTutorial(true);
    }, []);

    const stopTutorial = useCallback(() => {
        setShowTutorial(false);
        setTutorialStep(0);
    }, []);

    useEffect(() => {
        if (user) {
            return;
        }

        const timeoutId = window.setTimeout(startTutorial, 600);

        return () => window.clearTimeout(timeoutId);
    }, [startTutorial, user]);

    useEffect(() => {
        if (!showTutorial) {
            return;
        }

        if (tutorialStep === 0 && activeTool === "pencil") {
            setTutorialStep(1);
        } else if (
            tutorialStep === 1 &&
            selectedMotif !== tutorialInitRef.current.motif
        ) {
            setTutorialStep(2);
        } else if (tutorialStep === 3 && activeTool === "canting") {
            setTutorialStep(4);
        } else if (
            tutorialStep === 4 &&
            waxColor !== tutorialInitRef.current.color
        ) {
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
        activeTool,
        isMalamInPot,
        isMalamPouringFinished,
        malamState,
        selectedMotif,
        showTutorial,
        tutorialStep,
        waxColor,
    ]);

    const isPopupTutorialStep =
        tutorialStep >= FIRST_POPUP_TUTORIAL_STEP &&
        tutorialStep <= LAST_POPUP_TUTORIAL_STEP;

    useEffect(() => {
        if (!showTutorial || isPopupTutorialStep) {
            setSpotRect(null);
            return;
        }

        const updateSpotRect = () => {
            const targetId = TUTORIAL_STEPS[tutorialStep]?.target;
            const element = document.getElementById(targetId);

            setSpotRect(element?.getBoundingClientRect() ?? null);
        };

        updateSpotRect();
        window.addEventListener("resize", updateSpotRect);

        return () => window.removeEventListener("resize", updateSpotRect);
    }, [isPopupTutorialStep, showTutorial, tutorialStep]);

    useEffect(() => {
        if (!showTutorial || !isPopupTutorialStep) {
            return;
        }

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
    }, [isPopupTutorialStep, showTutorial, tutorialStep]);

    return {
        isPopupTutorialStep,
        setTutorialStep,
        showTutorial,
        spotRect,
        startTutorial,
        stopTutorial,
        tutorialStep,
    };
}
