import { ArrowRight, LogIn } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

export default function Navbar() {
  const { auth } = usePage().props;
  const isLoggedIn = !!auth.user;

  return (
    <nav className="fixed top-0 left-0 w-full px-20 max-md:px-4 py-4 shadow-sm flex justify-between items-center z-50 bg-gradient-to-b from-background via-background/70 to-transparent">
      {/* Logo */}
      <Link href="/" className='flex gap-3 items-center'>
        <img
          src="/logo-wastrakarya.svg"
          alt="Wastrakarya Logo"
          className="size-[60px] max-md:size-[50px] object-contain"
        />
        <span className="text-3xl max-md:text-2xl font-heading font-semibold text-primary-hover">
            Wastrakarya
        </span>
      </Link>

      <div className="flex gap-2">
        {!isLoggedIn ? (
          <>
            <Link
              href="/login"
              className="flex items-center gap-2 font-sans bg-transparent text-primary border-2 border-primary hover:bg-primary 
              hover:text-background text-md max-md:text-sm px-6 max-md:px-4 py-2.5 rounded-[12px] font-medium transition-all 
              duration-200"
            >
              <span>Masuk</span>
              <LogIn size={20} />
            </Link>

            <Link
              href="/register"
              className="flex items-center gap-2 font-sans bg-primary text-background hover:bg-transparent border-transparent 
              max-md:hidden border-2 hover:border-primary hover:text-primary text-md px-6 py-2.5 rounded-[12px] font-semibold 
              transition-all duration-200"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight size={20} />
            </Link>
          </>
        ) : (
          <span className="text-primary font-normal max-md:text-lg text-xl">
            {auth.user.name}
          </span>
        )}
        
      </div>
    </nav>
  );
}