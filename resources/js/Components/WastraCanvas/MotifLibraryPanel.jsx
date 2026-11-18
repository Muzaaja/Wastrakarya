import { Grid, Heart, Save } from "lucide-react";
import MotifGrid from "./MotifGrid";
import SavedDrawingsList from "./SavedDrawingsList";

export default function MotifLibraryPanel({
    activeTab,
    favorites,
    filteredMotifs,
    onDeleteDrawing,
    onLoadDrawing,
    onOpenMotifDetails,
    onSelectMotif,
    onToggleFavorite,
    savedDrawings,
    savedLoading,
    selectedMotif,
    setActiveTab,
    setShowTileGrid,
    showTileGrid,
    user,
}) {
    return (
        <aside
            id="tour-motif"
            className="w-72 bg-[#0A1712] border border-[#182C24] rounded-2xl p-4 flex flex-col shrink-0 shadow-lg"
        >
            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-2 shrink-0">
                    <h3 className="font-heading font-semibold text-lg text-[#E2CEAB]">
                        Pakem Motif Batik
                    </h3>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setShowTileGrid(!showTileGrid)}
                            className={`p-1.5 rounded transition-colors ${
                                showTileGrid
                                    ? "bg-[#142920] border-[#CDB988] text-[#D5BD8A]"
                                    : "bg-[#08130E] border-[#182C24] text-[#7E9385] hover:border-[#2A473A]"
                            }`}
                            title={
                                showTileGrid
                                    ? "Sembunyikan garis batas kanvas"
                                    : "Tampilkan garis batas kanvas"
                            }
                        >
                            <Grid size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-1 bg-[#0E1E18] border border-[#182C24] rounded-xl p-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            activeTab === "all"
                                ? "bg-[#142920] text-[#E2CEAB] shadow-sm"
                                : "text-[#7E9385] hover:text-[#E2CEAB]"
                        }`}
                    >
                        Panduan
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("favorites")}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            activeTab === "favorites"
                                ? "bg-[#142920] text-[#E2CEAB] shadow-sm"
                                : "text-[#7E9385] hover:text-[#E2CEAB]"
                        }`}
                    >
                        <Heart size={12} className="inline-block mr-1" />{" "}
                        Favorit
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("saved")}
                        disabled={!user}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                            activeTab === "saved"
                                ? "bg-[#142920] text-[#E2CEAB] shadow-sm"
                                : !user
                                  ? "opacity-40 cursor-not-allowed text-[#7E9385]"
                                  : "text-[#7E9385] hover:text-[#E2CEAB]"
                        }`}
                        title={
                            !user
                                ? "Masuk untuk melihat simpanan karya"
                                : "Simpanan Karya"
                        }
                    >
                        <Save size={12} className="inline-block mr-1" />{" "}
                        Simpanan
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                    {activeTab === "saved" ? (
                        <div className="flex flex-col gap-2">
                            <SavedDrawingsList
                                drawings={savedDrawings}
                                isLoading={savedLoading}
                                onDelete={onDeleteDrawing}
                                onLoad={onLoadDrawing}
                                user={user}
                            />
                        </div>
                    ) : (
                        <MotifGrid
                            favorites={favorites}
                            motifs={filteredMotifs}
                            onOpenDetails={onOpenMotifDetails}
                            onSelect={onSelectMotif}
                            onToggleFavorite={onToggleFavorite}
                            selectedMotif={selectedMotif}
                        />
                    )}
                </div>

                {!user && (
                    <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3 shrink-0 text-[11px] text-[#7E9385] leading-relaxed">
                        <p className="font-medium text-[#E2CEAB] mb-1">
                            Masuk untuk Fitur Lengkap
                        </p>
                        <p className="text-[#9CB0A4]">
                            Daftar/masuk untuk menyimpan banyak karya, mengakses
                            tab Simpanan, dan fitur penuh WastraCanvas. Tanpa
                            masuk, karya hanya tersimpan lokal dan tidak dapat
                            memiliki banyak simpanan.
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}
