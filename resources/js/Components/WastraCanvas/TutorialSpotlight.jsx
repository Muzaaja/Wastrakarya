import { useRef } from "react";
import { GripHorizontal, LocateFixed } from "lucide-react";
import { TUTORIAL_STEPS } from "./constants";
import useDraggablePanel from "./hooks/useDraggablePanel";

const TUTORIAL_POSITION_STORAGE_KEY =
    "wastrakarya_studio_tutorial_position";

function getDefaultTutorialPosition({ container, panel }) {
    if (!container || !panel) {
        return { x: 12, y: 12 };
    }

    return {
        x: Math.max(12, (container.clientWidth - panel.offsetWidth) / 2),
        y: Math.max(
            12,
            container.clientHeight - panel.offsetHeight - 32,
        ),
    };
}

function DraggableTutorialCard({
    containerRef,
    isFinalStep,
    onFinish,
    onNext,
    onSkip,
    requiresManualNext,
    tutorialStep,
}) {
    const panelRef = useRef(null);
    const { dragHandleProps, isDragging, position, resetPosition } =
        useDraggablePanel({
            containerRef,
            defaultPosition: getDefaultTutorialPosition,
            panelRef,
            storageKey: TUTORIAL_POSITION_STORAGE_KEY,
        });

    return (
        <div
            ref={panelRef}
            aria-live="polite"
            className={`pointer-events-auto absolute max-h-[calc(100vh-1.5rem)] w-[min(560px,90vw)] overflow-y-auto rounded-2xl border border-[#CDB988]/40 bg-[#0B1813] p-6 text-[#D8C7A5] ring-1 ring-black/40 backdrop-blur-xl transition-shadow ${
                isDragging
                    ? "shadow-[0_28px_80px_rgba(0,0,0,0.72)]"
                    : "shadow-2xl"
            }`}
            style={{ left: position.x, top: position.y }}
        >
            <div className="relative -mx-6 -mt-6 mb-4 h-9 shrink-0 rounded-t-2xl border-b border-white/10 bg-gradient-to-r from-[#12261D] via-[#172C22] to-[#0D1D16]">
                <div
                    {...dragHandleProps}
                    aria-label="Seret untuk memindahkan panduan tutorial. Gunakan tombol panah untuk memindahkan dan Home untuk mengembalikan posisi."
                    className={`absolute inset-0 flex touch-none select-none items-center justify-center rounded-t-2xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#CDB988] ${
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    title="Seret untuk memindahkan panduan"
                >
                    <GripHorizontal
                        aria-hidden="true"
                        className="text-[#71877A]"
                        size={30}
                        strokeWidth={1.25}
                    />
                </div>
                <button
                    type="button"
                    aria-label="Kembalikan posisi panduan tutorial"
                    onClick={resetPosition}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-[#71877A] transition-colors hover:bg-white/5 hover:text-[#E2CEAB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDB988]"
                    title="Kembalikan posisi panduan"
                >
                    <LocateFixed aria-hidden="true" size={14} />
                </button>
            </div>

            <h3 className="mb-2 font-heading text-xl font-bold text-[#E2CEAB]">
                {TUTORIAL_STEPS[tutorialStep].title}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-[#BACDC2]">
                {TUTORIAL_STEPS[tutorialStep].desc}
            </p>
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onSkip}
                    className="text-xs text-[#7E9385] hover:text-[#F5EFEB]"
                >
                    Lewati
                </button>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-[#7E9385]">
                        {tutorialStep + 1}/{TUTORIAL_STEPS.length}
                    </span>
                    {requiresManualNext && (
                        <button
                            type="button"
                            onClick={onNext}
                            className="rounded-xl bg-[#D5BD8A] px-5 py-2 text-sm font-semibold text-[#0A1612] shadow-md transition-all hover:bg-[#C4AC79]"
                        >
                            Selanjutnya
                        </button>
                    )}
                    {isFinalStep && (
                        <button
                            type="button"
                            onClick={onFinish}
                            className="rounded-xl bg-[#D5BD8A] px-5 py-2 text-sm font-semibold text-[#0A1612] shadow-md transition-all hover:bg-[#C4AC79]"
                        >
                            Selesai
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TutorialSpotlight({
    isHeatingOverlayOpen,
    isPopupTutorialStep,
    onFinish,
    onNext,
    onSkip,
    showTutorial,
    spotRect,
    tutorialStep,
}) {
    const containerRef = useRef(null);
    const isFinalStep = tutorialStep === TUTORIAL_STEPS.length - 1;
    const requiresManualNext = tutorialStep === 2 || tutorialStep === 11;

    if (
        !showTutorial ||
        isPopupTutorialStep ||
        (tutorialStep === 5 && isHeatingOverlayOpen)
    ) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="pointer-events-none fixed inset-0 z-[100]"
        >
            {spotRect && (
                <>
                    <div
                        className="fixed top-0 left-0 right-0 pointer-events-auto bg-black/78"
                        style={{ height: Math.max(0, spotRect.top - 8) }}
                    />
                    <div
                        className="fixed bottom-0 left-0 right-0 pointer-events-auto bg-black/78"
                        style={{
                            height: Math.max(
                                0,
                                window.innerHeight - (spotRect.bottom + 8),
                            ),
                        }}
                    />
                    <div
                        className="fixed pointer-events-auto bg-black/78"
                        style={{
                            top: Math.max(0, spotRect.top - 8),
                            left: 0,
                            width: Math.max(0, spotRect.left - 8),
                            height: spotRect.height + 16,
                        }}
                    />
                    <div
                        className="fixed pointer-events-auto bg-black/78"
                        style={{
                            top: Math.max(0, spotRect.top - 8),
                            left: spotRect.right + 8,
                            width: Math.max(
                                0,
                                window.innerWidth - (spotRect.right + 8),
                            ),
                            height: spotRect.height + 16,
                        }}
                    />
                    <div
                        className="absolute rounded-xl ring-2 ring-[#CDB988] pointer-events-none"
                        style={{
                            top: spotRect.top - 8,
                            left: spotRect.left - 8,
                            width: spotRect.width + 16,
                            height: spotRect.height + 16,
                            boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
                        }}
                    />
                </>
            )}
            <DraggableTutorialCard
                containerRef={containerRef}
                isFinalStep={isFinalStep}
                onFinish={onFinish}
                onNext={onNext}
                onSkip={onSkip}
                requiresManualNext={requiresManualNext}
                tutorialStep={tutorialStep}
            />
        </div>
    );
}
