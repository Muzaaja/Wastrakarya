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
        <div className="mt-5 grid w-full max-w-lg grid-cols-4 gap-2 text-left">
            {steps.map((step) => (
                <div
                    key={step.number}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors sm:px-3 ${
                        step.isActive
                            ? "border-[#E2B86B]/60 bg-[#E2B86B]/10 text-[#F3E5C8]"
                            : step.isComplete
                              ? "border-[#56C87A]/30 bg-[#56C87A]/10 text-[#A8D5BA]"
                              : "border-[#182C24] bg-[#07130E]/60 text-[#5C7265]"
                    }`}
                >
                    <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            step.isComplete
                                ? "bg-[#56C87A] text-[#07130E]"
                                : step.isActive
                                  ? "bg-[#E2B86B] text-[#07130E]"
                                  : "bg-[#142920] text-[#7E9385]"
                        }`}
                    >
                        {step.isComplete ? (
                            <Check size={13} strokeWidth={3} />
                        ) : (
                            step.number
                        )}
                    </span>
                    <span className="hidden text-[11px] font-semibold leading-tight sm:block">
                        {step.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
