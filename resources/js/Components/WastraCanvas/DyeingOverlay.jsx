import React from "react";
import {
    ArrowDown,
    ArrowUp,
    Check,
    Droplets,
    GripVertical,
    Loader2,
    Sparkles,
    X,
} from "lucide-react";
import DyeingProcessSteps from "./Dyeing/DyeingProcessSteps";
import DyeingClothMorph3D from "./Dyeing/DyeingClothMorph3D";
import { DyeingVat3D } from "./DyeingScenes";

const STAGE_CONTENT = {
    choosing: {
        eyebrow: "Tahap 1 · Racik warna",
        title: "Pilih warna pencelupan",
        description:
            "Tentukan warna dasar kain. Goresan malam akan tetap terlihat sebagai motif perintang warna.",
    },
    dipping: {
        eyebrow: "Tahap 2 · Ngelir",
        title: "Celupkan kain ke kuali",
        description:
            "Tahan kain pada scene, lalu seret ke bawah sampai kain masuk ke larutan pewarna.",
    },
    soaking: {
        eyebrow: "Tahap 3 · Medel",
        title: "Tahan hingga warna meresap",
        description:
            "Biarkan kain tetap berada di dalam larutan. Jika diangkat terlalu cepat, peresapan akan berhenti sementara.",
    },
    lifting: {
        eyebrow: "Tahap 4 · Tiriskan",
        title: "Angkat kain perlahan",
        description:
            "Seret kain ke atas. Warna yang sudah meresap akan terlihat saat kain keluar dari kuali.",
    },
    complete: {
        eyebrow: "Pencelupan selesai",
        title: "Warna batik sudah matang",
        description:
            "Terapkan warna ke kanvas untuk menyelesaikan proses Ngelir atau Medel.",
    },
};

function SceneFallback({ fabricColor, isIntroComplete, textureUrl }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(69,112,116,0.34),rgba(3,12,10,0.92)_68%)]">
            <img
                src={textureUrl}
                alt=""
                className={`h-[58%] max-h-[32rem] w-auto rotate-[-3deg] rounded-sm object-contain shadow-[0_35px_65px_rgba(0,0,0,0.5)] transition-opacity duration-200 ${
                    isIntroComplete ? "opacity-100" : "opacity-0"
                }`}
                style={{ backgroundColor: fabricColor }}
            />
            <Loader2 className="absolute bottom-7 animate-spin text-[#A7D0D6]" />
        </div>
    );
}

export default function DyeingOverlay({ dyeing, onApply }) {
    if (!dyeing.isOverlayOpen) {
        return null;
    }

    const content = STAGE_CONTENT[dyeing.stage] ?? STAGE_CONTENT.choosing;
    const canInteract = ["dipping", "soaking", "lifting"].includes(
        dyeing.stage,
    );

    return (
        <div
            className="fixed inset-0 z-[110] overflow-hidden bg-transparent"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dyeing-title"
            aria-describedby="dyeing-description"
        >
            <div
                ref={dyeing.backdropRef}
                className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(49,91,116,0.28),transparent_38%),linear-gradient(135deg,#020906_0%,#061710_52%,#07110F_100%)] transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                    dyeing.isOverlayUiVisible ? "opacity-100" : "opacity-0"
                }`}
            />

            {dyeing.morphDirection && (
                <DyeingClothMorph3D
                    direction={dyeing.morphDirection}
                    fabricColor={dyeing.fabricColor}
                    onComplete={dyeing.handleMorphComplete}
                    onHandoff={dyeing.handleMorphHandoff}
                    onReady={dyeing.handleMorphReady}
                    sceneRef={dyeing.sceneRef}
                    sourceRect={dyeing.morphSourceRect}
                    textureUrl={dyeing.morphTextureUrl}
                />
            )}

            <div className="relative z-10 grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_23rem] lg:grid-rows-1 lg:gap-5 lg:p-6">
                <div ref={dyeing.sceneRef} className="relative min-h-0">
                    <section
                        className={`absolute inset-0 overflow-hidden rounded-[28px] border border-[#6AA3AE]/25 bg-[#05120E] shadow-[0_40px_120px_rgba(0,0,0,0.68),inset_0_1px_0_rgba(255,255,255,0.06)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                            dyeing.morphDirection ||
                            !dyeing.isOverlayUiVisible
                                ? "will-change-[opacity,transform]"
                                : "will-change-auto"
                        } ${
                            dyeing.isOverlayUiVisible
                                ? "translate-y-0 opacity-100"
                                : "translate-y-4 opacity-0"
                        }`}
                        style={{
                            transitionDelay:
                                dyeing.isOverlayUiVisible &&
                                dyeing.morphDirection === "opening"
                                    ? "40ms"
                                    : "0ms",
                        }}
                    >

                    <div className="absolute inset-0">
                        <React.Suspense
                            fallback={
                                <SceneFallback
                                    fabricColor={dyeing.fabricColor}
                                    isIntroComplete={dyeing.isIntroComplete}
                                    textureUrl={dyeing.clothTextureUrl}
                                />
                            }
                        >
                            <DyeingVat3D
                                dyeColor={dyeing.selectedDye.hex}
                                fabricColor={dyeing.fabricColor}
                                isIntroComplete={dyeing.isIntroComplete}
                                onClothLifted={dyeing.handleClothLifted}
                                onSubmergedChange={
                                    dyeing.handleSubmergedChange
                                }
                                soakProgress={dyeing.soakProgress}
                                stage={dyeing.stage}
                                pencilTextureUrl={dyeing.pencilTextureUrl}
                                waxTextureUrl={dyeing.waxTextureUrl}
                            />
                        </React.Suspense>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 sm:p-5">
                        {dyeing.stage === "dipping" && (
                            <div className="flex items-center gap-2 rounded-full border border-[#8CC6D3]/30 bg-[#061712]/85 px-4 py-2 text-xs font-semibold text-[#D7ECEE] shadow-xl backdrop-blur-md">
                                <ArrowDown size={15} className="animate-bounce" />
                                Seret kain masuk ke larutan
                            </div>
                        )}
                        {dyeing.stage === "soaking" && (
                            <div className="flex items-center gap-2 rounded-full border border-[#8CC6D3]/30 bg-[#061712]/85 px-4 py-2 text-xs font-semibold text-[#D7ECEE] shadow-xl backdrop-blur-md">
                                <Droplets size={15} />
                                {dyeing.isClothSubmerged
                                    ? "Pertahankan posisi kain"
                                    : "Celupkan kembali untuk melanjutkan"}
                            </div>
                        )}
                        {dyeing.stage === "lifting" && (
                            <div className="flex items-center gap-2 rounded-full border border-[#D9C691]/30 bg-[#061712]/85 px-4 py-2 text-xs font-semibold text-[#F0E6CA] shadow-xl backdrop-blur-md">
                                <ArrowUp size={15} className="animate-bounce" />
                                Angkat kain dari kuali
                            </div>
                        )}
                    </div>
                    </section>
                </div>

                <aside
                    ref={dyeing.panelRef}
                    className={`max-h-[42vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#091A14]/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [scrollbar-color:#315B74_transparent] [scrollbar-width:thin] sm:p-5 lg:max-h-none lg:p-6 ${
                        dyeing.morphDirection ||
                        !dyeing.isOverlayUiVisible
                            ? "will-change-[opacity,transform]"
                            : "will-change-auto"
                    } ${
                        dyeing.isOverlayUiVisible
                            ? "translate-x-0 translate-y-0 opacity-100"
                            : "translate-y-4 opacity-0 lg:translate-x-6 lg:translate-y-0"
                    }`}
                    style={{
                        transitionDelay:
                            dyeing.isOverlayUiVisible &&
                            dyeing.morphDirection === "opening"
                                ? "110ms"
                                : "0ms",
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2
                                id="dyeing-title"
                                className="mt-2 font-heading text-xl font-bold text-[#F2E9D5] sm:text-2xl"
                            >
                                {content.title}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={dyeing.closeDyeing}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#8FA59B] transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Tutup proses pencelupan"
                        >
                            <X size={17} />
                        </button>
                    </div>

                    <p
                        id="dyeing-description"
                        className="mt-3 text-xs leading-relaxed text-[#8FA59B]"
                    >
                        {content.description}
                    </p>

                    <div className="mt-5">
                        <DyeingProcessSteps stage={dyeing.stage} />
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6F8B81]">
                                    Larutan pewarna
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#E7DDC7]">
                                    {dyeing.selectedDye.name}
                                </p>
                            </div>
                            <span
                                className="h-10 w-10 rounded-full border-4 border-white/15 shadow-[0_0_25px_rgba(124,181,197,0.18)]"
                                style={{
                                    backgroundColor:
                                        dyeing.selectedDye.hex,
                                }}
                            />
                        </div>
                    </div>

                    {dyeing.stage === "choosing" && (
                        <div className="mt-4 grid grid-cols-5 gap-2">
                            {dyeing.colors.map((dye) => {
                                const isSelected =
                                    dye.hex === dyeing.selectedDye.hex;

                                return (
                                    <button
                                        key={dye.hex}
                                        type="button"
                                        onClick={() =>
                                            dyeing.chooseDye(dye)
                                        }
                                        className={`group flex aspect-square items-center justify-center rounded-xl border transition-all ${
                                            isSelected
                                                ? "border-[#DCECEF] bg-white/10 ring-2 ring-[#7CB5C5]/40"
                                                : "border-white/10 bg-black/15 hover:border-white/25 hover:bg-white/5"
                                        }`}
                                        title={dye.name}
                                        aria-label={`Pilih warna ${dye.name}`}
                                        aria-pressed={isSelected}
                                    >
                                        <span
                                            className="h-6 w-6 rounded-full border border-white/20 shadow-inner transition-transform group-hover:scale-110"
                                            style={{
                                                backgroundColor: dye.hex,
                                            }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {dyeing.stage === "choosing" && (
                        <button
                            type="button"
                            onClick={dyeing.startDipping}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8CC6D3] px-4 py-3 text-sm font-bold text-[#06130F] shadow-[0_0_28px_rgba(124,181,197,0.2)] transition-all hover:bg-[#A7D6DF] active:scale-[0.98]"
                        >
                            <Droplets size={17} />
                            Mulai Pencelupan
                        </button>
                    )}

                    {dyeing.stage === "soaking" && (
                        <div className="mt-5 rounded-2xl border border-[#7CB5C5]/25 bg-[#315B74]/10 p-4">
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="font-semibold text-[#CFE5E8]">
                                    Penyerapan warna
                                </span>
                                <span className="font-mono font-bold text-[#8CC6D3]">
                                    {dyeing.soakProgress}%
                                </span>
                            </div>
                            <div
                                className="mt-3 h-2 overflow-hidden rounded-full bg-black/30"
                                role="progressbar"
                                aria-label="Kemajuan penyerapan warna"
                                aria-valuemin="0"
                                aria-valuemax="100"
                                aria-valuenow={dyeing.soakProgress}
                            >
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#477E92] via-[#7CB5C5] to-[#C5E1E2] shadow-[0_0_16px_rgba(124,181,197,0.55)] transition-[width] duration-100"
                                    style={{
                                        width: `${dyeing.soakProgress}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {dyeing.stage === "complete" && (
                        <button
                            type="button"
                            onClick={onApply}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D8C48F] px-4 py-3 text-sm font-bold text-[#101811] shadow-[0_0_28px_rgba(216,196,143,0.2)] transition-all hover:bg-[#E8D8AA] active:scale-[0.98]"
                        >
                            <Sparkles size={17} />
                            Terapkan ke Kanvas
                        </button>
                    )}

                    {dyeing.stage === "complete" && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#68B58A]/25 bg-[#68B58A]/10 px-3 py-2.5 text-xs text-[#BEE3CC]">
                            <Check size={15} />
                            Motif malam dipertahankan di atas warna kain.
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
