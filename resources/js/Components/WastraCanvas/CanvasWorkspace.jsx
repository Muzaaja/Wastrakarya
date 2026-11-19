import { Droplets } from "lucide-react";
import CanvasSurface from "./CanvasSurface";
import CanvasToolbar from "./CanvasToolbar";

export default function CanvasWorkspace({
    canvas,
    collaboration,
    drawing,
    dyeing,
    history,
    malam,
    menu,
    viewport,
}) {
    return (
        <main
            id="tour-canvas"
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#182C24] bg-[#08140F] p-3 shadow-xl"
            onPointerDown={drawing.onContainerPointerDown}
        >
            <CanvasToolbar
                canRedo={history.canRedo}
                canUndo={history.canUndo}
                onClear={menu.onClear}
                onExport={menu.onExport}
                onRedo={history.onRedo}
                onResetZoom={viewport.onResetZoom}
                onUndo={history.onUndo}
                onZoomIn={viewport.onZoomIn}
                onZoomOut={viewport.onZoomOut}
                setShowMoreMenu={menu.setShowMoreMenu}
                showMoreMenu={menu.showMoreMenu}
                zoom={viewport.zoom}
            />

            <CanvasSurface
                activeTool={drawing.activeTool}
                canvasHeight={canvas.canvasHeight}
                canvasRef={canvas.canvasRef}
                canvasWidth={canvas.canvasWidth}
                cursorAngle={drawing.cursorAngle}
                cursorPos={drawing.cursorPos}
                drawingTimeLeft={malam.drawingTimeLeft}
                isPressed={drawing.isPressed}
                malamState={malam.malamState}
                onPointerDown={drawing.onPointerDown}
                onPointerMove={drawing.onPointerMove}
                onPointerUp={drawing.onPointerUp}
                pan={viewport.pan}
                remoteCursors={collaboration.remoteCursors}
                zoom={viewport.zoom}
            />

            <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-t border-[#182C24] bg-[#0B1712] px-3 text-xs text-[#7E9385]">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[#9CB0A4]">
                        {Math.round(canvas.canvasWidth / 8)} ×{" "}
                        {Math.round(canvas.canvasHeight / 8)} cm
                    </span>
                    <span>|</span>
                    <span className="font-mono text-[#9CB0A4]">
                        {canvas.canvasWidth}×{canvas.canvasHeight}
                    </span>
                </div>
                <button
                    id="tour-dyeing"
                    type="button"
                    onClick={dyeing.onStart}
                    className="flex h-7 items-center gap-2 rounded-full border border-[#6FA6B2]/35 bg-[#315B74]/15 px-3 font-semibold text-[#A7D0D6] transition-all hover:border-[#8CC6D3]/70 hover:bg-[#315B74]/30 hover:text-[#DCECEF] active:scale-[0.98]"
                    title="Mulai proses pencelupan kain (Ngelir)"
                >
                    <span
                        className="h-3 w-3 rounded-full border border-white/20"
                        style={{ backgroundColor: dyeing.color }}
                    />
                    <Droplets size={13} />
                    <span className="hidden sm:inline">Ngelir</span>
                </button>
            </div>
        </main>
    );
}
