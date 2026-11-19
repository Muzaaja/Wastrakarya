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
                label: "Malam dingin",
                color: "text-[#7E9385]",
                icon: <InfoIcon size={18} className="text-[#7E9385]" />,
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
                icon: <InfoIcon size={18} className="text-[#7E9385]" />,
                actionLabel: "Mulai Melukis",
                actionColor:
                    "bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612]",
                description:
                    "Canting telah terisi malam cair, waktunya melukis!",
                showReheatButton: true,
            };
        case "drawing":
            return {
                label: `Gunakan sebelum ${drawingTimeLeft} detik`,
                color: "text-[#A8D5BA]",
                icon: <Timer size={18} className="text-[#A8D5BA]" />,
                actionLabel: "Sisa",
                actionColor:
                    "bg-[#142920] border-[#56C87A]/50 text-[#A8D5BA] cursor-not-allowed",
                description:
                    "Malam akan mengeras dan perlu dilelehkan kembali.",
                showReheatButton: true,
            };
        case "hardened":
            return {
                label: "Malam telah padat",
                color: "text-[#E88D8D]",
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
                icon: null,
                actionLabel: "",
                actionColor: "",
                description: "",
                showReheatButton: false,
            };
    }
}

export default function MalamStatusCard({ malam, malamWiggle }) {
    const malamInfo = getMalamStateInfo(
        malam.malamState,
        malam.heatingProgress,
        malam.drawingTimeLeft,
    );
    const isFreshlyMelted =
        malam.malamState === "pouring" || malam.malamState === "ready";
    const indicatorProgress =
        isFreshlyMelted || malam.malamState === "drawing"
            ? Math.max(0.01, malam.malamHardeningProgress)
            : malam.malamState === "hardened"
              ? malam.malamHardeningProgress
              : 1;
    const showPrimaryAction = ["cold", "ready", "hardened"].includes(
        malam.malamState,
    );
    const progress =
        malam.malamState === "heating"
            ? malam.heatingProgress
            : isFreshlyMelted
              ? 1
              : malam.malamState === "drawing" ||
                  malam.malamState === "hardened"
                ? Math.max(1, malam.malamHardeningProgress * 100)
                : 0;

    return (
        <div
            ref={malam.malamCardRef}
            id="tour-malam-card"
            className={`flex min-h-[8.5rem] min-w-0 items-center gap-3 bg-[#0B1812] px-3 py-2 ${
                malamWiggle
                    ? "animate-wiggle bg-[#2A1414] shadow-[inset_5px_0_0_#E88D8D]"
                    : ""
            }`}
        >
            <div
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-4 border-[#B5B8AA]/30 bg-[#07110D] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.12),0_5px_14px_rgba(0,0,0,0.38)]"
                title={`${malam.waxColorName} • ${malamInfo.label}`}
            >
                <React.Suspense
                    fallback={
                        <div
                            className="absolute inset-0 animate-pulse"
                            style={{ backgroundColor: malam.waxColor }}
                        />
                    }
                >
                    <MalamHardening3D
                        progress={indicatorProgress}
                        waxColor={malam.waxColor}
                    />
                </React.Suspense>
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className={`shrink-0 ${malamInfo.color}`}>
                        {malamInfo.icon}
                    </span>
                    <p
                        className={`truncate text-xs font-semibold ${malamInfo.color}`}
                    >
                        {malamInfo.label}
                    </p>
                </div>
                <p
                    className="mt-0.5 truncate text-[9px] text-[#71877A]"
                    title={malamInfo.description}
                >
                    {malamInfo.description}
                </p>

                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#F2A85A] via-[#CDB988] to-[#8FA395] transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="mt-1.5 flex items-center gap-1.5">
                    {showPrimaryAction && (
                        <button
                            type="button"
                            onClick={malam.handleCantingDip}
                            id="tour-heat"
                            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all ${malamInfo.actionColor}`}
                        >
                            <Flame size={12} />
                            <span className="truncate">
                                {malamInfo.actionLabel}
                            </span>
                        </button>
                    )}

                    {malamInfo.showReheatButton && (
                        <button
                            type="button"
                            onClick={malam.reheatForColorChange}
                            className="flex h-6 w-7 shrink-0 items-center justify-center rounded-lg border border-[#CDB988]/40 bg-[#142920] text-[#D5BD8A] transition-colors hover:border-[#CDB988] hover:bg-[#1A3A2E]"
                            title="Panaskan ulang untuk mengganti warna"
                        >
                            <RotateCcw size={12} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
