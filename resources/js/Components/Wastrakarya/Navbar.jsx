import { ArrowRight, LogIn } from "lucide-react";
import { Link } from "@inertiajs/react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full px-20 max-md:px-4 py-6 flex justify-between items-center bg-background z-50">
      {/* Logo */}
      <Link href="/" className='flex gap-3 items-center'>
        <img
          src="/logo-wastrakarya.svg"
          alt="Wastrakarya Logo"
          className="size-[65px] max-md:size-[50px] object-contain"
        />
        <span className="text-3xl max-md:text-2xl font-heading font-semibold text-primary-hover">
            Wastrakarya
        </span>
      </Link>

      {/* Tombol Contact */}
      <div className="flex gap-2">
        <Link
          href="#"
          className="flex items-center gap-2 font-sans bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-background text-lg max-md:text-sm px-6 max-md:px-4 py-2.5 rounded-[12px] font-medium transition-all duration-200"
        >
          <span>Masuk</span>
          <LogIn size={20} />
        </Link>

        <Link
          href="#"
          className="flex items-center gap-2 font-sans bg-primary text-background hover:bg-transparent border-transparent max-md:hidden border-2 hover:border-primary hover:text-primary text-lg px-6 py-2.5 rounded-[12px] font-semibold transition-all duration-200"
        >
          <span>Daftar Sekarang</span>
          <ArrowRight size={20} />
        </Link>
      </div>
    </nav>
  );
}