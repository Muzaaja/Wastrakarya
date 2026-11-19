import { useEffect, useRef, useState } from "react";
import { ChevronsRight, GripHorizontal, LocateFixed, X } from "lucide-react";
import DrawingToolPicker from "./DrawingToolPicker";
import MalamStatusCard from "./MalamStatusCard";
import { isWaxColorEditable } from "./constants";
import WaxColorPicker from "./WaxColorPicker";
import useDraggablePanel from "./hooks/useDraggablePanel";

export default function MalamToolPanel({
    activeTool,
    containerRef,
    forceExpanded,
    malam,
    malamWiggle,
    onSelectTool,
}) {
    const panelRef = useRef(null);
    const gripRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isReturningToDefaultPosition, setIsReturningToDefaultPosition] =
        useState(false);
    const showColorPicker = isWaxColorEditable(malam.malamState);
    const {
        dragHandleProps,
        isDragging,
        position,
        resetPosition,
    } = useDraggablePanel({
        containerRef,
        panelRef,
        storageKey: "wastrakarya_studio_tool_panel_position",
        visibleHandleRef: gripRef,
    });

    useEffect(() => {
        if (forceExpanded) {
            setIsCollapsed(false);
        }
    }, [forceExpanded]);

    useEffect(() => {
        if (!isReturningToDefaultPosition) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setIsReturningToDefaultPosition(false);
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [isReturningToDefaultPosition]);

    const handleResetPosition = () => {
        const nextPosition = resetPosition();

        setIsReturningToDefaultPosition(
            nextPosition.x !== position.x || nextPosition.y !== position.y,
        );
    };

    const handlePositionTransitionEnd = (event) => {
        if (
            event.currentTarget === event.target &&
            (event.propertyName === "left" || event.propertyName === "top")
        ) {
            setIsReturningToDefaultPosition(false);
        }
    };

    return (
        <aside
            ref={panelRef}
            aria-label="Palet alat lukis bergerak"
            className={`absolute z-40 flex max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#09150F]/95 text-[#D8C7A5] ring-1 ring-black/40 backdrop-blur-xl ${
                isReturningToDefaultPosition && !isDragging
                    ? "transition-[left,top,width,box-shadow] duration-300 ease-out motion-reduce:transition-none"
                    : "transition-[width,box-shadow] duration-200"
            } ${
                isCollapsed ? "w-[19rem]" : "w-[31rem]"
            } ${
                isDragging
                    ? "shadow-[0_30px_80px_rgba(0,0,0,0.68)]"
                    : "shadow-[0_20px_58px_rgba(0,0,0,0.52)]"
            }`}
            onTransitionEnd={handlePositionTransitionEnd}
            style={{ left: position.x, top: position.y }}
        >
            <div className="relative h-8 shrink-0 border-b border-white/10 bg-gradient-to-r from-[#12261D] via-[#172C22] to-[#0D1D16]">
                <div
                    {...dragHandleProps}
                    aria-label="Seret untuk memindahkan palet. Gunakan tombol panah untuk memindahkan dan Home untuk mengembalikan posisi."
                    className={`absolute inset-0 flex touch-none items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#CDB988] ${
                        isDragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    title="Seret untuk memindahkan • klik dua kali untuk mengembalikan posisi"
                >
                    <GripHorizontal
                        ref={gripRef}
                        size={34}
                        strokeWidth={1.25}
                        className="text-[#6F8377]"
                    />
                </div>

                <div className="absolute right-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5">
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={handleResetPosition}
                        className="rounded p-1 text-[#71877A] transition-colors hover:bg-white/5 hover:text-[#E2CEAB]"
                        title="Kembalikan posisi palet"
                    >
                        <LocateFixed size={13} />
                    </button>
                    <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                        className="rounded p-1 text-[#71877A] transition-colors hover:bg-white/5 hover:text-[#E2CEAB]"
                        title={isCollapsed ? "Buka palet" : "Ringkas palet"}
                    >
                        {isCollapsed ? (
                            <ChevronsRight size={14} />
                        ) : (
                            <X size={14} />
                        )}
                    </button>
                </div>
            </div>

            {isCollapsed ? (
                <div className="flex h-16 items-center gap-2.5 px-3">
                    <DrawingToolPicker
                        activeTool={activeTool}
                        compact
                        onSelectTool={onSelectTool}
                    />
                    <div className="h-9 w-px bg-white/10" />
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(false)}
                        className="group flex min-w-0 flex-1 items-center justify-end gap-2 rounded-full p-1 text-[#9CB0A4] transition-colors hover:bg-white/5 hover:text-[#E2CEAB]"
                        title="Buka palet lengkap"
                    >
                        <span
                            className="h-9 w-9 shrink-0 rounded-full border-2 border-white/20 shadow-[inset_0_0_0_3px_rgba(0,0,0,0.2)] transition-transform group-hover:scale-105"
                            style={{ backgroundColor: malam.waxColor }}
                        />
                        <ChevronsRight size={15} />
                    </button>
                </div>
            ) : (
                <div className="min-h-0 overflow-auto [scrollbar-color:#2A473A_transparent] [scrollbar-width:thin]">
                    <div className="grid min-h-[15.5rem] min-w-[29rem] grid-cols-[8.5rem_minmax(0,1fr)] bg-[#0C1A14]">
                        <DrawingToolPicker
                            activeTool={activeTool}
                            onSelectTool={onSelectTool}
                            vertical
                        />

                        <div className="flex min-w-0 flex-col border-l border-white/10">
                            <MalamStatusCard
                                malam={malam}
                                malamWiggle={malamWiggle}
                            />
                            <WaxColorPicker
                                malam={malam}
                                showColorPicker={showColorPicker}
                            />
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
