import { Link } from "@inertiajs/react"

export default function Footer() {
  return (
    <footer className="flex flex-col max-md:gap-10 max-lg:px-10 px-20 max-md:py-12 pb-12 w-full bg-primary">
      <div className="flex max-md:flex-col items-center gap-3 max-md:gap-1">
        <img 
          src="/logo-wastrakarya-dark.svg"
          alt="logo"
          className="rounded-3xl size-20"/>
          <span className="text-[40px] font-heading font-bold text-background/75">Wastrakarya</span>
      </div>

      <div className="flex max-md:flex-col justify-between">
        <div className="flex flex-col gap-7">
          <p className="text-background/90 max-md:hidden mt-14">
            © 2026 - WASTRAKARYA
          </p>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-background/90 hidden max-md:block text-sm">
            © 2026 - WASTRAKARYA
          </p>

          <div className="flex gap-3 justify-end items-end h-full">
            <span>wastrakarya@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>
  )
}