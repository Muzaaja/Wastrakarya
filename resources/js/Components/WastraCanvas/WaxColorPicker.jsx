import { Check, LockKeyhole, Palette } from "lucide-react";
import { WAX_COLORS } from "./constants";

export default function WaxColorPicker({ malam, showColorPicker }) {
    const customColorInputId = "wastra-custom-wax-color";
    const customColorControlClasses = showColorPicker
        ? "cursor-pointer hover:-translate-y-0.5"
        : "cursor-not-allowed opacity-40";

    const setCustomColor = (event) => {
        malam.setWaxColor(event.target.value);
        malam.setWaxColorName("Kustom");
    };

    return (
        <div
            id="tour-color"
            className="flex min-h-0 flex-1 flex-col justify-center gap-3 border-t border-white/10 bg-[#0B1812] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
        >
            <div className="flex min-w-0 items-center gap-2">
                <Palette size={15} className="shrink-0 text-[#82978A]" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#E2CEAB]">
                        {malam.waxColorName}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#657B6E]">
                        {malam.waxColor}
                    </p>
                </div>

                {!showColorPicker && (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-[#102019] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#82978A]">
                        <LockKeyhole size={11} />
                        Terkunci
                    </span>
                )}
            </div>

            <div className="grid grid-cols-5 items-center gap-2">
                {WAX_COLORS.map((swatch) => {
                    const isSelected =
                        malam.waxColor.toLowerCase() ===
                        swatch.hex.toLowerCase();

                    return (
                        <button
                            type="button"
                            key={swatch.hex}
                            disabled={!showColorPicker}
                            onClick={() => {
                                malam.setWaxColor(swatch.hex);
                                malam.setWaxColorName(swatch.name);
                            }}
                            className={`group relative flex h-10 w-10 items-center justify-center justify-self-center rounded-full border transition-all ${
                                isSelected
                                    ? "scale-110 border-[#F2E4C8] shadow-[0_5px_16px_rgba(0,0,0,0.42),0_0_0_3px_rgba(205,185,136,0.18)]"
                                    : "border-white/15 shadow-[0_4px_10px_rgba(0,0,0,0.28)] hover:-translate-y-0.5 hover:border-white/35"
                            } ${
                                showColorPicker
                                    ? "cursor-pointer"
                                    : "cursor-not-allowed opacity-55"
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                            title={swatch.name}
                        >
                            <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/20" />
                            {isSelected && (
                                <Check
                                    size={16}
                                    className="relative text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
                                    strokeWidth={3}
                                />
                            )}
                        </button>
                    );
                })}

                <label
                    htmlFor={customColorInputId}
                    aria-disabled={!showColorPicker}
                    className={`relative flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-[conic-gradient(#E88D8D,#E2B86B,#A8D5BA,#7AAAC8,#B893C7,#E88D8D)] p-[3px] shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-all ${customColorControlClasses}`}
                    title={
                        showColorPicker
                            ? "Buka roda warna"
                            : "Panaskan ulang malam untuk mengganti warna"
                    }
                >
                    <span className="flex h-full w-full items-center justify-center rounded-full bg-[#102019] text-[#D8C7A5]">
                        <Palette size={16} />
                    </span>
                </label>
            </div>

            <input
                id={customColorInputId}
                type="color"
                value={malam.waxColor}
                disabled={!showColorPicker}
                onChange={setCustomColor}
                className="sr-only"
            />
        </div>
    );
}
