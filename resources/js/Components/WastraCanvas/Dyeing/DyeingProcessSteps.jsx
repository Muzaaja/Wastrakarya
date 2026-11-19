import { ArrowUp, Check, Droplets, Hand, Palette } from "lucide-react";

const STAGE_ORDER = {
    choosing: 0,
    dipping: 1,
    soaking: 2,
    lifting: 3,
    complete: 4,
};

export default function DyeingProcessSteps({ stage }) {
    const currentStage = STAGE_ORDER[stage] ?? 0;
    const steps = [
        { label: "Pilih warna", icon: Palette },
        { label: "Celupkan kain", icon: Hand },
        { label: "Rendam warna", icon: Droplets },
        { label: "Angkat kain", icon: ArrowUp },
    ];

    return (
        <ol className="grid grid-cols-4 gap-2 lg:grid-cols-1">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isComplete = currentStage > index;
                const isActive = currentStage === index;

                return (
                    <li
                        key={step.label}
                        className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2.5 transition-colors lg:px-3.5 ${
                            isActive
                                ? "border-[#7CB5C5]/60 bg-[#315B74]/25 text-[#E4F3F5]"
                                : isComplete
                                  ? "border-[#68B58A]/35 bg-[#68B58A]/10 text-[#BEE3CC]"
                                  : "border-white/10 bg-black/15 text-[#688078]"
                        }`}
                    >
                        <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                isComplete
                                    ? "bg-[#68B58A] text-[#07130E]"
                                    : isActive
                                      ? "bg-[#8CC6D3] text-[#07130E]"
                                      : "bg-white/5 text-[#688078]"
                            }`}
                        >
                            {isComplete ? (
                                <Check size={14} strokeWidth={3} />
                            ) : (
                                <Icon size={14} />
                            )}
                        </span>
                        <span className="hidden truncate text-[11px] font-semibold sm:block">
                            {step.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
