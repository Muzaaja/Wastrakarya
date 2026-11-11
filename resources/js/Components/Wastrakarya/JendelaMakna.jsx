export default function JendelaMakna({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />

      <div className="relative z-10 w-full max-w-4xl bg-background rounded-2xl p-8 md:p-10 border border-white/10">
        
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif text-primary">Canting</h2>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">
            JENDELA MAKNA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <img 
              src="/logo-wastrakarya.svg" 
              alt="Canting Tulis" 
              className="w-36 h-auto opacity-80"
            />
            <span className="text-[10px] tracking-widest text-white/40 font-mono mt-2">
              CANTING TULIS
            </span>
            <p className="text-xs text-white/50">Bambu, tembaga, dan ketekunan.</p>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4 text-sm leading-relaxed text-white/70">
            <p>
              Canting adalah alat untuk menorehkan malam, atau lilin batik, ke permukaan kain. Gagang bambunya menopang wadah tembaga kecil dengan cucuk yang mengalirkan garis demi garis.
            </p>
            <p>
              Dalam tradisi batik tulis di Jawa, keterampilan menggunakan canting diwariskan melalui latihan dan pendampingan. Dari tangan ke tangan, pengetahuan tentang motif dan cara membatik terus dirawat.
            </p>
            <p>
              Geraknya yang perlahan mengingatkan kita pada kesabaran, ketelitian, dan ketekunan. Setiap goresan menjadi pertemuan antara keterampilan, rasa, dan warisan budaya.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}