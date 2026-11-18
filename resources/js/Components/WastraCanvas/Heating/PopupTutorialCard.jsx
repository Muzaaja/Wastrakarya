import { TUTORIAL_STEPS } from "../constants";

export default function PopupTutorialCard({
    onSkip,
    showTutorial,
    tutorialStep,
}) {
    if (!showTutorial) {
        return null;
    }

    return (
        <div
            className="mt-4 w-full max-w-lg rounded-2xl border border-[#CDB988]/45 bg-[#0E1E18] p-4 text-left shadow-[0_16px_45px_rgba(0,0,0,0.35)]"
            aria-live="polite"
        >
            <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#CDB988]">
                    Tutorial WastraCanvas
                </span>
                <span className="text-xs text-[#7E9385]">
                    {tutorialStep + 1}/{TUTORIAL_STEPS.length}
                </span>
            </div>
            <h3 className="mt-2 font-heading text-lg font-bold text-[#E2CEAB]">
                {TUTORIAL_STEPS[tutorialStep].title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#BACDC2]">
                {TUTORIAL_STEPS[tutorialStep].desc}
            </p>
            <button
                type="button"
                onClick={onSkip}
                className="mt-3 text-xs font-medium text-[#7E9385] transition-colors hover:text-[#F5EFEB]"
            >
                Lewati tutorial
            </button>
        </div>
    );
}
