import { Check } from "lucide-react";

export default function HeatingProcessSteps({
    isMalamInPot,
    isMalamPouringFinished,
    isPouringMalam,
    isPreparingMalam,
    malamState,
}) {
    const steps = [
        {
            number: 1,
            label: "Masukkan malam",
            isComplete:
                isMalamInPot || malamState === "heating" || isPouringMalam,
            isActive: isPreparingMalam && !isMalamInPot,
        },
        {
            number: 2,
            label: "Nyalakan api",
            isComplete: malamState === "heating" || isPouringMalam,
            isActive: isPreparingMalam && isMalamInPot,
        },
        {
            number: 3,
            label: "Panaskan",
            isComplete: isPouringMalam,
            isActive: malamState === "heating",
        },
        {
            number: 4,
            label: "Isi canting",
            isComplete: isMalamPouringFinished,
            isActive: isPouringMalam && !isMalamPouringFinished,
        },
    ];

    return (
        <div className="mt-5 w-full max-w-xl">
            <div className="relative grid grid-cols-4 gap-2 text-center sm:gap-3">
                <div className="absolute left-[12.5%] right-[12.5%] top-3 h-px bg-gradient-to-r from-[#56C87A]/35 via-[#D6BD82]/35 to-[#264237]" />
                {steps.map((step) => (
                    <div
                        key={step.number}
                        className="relative z-10 flex min-w-0 flex-col items-center gap-2"
                    >
                        <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold shadow-[0_0_0_5px_#091611] transition-all ${
                                step.isComplete
                                    ? "border-[#77D397] bg-[#56C87A] text-[#07130E] shadow-[0_0_0_5px_#091611,0_0_18px_rgba(86,200,122,0.28)]"
                                    : step.isActive
                                      ? "border-[#F3D795] bg-[#D9BB7D] text-[#07130E] shadow-[0_0_0_5px_#091611,0_0_22px_rgba(226,184,107,0.38)]"
                                      : "border-[#294438] bg-[#10231B] text-[#657A6E]"
                            }`}
                        >
                            {step.isComplete ? (
                                <Check size={12} strokeWidth={3} />
                            ) : (
                                step.number
                            )}
                        </span>
                        <span
                            className={`truncate text-[9px] font-bold uppercase tracking-[0.08em] sm:text-[10px] ${
                                step.isActive
                                    ? "text-[#E8D8B6]"
                                    : step.isComplete
                                      ? "text-[#91BDA0]"
                                      : "text-[#52675C]"
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
