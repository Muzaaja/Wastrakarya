import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/Components/Wastrakarya/Navbar';
import Footer from '@/Components/Wastrakarya/Footer';
import JendelaMakna from '@/Components/Wastrakarya/JendelaMakna';
import { useState } from 'react';

export default function Welcome() {
   const [isModalOpen, setIsModalOpen] = useState(false);
   return (
    <div className='flex flex-col bg-background w-full items-center overflow-x-hidden'>
        <Navbar />
        <section className='flex flex-col gap-10 min-h-screen items-center justify-center max-w-[1000px] max-lg:px-8'>
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
                <Link href="/login" 
                    className="text-xl max-md:text-lg border-2 text-primary border-primary px-6 py-3.5 rounded-[12px] font-semibold hover:bg-primary 
                    hover:text-background duration-200 transition-all">
                    Lihat Selengkapnya  
                </Link>
            </div>
        </section>

        <section className='w-full flex flex-col'>
            <img src="ombak-section-wastracanvas.svg" alt="" />
            <div className='flex max-md:flex-col bg-[#313B34] gap-10 min-h-screen w-full px-[120px] max-md:px-6 items-center'>
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
                        Nusantara secara presisi, dan seru.
                    </p>

                    <div className='flex mt-6'>
                        <Link href="/login" 
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
            <div className='flex bg-[#30543C] min-h-screen w-full px-[120px] max-md:px-6 items-center'>
                <div className='max-md:hidden flex-1 flex justify-start'>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-primary text-background font-semibold rounded-xl hover:opacity-90 transition-all"
                    >
                        Lihat Jendela Makna (Filosofi Canting)
                    </button>
                    
                    <JendelaMakna 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                </div>

                <div className='flex flex-1 flex-col gap-4 items-end'>
                    <h2 className='font-heading font-bold text-8xl max-md:text-6xl text-end text-primary'>
                        Simulasi Mahakarya <br /> <i>(3D Mockup)</i>
                    </h2>
                    <p className='text-white/90 text-2xl max-md:text-lg text-end max-w-[500px] mt-2'>
                        Proyeksikan hasil karya batik Anda menjadi visualisasi mockup tekstil 3D secara interaktif.
                    </p>

                    <div className='flex mt-6'>
                        <Link href="/login" 
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
            <div className='flex max-md:flex-col bg-[#23713D] gap-10 min-h-screen w-full px-[120px] max-md:px-6 items-center'>
                <div className='flex flex-1 flex-col gap-4 justify-center'>
                    <h2 className='font-heading font-bold text-8xl max-md:text-6xl text-primary'>
                        Jendela Makna
                    </h2>
                    <p className='text-white/90 text-2xl max-md:text-lg'>
                        Menghadirkan edukasi filosofi interaktif, di mana kartu pop-up estetik menampilkan asal-usul, sejarah, dan makna mendalam di balik setiap motif batik di kanvas.
                    </p>

                    <div className='flex mt-6'>
                        <Link href="/login" 
                            className="flex gap-2 justify-between items-center text-xl max-md:text-lg bg-primary text-background hover:bg-transparent 
                            border-2 border-transparent hover:border-primary px-6 py-3.5 rounded-[12px] font-semibold 
                            transition-all duration-200 hover:text-primary">
                            Coba Sekarang
                            <ArrowRight />
                        </Link>
                    </div>
                </div>

                <div className='max-md:hidden flex-1 justify-end flex'>
                    <img src="jendela-section.svg" alt="" 
                        className='w-[90%]'/>
                </div>
            </div>
        </section>

        <div className='flex flex-col w-full bg-[#23713D]'>
            <img src="ombak.svg" alt="" />
            <Footer />
        </div>
    </div>
   )
}
