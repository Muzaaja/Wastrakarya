import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/Components/Wastrakarya/Navbar';
import Footer from '@/Components/Wastrakarya/Footer';

export default function Welcome() {
   return (
    <div className='flex flex-col gap-10 bg-background w-full items-center overflow-x-hidden'>
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

        <div className='flex flex-col w-full'>
            <img src="ombak.svg" alt="" />
            <Footer />
        </div>
        
    </div>
   )
}
