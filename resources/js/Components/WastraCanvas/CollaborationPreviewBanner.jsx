import { Crown } from "lucide-react";

export default function CollaborationPreviewBanner({ onSubscribe }) {
    return (
        <div className="bg-gradient-to-r from-amber-950/80 to-[#142920] border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 z-20 shrink-0">
            <div className="flex items-center gap-2">
                <Crown size={15} className="text-amber-400 shrink-0" />
                <span>
                    <strong>Mode Pratinjau Kanvas:</strong> Anda dapat melihat
                    karya ini, namun memerlukan akun dengan paket langganan
                    aktif untuk mengedit bersama secara real-time.
                </span>
            </div>
            <button
                type="button"
                onClick={onSubscribe}
                className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold px-3 py-1 rounded-lg text-[11px] shadow transition-all active:scale-95 shrink-0 ml-4"
            >
                Aktifkan Langganan
            </button>
        </div>
    );
}
