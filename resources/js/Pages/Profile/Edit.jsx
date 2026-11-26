import { Head, Link } from '@inertiajs/react';
import Navbar from '@/Components/Wastrakarya/Navbar';
import Footer from '@/Components/Wastrakarya/Footer';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { ArrowLeft } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-white">
            <Head title="Profil Saya" />
            <Navbar />

            <main className="flex-1 w-full px-6 md:px-16 lg:px-28 mx-auto py-12 pt-[120px] flex flex-col gap-8">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors w-fit text-sm"
                >
                    <ArrowLeft size={18} />
                    <span>Kembali ke Beranda</span>
                </Link>

                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wider text-primary font-bold">Akun</span>
                    <h1 className="text-3xl md:text-4xl font-bold font-heading text-white">Profil Saya</h1>
                    <p className="text-gray-400 text-sm">Kelola informasi akun dan keamanan Anda.</p>
                </div>

                <div className="flex flex-col gap-6 w-full">
                    <div className="bg-[#252627] border border-white/5 rounded-2xl p-6 md:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </div>

                    <div className="bg-[#252627] border border-white/5 rounded-2xl p-6 md:p-8">
                        <UpdatePasswordForm />
                    </div>

                    <div className="bg-[#1e1f21] border border-red-500/20 rounded-2xl p-6 md:p-8">
                        <DeleteUserForm />
                    </div>
                </div>
            </main>

            <div className="flex flex-col w-full bg-background">
                <img src="/ombak.svg" alt="" />
                <Footer />
            </div>
        </div>
    );
}
