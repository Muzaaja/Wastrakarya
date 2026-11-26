import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="mb-6">
                <h2 className="text-lg font-semibold text-red-400">Hapus Akun</h2>
                <p className="mt-1 text-sm text-gray-400">
                    Setelah akun dihapus, semua data dan karya kamu akan hilang secara permanen.
                    Pastikan kamu sudah mengunduh data penting sebelum melanjutkan.
                </p>
            </header>

            <button
                type="button"
                onClick={confirmUserDeletion}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
                <Trash2 size={16} />
                Hapus Akun Saya
            </button>

            {confirmingUserDeletion && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-[#1e1f21] p-6 shadow-2xl ring-1 ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="mb-2 text-xl font-semibold text-white">Hapus Akun?</h3>
                        <p className="mb-4 text-sm text-gray-400">
                            Semua data dan karya kamu akan dihapus permanen. Masukkan kata sandi untuk konfirmasi.
                        </p>

                        <form onSubmit={deleteUser}>
                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Kata Sandi"
                                    className="text-primary font-medium"
                                />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1 block w-full"
                                    isFocused
                                    variant="underlined"
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    Ya, Hapus Akun
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
