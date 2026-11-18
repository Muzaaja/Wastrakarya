import { Check, Flame, Loader2, Sparkles } from "lucide-react";
import HeatingProcessSteps from "./Heating/HeatingProcessSteps";
import HeatingScene from "./Heating/HeatingScene";
import HeatingStatus from "./Heating/HeatingStatus";
import PopupTutorialCard from "./Heating/PopupTutorialCard";

export default function HeatingOverlay({ malam, tutorial }) {
    if (!malam.isHeatingOverlayOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="heating-malam-title"
            aria-describedby="heating-malam-description"
        >
            <div
                ref={malam.heatingBackdropRef}
                className="pointer-events-none fixed inset-0 bg-[#020705]/90"
            />
            <div
                ref={malam.heatingDialogRef}
                id="tour-malam-card"
                className="relative z-10 my-auto w-full max-w-2xl transform-gpu overflow-hidden rounded-3xl border border-[#CDB988]/40 bg-[#091611] shadow-[0_30px_100px_rgba(0,0,0,0.75),0_0_80px_rgba(226,139,43,0.08)]"
            >
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#A95325]/15 to-transparent" />
                <div className="relative flex flex-col items-center px-5 py-7 text-center sm:px-10 sm:py-9">
                    <div
                        className={`mb-2 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                            malam.isMalamPouringFinished
                                ? "border-[#56C87A]/30 bg-[#56C87A]/10 text-[#A8D5BA]"
                                : "border-[#E2B86B]/25 bg-[#E2B86B]/10 text-[#E2B86B]"
                        }`}
                    >
                        {malam.isPreparingMalam ? (
                            <Flame size={13} />
                        ) : malam.isMalamPouringFinished ? (
                            <Check size={13} strokeWidth={3} />
                        ) : malam.isPouringMalam ? (
                            <Sparkles size={13} />
                        ) : (
                            <Loader2 size={13} className="animate-spin" />
                        )}
                        {malam.isPreparingMalam
                            ? "Persiapan pemanasan"
                            : malam.isMalamPouringFinished
                              ? "Proses selesai"
                              : malam.isPouringMalam
                                ? "Pengisian canting"
                                : "Proses pemanasan"}
                    </div>
                    <h2
                        id="heating-malam-title"
                        className="font-heading text-2xl font-bold text-[#F3E5C8] sm:text-3xl"
                    >
                        {malam.isPreparingMalam
                            ? "Siapkan Malam"
                            : malam.isMalamPouringFinished
                              ? "Canting Siap Digunakan"
                              : malam.isPouringMalam
                                ? "Mengisi Canting"
                                : "Memanaskan Malam"}
                    </h2>
                    <p
                        id="heating-malam-description"
                        className="mt-2 max-w-md text-sm leading-relaxed text-[#9CB0A4]"
                    >
                        {malam.isPreparingMalam
                            ? "Masukkan malam ke dalam kuali terlebih dahulu, kemudian nyalakan api untuk mulai melelehkannya."
                            : malam.isMalamPouringFinished
                              ? "Malam telah selesai dituangkan ke dalam reservoir canting. Tutup popup untuk kembali ke kanvas."
                              : malam.isPouringMalam
                                ? "Malam sudah meleleh sempurna dan sedang dituangkan perlahan ke dalam reservoir canting."
                                : "Malam sedang dilelehkan perlahan hingga mencapai kekentalan yang tepat untuk mengalir melalui canting."}
                    </p>

                    <PopupTutorialCard
                        showTutorial={
                            tutorial.showTutorial &&
                            tutorial.isPopupTutorialStep
                        }
                        tutorialStep={tutorial.tutorialStep}
                        onSkip={tutorial.stopTutorial}
                    />

                    <HeatingProcessSteps
                        isMalamInPot={malam.isMalamInPot}
                        isMalamPouringFinished={
                            malam.isMalamPouringFinished
                        }
                        isPouringMalam={malam.isPouringMalam}
                        isPreparingMalam={malam.isPreparingMalam}
                        malamState={malam.malamState}
                    />

                    <HeatingScene
                        completeMalamPouring={malam.completeMalamPouring}
                        handleMalamDragStart={malam.handleMalamDragStart}
                        handleMalamDrop={malam.handleMalamDrop}
                        isDraggingMalam={malam.isDraggingMalam}
                        isMalamInPot={malam.isMalamInPot}
                        isMalamPouringFinished={
                            malam.isMalamPouringFinished
                        }
                        isPotDragOver={malam.isPotDragOver}
                        isPouringMalam={malam.isPouringMalam}
                        isPreparingMalam={malam.isPreparingMalam}
                        malamState={malam.malamState}
                        placeMalamInPot={malam.placeMalamInPot}
                        setIsDraggingMalam={malam.setIsDraggingMalam}
                        setIsPotDragOver={malam.setIsPotDragOver}
                        showTutorial={tutorial.showTutorial}
                        tutorialStep={tutorial.tutorialStep}
                        waxColor={malam.waxColor}
                        waxColorName={malam.waxColorName}
                    />

                    <HeatingStatus
                        closeHeatingOverlay={malam.closeHeatingOverlay}
                        heatingProgress={malam.heatingProgress}
                        heatingSecondsRemaining={
                            malam.heatingSecondsRemaining
                        }
                        heatingStage={malam.heatingStage}
                        igniteHeatingFire={malam.igniteHeatingFire}
                        isMalamInPot={malam.isMalamInPot}
                        isMalamPouringFinished={
                            malam.isMalamPouringFinished
                        }
                        isPouringMalam={malam.isPouringMalam}
                        isPreparingMalam={malam.isPreparingMalam}
                        showTutorial={tutorial.showTutorial}
                        tutorialStep={tutorial.tutorialStep}
                    />
                </div>
            </div>
        </div>
    );
}
