import React from "react";
import {
    AlertTriangle,
    Flame,
    InfoIcon,
    Loader2,
    RotateCcw,
    Sparkles,
    Timer,
} from "lucide-react";
import { MalamHardening3D } from "./MalamScenes";

function getMalamStateInfo(malamState, heatingProgress, drawingTimeLeft) {
    switch (malamState) {
        case "cold":
            return {
                label: "",
                color: "text-[#7E9385]",
                bgColor: "bg-[#0E1E18]",
                borderColor: "border-[#182C24]",
                icon: <InfoIcon size={18} text="#7E9385" />,
                actionLabel: "Lelehkan Malam",
                actionColor:
                    "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                description:
                    "Lelehkan malam dahulu untuk menggunakan canting!",
            };
        case "heating":
            return {
                label: `Memanas.. ${heatingProgress}%`,
                color: "text-[#E2B86B]",
                bgColor: "bg-[#1A2E20]",
                borderColor: "border-[#CDB988]/50",
                icon: (
                    <Loader2
                        size={18}
                        className="text-[#E2B86B] animate-spin"
                    />
                ),
                actionLabel: "Menunggu...",
                actionColor:
                    "bg-[#142920] border-[#2A473A] text-[#7E9385] cursor-not-allowed",
                description: "Silahkan tunggu sampai malam meleleh.",
            };
        case "pouring":
            return {
                label: "Mengisi canting",
                color: "text-[#E2B86B]",
                bgColor: "bg-[#1A2E20]",
                borderColor: "border-[#CDB988]/50",
                icon: <Sparkles size={18} className="text-[#E2B86B]" />,
                actionLabel: "Menunggu...",
                actionColor:
                    "bg-[#142920] border-[#2A473A] text-[#7E9385] cursor-not-allowed",
                description: "Malam cair sedang dituangkan ke canting.",
            };
        case "preparing":
            return {
                label: "Menyiapkan pemanasan",
                color: "text-[#E2B86B]",
                bgColor: "bg-[#1A2E20]",
                borderColor: "border-[#CDB988]/50",
                icon: <Flame size={18} className="text-[#E2B86B]" />,
                actionLabel: "Menunggu...",
                actionColor:
                    "bg-[#142920] border-[#2A473A] text-[#7E9385] cursor-not-allowed",
                description: "Masukkan malam ke kuali dan nyalakan api.",
            };
        case "ready":
            return {
                label: "Canting siap!",
                color: "text-[#D5BD8A]",
                bgColor: "bg-[#142920]",
                borderColor: "border-[#CDB988]",
                icon: <InfoIcon size={18} text="#7E9385" />,
                actionLabel: "Mulai Melukis",
                actionColor:
                    "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                description:
                    "Canting telah terisi malam cair, waktunya melukis!",
                showReheatButton: true,
            };
        case "drawing":
            return {
                label: `Malam mendingin • ${drawingTimeLeft}s`,
                color: "text-[#A8D5BA]",
                bgColor: "bg-[#0F2A1E]",
                borderColor: "border-[#56C87A]/50",
                icon: <Timer size={18} className="text-[#A8D5BA]" />,
                actionLabel: "Sisa",
                actionColor:
                    "bg-[#142920] border-[#56C87A]/50 text-[#A8D5BA] cursor-not-allowed",
                description:
                    "Kilau dan aliran malam mereda perlahan hingga padat.",
                showReheatButton: true,
            };
        case "hardened":
            return {
                label: "Malam telah padat",
                color: "text-[#E88D8D]",
                bgColor: "bg-[#2A1414]",
                borderColor: "border-[#E88D8D]/50",
                icon: (
                    <AlertTriangle size={18} className="text-[#E88D8D]" />
                ),
                actionLabel: "Panaskan Ulang",
                actionColor:
                    "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                description:
                    "Malam telah mengeras. Harus dipanaskan ulang 5 detik.",
                showReheatButton: true,
            };
        default:
            return {
                label: "",
                color: "",
                bgColor: "",
                borderColor: "",
                icon: null,
                actionLabel: "",
                actionColor: "",
                description: "",
                showReheatButton: false,
            };
    }
}

export function isWaxColorEditable(malamState) {
    return malamState === "cold" || malamState === "hardened";
}

export default function MalamStatusCard({ malam, malamWiggle }) {
    const malamInfo = getMalamStateInfo(
        malam.malamState,
        malam.heatingProgress,
        malam.drawingTimeLeft,
    );

    return (
        <div
            ref={malam.malamCardRef}
            className={`bg-[#0E1E18] border border-[#182C24] rounded-xl p-4 ${
                malamWiggle
                    ? "animate-wiggle border-[#E88D8D] shadow-[0_0_0_6px_rgba(232,141,141,0.35)]"
                    : "border-[#182C24]"
            }`}
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-lg text-[#E2CEAB]">
                    Malam
                </h3>
            </div>

            {!malam.isHeatingOverlayOpen && (
                <div
                    id="tour-malam-card"
                    className={`${malamInfo.bgColor} ${malamInfo.borderColor} rounded-xl p-4 mb-3 transition-all duration-300`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        {malamInfo.icon}
                        <div className="flex-1">
                            <p
                                className={`font-semibold text-sm ${malamInfo.color}`}
                            >
                                {malamInfo.label}
                            </p>
                            <p className="text-xs text-[#7E9385] mt-0.5">
                                {malamInfo.description}
                            </p>
                        </div>
                    </div>

                    {(malam.malamState === "drawing" ||
                        malam.malamState === "hardened") && (
                        <div className="relative mt-3 h-32 overflow-hidden rounded-lg border border-[#CDB988]/20 bg-[#08130E]">
                            <React.Suspense
                                fallback={
                                    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(226,184,107,0.2),transparent_62%)]" />
                                }
                            >
                                <MalamHardening3D
                                    progress={malam.malamHardeningProgress}
                                    waxColor={malam.waxColor}
                                />
                            </React.Suspense>

                            <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full border border-white/10 bg-[#06100C]/75 px-2 py-1 backdrop-blur-sm">
                                <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#F0B96A]">
                                    Cair
                                </span>
                                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#F2A85A] via-[#CDB988] to-[#8FA395] transition-[width] duration-1000 ease-linear"
                                        style={{
                                            width: `${malam.malamHardeningProgress * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#AFC0B5]">
                                    Padat
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {malamInfo.actionLabel !== "Menunggu..." &&
                malamInfo.actionLabel !== "Mulai Melukis" &&
                malamInfo.actionLabel !== "Sisa" && (
                    <button
                        type="button"
                        onClick={malam.handleCantingDip}
                        id="tour-heat"
                        disabled={
                            malam.malamState === "heating" ||
                            malam.malamState === "drawing"
                        }
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${malamInfo.actionColor}`}
                    >
                        {malam.malamState === "heating" && (
                            <Loader2 size={16} className="animate-spin" />
                        )}
                        {malam.malamState === "drawing" && (
                            <Timer size={16} />
                        )}
                        {malam.malamState !== "heating" &&
                            malam.malamState !== "drawing" && (
                                <Flame size={16} />
                            )}
                        <span>{malamInfo.actionLabel}</span>
                    </button>
                )}

            {malamInfo.showReheatButton && (
                <button
                    type="button"
                    onClick={malam.reheatForColorChange}
                    className="w-full mt-2 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 bg-[#142920] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#D5BD8A] hover:bg-[#1A3A2E]"
                >
                    <RotateCcw size={14} />
                    <span>Panaskan Ulang (Ganti Warna)</span>
                </button>
            )}
        </div>
    );
}
