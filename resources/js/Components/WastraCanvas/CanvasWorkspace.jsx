import CanvasSurface from "./CanvasSurface";
import CanvasToolbar from "./CanvasToolbar";

export default function CanvasWorkspace({
    canvas,
    collaboration,
    drawing,
    history,
    malam,
    menu,
    viewport,
}) {
    return (
        <main
            id="tour-canvas"
            className="flex-1 flex flex-col bg-[#08140F] border border-[#182C24] rounded-2xl p-3 shadow-xl overflow-hidden relative"
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

            <div className="h-10 px-3 bg-[#0B1712] border-t border-[#182C24] flex items-center justify-between text-xs text-[#7E9385] shrink-0">
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
            </div>
        </main>
    );
}
