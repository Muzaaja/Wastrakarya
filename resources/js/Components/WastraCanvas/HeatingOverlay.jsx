import { Check, Flame, Loader2, Sparkles } from "lucide-react";
import HeatingProcessSteps from "./Heating/HeatingProcessSteps";
import HeatingScene from "./Heating/HeatingScene";
import HeatingStatus from "./Heating/HeatingStatus";
import PopupTutorialCard from "./Heating/PopupTutorialCard";

export default function HeatingOverlay({ malam, tutorial }) {
    if (!malam.isHeatingOverlayOpen) {
        return null;
    }

    const activeStep = malam.isPreparingMalam
        ? malam.isMalamInPot
            ? 2
            : 1
        : malam.isPouringMalam
          ? 4
          : 3;
    const stageContent = malam.isPreparingMalam
        ? {
              eyebrow: malam.isMalamInPot
                  ? "Babak II · Menyalakan tungku"
                  : "Babak I · Persiapan malam",
              icon: Flame,
              iconClassName: "text-[#F2C879]",
              title: "Siapkan Malam",
              description:
                  "Masukkan malam ke dalam kuali terlebih dahulu, kemudian nyalakan api untuk mulai melelehkannya.",
          }
        : malam.isMalamPouringFinished
          ? {
                eyebrow: "Adegan akhir · Proses selesai",
                icon: Check,
                iconClassName: "text-[#9AD8AE]",
                title: "Canting Siap Digunakan",
                description:
                    "Malam telah selesai dilelehkan dan dimasukkan ke dalam canting.",
            }
          : malam.isPouringMalam
            ? {
                  eyebrow: "Babak IV · Pengisian canting",
                  icon: Sparkles,
                  iconClassName: "text-[#F2C879]",
                  title: "Mengisi Canting",
                  description:
                      "Malam sudah meleleh sempurna dan sedang dituangkan perlahan ke dalam canting.",
              }
            : {
                  eyebrow: "Babak III · Pelelehan malam",
                  icon: Loader2,
                  iconClassName: "animate-spin text-[#F2C879]",
                  title: "Memanaskan Malam",
                  description: "Tunggu malam sampai meleleh.",
              };
    const StageIcon = stageContent.icon;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-3 sm:p-6 lg:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="heating-malam-title"
            aria-describedby="heating-malam-description"
        >
            <div
                ref={malam.heatingBackdropRef}
                className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(177,80,35,0.24),transparent_34%),radial-gradient(circle_at_16%_82%,rgba(38,98,72,0.18),transparent_38%),linear-gradient(135deg,rgba(1,6,4,0.97),rgba(3,13,9,0.95)_48%,rgba(10,9,5,0.97))] backdrop-blur-sm"
            />
            <div className="pointer-events-none fixed left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#D06D32]/10 blur-[110px]" />
            <div
                ref={malam.heatingDialogRef}
                id="tour-malam-card"
                className="relative z-10 my-auto w-full max-w-3xl transform-gpu overflow-hidden rounded-[2rem] border border-[#D7BE84]/30 bg-[linear-gradient(145deg,rgba(13,32,24,0.98)_0%,rgba(5,16,12,0.99)_56%,rgba(17,20,13,0.98)_100%)] shadow-[0_40px_140px_rgba(0,0,0,0.82),0_0_100px_rgba(211,105,43,0.12),inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-inset ring-white/[0.03]"
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(211,105,43,0.2),transparent_68%)]" />
                <div className="pointer-events-none absolute -right-20 top-20 h-52 w-52 rounded-full bg-[#D2A45D]/[0.06] blur-3xl" />
                <div className="pointer-events-none absolute -left-24 bottom-10 h-60 w-60 rounded-full bg-[#2D7657]/[0.08] blur-3xl" />
                <div className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-[#F0D69B]/70 to-transparent" />

                <div className="relative flex flex-col items-center px-4 py-6 text-center sm:px-8 sm:py-8 lg:px-12">

                    <h2
                        id="heating-malam-title"
                        className="mt-4 font-heading text-3xl font-bold tracking-[-0.02em] text-[#F5E9CF] drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)] sm:text-4xl"
                    >
                        {stageContent.title}
                    </h2>
                    <p
                        id="heating-malam-description"
                        className="mt-2 max-w-lg text-xs leading-relaxed text-[#9CB0A4] sm:text-sm"
                    >
                        {stageContent.description}
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
                        heatingProgress={malam.heatingProgress}
                        isDraggingMalam={malam.isDraggingMalam}
                        isMalamInPot={malam.isMalamInPot}
                        isMalamPouringFinished={
                            malam.isMalamPouringFinished
                        }
                        isPotDragOver={malam.isPotDragOver}
                        isPouringMalam={malam.isPouringMalam}
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
