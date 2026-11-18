import { Heart, Info } from "lucide-react";

export default function MotifGrid({
    favorites,
    motifs,
    onOpenDetails,
    onSelect,
    onToggleFavorite,
    selectedMotif,
}) {
    if (motifs.length === 0) {
        return (
            <div className="text-center py-8 text-[#5C7265] text-sm">
                Tidak ada motif ditemukan
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {motifs.map((motif) => (
                <div
                    key={motif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(motif)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelect(motif);
                        }
                    }}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        onToggleFavorite(motif.id, event);
                    }}
                    className={`relative group flex flex-col items-center p-3 rounded-xl border transition-all ${
                        selectedMotif === motif.id
                            ? "bg-[#142920] border-[#CDB988] shadow-md ring-1 ring-[#CDB988]/30"
                            : "bg-[#08130E] border-[#182C24] hover:border-[#2A473A] hover:bg-[#0E1E18]"
                    }`}
                >
                    <div className="w-14 h-14 rounded-lg bg-[#0E1E18] border border-[#182C24] flex items-center justify-center mb-2 relative overflow-hidden">
                        {motif.svgIcon}
                        {favorites.includes(motif.id) && (
                            <div className="absolute top-1 right-1">
                                <Heart
                                    size={12}
                                    className="text-[#E88D8D] fill-current"
                                />
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-medium text-[#E2CEAB] text-center truncate w-full px-1">
                        {motif.name}
                    </span>
                    <span className="text-[10px] text-[#7E9385] text-center truncate w-full px-1">
                        {motif.origin}
                    </span>

                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetails(motif);
                        }}
                        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#7E9385] hover:text-[#CDB988]"
                        title="Lihat detail filosofi motif"
                    >
                        <Info size={12} />
                    </button>

                    <button
                        type="button"
                        onClick={(event) =>
                            onToggleFavorite(motif.id, event)
                        }
                        className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#7E9385] hover:text-[#E88D8D]"
                        title={
                            favorites.includes(motif.id)
                                ? "Hapus dari favorit"
                                : "Tambah ke favorit"
                        }
                    >
                        <Heart
                            size={12}
                            className={
                                favorites.includes(motif.id)
                                    ? "fill-current text-[#E88D8D]"
                                    : "text-[#7E9385]"
                            }
                        />
                    </button>
                </div>
            ))}
        </div>
    );
}
