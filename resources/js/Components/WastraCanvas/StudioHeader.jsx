import { Link } from "@inertiajs/react";
import {
    Crown,
    HelpCircle,
    Layers,
    Save,
    Share2,
    Shirt,
} from "lucide-react";

export default function StudioHeader({
    activeCollaborators,
    canvasOwner,
    hasActiveSubscription,
    hasUnsavedChanges,
    isEditingTitle,
    isOwner,
    onOpenShare,
    onOpenThreeDimensionalMockup,
    onSave,
    onStartTutorial,
    onTitleChange,
    onTitleCommit,
    projectTitle,
    setIsEditingTitle,
    shareType,
}) {
    const finishTitleEditing = () => {
        setIsEditingTitle(false);
        void onTitleCommit();
    };

    return (
        <header className="h-16 px-6 bg-[#091611] border-b border-[#182C24] flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 group">
                    <img
                        width={40}
                        src="/logo-wastrakarya.svg"
                        alt="Wastrakarya"
                    />
                    <span className="font-heading text-2xl font-bold tracking-wide text-[#E2CEAB] group-hover:text-[#F3E5C8] transition-colors">
                        Wastrakarya
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0E1E18] border border-[#1E362C] flex items-center justify-center text-[#CDB988]">
                    <Layers size={18} />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#F5EFEB]">
                        Kanvas
                    </span>
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={projectTitle}
                            onChange={(event) =>
                                onTitleChange(event.target.value)
                            }
                            onBlur={finishTitleEditing}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.currentTarget.blur();
                                }
                            }}
                            autoFocus
                            className="bg-[#0B1813] border border-[#CDB988]/40 text-xs text-[#BACDC2] px-1.5 py-0.5 rounded outline-none w-48"
                        />
                    ) : (
                        <span
                            onClick={() => {
                                if (isOwner) {
                                    setIsEditingTitle(true);
                                }
                            }}
                            title={
                                isOwner
                                    ? "Klik untuk mengubah nama karya"
                                    : "Hanya pemilik yang dapat mengubah nama karya"
                            }
                            className={`text-xs text-[#7E9385] transition-colors ${
                                isOwner
                                    ? "hover:text-[#CDB988] cursor-pointer"
                                    : "cursor-default"
                            }`}
                        >
                            {projectTitle}
                        </span>
                    )}
                    {!isOwner && canvasOwner?.name && (
                        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
                            <Crown size={11} className="text-amber-400" />
                            Pemilik: {canvasOwner.name}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
                {activeCollaborators.length > 0 && (
                    <div
                        className="flex items-center -space-x-2 mr-1 bg-[#0E1E18] px-2.5 py-1.5 rounded-xl border border-[#182C24]"
                        title={`Sedang mengedit bersama: ${activeCollaborators
                            .map((collaborator) => collaborator.name)
                            .join(", ")}`}
                    >
                        {activeCollaborators
                            .slice(0, 3)
                            .map((collaborator, index) => (
                                <div
                                    key={collaborator.id || index}
                                    className="w-6 h-6 rounded-full bg-[#142920] border-2 border-[#091611] flex items-center justify-center text-[10px] font-bold text-[#CDB988] shadow relative"
                                    title={`${collaborator.name} (${collaborator.is_owner ? "Pemilik" : "Kolaborator"})`}
                                >
                                    {(collaborator.name || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-[#091611]" />
                                </div>
                            ))}
                        {activeCollaborators.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-[#142920] border-2 border-[#091611] flex items-center justify-center text-[9px] font-bold text-[#E2CEAB] shadow">
                                +{activeCollaborators.length - 3}
                            </div>
                        )}
                        <span className="ml-3 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {activeCollaborators.length} aktif
                        </span>
                    </div>
                )}

                <span className="text-xs text-[#7E9385] mr-1 hidden sm:inline">
                    {!isOwner
                        ? "Hanya pemilik dapat menyimpan"
                        : hasUnsavedChanges
                          ? "Perubahan belum disimpan"
                          : "Perubahan tersimpan"}
                </span>

                {isOwner && (
                    <button
                        type="button"
                        onClick={onOpenShare}
                        title={
                            hasActiveSubscription
                                ? "Bagikan kanvas dan kolaborasi real-time"
                                : "Fitur kolaborasi (eksklusif pengguna berlangganan)"
                        }
                        className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2 active:scale-95"
                    >
                        {hasActiveSubscription ? (
                            <Share2 size={15} className="text-[#CDB988]" />
                        ) : (
                            <Crown size={15} className="text-amber-400" />
                        )}
                        <span>Bagikan</span>
                        {hasActiveSubscription ? (
                            shareType &&
                            shareType !== "private" && (
                                <span
                                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                                    title="Berbagi aktif"
                                />
                            )
                        ) : (
                            <span className="text-[10px] text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded-md border border-amber-400/30 font-medium">
                                Pro
                            </span>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={onStartTutorial}
                    title="Tutorial Membatik"
                    className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-3 py-2.5 rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2"
                >
                    <HelpCircle size={15} className="text-[#CDB988]" />
                    <span>Bantuan</span>
                </button>
                {isOwner && (
                    <button
                        type="button"
                        onClick={onSave}
                        className="bg-[#D5BD8A] hover:bg-[#C4AC79] active:scale-95 text-[#0A1612] font-semibold text-sm px-5 py-2 rounded-xl shadow-md transition-all duration-150 flex items-center gap-2"
                    >
                        <Save size={15} />
                        <span>Simpan</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onOpenThreeDimensionalMockup}
                    title="Lihat simulasi 3D desain batik pada kemeja"
                    className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 flex items-center gap-2"
                >
                    <Shirt size={15} className="text-[#CDB988]" />
                    <span>Simulasi 3D</span>
                </button>
            </div>
        </header>
    );
}
