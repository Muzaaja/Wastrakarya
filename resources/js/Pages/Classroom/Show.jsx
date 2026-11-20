import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Users, Trash2, Copy, Check, Plus, Palette } from 'lucide-react';
import Navbar from '@/Components/Wastrakarya/Navbar';
import Footer from '@/Components/Wastrakarya/Footer';
import DesignCard from '@/Components/Wastrakarya/DesignCard';
import ToastNotification from '@/Components/WastraCanvas/ToastNotification';
import useToast from '@/Components/WastraCanvas/hooks/useToast';

export default function Show({ classroom, isAdmin, members = [], drawings = [] }) {
    const { auth } = usePage().props;
    const [copied, setCopied] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmDeleteDrawing, setConfirmDeleteDrawing] = useState(null); // { id, title }
    const [isCreatingDrawing, setIsCreatingDrawing] = useState(false);
    const { toastMessage, toastType, showToast } = useToast();

    function getCsrfToken() {
        return document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1];
    }

    // Fungsi salin kode kelas ke clipboard
    function handleCopyCode() {
        navigator.clipboard.writeText(classroom.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    // Fungsi ubah nama desain kelas
    function handleRenameDrawing(drawingId, newTitle) {
        fetch(`/api/user-drawings/${drawingId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Accept': 'application/json',
                'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken() ?? '') 
            },
            body: JSON.stringify({ title: newTitle }),
        }).then((res) => {
            if (!res.ok) {
                showToast('Gagal mengubah nama desain.', 'error');
                return;
            }
            router.reload({ 
                only: ['drawings'],
                onSuccess: () => {
                    showToast('Nama desain berhasil diperbarui!', 'info');
                }
            });
        }).catch(() => {
            showToast('Terjadi kesalahan koneksi.', 'error');
        });
    }

    // Fungsi hapus karya kelas
    function handleDeleteDrawing(drawingId) {
        fetch(`/api/user-drawings/${drawingId}`, {
            method: 'DELETE',
            headers: { 
                'Accept': 'application/json',
                'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken() ?? '') 
            },
        }).then((res) => {
            setConfirmDeleteDrawing(null);
            if (!res.ok) {
                showToast('Gagal menghapus desain.', 'error');
                return;
            }
            router.reload({ 
                only: ['drawings'],
                onSuccess: () => {
                    showToast('Desain berhasil dihapus.', 'info');
                }
            });
        }).catch(() => {
            setConfirmDeleteDrawing(null);
            showToast('Terjadi kesalahan koneksi.', 'error');
        });
    }

    // Fungsi hapus kelas (Khusus Admin)
    function handleDeleteClass() {
        router.delete(`/classroom/${classroom.code}`, {
            onSuccess: () => {
                setConfirmDelete(false);
            },
        });
    }

    // Fungsi buat kanvas baru untuk kelas
    function handleCreateClassDrawing() {
        setIsCreatingDrawing(true);
        router.post(`/classroom/${classroom.code}/drawings`, {}, {
            onFinish: () => setIsCreatingDrawing(false),
        });
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-white">
            <ToastNotification message={toastMessage} type={toastType} />
            <Head title={`Kelas ${classroom.name}`} />
            <Navbar />

            <main className="flex-1 w-full px-28 mx-auto py-12 pt-[120px] flex flex-col gap-8">
                {/* Tombol Kembali ke Welcome */}
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors w-fit text-sm"
                >
                    <ArrowLeft size={18} />
                    <span>Kembali ke Beranda</span>
                </Link>

                {/* Header Kelas */}
                <div className="flex max-md:flex-col justify-between items-start md:items-center gap-4 bg-[#252627] p-8 rounded-2xl border border-white/5">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs uppercase tracking-wider text-primary font-bold">
                            Ruang Kelas
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold font-heading text-white">
                            {classroom.name}
                        </h1>
                        <p className="text-sm text-gray-400">
                            Dibuat oleh: <span className="text-white font-medium">{classroom.owner?.name || 'Admin'}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Box Kode Kelas */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 uppercase">Kode Kelas</span>
                                <span className="font-mono text-xl font-bold tracking-widest text-primary">
                                    {classroom.code}
                                </span>
                            </div>
                            <button
                                onClick={handleCopyCode}
                                title="Salin Kode"
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                            >
                                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                            </button>
                        </div>

                        {/* Tombol Hapus Kelas (Hanya untuk Admin/Pembuat) */}
                        {isAdmin && (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                                title="Hapus Kelas Ini"
                            >
                                <Trash2 size={16} />
                                <span className="max-md:hidden">Hapus Kelas</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bagian Konten: Karya Kelas (Kiri) & Anggota Kelas (Kanan) */}
                <div className="flex max-lg:flex-col gap-10 mt-4 justify-between items-start">
                    {/* Kolom Kiri: Karya Bersama Kelas */}
                    <div className="flex flex-1 flex-col gap-6 w-full">
                        <div className="flex max-sm:flex-col justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-2xl font-semibold text-primary">
                                    <Palette className="text-primary" size={24} />
                                    <h2>Karya Bersama ({drawings.length})</h2>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isCreatingDrawing}
                                onClick={handleCreateClassDrawing}
                                className="flex gap-2 justify-between items-center text-base bg-primary text-background hover:bg-transparent 
                                border-2 border-transparent hover:border-primary px-5 py-2.5 rounded-[12px] font-semibold 
                                transition-all duration-200 hover:text-primary disabled:opacity-50 shrink-0"
                            >
                                <Plus size={18} />
                                {isCreatingDrawing ? 'Membuat...' : 'Buat Desain Kelas'}
                            </button>
                        </div>

                        {drawings.length > 0 ? (
                            <div className="grid gap-4 w-full grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
                                {drawings.map((drawing) => {
                                    const canDelete = isAdmin || (auth?.user?.id && Number(drawing.user_id) === Number(auth.user.id));
                                    const canRename = isAdmin || (auth?.user?.id && Number(drawing.user_id) === Number(auth.user.id));

                                    return (
                                        <DesignCard
                                            key={drawing.id}
                                            title={drawing.title || drawing.motif || 'Desain Kelas'}
                                            lastEdited={drawing.updated_at ? `Diedit ${new Date(drawing.updated_at).toLocaleString('id-ID')}` : undefined}
                                            thumbnailUrl={drawing.data_url || null}
                                            onClick={() => router.visit(`/canvas/${drawing.id}`)}
                                            onRename={canRename ? (newTitle) => handleRenameDrawing(drawing.id, newTitle) : undefined}
                                            onDelete={canDelete ? () => setConfirmDeleteDrawing({ id: drawing.id, title: drawing.title || drawing.motif || 'Desain Kelas' }) : undefined}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-[#1e1f21] border border-dashed border-white/10 rounded-2xl gap-3">
                                <Palette size={40} className="text-primary/60" />
                                <h3 className="font-semibold text-lg text-white">Belum ada karya di kelas ini</h3>
                                <p className="text-gray-400 text-sm max-w-sm">
                                    Ayo mulai karya pertama kelas kamu! Klik tombol "Buat Desain Kelas" di atas untuk mulai mabar menggambar bersama.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Kolom Kanan: Daftar Anggota Kelas */}
                    <div className="flex flex-col gap-4 w-full lg:w-[360px] shrink-0">
                        <div className="flex items-center gap-2 text-xl font-semibold text-primary">
                            <Users size={22} />
                            <h2>Daftar Anggota ({members.length}/40)</h2>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
                            {members.map((member) => (
                                <div 
                                    key={member.id} 
                                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#1e1f21] border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-white text-lg truncate">{member.name}</span>
                                            <span className="text-sm text-gray-400 truncate">{member.email}</span>
                                        </div>
                                    </div>

                                    {member.id === classroom.user_id && (
                                        <span className="text-sm bg-primary text-background font-bold px-3 py-1 rounded shrink-0">
                                            Admin
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Konfirmasi Hapus Kelas */}
            {confirmDelete && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setConfirmDelete(false)}
                >
                    <div 
                        className="w-full max-w-sm rounded-2xl bg-[#1e1f21] p-6 shadow-2xl ring-1 ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="mb-2 text-2xl font-semibold text-white">Hapus Kelas Ini?</h3>
                        <p className="mb-6 text-lg text-gray-400">
                            Kelas <span className="font-medium text-white">"{classroom.name}"</span> beserta semua anggotanya akan dihapus permanen.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                className="rounded-lg px-4 py-2 text-md font-medium text-gray-300 hover:bg-white/10 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteClass}
                                className="rounded-lg bg-red-600 px-4 py-2 text-md font-semibold text-white hover:bg-red-700 transition-colors"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Desain Kelas */}
            {confirmDeleteDrawing && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setConfirmDeleteDrawing(null)}
                >
                    <div 
                        className="w-full max-w-sm rounded-2xl bg-[#1e1f21] p-6 shadow-2xl ring-1 ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="mb-2 text-xl font-semibold text-white">Hapus Desain Kelas?</h3>
                        <p className="mb-6 text-sm text-gray-400">
                            Desain <span className="font-medium text-white">"{confirmDeleteDrawing.title}"</span> akan dihapus permanen dari kelas dan tidak bisa dikembalikan.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDeleteDrawing(null)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteDrawing(confirmDeleteDrawing.id)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='flex flex-col w-full bg-background'>
                <img src="/ombak.svg" alt="" />
                <Footer />
            </div>
        </div>
    );
}