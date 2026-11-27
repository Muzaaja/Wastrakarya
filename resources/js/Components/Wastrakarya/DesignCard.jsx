import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function DesignCard({
  title = 'Desain Wastrakarya',
  lastEdited = 'Diedit 1 jam yang lalu',
  thumbnailUrl = null,
  onClick,
  onRename,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Tutup menu kalau klik di luar
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Fokus input saat mode rename aktif
  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renaming]);

  function handleMenuToggle(e) {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }

  function handleRenameClick(e) {
    e.stopPropagation();
    setRenameValue(title);
    setRenaming(true);
    setMenuOpen(false);
  }

  function handleRenameSubmit(e) {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title && onRename) {
      onRename(trimmed);
    }
    setRenaming(false);
  }

  function handleDeleteClick(e) {
    e.stopPropagation();
    setMenuOpen(false);
    if (onDelete) onDelete();
  }

  return (
    <div
      onClick={onClick}
      className="group w-full cursor-pointer select-none font-sans text-white"
    >
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#252627] p-3 transition-colors duration-200 group-hover:bg-[#2f3133]">
        {/* Tombol titik tiga */}
        <div
          ref={menuRef}
          className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Lainnya"
            onClick={handleMenuToggle}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#18191b]/85 text-white backdrop-blur-sm transition-colors hover:bg-black"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 overflow-hidden rounded-lg bg-[#1e1f21] shadow-xl ring-1 ring-white/10">
              <button
                type="button"
                onClick={handleRenameClick}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-gray-200 transition-colors hover:bg-white/10"
              >
                <Pencil size={13} className="shrink-0 text-gray-400" />
                Ubah Nama
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
              >
                <Trash2 size={13} className="shrink-0" />
                Hapus
              </button>
            </div>
          )}
        </div>

        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full rounded-[5px] object-cover shadow-md transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="relative flex h-full w-full flex-col justify-center overflow-hidden rounded-[5px] bg-gradient-to-br from-[#0b192c] via-[#102a4c] to-[#091526] px-3.5 py-3 shadow-md transition-transform duration-200 group-hover:scale-[1.02]">
            <h4 className="z-10 max-w-[75%] text-[11px] font-bold leading-tight text-white">
              {title}
            </h4>
            {/* Dekorasi lingkaran kanan */}
            <div className="absolute -right-1.5 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-dashed border-sky-300/35 bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,transparent_70%)]" />
          </div>
        )}
      </div>

      {/* Bagian Teks Bawah */}
      <div className="mt-2 px-0.5">
        {renaming ? (
          <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => { if (e.key === 'Escape') setRenaming(false); }}
              className="mb-1 w-full rounded-md bg-white/10 px-2 py-0.5 text-[18px] font-semibold text-gray-100 outline-none ring-1 ring-primary/60 focus:ring-primary"
            />
          </form>
        ) : (
          <div
            title={title}
            className="mb-1 truncate text-[20px] font-semibold text-gray-100"
          >
            {title}
          </div>
        )}

        <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[15px] text-gray-400">
          <span className="truncate">
            {lastEdited}
          </span>
        </div>
      </div>
    </div>
  );
}