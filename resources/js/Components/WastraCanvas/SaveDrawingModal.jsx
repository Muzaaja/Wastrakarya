import { Loader2, X } from "lucide-react";

export default function SaveDrawingModal({
    isOpen,
    isSaving,
    mode = "save",
    name,
    onCancel,
    onConfirm,
    onNameChange,
}) {
    if (!isOpen) {
        return null;
    }

    const isSaveAs = mode === "save-as";

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0B1813] border border-[#2A473A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#D8C7A5]">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="absolute top-4 right-4 text-[#7E9385] hover:text-[#F5EFEB] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <X size={20} />
                </button>
                <h3 className="font-heading text-xl font-bold text-[#E2CEAB] mb-4 text-center">
                    {isSaveAs ? "Simpan Karya Sebagai" : "Beri Nama Karya"}
                </h3>
                <div className="bg-[#08130E] border border-[#182C24] rounded-xl p-4 mb-6">
                    <label className="block text-xs text-[#7E9385] mb-2 font-medium">
                        Nama Karya
                    </label>
                    <input
                        autoFocus
                        value={name}
                        disabled={isSaving}
                        onChange={(event) => onNameChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !isSaving) {
                                onConfirm();
                            }
                        }}
                        className="w-full bg-[#0E1E18] border border-[#CDB988]/40 text-[#BACDC2] text-sm px-4 py-2.5 rounded outline-none focus:ring-2 focus:ring-[#CDB988] transition-colors disabled:cursor-wait disabled:opacity-60"
                        placeholder="Karya tanpa judul"
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl font-semibold text-sm text-[#7E9385] hover:text-[#F5EFEB] hover:bg-[#08130E] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all duration-150 flex items-center gap-2 disabled:cursor-wait disabled:opacity-70"
                    >
                        {isSaving && (
                            <Loader2 size={15} className="animate-spin" />
                        )}
                        {isSaving
                            ? "Menyimpan..."
                            : isSaveAs
                              ? "Simpan Sebagai"
                              : "Simpan"}
                    </button>
                </div>
            </div>
        </div>
    );
}
