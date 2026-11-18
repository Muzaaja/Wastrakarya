import { Eye, Trash2 } from "lucide-react";

export default function SavedDrawingsList({
    drawings,
    isLoading,
    onDelete,
    onLoad,
    user,
}) {
    if (isLoading) {
        return (
            <div className="text-center py-8 text-[#5C7265] text-sm">
                Memuat simpanan...
            </div>
        );
    }

    if (drawings.length === 0) {
        return (
            <div className="text-center py-8 text-[#5C7265] text-sm">
                {user
                    ? "Belum ada karyaan disimpan"
                    : "Masuk untuk melihat simpanan karya Anda"}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {drawings.map((drawing) => (
                <div
                    key={drawing.id}
                    className="flex items-center gap-3 p-2 bg-[#08130E] border border-[#182C24] rounded-xl group"
                >
                    <img
                        src={drawing.data_url}
                        alt={drawing.title}
                        className="w-16 h-12 object-cover rounded-lg border border-[#182C24] bg-[#0E1E18]"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-[#E2CEAB] truncate">
                                {drawing.title}
                            </span>
                            <span className="text-[10px] text-[#7E9385]">
                                {new Date(
                                    drawing.updated_at,
                                ).toLocaleDateString("id-ID")}
                            </span>
                        </div>
                        <div className="text-[10px] text-[#5C7265] truncate">
                            Motif: {drawing.motif || "-"}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onLoad(drawing)}
                            className="p-1 rounded hover:bg-[#162B21] text-[#9CB0A4] hover:text-[#E2CEAB] transition-colors"
                            title="Muat karya ke kanvas"
                        >
                            <Eye size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(drawing.id);
                            }}
                            className="p-1 rounded hover:bg-[#3E1E1E] text-[#E88D8D] hover:text-[#F5EFEB] transition-colors"
                            title="Hapus simpanan"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
