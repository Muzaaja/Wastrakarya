import { AlertTriangle } from "lucide-react";
import { useCallback, useState } from "react";
import CanvasClothReveal3D from "./CanvasClothReveal3D";

function LocalToolCursor({
    activeTool,
    cursorAngle,
    cursorPos,
    isPressed,
    malamState,
}) {
    const canShowCanting =
        malamState === "ready" || malamState === "drawing";

    if (
        !cursorPos ||
        !cursorPos.isInside ||
        (activeTool === "canting" && !canShowCanting)
    ) {
        return null;
    }

    return (
        <div
            className="absolute pointer-events-none transition-transform duration-75 z-10"
            style={{
                left: cursorPos.screenX,
                top: cursorPos.screenY,
                transformOrigin: "top left",
                transform: `rotate(${cursorAngle}deg) ${
                    isPressed ? "scale(0.85)" : "scale(1)"
                }`,
                opacity: isPressed ? 0.6 : 1,
                willChange: "transform, opacity",
            }}
        >
            {activeTool === "canting" ? (
                <img
                    src="/canting.png"
                    alt=""
                    className="select-none"
                    style={{
                        width: 120,
                        height: "auto",
                        transform: "translate(0px, -37px)",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                    }}
                    draggable={false}
                />
            ) : activeTool === "eraser" ? (
                <img
                    src="/penghapus.png"
                    alt=""
                    className="select-none"
                    style={{
                        width: 70,
                        height: "auto",
                        transform: "translate(0, -35px)",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                    }}
                    draggable={false}
                />
            ) : (
                <img
                    src="/pensil.png"
                    alt=""
                    className="select-none"
                    style={{
                        width: 120,
                        height: "auto",
                        transform: "translate(-10px, 0px)",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                    }}
                    draggable={false}
                />
            )}
        </div>
    );
}

function RemoteCursors({
    canvasHeight,
    canvasWidth,
    remoteCursors,
    zoom,
}) {
    return Object.entries(remoteCursors).map(([userId, cursor]) => {
        const x = cursor.x * zoom;
        const y = cursor.y * zoom;

        if (
            x < -40 ||
            x > canvasWidth + 40 ||
            y < -40 ||
            y > canvasHeight + 40
        ) {
            return null;
        }

        const remoteColor = cursor.color || "#CDB988";

        return (
            <div
                key={userId}
                className="absolute pointer-events-none z-20 transition-all duration-75 select-none"
                style={{ left: x, top: y }}
            >
                {cursor.tool === "canting" && (
                    <img
                        src="/canting.png"
                        alt=""
                        className="select-none"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 110,
                            height: "auto",
                            transform: "translate(0px, -34px)",
                            filter: `drop-shadow(0 0 9px ${remoteColor}aa) drop-shadow(0 2px 5px rgba(0,0,0,0.4))`,
                        }}
                        draggable={false}
                    />
                )}
                {cursor.tool === "pencil" && (
                    <img
                        src="/pensil.png"
                        alt=""
                        className="select-none"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 110,
                            height: "auto",
                            transform: "translate(-9px, -2px)",
                            filter: `drop-shadow(0 0 9px ${remoteColor}aa) drop-shadow(0 2px 5px rgba(0,0,0,0.4))`,
                        }}
                        draggable={false}
                    />
                )}
                {cursor.tool === "eraser" && (
                    <img
                        src="/penghapus.png"
                        alt=""
                        className="select-none"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 64,
                            height: "auto",
                            transform: "translate(0, -31px)",
                            filter: `drop-shadow(0 0 9px ${remoteColor}aa) drop-shadow(0 2px 5px rgba(0,0,0,0.4))`,
                        }}
                        draggable={false}
                    />
                )}
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={remoteColor}
                    stroke="#091611"
                    strokeWidth="1.5"
                    className="drop-shadow-lg"
                >
                    <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>
                <div
                    className="absolute left-3.5 top-2.5 text-[10px] font-semibold text-[#0A1612] px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap border border-[#091611]/30 flex items-center gap-1.5"
                    style={{ backgroundColor: remoteColor }}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A1612]/70" />
                    <span>{cursor.userName || "Kolaborator"}</span>
                </div>
            </div>
        );
    });
}

export default function CanvasSurface({
    activeTool,
    canvasHeight,
    canvasRef,
    canvasWidth,
    cursorAngle,
    cursorPos,
    drawingTimeLeft,
    isPanning,
    isPanReady,
    isPressed,
    malamState,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    pan,
    remoteCursors,
    zoom,
}) {
    const [isCanvasEntering, setIsCanvasEntering] = useState(true);
    const canShowCanting =
        malamState === "ready" || malamState === "drawing";
    const renderedCanvasWidth = Math.max(1, Math.round(canvasWidth * zoom));
    const renderedCanvasHeight = Math.max(
        1,
        Math.round(canvasHeight * zoom),
    );

    const handleCanvasEntranceComplete = useCallback(() => {
        setIsCanvasEntering(false);
    }, []);

    return (
        <div
            data-canvas-viewport
            role="region"
            aria-label="Kanvas batik yang dapat digeser dan diperbesar"
            tabIndex={0}
            className={`relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#CDB988] [scrollbar-color:#2A473A_#08140F] [scrollbar-width:thin] ${
                isPanning
                    ? "cursor-grabbing"
                    : isPanReady
                      ? "cursor-grab"
                      : ""
            }`}
            style={{ touchAction: "pan-x pan-y" }}
        >
            <div
                className="grid min-h-full min-w-full place-items-center"
                style={{
                    height: renderedCanvasHeight,
                    width: renderedCanvasWidth,
                }}
            >
                <div
                    className="relative shrink-0"
                    style={{
                        height: renderedCanvasHeight,
                        touchAction: "none",
                        transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
                        willChange: isPanning ? "transform" : "auto",
                        width: renderedCanvasWidth,
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={renderedCanvasWidth}
                        height={renderedCanvasHeight}
                        className={`block ${
                            isPanning
                                ? "cursor-grabbing"
                                : isPanReady
                                  ? "cursor-grab"
                                  : activeTool !== "canting" || canShowCanting
                                    ? "cursor-none"
                                    : "cursor-crosshair"
                        } ${isCanvasEntering ? "opacity-0" : "opacity-100"}`}
                        style={{
                            pointerEvents: isCanvasEntering ? "none" : "auto",
                            touchAction: "none",
                        }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onContextMenu={(event) => event.preventDefault()}
                    />

                    {isCanvasEntering && (
                        <CanvasClothReveal3D
                            canvasHeight={canvasHeight}
                            canvasWidth={canvasWidth}
                            onComplete={handleCanvasEntranceComplete}
                            sourceCanvasRef={canvasRef}
                        />
                    )}

                    {!isCanvasEntering && (
                        <>
                            {!isPanReady && !isPanning && (
                                <LocalToolCursor
                                    activeTool={activeTool}
                                    cursorAngle={cursorAngle}
                                    cursorPos={cursorPos}
                                    isPressed={isPressed}
                                    malamState={malamState}
                                />
                            )}

                            <RemoteCursors
                                canvasHeight={renderedCanvasHeight}
                                canvasWidth={renderedCanvasWidth}
                                remoteCursors={remoteCursors}
                                zoom={zoom}
                            />
                        </>
                    )}

                    {malamState === "drawing" &&
                        drawingTimeLeft <= 10 &&
                        drawingTimeLeft > 0 && (
                            <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 animate-pulse">
                                <div className="flex items-center gap-2 rounded-xl border border-[#E88D8D] bg-[#E88D8D]/90 px-4 py-2 text-sm font-medium text-white shadow-xl">
                                    <AlertTriangle size={16} />
                                    <span>
                                        Waktu tersisa: {drawingTimeLeft} detik!
                                    </span>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
