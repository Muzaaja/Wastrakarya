import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Plus } from 'lucide-react';
import Navbar from '@/Components/Wastrakarya/Navbar';
import Footer from '@/Components/Wastrakarya/Footer';
import DesignCard from '@/Components/Wastrakarya/DesignCard';

export default function Welcome() {
   const { auth } = usePage().props;
   const isLoggedIn = !!auth.user;

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
        <Navbar />
        {!isLoggedIn ? (
            <>
                <section className='flex flex-col gap-10 min-h-screen items-center justify-center max-w-[1000px] max-lg:px-8 relative'>
                    <img src="megamendung.svg" alt="" className='size-[1000px] absolute -top-[200px] -left-[900px] z-0'/>
                    <img src="megamendung.svg" alt="" className='size-[1000px] absolute -bottom-[200px] -right-[850px] z-0'/>

                    <h1 className='text-primary text-8xl max-lg:text-6xl max-md:text-[56px] leading-[100px] font-heading font-bold justify-center text-center'>
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
                    <div className='flex bg-[#30543C] min-h-[80vh] w-full px-[120px] max-md:px-6 items-center'>
                        <div className='max-md:hidden flex-1 flex justify-start'>
                            {/* <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-primary text-background font-semibold rounded-xl hover:opacity-90 transition-all"
                            >
                                Lihat Jendela Makna (Filosofi Canting)
                            </button>
                            
                            <JendelaMakna 
                                isOpen={isModalOpen} 
                                onClose={() => setIsModalOpen(false)} 
                            /> */}
                        </div>

                        <div className='flex flex-1 flex-col gap-4 items-end'>
                            <h2 className='font-heading font-bold text-8xl max-md:text-6xl text-end text-primary'>
                                Simulasi Mahakarya <br /> <i>(3D Mockup)</i>
                            </h2>
                            <p className='text-white/90 text-2xl max-md:text-lg text-end max-w-[500px] mt-2'>
                                Proyeksikan hasil karya batik Anda menjadi visualisasi mockup tekstil 3D secara interaktif.
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
                            <h1 className='text-primary text-7xl max-md:text-[50px] max-md:leading-[60px] leading-[70px] font-heading text-start font-semibold'>
                                {getGreeting()}, {auth.user.name}!
                            </h1>
                            <p className='text-white/80 text-[24px] max-md:text-[18px]'>Mau desain apa hari ini?</p>
                        </div>
                    </div>
                    <div className='flex max-md:flex-col justify-between items-center text-center max-md:gap-10 gap-9 w-full'>
                        <span className='font-semibold text-primary text-3xl'>Lanjutkan Mendesain</span>
                        <Link href="/wastracanvas" 
                            className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                            border-2 border-transparent hover:border-primary px-6 max-md:px-4 max-md:py-2.5 py-3.5 rounded-[12px] font-semibold 
                            transition-all duration-200 hover:text-primary">
                            <Plus />
                            Buat Desain Baru
                        </Link>
                    </div>
                    
                    <div className='grid gap-6 w-full grid-cols-4 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1'>
                        <DesignCard />
                        <DesignCard />
                        <DesignCard />
                        <DesignCard />
                        <DesignCard />
                        <DesignCard />
                    </div>
                </section>
            </>
        )}
        
    </div>
   )
}
