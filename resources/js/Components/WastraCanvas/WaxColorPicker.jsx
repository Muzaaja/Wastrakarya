import { Check, Palette } from "lucide-react";
import { WAX_COLORS } from "./constants";

export default function WaxColorPicker({ malam, showColorPicker }) {
    if (!showColorPicker) {
        return (
            <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3">
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-[#E2CEAB]">
                        Warna Malam
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 flex-shrink-0"
                        style={{
                            backgroundColor: malam.waxColor,
                            WebkitMaskImage: "url('/malam.png')",
                            maskImage: "url('/malam.png')",
                            WebkitMaskRepeat: "no-repeat",
                            maskRepeat: "no-repeat",
                            WebkitMaskPosition: "center",
                            maskPosition: "center",
                            WebkitMaskSize: "contain",
                            maskSize: "contain",
                        }}
                        title={malam.waxColorName}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#E2CEAB] truncate">
                            {malam.waxColorName}
                        </p>
                    </div>
                </div>
                <p className="text-[11px] opacity-70 text-[#E2CEAB] mt-2">
                    Panaskan ulang malam untuk mengganti warna.
                </p>
            </div>
        );
    }

    return (
        <div id="tour-color">
            <h4 className="text-sm font-medium text-[#E2CEAB] mb-3">
                Pilih Warna Malam
            </h4>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
                {WAX_COLORS.map((swatch) => {
                    const isSelected =
                        malam.waxColor.toLowerCase() ===
                        swatch.hex.toLowerCase();

                    return (
                        <button
                            type="button"
                            key={swatch.hex}
                            onClick={() => {
                                malam.setWaxColor(swatch.hex);
                                malam.setWaxColorName(swatch.name);
                            }}
                            className={`relative w-12 h-12 rounded-xl border-2 transition-transform flex items-center justify-center overflow-hidden bg-[#08130E] ${
                                isSelected
                                    ? "border-[#E2CEAB] scale-110 shadow-md ring-2 ring-[#CDB988]/40"
                                    : "border-[#182C24] hover:scale-105 hover:border-[#2A473A]"
                            }`}
                            title={swatch.name}
                        >
                            <div
                                className="w-10 h-10"
                                style={{
                                    backgroundColor: swatch.hex,
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
                            {isSelected && (
                                <Check
                                    size={14}
                                    className="absolute bottom-0.5 right-0.5 text-[#E2CEAB] drop-shadow"
                                    strokeWidth={3}
                                />
                            )}
                        </button>
                    );
                })}

                <label
                    className="w-12 h-12 rounded-xl border-2 border-[#182C24] hover:border-[#CDB988] flex flex-col items-center justify-center cursor-pointer text-[#7E9385] hover:text-[#E2CEAB] transition-colors bg-[#08130E]"
                    title="Pilih warna kustom"
                >
                    <Palette size={14} />
                    <span className="text-[9px] mt-0.5">Kustom</span>
                    <input
                        type="color"
                        value={malam.waxColor}
                        onChange={(event) => {
                            malam.setWaxColor(event.target.value);
                            malam.setWaxColorName("Kustom");
                        }}
                        className="sr-only"
                    />
                </label>
            </div>

            <div className="flex items-center justify-between text-xs text-[#9CB0A4]">
                <span>{malam.waxColorName}</span>
                <span className="font-mono text-[11px] text-[#7E9385] uppercase">
                    {malam.waxColor}
                </span>
            </div>
        </div>
    );
}
