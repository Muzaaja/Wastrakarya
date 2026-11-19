import React, { useState, useEffect } from "react";
import {
    X,
    Lock,
    Globe,
    Users,
    Copy,
    Check,
    Trash2,
    UserPlus,
    Loader2,
    ShieldAlert,
    ExternalLink,
} from "lucide-react";
import { getJsonRequestHeaders, getRequestHeaders } from "./http";

export default function ShareModal({
    isOpen,
    onClose,
    drawingId,
    isOwner = true,
    initialShareType = "private",
    shareUrl = "",
    onShareUpdated,
    showToast,
}) {
    const [shareType, setShareType] = useState(initialShareType);
    const [copied, setCopied] = useState(false);
    const [emailInput, setEmailInput] = useState("");
    const [collaborators, setCollaborators] = useState([]);
    const [loadingCollaborators, setLoadingCollaborators] = useState(false);
    const [submittingShare, setSubmittingShare] = useState(false);
    const [addingEmail, setAddingEmail] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // Sinkronisasi data saat modal dibuka
    useEffect(() => {
        if (!isOpen || !drawingId) return;

        setShareType(initialShareType || "private");
        setErrorMessage(null);

        // Muat daftar kolaborator jika ada
        const fetchCollaborators = async () => {
            setLoadingCollaborators(true);
            try {
                const res = await fetch(
                    `/api/user-drawings/${drawingId}/collaborators`,
                    {
                        headers: getRequestHeaders(),
                    },
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data.share_type) {
                        setShareType(data.share_type);
                    }
                    setCollaborators(data.collaborators || []);
                }
            } catch (err) {
                console.error("Gagal memuat kolaborator", err);
            } finally {
                setLoadingCollaborators(false);
            }
        };

        fetchCollaborators();
    }, [isOpen, drawingId, initialShareType]);

    if (!isOpen) return null;

    // Salin Tautan ke Clipboard
    const handleCopyLink = async () => {
        try {
            const urlToCopy =
                shareUrl || `${window.location.origin}/canvas/${drawingId}`;
            await navigator.clipboard.writeText(urlToCopy);
            setCopied(true);
            showToast?.("Tautan kanvas berhasil disalin ke clipboard!");
            setTimeout(() => setCopied(false), 2500);
        } catch (err) {
            console.error(err);
            showToast?.("Gagal menyalin tautan");
        }
    };

    // Perbarui Opsi Berbagi (1: public, 2: specific_users, 3: private)
    const handleSelectShareType = async (newType) => {
        if (!isOwner || submittingShare || newType === shareType) return;

        setShareType(newType);
        setSubmittingShare(true);
        setErrorMessage(null);

        try {
            const res = await fetch(`/api/user-drawings/${drawingId}/share`, {
                method: "PUT",
                headers: getJsonRequestHeaders(),
                body: JSON.stringify({ share_type: newType }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Gagal memperbarui izin berbagi");
            }

            const data = await res.json();
            onShareUpdated?.(newType);

            const label =
                newType === "public"
                    ? "Publik (siapa saja dengan tautan)"
                    : newType === "specific_users"
                      ? "Pengguna Tertentu (Email)"
                      : "Privat (Hanya Saya)";
            showToast?.(`Izin berbagi diperbarui: ${label}`);
        } catch (err) {
            console.error(err);
            setErrorMessage(err.message || "Gagal menyimpan perubahan");
            setShareType(initialShareType);
        } finally {
            setSubmittingShare(false);
        }
    };

    // Tambahkan Kolaborator Email
    const handleAddCollaborator = async (e) => {
        e.preventDefault();
        const email = emailInput.trim().toLowerCase();
        if (!email || addingEmail || !isOwner) return;

        setAddingEmail(true);
        setErrorMessage(null);

        try {
            const res = await fetch(
                `/api/user-drawings/${drawingId}/collaborators`,
                {
                    method: "POST",
                    headers: getJsonRequestHeaders(),
                    body: JSON.stringify({ email }),
                },
            );

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Gagal menambahkan email");
            }

            if (data.collaborator) {
                setCollaborators((prev) => [
                    ...prev.filter((c) => c.email !== email),
                    data.collaborator,
                ]);
            }
            setEmailInput("");
            showToast?.(`Kolaborator ${email} berhasil ditambahkan!`);
        } catch (err) {
            console.error(err);
            setErrorMessage(err.message || "Gagal menambahkan kolaborator");
        } finally {
            setAddingEmail(false);
        }
    };

    // Hapus Kolaborator
    const handleRemoveCollaborator = async (collabId, email) => {
        if (!isOwner) return;

        try {
            const res = await fetch(
                `/api/user-drawings/${drawingId}/collaborators/${collabId}`,
                {
                    method: "DELETE",
                    headers: getRequestHeaders(),
                },
            );

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Gagal menghapus kolaborator");
            }

            setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
            showToast?.(`Kolaborator ${email} telah dihapus.`);
        } catch (err) {
            console.error(err);
            showToast?.(err.message || "Gagal menghapus kolaborator");
        }
    };

    const displayUrl =
        shareUrl || `${window.location.origin}/canvas/${drawingId}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div
                className="bg-[#0E1E18] border border-[#1E362C] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#F5EFEB]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#182C24] bg-[#091611]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#142920] border border-[#CDB988]/30 flex items-center justify-center text-[#CDB988]">
                            <Users size={17} />
                        </div>
                        <div>
                            <h3 className="font-heading font-semibold text-base text-[#E2CEAB]">
                                Berbagi & Kolaborasi
                            </h3>
                            <p className="text-xs text-[#7E9385]">
                                Edit kanvas bersama pengguna lain secara bersamaan
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#7E9385] hover:text-[#F5EFEB] p-1.5 rounded-lg hover:bg-[#142920] transition-colors"
                        title="Tutup"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Konten Modal */}
                <div className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
                    {errorMessage && (
                        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
                            <ShieldAlert size={16} className="shrink-0 text-red-400" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {!isOwner && (
                        <div className="p-3 bg-[#142920] border border-[#CDB988]/30 rounded-xl text-xs text-[#CDB988] flex items-center gap-2">
                            <span>
                                Anda sedang mengedit sebagai kolaborator. Hanya pemilik
                                karya yang dapat mengubah setelan pembagian.
                            </span>
                        </div>
                    )}

                    {/* PILIHAN 3 MODE BERBAGI */}
                    <div className="flex flex-col gap-2.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#A5B8AC]">
                            Pilih Akses Kolaborasi
                        </label>

                        {/* Opsi 1: Privat (Hanya Saya) */}
                        <div
                            onClick={() => handleSelectShareType("private")}
                            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                                shareType === "private"
                                    ? "bg-[#142920] border-[#CDB988] shadow-sm ring-1 ring-[#CDB988]/50"
                                    : "bg-[#0A1712] border-[#182C24] hover:border-[#1E362C]"
                            } ${!isOwner ? "cursor-default opacity-80" : ""}`}
                        >
                            <div
                                className={`p-2 rounded-lg mt-0.5 ${
                                    shareType === "private"
                                        ? "bg-[#CDB988] text-[#0A1612]"
                                        : "bg-[#0E1E18] text-[#7E9385]"
                                }`}
                            >
                                <Lock size={16} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[#F5EFEB]">
                                        Jangan bagikan ke siapa pun (Privat)
                                    </span>
                                </div>
                                <p className="text-xs text-[#7E9385] mt-1">
                                    Hanya Anda sendiri yang dapat melihat dan melukis
                                    di kanvas ini.
                                </p>
                            </div>
                        </div>

                        {/* Opsi 2: Publik dengan tautan */}
                        <div
                            onClick={() => handleSelectShareType("public")}
                            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                                shareType === "public"
                                    ? "bg-[#142920] border-[#CDB988] shadow-sm ring-1 ring-[#CDB988]/50"
                                    : "bg-[#0A1712] border-[#182C24] hover:border-[#1E362C]"
                            } ${!isOwner ? "cursor-default opacity-80" : ""}`}
                        >
                            <div
                                className={`p-2 rounded-lg mt-0.5 ${
                                    shareType === "public"
                                        ? "bg-[#CDB988] text-[#0A1612]"
                                        : "bg-[#0E1E18] text-[#7E9385]"
                                }`}
                            >
                                <Globe size={16} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[#F5EFEB]">
                                        Siapa pun yang memiliki tautan (Publik)
                                    </span>
                                </div>
                                <p className="text-xs text-[#7E9385] mt-1">
                                    Semua pengguna terdaftar yang membuka tautan dapat
                                    mengedit kanvas bersamaan secara real-time.
                                </p>
                            </div>
                        </div>

                        {/* Opsi 3: Pengguna tertentu (Email) */}
                        <div
                            onClick={() => handleSelectShareType("specific_users")}
                            className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                                shareType === "specific_users"
                                    ? "bg-[#142920] border-[#CDB988] shadow-sm ring-1 ring-[#CDB988]/50"
                                    : "bg-[#0A1712] border-[#182C24] hover:border-[#1E362C]"
                            } ${!isOwner ? "cursor-default opacity-80" : ""}`}
                        >
                            <div
                                className={`p-2 rounded-lg mt-0.5 ${
                                    shareType === "specific_users"
                                        ? "bg-[#CDB988] text-[#0A1612]"
                                        : "bg-[#0E1E18] text-[#7E9385]"
                                }`}
                            >
                                <Users size={16} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-[#F5EFEB]">
                                        Hanya pengguna tertentu (Email)
                                    </span>
                                </div>
                                <p className="text-xs text-[#7E9385] mt-1">
                                    Hanya pengguna terdaftar yang Anda tambahkan
                                    melalui email yang berhak mengakses dan mengedit.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SALIN TAUTAN (Ditampilkan jika Public atau Specific Users) */}
                    {shareType !== "private" && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-[#182C24]">
                            <label className="text-xs font-semibold text-[#A5B8AC]">
                                Tautan Kanvas Kolaborasi
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={displayUrl}
                                    className="flex-1 bg-[#091611] border border-[#182C24] text-xs text-[#BACDC2] rounded-xl px-3 py-2.5 outline-none font-mono selection:bg-[#CDB988] selection:text-[#0A1612]"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="bg-[#D5BD8A] hover:bg-[#C4AC79] text-[#0A1612] font-semibold text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={14} className="text-emerald-950 font-bold" />
                                            <span>Disalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} />
                                            <span>Salin Tautan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* FORM & DAFTAR KOLABORATOR EMAIL (Jika Mode Specific Users) */}
                    {shareType === "specific_users" && (
                        <div className="flex flex-col gap-3 pt-2 border-t border-[#182C24]">
                            <label className="text-xs font-semibold text-[#A5B8AC]">
                                Undang Kolaborator via Email
                            </label>

                            {isOwner && (
                                <form
                                    onSubmit={handleAddCollaborator}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="email"
                                        required
                                        placeholder="nama@email.com"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        className="flex-1 bg-[#091611] border border-[#182C24] focus:border-[#CDB988] text-xs text-[#F5EFEB] rounded-xl px-3 py-2.5 outline-none placeholder:text-[#526458]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={addingEmail || !emailInput.trim()}
                                        className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/50 hover:border-[#CDB988] text-[#E2CEAB] font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                                    >
                                        {addingEmail ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <UserPlus size={14} />
                                        )}
                                        <span>Undang</span>
                                    </button>
                                </form>
                            )}

                            {/* Daftar Kolaborator Terundang */}
                            <div className="flex flex-col gap-1.5 mt-1">
                                <span className="text-[11px] text-[#7E9385] font-medium">
                                    Daftar Pengguna Diundang ({collaborators.length}):
                                </span>

                                {loadingCollaborators ? (
                                    <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#7E9385]">
                                        <Loader2 size={15} className="animate-spin text-[#CDB988]" />
                                        <span>Memuat daftar kolaborator...</span>
                                    </div>
                                ) : collaborators.length === 0 ? (
                                    <div className="p-3 bg-[#0A1712] border border-[#182C24] rounded-xl text-xs text-[#7E9385] text-center italic">
                                        Belum ada pengguna yang diundang. Masukkan email
                                        di atas untuk mengizinkan kolaborasi.
                                    </div>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                                        {collaborators.map((c) => (
                                            <div
                                                key={c.id}
                                                className="flex items-center justify-between px-3 py-2 bg-[#0A1712] border border-[#182C24] rounded-xl text-xs"
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className="w-6 h-6 rounded-full bg-[#142920] border border-[#CDB988]/40 flex items-center justify-center text-[10px] text-[#CDB988] font-bold shrink-0">
                                                        {(c.name || c.email || "?")
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="font-medium text-[#F5EFEB] truncate block">
                                                            {c.name ? `${c.name} (${c.email})` : c.email}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                            c.registered
                                                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                                                                : "bg-amber-950/40 text-amber-300 border-amber-500/30"
                                                        }`}
                                                    >
                                                        {c.registered ? "Terdaftar" : "Diundang"}
                                                    </span>

                                                    {isOwner && (
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveCollaborator(
                                                                    c.id,
                                                                    c.email,
                                                                )
                                                            }
                                                            className="text-[#7E9385] hover:text-red-400 p-1 rounded transition-colors"
                                                            title="Hapus kolaborator"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="px-6 py-3.5 bg-[#091611] border-t border-[#182C24] flex items-center justify-between text-xs text-[#7E9385]">

                    <button
                        onClick={onClose}
                        className="bg-[#142920] hover:bg-[#1E3B2E] border border-[#CDB988]/40 hover:border-[#CDB988] text-[#E2CEAB] font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
}
