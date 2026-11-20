import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Plus } from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/Components/Wastrakarya/Navbar';
import Footer from '@/Components/Wastrakarya/Footer';
import DesignCard from '@/Components/Wastrakarya/DesignCard';
import Shirt3DViewer from '@/Components/WastraMockup/Shirt3DViewer';
import ToastNotification from '@/Components/WastraCanvas/ToastNotification';
import useToast from '@/Components/WastraCanvas/hooks/useToast';
import { error } from 'three';

export default function Welcome({ drawings = [], classrooms = [] }) {
   const { auth } = usePage().props;
   const isLoggedIn = !!auth.user;

   const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }
   const [activeTab, setActiveTab] = useState('personal');

   const [classCode, setClassCode] = useState('');
   const [isJoining, setIsJoining] = useState(false);
   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [newClassName, setNewClassName] = useState('');
   const [isCreating, setIsCreating] = useState(false);
   const { toastMessage, toastType, showToast } = useToast();

   function getCsrfToken() {
       return document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1];
   }

   function handleRename(drawingId, newTitle) {
       fetch(`/api/user-drawings/${drawingId}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken() ?? '') },
           body: JSON.stringify({ title: newTitle }),
       }).then(() => router.reload({ only: ['drawings'] }));
   }

   function handleDelete(drawingId) {
       fetch(`/api/user-drawings/${drawingId}`, {
           method: 'DELETE',
           headers: { 'X-XSRF-TOKEN': decodeURIComponent(getCsrfToken() ?? '') },
       }).then(() => {
           setConfirmDelete(null);
           router.reload({ only: ['drawings'] });
       });
   }
   
   function handleJoinClass(e) {
    e.preventDefault();
    if (!classCode.trim()) return;

    setIsJoining(true);

    router.post('/classrooms/join', { code: classCode }, {
        preserveScroll: true,
        onError: (errors) => {
            showToast(errors.code || 'Kode kelas tidak valid.', 'error');
        },
        onSuccess: () => {
            setClassCode('');
            showToast('Berhasil bergabung ke kelas!', 'info');
        },
        onFinish: () => {
            setIsJoining(false);
        },
    });
   }

   function handleCreateClass(e) {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setIsCreating(true);

    router.post('classrooms', { name: newClassName}, {
        preserveScroll:true,
        onSuccess: () => {
            setNewClassName('');
            setIsCreateModalOpen(false);
            showToast('Kelas berhasil dibuat!', 'info');
        },
        onError: (errors) => {
            showToast(errors.name || 'Gagal membuat kelas.', 'error');
        },
        onFinish: () => {
            setIsCreating(false);
        },
    });
   }

   const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
        return `Selamat Pagi`;
    } else if (hour >= 11 && hour < 15) {
        return `Selamat Siang`;
    } else if (hour >= 15 && hour < 18) {
        return `Selamat Sore`;
    } else  {
        return `Selamat Malam`;
    }
   }

   return (
    <div className='flex flex-col bg-background w-full items-center overflow-x-hidden'>
        <ToastNotification message={toastMessage} type={toastType} />
        <Navbar />
        {!isLoggedIn ? (
            <>
                <section className='flex flex-col gap-10 min-h-screen items-center justify-center max-w-[1000px] max-lg:px-8 relative'>
                    <img src="megamendung.svg" alt="" className='size-[1000px] absolute -top-[200px] -left-[900px] z-0'/>
                    <img src="megamendung.svg" alt="" className='size-[1000px] absolute -bottom-[200px] -right-[850px] z-0'/>

                    <h1 className='text-primary text-8xl max-lg:text-6xl max-md:text-[56px] leading-[100px] font-heading font-bold justify-center text-center z-10'>
                        Platform Pembelajaran Batik Digital Interaktif
                    </h1>
                    <p className='text-white/85 text-2xl max-lg:text-xl max-md:text-[15px] text-center'>
                        Belajar sambil mencipta. Eksplorasi keindahan filosofi batik Nusantara melalui ruang kreasi digital yang mudah dan seru tanpa hambatan fasilitas.
                    </p>
                    <div className='flex max-md:flex-col max-md:w-full max-md:gap-3 gap-6'>
                        <Link href="/login" 
                            className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                            border-2 border-transparent hover:border-primary px-6 py-3.5 rounded-[12px] font-semibold 
                            transition-all duration-200 hover:text-primary">
                            Coba Sekarang
                            <ArrowRight />
                        </Link>
                        <a href="#wastracanvas" 
                            className="text-xl max-md:text-lg border-2 text-primary border-primary px-6 py-3.5 rounded-[12px] font-semibold hover:bg-primary 
                            hover:text-background duration-200 transition-all">
                            Lihat Selengkapnya  
                        </a>
                    </div>
                </section>

                <section id="wastracanvas" className='w-full flex flex-col'>
                    <img src="ombak-section-wastracanvas.svg" alt="" />
                    <div className='flex max-md:flex-col bg-[#313B34] gap-10 min-h-[80vh] w-full px-[120px] max-md:px-6 items-center'>
                        <div className='flex flex-1 flex-col gap-4 justify-center'>
                            <h2 className='font-heading font-bold text-8xl max-md:text-6xl max-md:hidden text-primary'>
                                WastraCanvas
                            </h2>
                            <h2 className='font-heading font-bold text-8xl max-md:text-6xl max-md:block hidden text-primary'>
                                Wastra<br />Canvas
                            </h2>
                            <p className='text-white/90 text-2xl max-md:text-lg'>
                                Ruang kreasi batik digital intuitif dengan fitur drag-and-drop motif dan canting digital
                                yang memudahkan siapa saja merancang susunan pola batik 
                                Nusantara.
                            </p>

                            <div className='flex mt-6'>
                                <Link href="/canvas" 
                                    className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                                    border-2 border-transparent hover:border-primary px-6 py-3.5 rounded-[12px] font-semibold 
                                    transition-all duration-200 hover:text-primary">
                                    Coba Sekarang
                                    <ArrowRight />
                                </Link>
                            </div>
                        </div>

                        <div className='max-md:hidden flex-1 justify-end flex'>
                            <img src="wastracanvas-section.svg" alt="" 
                                className='w-[80%]'/>
                        </div>
                    </div>
                </section>

                <section className='w-full flex flex-col bg-[#313B34]'>
                    <img src="ombak-section-mockup.svg" alt="" />
                    <div className='flex max-md:flex-col bg-[#30543C] min-h-[80vh] w-full px-[100px] justify-between max-md:px-6 items-center gap-10 py-12'>
                        <div className='flex-1 max-md:hidden w-full h-[520px] flex items-center justify-center'>
                            <Shirt3DViewer />
                        </div>

                        <div className='flex flex-1 flex-col gap-4 pr-[30px] max-md:pr-0 items-end max-md:items-center max-md:justify-center'>
                            <h2 className='font-heading font-bold text-8xl max-md:text-6xl text-end max-md:text-center text-primary'>
                                Simulasi Mahakarya <br /> <i>(3D Mockup)</i>
                            </h2>
                            <p className='text-white/90 text-2xl max-md:text-lg text-end max-md:text-center max-w-[500px] mt-2'>
                                Proyeksikan hasil karya batik Anda menjadi visualisasi mockup tekstil 3D secara interaktif.
                            </p>

                            <div className='flex mt-6'>
                                <Link href="/mockup" 
                                    className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                                    border-2 border-transparent hover:border-primary px-6 py-3.5 rounded-[12px] font-semibold 
                                    transition-all duration-200 hover:text-primary">
                                    Coba Sekarang
                                    <ArrowRight />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='w-full flex flex-col bg-[#30543C]'>
                    <img src="ombak-section-jendela.svg" alt="" />
                    <div className='flex max-md:flex-col bg-[#23713D] gap-10 min-h-[80vh] w-full px-[120px] max-md:px-6 items-center'>
                        <div className='flex flex-1 flex-col gap-4 justify-center'>
                            <h2 className='font-heading font-bold text-8xl max-md:text-6xl text-primary'>
                                Jendela Makna
                            </h2>
                            <p className='text-white/90 text-2xl max-md:text-lg'>
                                Menghadirkan edukasi filosofi interaktif, di mana kartu pop-up estetik menampilkan asal-usul, sejarah, dan makna mendalam di balik setiap motif batik di kanvas.
                            </p>

                            <div className='flex mt-6'>
                                <Link href="/canvas" 
                                    className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                                    border-2 border-transparent hover:border-primary px-6 py-3.5 rounded-[12px] font-semibold 
                                    transition-all duration-200 hover:text-primary">
                                    Coba Sekarang
                                    <ArrowRight />
                                </Link>
                            </div>
                        </div>

                        <div className='max-lg:hidden flex-1 justify-end flex'>
                            <img src="jendela-section.svg" alt="" 
                                className='w-[90%]'/>
                        </div>
                    </div>
                </section>

                <div className='flex flex-col w-full bg-[#23713D]'>
                    <img src="ombak.svg" alt="" />
                    <Footer />
                </div>
            </>
        ) : (
            <>
                <section className='flex flex-col gap-10 min-h-screen py-[140px] max-md:py-[100px] justify-start px-[85px] max-md:px-6 w-full'>
                    <div className='flex max-md:flex-col justify-center text-center max-md:gap-10 gap-9 w-full'>
                        <div className='flex flex-col gap-4'>
                            <h1 className='text-primary text-7xl text-center max-md:text-[50px] max-md:leading-[60px] leading-[70px] font-heading font-semibold'>
                                {getGreeting()}, {auth.user.name}!
                            </h1>
                            <p className='text-white/80 text-[24px] max-md:text-[18px]'>Mau desain apa hari ini?</p>
                            <div className='flex gap-3 w-full items-center justify-center mt-3'>
                                <button 
                                    type='button'
                                    onClick={() => setActiveTab('personal')}
                                    className={`${activeTab == 'personal' 
                                        ? 'bg-primary text-background hover:bg-transparent border-2 border-transparent hover:border-primary hover:text-primary' :
                                        'hover:bg-primary hover:text-background border-2 border-primary text-primary'} flex gap-2 justify-between px-4 items-center text-lg max-md:text-[16px] max-md:px-3 max-md:py-2 py-2.5 rounded-[12px] font-semibold transition-all duration-200`}>
                                    Desain Anda
                                </button>  

                                <button 
                                    type='button'
                                    onClick={() => setActiveTab('classroom')} 
                                    className={`${activeTab == 'classroom' 
                                        ? 'bg-primary text-background hover:bg-transparent border-2 border-transparent hover:border-primary hover:text-primary' :
                                        'hover:bg-primary hover:text-background border-2 border-primary text-primary'} flex gap-2 justify-between px-4 items-center text-lg max-md:text-[16px] max-md:px-3 max-md:py-2 py-2.5 rounded-[12px] font-semibold transition-all duration-200`}>
                                    Ruang Kelas
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTab == 'personal' ? (
                        <>
                        <div className='flex max-md:flex-col w-full items-start gap-6 max-md:items-center mt-8 justify-between'>
                            <span className='font-semibold text-primary text-3xl'>
                                Lanjutkan Mendesain
                            </span>
                            <div className='w-fit'>
                                <Link href="/canvas" 
                                    className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                                    border-2 border-transparent hover:border-primary px-6 max-md:px-4 max-md:py-2.5 py-3.5 rounded-[12px] font-semibold 
                                    transition-all duration-200 hover:text-primary">
                                    <Plus />
                                    Buat Desain Baru
                                </Link>
                            </div>
                        </div>
                        {drawings.length > 0 ? (
                            <div className='grid gap-4 w-full grid-cols-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1'>
                                {drawings.map((drawing) => (
                                    <DesignCard
                                        key={drawing.id}
                                        title={drawing.title || drawing.motif || 'Desain Wastrakarya'}
                                        lastEdited={drawing.updated_at ? `Diedit ${new Date(drawing.updated_at).toLocaleString('id-ID')}` : undefined}
                                        thumbnailUrl={drawing.data_url || null}
                                        onClick={() => router.visit(`/canvas/${drawing.id}`)}
                                        onRename={(newTitle) => handleRename(drawing.id, newTitle)}
                                        onDelete={() => setConfirmDelete({ id: drawing.id, title: drawing.title || drawing.motif || 'Desain Wastrakarya' })}
                                    />
                                ))}
                            </div>
                            ) : (
                                <p className='text-white/70 text-lg w-full text-center'>Belum ada desain tersimpan.</p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className='flex max-md:flex-col w-full items-start gap-6 max-md:items-center mt-8 justify-between'>
                                <span className='font-semibold text-primary text-3xl'>
                                    Ruang Kelas Anda
                                </span>
                                <div className='w-fit flex gap-4 items-center'>
                                    <form onSubmit={handleJoinClass} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Masukkan Kode Kelas"
                                            value={classCode}
                                            disabled={isJoining}
                                            onChange={(e) => setClassCode(e.target.value)}
                                            className="rounded-lg bg-transparent px-4 py-2 text-white/90 border border-white/20 focus:border-primary focus:ring-1 focus:ring-primary uppercase text-md outline-none transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isJoining || !classCode.trim()}
                                            className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                                            border-2 border-transparent hover:border-primary px-6 max-md:px-4 max-md:py-2.5 py-3.5 rounded-[12px] font-semibold 
                                            transition-all duration-200 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isJoining ? 'Memeriksa...' : 'Gabung'}
                                        </button>
                                    </form>

                                    <span className='text-white/70 text-lg'>atau</span>

                                    <button type='button'
                                        onClick={() => setIsCreateModalOpen(true)} 
                                        className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                                        border-2 border-transparent hover:border-primary px-6 max-md:px-4 max-md:py-2.5 py-3.5 rounded-[12px] font-semibold 
                                        transition-all duration-200 hover:text-primary">
                                        <Plus />
                                        Buat Kelas
                                    </button>
                                </div>
                            </div>

                            {classrooms.length > 0 ? (
                                <div className="grid grid-cols-3 gap-4">
                                    {classrooms.map((cls) => (
                                        <Link key={cls.id} 
                                        href={`/classroom/${cls.code}`}
                                        className="p-6 rounded-xl bg-[#252627] text-white flex flex-col gap-2 border-2 border-transparent hover:border-primary duration-200 transition-all">
                                            <h4 className="font-semibold text-xl">{cls.name}</h4>
                                            <span className="text-md text-primary bg-primary/10 w-fit px-2 py-1 rounded">
                                                Kode: {cls.code}
                                            </span>
                                        </Link>
                            ))}
                                </div>
                            ) : (
                                <p className="text-white/80 text-lg text-center py-8">Kamu belum bergabung ke kelas manapun.</p>
                            )}
                        </>
                    )}
                </section>

                <div className='flex flex-col w-full bg-background'>
                    <img src="ombak.svg" alt="" />
                    <Footer />
                </div>

                {/* Modal Buat Kelas Baru */}
                {isCreateModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <div
                            className="w-full max-w-md rounded-2xl bg-[#1e1f21] p-6 shadow-2xl ring-1 ring-white/10"
                            onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat diklik di dalam kotak
                        >
                            <h3 className="mb-2 text-xl font-semibold text-white">Buat Kelas Baru</h3>
                            <p className="mb-4 text-md text-gray-400">
                                Masukkan nama kelas untuk mulai mengajak siswa atau rekan belajar mendesain bersama.
                            </p>
                            <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
                                <div>
                                    <label className="text-lg text-gray-300 font-medium mb-1 block">
                                        Nama Kelas
                                    </label>
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Contoh: Batik Nusantara XII-RPL"
                                        value={newClassName}
                                        disabled={isCreating}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary text-lg"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="rounded-lg px-4 py-2 text-lg font-medium text-gray-300 transition-colors hover:bg-white/10"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating || !newClassName.trim()}
                                        className="rounded-lg bg-primary px-5 py-2 text-lg font-semibold text-background transition-colors hover:opacity-90 disabled:opacity-50"
                                    >
                                        {isCreating ? 'Menyimpan...' : 'Buat Kelas'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {confirmDelete && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setConfirmDelete(null)}
                    >
                        <div
                            className="w-full max-w-sm rounded-2xl bg-[#1e1f21] p-6 shadow-2xl ring-1 ring-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="mb-2 text-lg font-semibold text-white">Hapus Desain?</h3>
                            <p className="mb-6 text-sm text-gray-400">
                                Desain <span className="font-medium text-white">"{confirmDelete.title}"</span> akan dihapus permanen dan tidak bisa dikembalikan.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(null)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(confirmDelete.id)}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}
        
    </div>
   )
}
