import { X } from "lucide-react";

export default function MotifDetailModal({ motif, onClose, onUse }) {
    if (!motif) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0B1813] border border-[#2A473A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-[#D8C7A5]">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#7E9385] hover:text-[#F5EFEB] transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-[#08130E] border border-[#182C24] flex items-center justify-center p-2">
                        {motif.svgIcon}
                    </div>
                    <div>
                        <h3 className="font-heading text-2xl font-bold text-[#E2CEAB]">
                            {motif.name}
                        </h3>
                        <p className="text-xs text-[#7E9385]">
                            {motif.origin} · {motif.category}
                        </p>
                    </div>
                </div>
                <div className="bg-[#08130E] border border-[#182C24] rounded-xl p-4 mb-5 text-sm leading-relaxed text-[#BACDC2]">
                    <p className="font-medium text-[#E2CEAB] mb-1">
                        Makna & Filosofi:
                    </p>
                    {motif.description}
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => onUse(motif)}
                        className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-xs px-5 py-2.5 rounded-xl transition-all"
                    >
                        Gunakan Mode Ini
                    </button>
                </div>
            </div>
        </div>
    );
}
