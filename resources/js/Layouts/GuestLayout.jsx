import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex items-center justify-center bg-background min-h-screen px-6 py-[100px] overflow-hidden">
            <img src="/megamendung.svg" alt="" className='size-[1000px] absolute -top-[240px] -left-[550px] z-0 pointer-events-none'/>
            <img src="/megamendung.svg" alt="" className='size-[1000px] absolute -bottom-[400px] -right-[400px] z-0 pointer-events-none'/>

            <div className="z-10 flex flex-col md:flex-row items-center bg-primary/5 backdrop-blur-md border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full">
                <div className="flex flex-col items-center justify-center p-8 md:p-12 md:w-1/2 border-b md:border-b-0 md:border-r border-white/10 w-full">
                    <Link href="/" className="flex flex-col items-center gap-3 group">
                        <img 
                            src="/logo-wastrakarya.svg" 
                            alt="Logo Wastrakarya" 
                            className="size-[120px] md:size-[150px] transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="text-center font-bold text-primary text-[36px] md:text-[44px] font-heading leading-tight">
                            Wastrakarya
                        </span>
                    </Link>
                </div>

                <div className="p-8 md:p-12 md:w-1/2 w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
