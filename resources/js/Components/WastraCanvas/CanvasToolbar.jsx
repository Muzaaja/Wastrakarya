import {
    Download,
    Maximize2,
    Minus,
    MoreHorizontal,
    Plus,
    Redo2,
    Trash2,
    Undo2,
} from "lucide-react";

export default function CanvasToolbar({
    canRedo,
    canUndo,
    onClear,
    onExport,
    onRedo,
    onResetZoom,
    onUndo,
    onZoomIn,
    onZoomOut,
    setShowMoreMenu,
    showMoreMenu,
    zoom,
}) {
    return (
        <div className="flex items-center justify-between pb-3 shrink-0">
            <div className="flex items-baseline gap-3">
                <h2 className="font-heading text-xl font-bold text-[#E2CEAB]">
                    Kain
                </h2>
            </div>

            <div className="bg-[#0B1712] border border-[#182C24] rounded-xl px-3 py-1.5 flex items-center gap-3 text-[#9CB0A4] shadow-sm">
                <button
                    type="button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Batalkan (Ctrl+Z)"
                    className={`p-1 rounded hover:bg-[#162B21] transition-colors ${
                        canUndo
                            ? "text-[#E2CEAB] cursor-pointer"
                            : "opacity-40 cursor-not-allowed"
                    }`}
                >
                    <Undo2 size={16} />
                </button>

                <button
                    type="button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Ulangi (Ctrl+Y)"
                    className={`p-1 rounded hover:bg-[#162B21] transition-colors ${
                        canRedo
                            ? "text-[#E2CEAB] cursor-pointer"
                            : "opacity-40 cursor-not-allowed"
                    }`}
                >
                    <Redo2 size={16} />
                </button>

                <div className="w-px h-4 bg-[#182C24]" />

                <button
                    type="button"
                    onClick={onZoomOut}
                    title="Perkecil (-)"
                    className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                >
                    <Minus size={15} />
                </button>

                <button
                    type="button"
                    onClick={onResetZoom}
                    title="Kembalikan ke 100%"
                    className="text-xs font-mono font-medium text-[#E2CEAB] min-w-12 text-center hover:underline"
                >
                    {Math.round(zoom * 100)}%
                </button>

                <button
                    type="button"
                    onClick={onZoomIn}
                    title="Perbesar (+)"
                    className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                >
                    <Plus size={15} />
                </button>

                <div className="w-px h-4 bg-[#182C24]" />

                <button
                    type="button"
                    onClick={onResetZoom}
                    title="Pusatkan Tampilan"
                    className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                >
                    <Maximize2 size={15} />
                </button>

                <div className="w-px h-4 bg-[#182C24]" />

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        title="Opsi Kanvas Lainnya"
                        className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {showMoreMenu && (
                        <div className="absolute right-0 top-8 w-60 bg-[#0E1F18] border border-[#223E31] rounded-xl shadow-2xl py-2 z-40 text-xs text-[#D8C7A5]">
                            <button
                                type="button"
                                onClick={onClear}
                                className="w-full px-3.5 py-2 text-left hover:bg-[#3E1E1E] flex items-center gap-2.5 text-[#E88D8D]"
                            >
                                <Trash2 size={14} />
                                <span>Bersihkan Kanvas</span>
                            </button>
                            <button
                                type="button"
                                onClick={onExport}
                                className="w-full px-3.5 py-2 text-left hover:bg-[#183327] flex items-center gap-2.5"
                            >
                                <Download size={14} />
                                <span>Unduh Kain Penuh (PNG)</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
