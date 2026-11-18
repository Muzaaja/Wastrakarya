import { TUTORIAL_STEPS } from "./constants";

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
    if (
        !showTutorial ||
        isPopupTutorialStep ||
        (tutorialStep === 5 && isHeatingOverlayOpen)
    ) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
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
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(560px,90vw)] bg-[#0B1813] border border-[#CDB988]/40 rounded-2xl p-6 shadow-2xl text-[#D8C7A5] pointer-events-auto">
                <h3 className="font-heading text-xl font-bold text-[#E2CEAB] mb-2">
                    {TUTORIAL_STEPS[tutorialStep].title}
                </h3>
                <p className="text-sm leading-relaxed text-[#BACDC2] mb-4">
                    {TUTORIAL_STEPS[tutorialStep].desc}
                </p>
                <div className="flex justify-between items-center">
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
                        {tutorialStep === 2 && (
                            <button
                                type="button"
                                onClick={onNext}
                                className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all"
                            >
                                Selanjutnya
                            </button>
                        )}
                        {tutorialStep === 11 && (
                            <button
                                type="button"
                                onClick={onFinish}
                                className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all"
                            >
                                Selesai
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
