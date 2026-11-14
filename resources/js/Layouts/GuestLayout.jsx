import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col gap-10 items-center bg-background pt-6 sm:justify-center sm:pt-0 overflow-x-hidden overflow-y-hidden">
            <img src="megamendung.svg" alt="" className='size-[1000px] absolute -top-[200px] -left-[400px] z-0'/>
            <img src="megamendung.svg" alt="" className='size-[1000px] absolute -bottom-[200px] -right-[500px] z-0'/>
            <div>
                <Link href="/" className=' gap-2 flex-col flex'>
                    <img src="logo-wastrakarya.svg" alt="Logo Wastrakarya" />
                    <span className='w-full items-center justify-center text-center font-bold text-primary-hover text-[44px] font-heading'>Wastrakarya</span>
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-transparent px-6 py-4 sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
