import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grid } from "lucide-react";
import MotifGrid from "./MotifGrid";

export default function MotifLibraryPanel({
    forceExpanded,
    motifs,
    onOpenMotifDetails,
    onSelectMotif,
    onTileFreeDrawingChange,
    selectedMotif,
    setShowTileGrid,
    showTileGrid,
    tileFreeDrawing,
    user,
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (forceExpanded) {
            setIsCollapsed(false);
        }
    }, [forceExpanded]);

    const tileGridButtonClasses = `rounded border p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDB988] ${
        showTileGrid
            ? "border-[#CDB988] bg-[#142920] text-[#D5BD8A]"
            : "border-[#182C24] bg-[#08130E] text-[#7E9385] hover:border-[#2A473A]"
    }`;
    const tileGridButtonTitle = showTileGrid
        ? "Sembunyikan garis batas kanvas"
        : "Tampilkan garis batas kanvas";

    return (
        <aside
            id="tour-motif"
            aria-label="Pakem Motif Batik"
            className={`flex shrink-0 flex-col rounded-2xl border border-[#182C24] bg-[#0A1712] shadow-lg transition-[width,padding] duration-200 motion-reduce:transition-none ${
                isCollapsed ? "w-14 p-2" : "w-72 p-4"
            }`}
        >
            {isCollapsed ? (
                <div className="flex min-h-0 flex-1 flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(false)}
                        className="rounded-lg p-1.5 text-[#9CB0A4] transition-colors hover:bg-[#142920] hover:text-[#E2CEAB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDB988]"
                        title="Buka Pakem Motif Batik"
                        aria-label="Buka Pakem Motif Batik"
                        aria-expanded={false}
                    >
                        <ChevronLeft size={17} />
                    </button>

                    <div className="h-px w-full bg-[#182C24]" />

                    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
                        <span className="-rotate-90 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7E9385]">
                            Pakem Motif
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowTileGrid(!showTileGrid)}
                        className={tileGridButtonClasses}
                        title={tileGridButtonTitle}
                        aria-label={tileGridButtonTitle}
                        aria-pressed={showTileGrid}
                    >
                        <Grid size={14} />
                    </button>
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                    <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                        <h3 className="min-w-0 truncate font-heading text-lg font-semibold text-[#E2CEAB]">
                            Pakem Motif Batik
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setShowTileGrid(!showTileGrid)}
                                className={tileGridButtonClasses}
                                title={tileGridButtonTitle}
                                aria-label={tileGridButtonTitle}
                                aria-pressed={showTileGrid}
                            >
                                <Grid size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCollapsed(true)}
                                className="rounded p-1.5 text-[#7E9385] transition-colors hover:bg-[#142920] hover:text-[#E2CEAB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CDB988]"
                                title="Ringkas Pakem Motif Batik"
                                aria-label="Ringkas Pakem Motif Batik"
                                aria-expanded={true}
                            >
                                <ChevronRight size={16} />
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

                    {selectedMotif === "polos" && (
                        <div className="shrink-0 rounded-xl border border-[#263D32] bg-[#0E1E18] p-3">
                            <label className="flex cursor-pointer items-center justify-between gap-3">
                                <span className="min-w-0">
                                    <span className="block text-xs font-semibold text-[#E2CEAB]">
                                        Gambar berulang
                                    </span>
                                    <span className="mt-0.5 block text-[10px] leading-relaxed text-[#7E9385]">
                                        Ulangi gambaran menjadi motif berpola.
                                    </span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={tileFreeDrawing}
                                    onChange={(event) =>
                                        onTileFreeDrawingChange(
                                            event.target.checked,
                                        )
                                    }
                                    className="h-4 w-4 shrink-0 rounded border-[#496154] bg-[#08130E] text-[#CDB988] focus:ring-[#CDB988] focus:ring-offset-0"
                                />
                            </label>
                        </div>
                    )}

                    {!user && (
                        <div className="shrink-0 rounded-xl border border-[#182C24] bg-[#0E1E18] p-3 text-[11px] leading-relaxed text-[#7E9385]">
                            <p className="mb-1 font-medium text-[#E2CEAB]">
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
            )}
        </aside>
    );
}
