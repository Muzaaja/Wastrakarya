import { useId } from "react";

export default function MockupSlider({
    label,
    value,
    min = 0,
    max,
    step = 0.01,
    onChange,
    showLimits = false,
}) {
    const id = useId();
    const percent = `${Math.round(value * 100)}%`;

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
                <label htmlFor={id} className="font-medium text-[#BACDC2]">
                    {label}
                </label>
                <span className="rounded-lg border border-[#182C24] bg-[#08140F] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#E2CEAB]">
                    {percent}
                </span>
            </div>

            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                aria-valuetext={percent}
                onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
                className="h-6 w-full cursor-pointer accent-[#D5BD8A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D5BD8A]"
            />

            {showLimits && (
                <div className="flex items-center justify-between text-[11px] text-[#7E9385]">
                    <span>{Math.round(min * 100)}%</span>
                    <span>{Math.round(max * 100)}%</span>
                </div>
            )}
        </div>
    );
}
