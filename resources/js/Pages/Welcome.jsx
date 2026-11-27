import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Plus, ArrowDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import Navbar from '@/Components/Wastrakarya/Navbar';
import Footer from '@/Components/Wastrakarya/Footer';
import DesignCard from '@/Components/Wastrakarya/DesignCard';
import ToastNotification from '@/Components/WastraCanvas/ToastNotification';
import useToast from '@/Components/WastraCanvas/hooks/useToast';

const featureItems = [
    {
        badge: '01 • Studio',
        title: 'WastraCanvas',
        description: 'Canting digital & kolaborasi real-time.',
        cta: 'BUKA STUDIO',
        href: '/login',
        image: '/wastracanvas.png',
    },
    {
        badge: '02 • Arsip',
        title: 'Jendela Makna',
        description: 'Filosofi dan asal-usul setiap pakem batik.',
        cta: 'TELUSURI PAKEM',
        href: '/login',
        image: 'https://images.unsplash.com/photo-1680345575909-99633d4b6f46?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
    },
    {
        badge: '03 • Rendering',
        title: 'Simulasi 3D',
        description: 'Pratinjau motif langsung pada busana 3D interaktif.',
        cta: 'SIMULASI POLA',
        href: '/login',
        image: '/mockup.jpg',
    },
    {
        badge: '04 • Komunitas',
        title: 'Ruang Kelas',
        description: 'Belajar dan berkarya bersama dalam satu ruang.',
        cta: 'IKUTI KELAS',
        href: '/login',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    },
];

const jendelaMaknaItems = [
    {
        title: 'Kawung',
        href: '/login',
        image: '/jendela-section.svg',
    },
    {
        title: 'Parang Rusak',
        href: '/login',
        image: '/mockup-3d-motif-acakadut-2-sutra.png',
    },
    {
        title: 'Ceplok Grompol',
        href: '/login',
        image: '/wastracanvas-section.svg',
    },
    {
        title: 'Truntum',
        href: '/login',
        image: '/megamendung.svg',
    },
    {
        title: 'Sido Mukti',
        href: '/login',
        image: '/mockup-section.svg',
    },
];

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
   const jendelaScrollRef = useRef(null);

   function scrollJendela(direction) {
       if (!jendelaScrollRef.current) return;
       jendelaScrollRef.current.scrollBy({
           left: direction === 'left' ? -310 : 310,
           behavior: 'smooth',
       });
   }

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

    router.post('classrooms', { name: newClassName }, {
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
    <div className='flex flex-col bg-background w-full items-start overflow-x-hidden'>
        <ToastNotification message={toastMessage} type={toastType} />
        <Navbar />
        {!isLoggedIn ? (
            <>
                {/* Hero Section */}
                <section className='flex flex-col gap-5 min-h-screen items-start justify-end w-full max-lg:px-8 p-20 relative'>
                    <img
                        src="/hero.webp"
                        alt="Hero Wastrakarya"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/30 z-0" />

                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30 z-10" />
                    {/* <img src="megamendung.svg" alt="" className='size-[1000px] absolute -top-[200px] -left-[900px] z-0'/> */}
                    {/* <img src="megamendung.svg" alt="" className='size-[1000px] absolute -bottom-[200px] -right-[850px] z-0'/> */}

                    <div className='flex flex-col gap-6 max-w-[600px]'>
                        <h1 className='text-primary text-7xl max-lg:text-6xl max-md:text-[56px] leading-[80px] font-heading font-bold justify-center z-10'>
                            <span className='text-white'>Setiap Goresan</span> Punya Makna.
                        </h1>

                        <p className='text-white/60 text-xl max-lg:text-xl max-md:text-[15px] mb-4 z-10'>
                            Platform digital pelestarian batik Nusantara — memadukan tradisi canting leluhur dengan kanvas kolaboratif masa depan.
                        </p>

                        <div className='flex max-md:flex-col max-md:w-full max-md:gap-3 gap-6 z-10'>
                            <Link href="/login" 
                                className="flex gap-2 justify-between items-center text-lg max-md:text-lg bg-primary text-background hover:bg-transparent 
                                border-2 border-transparent hover:border-primary px-6 py-3.5 rounded-[12px] font-semibold 
                                transition-all duration-200 hover:text-primary">
                                Coba Sekarang
                                <ArrowRight />
                            </Link>
                            <a href="#wastracanvas" 
                                className="text-lg flex items-center gap-2 max-md:text-lg border text-primary border-primary px-6 py-3.5 rounded-[12px] font-semibold hover:bg-primary 
                                hover:text-background duration-200 transition-all">
                                Lihat Selengkapnya
                                <ArrowDown />
                            </a>
                        </div>
                    </div>
                </section>

                {/* Fitur-Fitur Wastrakarya */}
                <section id="wastracanvas" className='w-full flex flex-col'>
                    <div className='h-px w-screen bg-primary/20'></div>
                    <div className='flex flex-col gap-20 w-full p-20 max-md:px-6 max-md:py-16 items-center'>
                        <div className='flex max-md:flex-col gap-4 justify-between items-end max-md:items-start w-full'>
                            <h2 className='font-heading font-bold text-5xl max-md:text-4xl text-primary'>
                                Kreativitas Berakar Tradisi
                            </h2>
                            <p className='text-white/60 text-lg text-end max-md:text-start max-w-[400px]'>
                                Alat bantu yang dirancang untuk desainer, pendidik, dan pegiat wastra masa kini.
                            </p>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full'>
                            {featureItems.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    className='group bg-[#0B1612] border border-white/10 hover:border-primary/40 rounded-2xl overflow-hidden flex flex-col transition-all duration-300'
                                >
                                    <div className='relative h-52 w-full overflow-hidden bg-black/40'>
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                                        />
                                        <div className='absolute inset-0 bg-gradient-to-t from-[#0B1612] via-transparent to-black/30' />
                                        <span className='absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-sm text-primary text-xs font-medium px-3 py-1 rounded-full border border-white/10'>
                                            {item.badge}
                                        </span>
                                    </div>

                                    <div className='p-6 flex flex-col flex-1 justify-between gap-6'>
                                        <div>
                                            <h3 className='font-heading font-bold text-2xl text-white group-hover:text-primary transition-colors'>
                                                {item.title}
                                            </h3>
                                            <p className='text-white/60 text-sm leading-relaxed mt-2'>
                                                {item.description}
                                            </p>
                                        </div>

                                        <div className='flex items-center justify-between text-xs font-semibold tracking-wider text-primary uppercase pt-4 border-t border-white/5'>
                                            <span>{item.cta}</span>
                                            <ArrowRight className='w-4 h-4 transition-transform duration-300 group-hover:translate-x-1' />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className='w-full flex flex-col'>
                    <div className='h-px w-screen bg-primary/20'></div>
                    <div className='flex flex-col gap-20 w-full p-20 max-md:px-6 max-md:py-16 items-center'>
                        <div className='flex flex-col gap-4 justify-between items-start w-full'>
                                <span className='flex gap-5 font-semibold text-md text-primary tracking-widest items-center'>
                                    <div className='bg-primary p-1 w-fit h-fit rounded-xl'></div>
                                    KATALOG FILOSOFI
                                </span>
                            <h2 className='font-heading font-bold text-5xl max-md:text-4xl text-primary'>
                                Jendela Makna
                            </h2>
                            <p className='text-white/60 text-lg text-start'>
                                Pilih kartu motif untuk membuka telaah mendalam informasi setiap motif.
                            </p>
                        </div>

                        <div className='relative w-full'>
                            <div className='pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10' />
                            <div className='pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10' />

                            <button
                                type='button'
                                onClick={() => scrollJendela('left')}
                                aria-label='Geser ke kiri'
                                className='absolute left-2 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/70 backdrop-blur-sm border border-primary/40 text-primary hover:bg-primary hover:text-background flex items-center justify-center transition-colors shadow-lg'
                            >
                                <ChevronLeft className='w-5 h-5' />
                            </button>

                            <button
                                type='button'
                                onClick={() => scrollJendela('right')}
                                aria-label='Geser ke kanan'
                                className='absolute right-2 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-black/70 backdrop-blur-sm border border-primary/40 text-primary hover:bg-primary hover:text-background flex items-center justify-center transition-colors shadow-lg'
                            >
                                <ChevronRight className='w-5 h-5' />
                            </button>

                            <div
                                ref={jendelaScrollRef}
                                className='flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4 snap-x snap-mandatory scroll-smooth'
                            >
                                {jendelaMaknaItems.map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        className='group relative shrink-0 w-[260px] sm:w-[290px] aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 bg-[#0B1612] snap-start transition-all duration-300'
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                                        />
                                        <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent' />
                                        <div className='absolute inset-x-0 bottom-0 p-5 flex items-center justify-between gap-3'>
                                            <h3 className='font-heading font-bold text-2xl text-primary group-hover:text-white transition-colors'>
                                                {item.title}
                                            </h3>
                                            <span className='size-9 rounded-full bg-black/60 backdrop-blur-sm border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-colors shrink-0'>
                                                <Eye className='w-4 h-4' />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className='relative w-full h-fit max-h-screen items-center justify-center flex flex-col bg-background overflow-hidden'>
                    <img src="megamendung.svg" alt="" className='size-[1000px] absolute -top-[200px] -left-[600px] z-0 pointer-events-none'/>
                    <img src="megamendung.svg" alt="" className='size-[1000px] absolute -bottom-[200px] -right-[600px] z-0 pointer-events-none'/>
                    <div className='relative z-10 min-h-[75vh] w-full px-20 py-24 max-md:px-6 max-md:py-16 items-center justify-center flex flex-col gap-10'>
                        <h3 className='font-heading text-6xl max-md:text-4xl leading-tight font-normal text-white max-w-[800px] text-center'>
                            <span className='text-primary'>“Merawat warisan leluhur,</span> menghidupkannya lewat inovasi.”
                        </h3>
                        <div className='h-px max-w-[100px] w-full bg-primary/60'></div>
                        <div className='flex flex-col items-center gap-5 w-full max-w-md'>
                            <p className='font-heading text-white text-2xl max-md:text-xl text-center'>
                                Bermitra dengan Wastrakarya
                            </p>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    showToast('Terima kasih! Email Anda telah kami catat.', 'success');
                                    e.currentTarget.reset();
                                }}
                                className='flex max-sm:flex-col gap-2 w-full'
                            >
                                <input
                                    type='email'
                                    required
                                    placeholder='Masukkan email Anda'
                                    className='flex-1 rounded-lg bg-transparent px-4 py-3 text-white/90 placeholder:text-white/40 border border-white/20 focus:border-primary focus:ring-1 focus:ring-primary text-md outline-none transition-colors'
                                />
                                <button
                                    type='submit'
                                    className='flex gap-2 justify-center items-center text-lg bg-primary text-background hover:bg-transparent border-2 border-transparent hover:border-primary px-6 py-3 rounded-[12px] font-semibold transition-all duration-200 hover:text-primary shrink-0'
                                >
                                    Kirim
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                <div className='flex flex-col w-full bg-background'>
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
