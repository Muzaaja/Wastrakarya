import React from "react";
import { Flame, Loader2 } from "lucide-react";
import { MalamPouring3D } from "../MalamScenes";

export default function HeatingScene({
    completeMalamPouring,
    handleMalamDragStart,
    handleMalamDrop,
    isDraggingMalam,
    isMalamInPot,
    isMalamPouringFinished,
    isPotDragOver,
    isPouringMalam,
    isPreparingMalam,
    malamState,
    placeMalamInPot,
    setIsDraggingMalam,
    setIsPotDragOver,
    showTutorial,
    tutorialStep,
    waxColor,
    waxColorName,
}) {
    return (
        <div
            id="tour-malam-transfer"
            className={`relative mt-4 h-[250px] w-full max-w-md select-none rounded-2xl transition-shadow sm:h-[270px] ${
                showTutorial && tutorialStep === 6
                    ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611] shadow-[0_0_35px_rgba(226,184,107,0.22)]"
                    : ""
            }`}
        >
            {isPouringMalam && (
                <>
                    <React.Suspense
                        fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-[#07130E] text-[#CDB988]">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        }
                    >
                        <MalamPouring3D
                            waxColor={waxColor}
                            onComplete={completeMalamPouring}
                        />
                    </React.Suspense>

                    <div
                        className={`absolute bottom-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border bg-[#07130E]/85 px-3 py-1.5 text-[10px] font-semibold ${
                            isMalamPouringFinished
                                ? "border-[#56C87A]/30 text-[#A8D5BA]"
                                : "border-[#CDB988]/25 text-[#E2CEAB]"
                        }`}
                    >
                        {isMalamPouringFinished
                            ? "Canting telah terisi malam"
                            : "Menuangkan malam ke reservoir canting"}
                    </div>
                </>
            )}

            {malamState === "heating" && (
                <div className="absolute inset-x-10 bottom-2 h-20 rounded-full bg-[#E2452B]/10 blur-3xl" />
            )}

            {isPreparingMalam && !isMalamInPot && (
                <div
                    draggable
                    role="button"
                    tabIndex={0}
                    aria-label={`Malam ${waxColorName}. Seret ke dalam kuali.`}
                    aria-grabbed={isDraggingMalam}
                    onDragStart={handleMalamDragStart}
                    onDragEnd={() => {
                        setIsDraggingMalam(false);
                        setIsPotDragOver(false);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            placeMalamInPot();
                        }
                    }}
                    className={`absolute left-0 top-3 z-50 flex w-24 cursor-grab flex-col items-center gap-1 rounded-2xl border border-[#CDB988]/35 bg-[#0E1E18]/95 p-2.5 shadow-xl transition-all active:cursor-grabbing sm:left-2 ${
                        isDraggingMalam
                            ? "scale-95 opacity-45"
                            : "hover:-translate-y-1 hover:border-[#CDB988]"
                    }`}
                >
                    <div
                        className="h-14 w-14 drop-shadow-[0_5px_8px_rgba(0,0,0,0.45)]"
                        style={{
                            backgroundColor: waxColor,
                            WebkitMaskImage: "url('/malam.png')",
                            maskImage: "url('/malam.png')",
                            WebkitMaskRepeat: "no-repeat",
                            maskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskPosition: "center",
                            WebkitMaskSize: "contain",
                            maskSize: "contain",
                        }}
                    />
                    <span className="text-[10px] font-semibold text-[#E2CEAB]">
                        Seret malam
                    </span>
                </div>
            )}

            {malamState === "heating" && (
                <div className="absolute left-1/2 top-10 z-40 h-20 w-36 -translate-x-1/2">
                    {[20, 50, 80].map((left, index) => (
                        <span
                            key={left}
                            className="steam-wisp absolute bottom-0 h-12 w-4 rounded-full border-l-2 border-white/20 blur-[1px]"
                            style={{
                                left: `${left}%`,
                                animationDelay: `${index * 0.55}s`,
                            }}
                        />
                    ))}
                </div>
            )}

            {malamState === "heating" ? (
                <div
                    className="animate-wax-simmer absolute left-1/2 top-[78px] z-30 h-10 w-52 -translate-x-1/2 rounded-[50%] border border-white/20 shadow-[inset_0_8px_15px_rgba(255,255,255,0.18),0_0_25px_rgba(226,184,107,0.25)] sm:top-[86px] sm:w-60"
                    style={{ backgroundColor: waxColor }}
                >
                    <span className="absolute left-[28%] top-[28%] h-2 w-2 rounded-full bg-white/30" />
                    <span className="absolute right-[24%] top-[48%] h-3 w-3 rounded-full border border-white/25" />
                </div>
            ) : (
                isPreparingMalam &&
                isMalamInPot && (
                    <div
                        className="absolute left-1/2 top-[66px] z-30 h-20 w-20 -translate-x-1/2 drop-shadow-[0_0_12px_rgba(226,184,107,0.35)]"
                        style={{
                            backgroundColor: waxColor,
                            WebkitMaskImage: "url('/malam.png')",
                            maskImage: "url('/malam.png')",
                            WebkitMaskRepeat: "no-repeat",
                            maskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskPosition: "center",
                            WebkitMaskSize: "contain",
                            maskSize: "contain",
                        }}
                    />
                )
            )}

            {isPreparingMalam && !isMalamInPot && (
                <div
                    onDragEnter={(event) => {
                        event.preventDefault();
                        setIsPotDragOver(true);
                    }}
                    onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setIsPotDragOver(true);
                    }}
                    onDragLeave={() => setIsPotDragOver(false)}
                    onDrop={handleMalamDrop}
                    className={`absolute left-1/2 top-14 z-40 h-28 w-60 -translate-x-1/2 rounded-[50%] border-2 border-dashed transition-all ${
                        isPotDragOver
                            ? "scale-105 border-[#E2B86B] bg-[#E2B86B]/15 shadow-[0_0_35px_rgba(226,184,107,0.3)]"
                            : "border-[#CDB988]/45 bg-[#CDB988]/5"
                    }`}
                >
                    <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#07130E]/90 px-2.5 py-1 text-[10px] font-semibold text-[#E2CEAB]">
                        Jatuhkan di sini
                    </span>
                </div>
            )}

            {!isPouringMalam && (
                <img
                    src="/pot.png"
                    alt={`Kuali pemanas malam ${waxColorName}`}
                    draggable={false}
                    className="absolute left-1/2 top-16 z-20 w-[310px] -translate-x-1/2 pointer-events-none sm:w-[360px]"
                />
            )}

            {!isPouringMalam &&
                (malamState === "heating" ? (
                    <div className="absolute bottom-0 left-1/2 z-10 h-[76px] w-[170px] -translate-x-1/2">
                        <div
                            className="absolute bottom-0 left-1/2 h-10 w-36 rounded-[50%] blur-xl"
                            style={{
                                background:
                                    "radial-gradient(ellipse at center, rgba(255,176,64,0.9) 0%, rgba(226,69,43,0.38) 55%, rgba(226,69,43,0) 76%)",
                                animation:
                                    "emberGlow 1.4s ease-in-out infinite",
                            }}
                        />
                        <span
                            className="flame-shape"
                            style={{
                                width: 56,
                                height: 56,
                                marginLeft: -28,
                                background:
                                    "radial-gradient(circle at 50% 72%, #F6A02A 0%, #E2452B 72%)",
                                filter: "blur(1.5px)",
                                animationDuration: "0.62s",
                            }}
                        />
                        <span
                            className="flame-shape"
                            style={{
                                width: 36,
                                height: 36,
                                marginLeft: -18,
                                background:
                                    "radial-gradient(circle at 50% 72%, #FFF3B0 0%, #F07C1E 78%)",
                                animationDuration: "0.45s",
                                animationDelay: "0.1s",
                            }}
                        />
                    </div>
                ) : (
                    <div className="absolute bottom-2 left-1/2 z-10 flex h-10 w-32 -translate-x-1/2 items-center justify-center rounded-[50%] border border-[#2A352F] bg-[#050B08] shadow-inner">
                        <Flame size={18} className="text-[#34433C]" />
                    </div>
                ))}
        </div>
    );
}
