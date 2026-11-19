import React from "react";
import { Check, Flame, Loader2, Sparkles } from "lucide-react";
import { MalamHeating3D, MalamPouring3D } from "../MalamScenes";

export default function HeatingScene({
    completeMalamPouring,
    heatingProgress,
    isDraggingMalam,
    isMalamInPot,
    isMalamPouringFinished,
    isPotDragOver,
    isPouringMalam,
    malamState,
    placeMalamInPot,
    setIsDraggingMalam,
    setIsPotDragOver,
    showTutorial,
    tutorialStep,
    waxColor,
    waxColorName,
}) {
    const sceneLabel = isPouringMalam
        ? isMalamPouringFinished
            ? "Canting telah terisi malam"
            : "Malam cair mengalir ke canting"
        : malamState === "heating"
          ? `Suhu malam · ${heatingProgress}%`
          : isMalamInPot
            ? "Malam siap dipanaskan"
            : "Seret malam ke kuali";

    return (
        <div
            id="tour-malam-transfer"
            className={`relative mt-5 h-[270px] w-full max-w-xl select-none overflow-hidden rounded-[1.75rem] border border-[#CDB988]/20 bg-[#04100C] shadow-[0_24px_70px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.06)] transition-shadow sm:h-[300px] ${
                showTutorial && tutorialStep === 6
                    ? "ring-2 ring-[#E2B86B] ring-offset-4 ring-offset-[#091611] shadow-[0_0_45px_rgba(226,184,107,0.22)]"
                    : ""
            }`}
        >
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(1,6,4,0.5),transparent_16%,transparent_84%,rgba(1,6,4,0.5)),linear-gradient(180deg,rgba(1,6,4,0.35),transparent_24%,transparent_68%,rgba(1,6,4,0.78))]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-5">
            </div>

            <React.Suspense
                fallback={
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#07130E] text-[#CDB988]">
                        <Loader2 size={24} className="animate-spin" />
                    </div>
                }
            >
                {isPouringMalam ? (
                    <MalamPouring3D
                        waxColor={waxColor}
                        onComplete={completeMalamPouring}
                    />
                ) : (
                    <MalamHeating3D
                        heatingProgress={heatingProgress}
                        isDraggingMalam={isDraggingMalam}
                        isMalamInPot={isMalamInPot}
                        isPotDragOver={isPotDragOver}
                        malamState={malamState}
                        onDragStateChange={setIsDraggingMalam}
                        onMalamPlaced={placeMalamInPot}
                        onPotDragOverChange={setIsPotDragOver}
                        waxColor={waxColor}
                        waxColorName={waxColorName}
                    />
                )}
            </React.Suspense>
        </div>
    );
}
