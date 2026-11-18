import { Head, Link, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Brush,
    LockKeyhole,
    LogIn,
    Plus,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

export default function CanvasForbidden({ message }) {
    const { auth } = usePage().props;
    const isLoggedIn = Boolean(auth?.user);

    return (
        <>
            <Head title="Akses Kanvas Ditolak" />

            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-28 text-white sm:px-8 lg:px-12">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(238,199,78,0.13),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(35,113,61,0.32),transparent_38%)]"
                />
                <img
                    src="/megamendung.svg"
                    alt=""
                    className="pointer-events-none absolute -left-[360px] -top-[170px] w-[820px] opacity-60"
                />
                <img
                    src="/megamendung.svg"
                    alt=""
                    className="pointer-events-none absolute -bottom-[190px] -right-[390px] w-[900px] rotate-180 opacity-50"
                />

                <section className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[32px] border border-[#CDB988]/20 bg-[#091611]/90 shadow-[0_32px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

                    <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-14">
                        <div className="flex flex-col justify-center gap-7">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                                    <LockKeyhole size={16} aria-hidden="true" />
                                    Akses dibatasi
                                </span>
                            </div>

                            <div className="flex flex-col gap-4">
                                <p className="font-heading text-xl italic text-[#CDB988]">
                                    Setiap karya punya ruang yang perlu dijaga.
                                </p>
                                <h1 className="max-w-2xl font-heading text-5xl font-bold leading-[0.98] text-[#F7EFD9] sm:text-6xl lg:text-7xl">
                                    Kanvas ini belum bisa Anda buka.
                                </h1>
                                <p className="max-w-xl text-base leading-7 text-white/70 sm:text-lg">
                                    {message}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-semibold text-background transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#091611]"
                                >
                                    <ArrowLeft size={19} aria-hidden="true" />
                                    Kembali ke Beranda
                                </Link>
                                <Link
                                    href={isLoggedIn ? "/canvas" : "/login"}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#CDB988]/35 bg-[#CDB988]/5 px-5 py-3.5 font-semibold text-[#E8D9B9] transition-colors hover:border-primary/70 hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#091611]"
                                >
                                    {isLoggedIn ? (
                                        <Plus size={19} aria-hidden="true" />
                                    ) : (
                                        <LogIn size={19} aria-hidden="true" />
                                    )}
                                    {isLoggedIn
                                        ? "Buat Kanvas Baru"
                                        : "Masuk ke Akun"}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
