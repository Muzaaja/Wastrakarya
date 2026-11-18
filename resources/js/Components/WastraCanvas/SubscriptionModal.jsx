import React from "react";
import { X, Crown, Sparkles, Users, Globe, ShieldCheck, ArrowRight } from "lucide-react";

export default function SubscriptionModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div
                className="bg-[#0E1E18] border border-[#CDB988]/40 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#F5EFEB] relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Glow Background Accent */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#CDB988]/20 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#7E9385] hover:text-[#F5EFEB] p-1.5 rounded-xl hover:bg-[#142920] transition-colors z-10"
                    title="Tutup"
                >
                    <X size={18} />
                </button>

                {/* Header Modal */}
                <div className="pt-8 pb-4 px-6 flex flex-col items-center text-center relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#9B8049] to-[#E2CEAB] p-0.5 shadow-lg shadow-[#CDB988]/20 mb-4 flex items-center justify-center">
                        <div className="w-full h-full bg-[#0E1E18] rounded-[14px] flex items-center justify-center text-[#E2CEAB]">
                            <Crown size={30} className="text-[#CDB988] animate-bounce" />
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CDB988]/10 border border-[#CDB988]/30 text-[#CDB988] text-[11px] font-semibold uppercase tracking-wider mb-2">
                        <Sparkles size={12} />
                        <span>Fitur Eksklusif Member</span>
                    </div>

                    <h3 className="font-heading font-bold text-2xl text-[#E2CEAB]">
                        Kolaborasi Real-Time
                    </h3>
                    <p className="text-xs text-[#A5B8AC] mt-1.5 max-w-xs leading-relaxed">
                        Fitur berbagi dan mengedit kanvas secara bersamaan hanya dapat
                        diakses oleh pengguna dengan paket langganan aktif.
                    </p>
                </div>

                {/* Benefits List */}
                <div className="px-6 py-2 flex flex-col gap-2.5 relative z-10">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#091611] border border-[#182C24]">
                        <div className="p-2 rounded-xl bg-[#142920] text-[#CDB988] shrink-0 mt-0.5">
                            <Users size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-[#F5EFEB]">
                                Kolaborasi Multi-Pengguna Bersamaan
                            </h4>
                            <p className="text-[11px] text-[#7E9385] mt-0.5">
                                Melukis canting bersama teman atau komunitas secara live dalam satu kanvas.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#091611] border border-[#182C24]">
                        <div className="p-2 rounded-xl bg-[#142920] text-[#CDB988] shrink-0 mt-0.5">
                            <Globe size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-[#F5EFEB]">
                                Berbagi Tautan Publik & Undangan Email
                            </h4>
                            <p className="text-[11px] text-[#7E9385] mt-0.5">
                                Bagikan tautan kanvas ke siapa saja atau khusus ke email kolaborator terpilih.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#091611] border border-[#182C24]">
                        <div className="p-2 rounded-xl bg-[#142920] text-[#CDB988] shrink-0 mt-0.5">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-[#F5EFEB]">
                                Tautan Kanvas Permanen Khusus
                            </h4>
                            <p className="text-[11px] text-[#7E9385] mt-0.5">
                                Setiap kanvas memiliki URL permanen tersendiri seperti di Google Docs & Canva.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 flex flex-col gap-2.5 relative z-10">
                    <button
                        onClick={() => {
                            onClose();
                            window.location.href = "/dashboard";
                        }}
                        className="w-full bg-gradient-to-r from-[#D5BD8A] to-[#C4AC79] hover:from-[#C4AC79] hover:to-[#B39B68] text-[#0A1612] font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-[#CDB988]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <span>Aktifkan Langganan Sekarang</span>
                        <ArrowRight size={16} />
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full text-xs text-[#7E9385] hover:text-[#BACDC2] py-2 transition-colors text-center"
                    >
                        Mungkin Nanti
                    </button>
                </div>
            </div>
        </div>
    );
}
