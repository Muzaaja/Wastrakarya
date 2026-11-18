import { AlertTriangle } from "lucide-react";

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
    pan,
    remoteCursors,
    zoom,
}) {
    return Object.entries(remoteCursors).map(([userId, cursor]) => {
        const x = pan.x + cursor.x * zoom;
        const y = pan.y + cursor.y * zoom;

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
    isPressed,
    malamState,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    pan,
    remoteCursors,
    zoom,
}) {
    const canShowCanting =
        malamState === "ready" || malamState === "drawing";

    return (
        <div className="flex-1 relative overflow-hidden" style={{ touchAction: "none" }}>
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className={`block ${
                    activeTool !== "canting" || canShowCanting
                        ? "cursor-none"
                        : "cursor-crosshair"
                }`}
                style={{ touchAction: "none" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                onPointerOut={onPointerUp}
                onContextMenu={(event) => event.preventDefault()}
            />

            <LocalToolCursor
                activeTool={activeTool}
                cursorAngle={cursorAngle}
                cursorPos={cursorPos}
                isPressed={isPressed}
                malamState={malamState}
            />

            <RemoteCursors
                canvasHeight={canvasHeight}
                canvasWidth={canvasWidth}
                pan={pan}
                remoteCursors={remoteCursors}
                zoom={zoom}
            />

            {malamState === "drawing" &&
                drawingTimeLeft <= 10 &&
                drawingTimeLeft > 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-pulse">
                        <div className="bg-[#E88D8D]/90 border border-[#E88D8D] rounded-xl px-4 py-2 flex items-center gap-2 text-white text-sm font-medium shadow-xl">
                            <AlertTriangle size={16} />
                            <span>Waktu tersisa: {drawingTimeLeft} detik!</span>
                        </div>
                    </div>
                )}
        </div>
    );
}
