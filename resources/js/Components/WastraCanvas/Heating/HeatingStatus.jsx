import { Check, Flame, PencilIcon, SquareDashed } from "lucide-react";

export default function HeatingStatus({
    closeHeatingOverlay,
    heatingProgress,
    heatingSecondsRemaining,
    heatingStage,
    igniteHeatingFire,
    isMalamInPot,
    isMalamPouringFinished,
    isPouringMalam,
    isPreparingMalam,
    showTutorial,
    tutorialStep,
}) {
    return (
        <>
            {isPreparingMalam ? (
                <div className="mt-4 w-full max-w-xl" aria-live="polite">
                    <div
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                            isMalamInPot
                                ? "border-[#56C87A]/30 bg-[#56C87A]/[0.08]"
                                : "border-[#CDB988]/20 bg-black/15"
                        }`}
                    >
                        <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                isMalamInPot
                                    ? "bg-[#56C87A] text-[#07130E]"
                                    : "bg-[#142920] text-[#CDB988]"
                            }`}
                        >
                            {isMalamInPot ? (
                                <Check size={16} strokeWidth={3} />
                            ) : (
                                <SquareDashed size={16} />
                            )}
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-[#E2CEAB]">
                                {isMalamInPot
                                    ? "Malam sudah di dalam kuali"
                                    : "Geser malam ke dalam kuali"}
                            </p>
                            <p className="mt-0.5 text-xs text-[#7E9385]">
                                {isMalamInPot
                                    ? ""
                                    : "Tahan malam, lalu lepaskan pada area bergaris di atas kuali."}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        id="tour-ignite-fire"
                        onClick={igniteHeatingFire}
                        disabled={!isMalamInPot}
                        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all ${
                            isMalamInPot
                                ? "bg-gradient-to-r from-[#CFAF70] via-[#E4CB94] to-[#D5B778] text-[#0A1612] shadow-[0_12px_32px_rgba(213,189,138,0.2)] hover:brightness-110 active:scale-[0.98]"
                                : "cursor-not-allowed border border-[#182C24] bg-[#0E1E18] text-[#4E6257]"
                        } ${
                            showTutorial && tutorialStep === 7
                                ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611]"
                                : ""
                        }`}
                    >
                        <Flame size={17} />
                        Nyalakan Api
                    </button>
                </div>
            ) : isPouringMalam ? (
                <></>
            ) : (
                <div
                    id="tour-heating-progress"
                    className={`mt-4 w-full max-w-xl rounded-2xl border border-white/[0.06] bg-black/15 p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-shadow ${
                        showTutorial && tutorialStep === 8
                            ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611] shadow-[0_0_35px_rgba(226,184,107,0.18)]"
                            : ""
                    }`}
                    aria-live="polite"
                >
                    <div
                        className="h-2 overflow-hidden rounded-full bg-[#020805] p-px ring-1 ring-[#2A473A]/70"
                        role="progressbar"
                        aria-label="Kemajuan pemanasan malam"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={heatingProgress}
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#B94D2A] via-[#E2A553] to-[#F3D69A] shadow-[0_0_16px_rgba(226,184,107,0.5)] transition-all duration-700 ease-out"
                            style={{ width: `${heatingProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {isMalamPouringFinished && (
                <button
                    type="button"
                    id="tour-close-heating"
                    onClick={closeHeatingOverlay}
                    className={`mt-4 flex w-full max-w-xl items-center justify-center gap-2 rounded-xl border border-[#E4CC97] bg-gradient-to-r from-[#CFAF70] via-[#E4CB94] to-[#D5B778] px-5 py-3.5 text-sm font-bold text-[#0A1612] shadow-[0_12px_34px_rgba(213,189,138,0.22)] transition-all hover:brightness-110 active:scale-[0.98] ${
                        showTutorial && tutorialStep === 10
                            ? "ring-2 ring-[#F3E5C8] ring-offset-4 ring-offset-[#091611]"
                            : ""
                    }`}
                >
                    <PencilIcon size={17} />
                    Waktunya Menggambar
                </button>
            )}
        </>
    );
}
