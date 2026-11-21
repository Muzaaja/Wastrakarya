import { DRAWING_TOOLS } from "./constants";

export default function DrawingToolPicker({
    activeTool,
    compact = false,
    onSelectTool,
    vertical = false,
}) {
    const toolButtons = DRAWING_TOOLS.map((tool) => {
        const isActive = activeTool === tool.id;

        return (
            <button
                type="button"
                key={tool.id}
                id={
                    tool.id === "canting"
                        ? "tour-canting"
                        : tool.id === "pencil"
                          ? "tour-pencil"
                          : undefined
                }
                aria-label={`Gunakan ${tool.label}`}
                aria-pressed={isActive}
                onClick={() => onSelectTool(tool.id)}
                title={tool.label}
                className={`group relative flex items-center justify-center overflow-hidden transition-all duration-200 ${
                    compact
                        ? "h-11 w-11 rounded-full border"
                        : vertical
                          ? "min-h-0 w-full flex-1 gap-2 rounded-lg border px-2"
                          : "h-full min-w-0 flex-1 border-x border-transparent"
                } ${
                    isActive
                        ? compact
                            ? "border-[#CDB988] bg-[#183126] text-[#F3E5C8] ring-2 ring-[#CDB988]/25"
                            : vertical
                              ? "border-[#CDB988]/70 bg-[#183126] text-[#F3E5C8] ring-2 ring-[#CDB988]/15"
                            : "border-x-white/5 bg-[radial-gradient(ellipse_at_bottom,rgba(205,185,136,0.18),transparent_66%)] text-[#F3E5C8]"
                        : compact
                          ? "border-white/10 bg-[#08130E]/80 text-[#7E9385] hover:border-[#52705F] hover:bg-[#10231B]"
                          : vertical
                            ? "border-white/10 bg-[#08130E]/70 text-[#7E9385] hover:border-[#52705F] hover:bg-[#10231B] hover:text-[#E2CEAB]"
                          : "text-[#7E9385] hover:bg-white/[0.025] hover:text-[#E2CEAB]"
                }`}
            >
                <span
                    className={`pointer-events-none flex shrink-0 items-center justify-center overflow-hidden transition-transform duration-200 ${
                        vertical
                            ? "h-10 w-10 rounded-none group-hover:-translate-x-0.5"
                            : compact
                              ? "h-10 w-10 rounded-none group-hover:-translate-y-1"
                              : "h-full w-full group-hover:-translate-y-1"
                    }`}
                >
                    <img
                        alt=""
                        className="select-none"
                        style={
                            compact || vertical
                                ? tool.compactImageStyle
                                : tool.paletteImageStyle
                        }
                        draggable={false}
                        src={tool.image}
                    />
                </span>
                {vertical && (
                    <span className="min-w-0 truncate text-[10px] font-semibold">
                        {tool.label}
                    </span>
                )}
                {isActive && (
                    <span
                        aria-hidden="true"
                        className={`absolute rounded-full bg-[#E2CEAB] shadow-[0_0_8px_#CDB988] ${
                            compact
                                ? "right-1.5 top-1.5 h-1.5 w-1.5"
                                : vertical
                                  ? "left-1 top-1/2 h-8 w-1 -translate-y-1/2"
                                  : "bottom-1 h-1 w-10"
                        }`}
                    />
                )}
            </button>
        );
    });

    if (compact) {
        return <div className="flex gap-2">{toolButtons}</div>;
    }

    if (vertical) {
        return (
            <div
                aria-label="Pilih alat lukis"
                className="flex min-h-0 flex-col gap-2 bg-gradient-to-b from-[#0D1E17] via-[#0A1712] to-[#07110D] p-2"
            >
                {toolButtons}
            </div>
        );
    }

    return (
        <div
            aria-label="Pilih alat lukis"
            className="relative h-[8.75rem] bg-gradient-to-b from-[#0D1E17] via-[#0A1712] to-[#07110D] px-8"
        >
            <div className="absolute inset-x-5 bottom-2 h-px bg-white/10 shadow-[0_2px_0_rgba(0,0,0,0.35)]" />
            <div className="absolute inset-x-8 bottom-0 h-2 rounded-t-full border-x border-t border-white/10 bg-[#13271E] shadow-[0_-4px_14px_rgba(0,0,0,0.25)]" />
            <div className="relative z-10 flex h-full items-end justify-center gap-3">
                {toolButtons}
            </div>
        </div>
    );
}
