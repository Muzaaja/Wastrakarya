import React, { useState } from 'react';

export default function DesignCard({
  title = 'Desain Wastrakarya',
  lastEdited = 'Diedit 1 jam yang lalu',
  thumbnailUrl = null,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className="group w-full cursor-pointer select-none font-sans text-white"
    >
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#252627] p-3 transition-colors duration-200 group-hover:bg-[#2f3133]">
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            title="Lainnya"
            onClick={(e) => e.stopPropagation()}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-[#18191b]/85 text-white backdrop-blur-sm transition-colors hover:bg-black"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
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
            <p className="z-10 mt-1 text-[6px] text-blue-300">
              Presentasi Kelompok
            </p>
            {/* Dekorasi lingkaran kanan */}
            <div className="absolute -right-1.5 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-dashed border-sky-300/35 bg-[radial-gradient(circle,rgba(56,189,248,0.45)_0%,transparent_70%)]" />
          </div>
        )}
      </div>

      {/* Bagian Teks Bawah */}
      <div className="mt-2 px-0.5">
        <div
          title={title}
          className="mb-1 truncate text-[20px] font-semibold text-gray-100"
        >
          {title}
        </div>

        <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[15px] text-gray-400">
          <span className="truncate">
            {lastEdited}
          </span>
        </div>
      </div>
    </div>
  );
}