import { Check, Flame, Sparkles, SquareDashed, X } from "lucide-react";

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
                <div className="mt-3 w-full max-w-lg" aria-live="polite">
                    <div
                        className={`mb-3 flex items-center gap-3 rounded-xl border p-3 text-left ${
                            isMalamInPot
                                ? "border-[#56C87A]/35 bg-[#56C87A]/10"
                                : "border-[#CDB988]/25 bg-[#07130E]/70"
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
                                    : "Seret malam ke mulut kuali"}
                            </p>
                            <p className="mt-0.5 text-xs text-[#7E9385]">
                                {isMalamInPot
                                    ? "Langkah berikutnya: nyalakan api tungku."
                                    : "Tahan malam, lalu lepaskan pada area bergaris di atas kuali."}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        id="tour-ignite-fire"
                        onClick={igniteHeatingFire}
                        disabled={!isMalamInPot}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all ${
                            isMalamInPot
                                ? "bg-[#D5BD8A] text-[#0A1612] shadow-[0_0_24px_rgba(213,189,138,0.22)] hover:bg-[#E2CEAB] active:scale-[0.98]"
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
                <div
                    id="tour-pouring-status"
                    className={`mt-4 w-full max-w-lg rounded-xl border p-3.5 ${
                        isMalamPouringFinished
                            ? "border-[#56C87A]/35 bg-[#56C87A]/10"
                            : "border-[#CDB988]/30 bg-[#CDB988]/10"
                    } ${
                        showTutorial && tutorialStep === 9
                            ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611]"
                            : ""
                    }`}
                    aria-live="polite"
                    role="status"
                >
                    <div className="flex items-center gap-3 text-left">
                        <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0A1612] ${
                                isMalamPouringFinished
                                    ? "bg-[#56C87A] shadow-[0_0_18px_rgba(86,200,122,0.25)]"
                                    : "bg-[#D5BD8A] shadow-[0_0_18px_rgba(213,189,138,0.3)]"
                            }`}
                        >
                            {isMalamPouringFinished ? (
                                <Check size={17} strokeWidth={3} />
                            ) : (
                                <Sparkles size={17} />
                            )}
                        </span>
                        <div className="flex-1">
                            <p
                                className={`text-sm font-semibold ${
                                    isMalamPouringFinished
                                        ? "text-[#A8D5BA]"
                                        : "text-[#F3E5C8]"
                                }`}
                            >
                                {isMalamPouringFinished
                                    ? "Canting siap digunakan"
                                    : "Mengisi reservoir canting"}
                            </p>
                            <p className="mt-0.5 text-xs text-[#9CB0A4]">
                                {isMalamPouringFinished
                                    ? "Animasi selesai. Tutup popup untuk kembali ke kanvas."
                                    : "Malam cair dituangkan perlahan agar canting siap digunakan."}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#07130E]">
                        <div
                            className={`h-full w-full origin-left rounded-full ${
                                isMalamPouringFinished
                                    ? "bg-[#56C87A]"
                                    : "animate-pulse bg-gradient-to-r from-[#C95F32] via-[#E2B86B] to-[#F3D69A]"
                            }`}
                        />
                    </div>
                </div>
            ) : (
                <div
                    id="tour-heating-progress"
                    className={`mt-4 w-full max-w-lg rounded-xl transition-shadow ${
                        showTutorial && tutorialStep === 8
                            ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611] shadow-[0_0_35px_rgba(226,184,107,0.18)]"
                            : ""
                    }`}
                    aria-live="polite"
                >
                    <div className="mb-2 flex items-end justify-between gap-4">
                        <div className="text-left">
                            <p className="text-sm font-semibold text-[#E2CEAB]">
                                {heatingStage}
                            </p>
                            <p className="mt-0.5 text-xs text-[#7E9385]">
                                Jangan angkat kuali selama proses berlangsung.
                            </p>
                        </div>
                        <span className="font-mono text-2xl font-bold tabular-nums text-[#E2B86B]">
                            {heatingProgress}%
                        </span>
                    </div>
                    <div
                        className="h-3 overflow-hidden rounded-full border border-[#2A473A] bg-[#06100C] p-0.5"
                        role="progressbar"
                        aria-label="Kemajuan pemanasan malam"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={heatingProgress}
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#C95F32] via-[#E2B86B] to-[#F3D69A] shadow-[0_0_14px_rgba(226,184,107,0.55)] transition-all duration-700 ease-out"
                            style={{ width: `${heatingProgress}%` }}
                        />
                    </div>
                    <p className="mt-3 text-xs text-[#7E9385]">
                        Sekitar {heatingSecondsRemaining} detik lagi hingga malam
                        siap digunakan.
                    </p>
                </div>
            )}

            {isMalamPouringFinished && (
                <button
                    type="button"
                    id="tour-close-heating"
                    onClick={closeHeatingOverlay}
                    className={`mt-4 flex w-full max-w-lg items-center justify-center gap-2 rounded-xl border border-[#D5BD8A] bg-[#D5BD8A] px-5 py-3.5 text-sm font-bold text-[#0A1612] shadow-[0_0_24px_rgba(213,189,138,0.22)] transition-all hover:bg-[#E2CEAB] active:scale-[0.98] ${
                        showTutorial && tutorialStep === 10
                            ? "ring-2 ring-[#F3E5C8] ring-offset-4 ring-offset-[#091611]"
                            : ""
                    }`}
                >
                    <X size={17} />
                    Tutup Popup
                </button>
            )}
        </>
    );
}
