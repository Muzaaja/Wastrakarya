const DRAWING_TOOLS = [
    {
        id: "canting",
        label: "Canting",
        image: "/canting.png",
        imageStyle: {
            width: 18,
            height: 18,
            transform: "translate(10px, -10px) scale(4) rotate(-55deg)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        },
    },
    {
        id: "pencil",
        label: "Pensil",
        image: "/pensil.png",
        imageStyle: {
            width: 18,
            height: 18,
            transform: "translate(10px, -15px) scale(4) rotate(-90deg)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        },
    },
    {
        id: "eraser",
        label: "Penghapus",
        image: "/penghapus.png",
        imageStyle: {
            width: 18,
            height: 18,
            transform: "translate(10px, -15px) scale(4) rotate(-70deg)",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        },
    },
];

export default function DrawingToolPicker({ activeTool, onSelectTool }) {
    return (
        <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C7265] mb-3 block">
                Alat Lukis
            </span>
            <div className="grid grid-cols-3 gap-1.5">
                {DRAWING_TOOLS.map((tool) => {
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
                            onClick={() => onSelectTool(tool.id)}
                            title={tool.label}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all [clip-path:inset(0)] ${
                                isActive
                                    ? "bg-[#142920] border-[#CDB988] text-[#E2CEAB] shadow-sm"
                                    : "bg-[#08130E] border-[#182C24] text-[#7E9385] hover:bg-[#0E1E18] hover:border-[#2A473A] hover:text-[#E2CEAB]"
                            }`}
                        >
                            <div
                                className={`w-6 h-6 flex items-center justify-center ${
                                    isActive
                                        ? "text-[#D5BD8A]"
                                        : "text-[#9CB0A4]"
                                }`}
                            >
                                <img
                                    alt=""
                                    className="select-none"
                                    style={tool.imageStyle}
                                    draggable={false}
                                    src={tool.image}
                                />
                            </div>
                            <span className="text-[10px] font-medium leading-none">
                                {tool.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
