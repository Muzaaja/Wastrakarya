import { Grid } from "lucide-react";
import MotifGrid from "./MotifGrid";

export default function MotifLibraryPanel({
    motifs,
    onOpenMotifDetails,
    onSelectMotif,
    selectedMotif,
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

                <div className="flex-1 overflow-y-auto pr-1">
                    <MotifGrid
                        motifs={motifs}
                        onOpenDetails={onOpenMotifDetails}
                        onSelect={onSelectMotif}
                        selectedMotif={selectedMotif}
                    />
                </div>

                {!user && (
                    <div className="bg-[#0E1E18] border border-[#182C24] rounded-xl p-3 shrink-0 text-[11px] text-[#7E9385] leading-relaxed">
                        <p className="font-medium text-[#E2CEAB] mb-1">
                            Masuk untuk Fitur Lengkap
                        </p>
                        <p className="text-[#9CB0A4]">
                            Daftar/masuk untuk menyimpan karya ke akun dan
                            mengakses fitur penuh WastraCanvas. Tanpa masuk,
                            karya hanya tersimpan secara lokal.
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}
