import { Ban } from "lucide-react";

const SKYBOX_FILES = [
    null,
    "Hutan 1.exr",
    "Interior 1.exr",
    "Interior 2.hdr",
    "Interior 3.exr",
    "Photo Studio 1.exr",
    "Photo Studio 2.hdr",
];

export default function SkyboxPicker({ value, onChange, status }) {
    return (
        <fieldset className="flex min-w-0 flex-col gap-2.5">
            <legend className="pb-2.5 text-xs font-medium text-[#BACDC2]">
                Latar
            </legend>

            <div className="grid grid-cols-4 gap-x-1 gap-y-3">
                {SKYBOX_FILES.map((file) => {
                    const label = file ? file.replace(/\.[^.]+$/, "") : "Kosong";
                    const preview = file && `/hdri/previews/${label.toLowerCase().replaceAll(" ", "-")}.webp`;
                    const isSelected = value === file;

                    return (
                        <button
                            key={file ?? "none"}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => onChange(file)}
                            className={`group flex min-w-0 flex-col items-center gap-1.5 rounded-lg px-0.5 py-1 text-center text-[11px] font-medium leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5BD8A] ${
                                isSelected
                                    ? "text-[#E2CEAB]"
                                    : "text-[#A8BCB1] hover:text-[#E2CEAB]"
                            }`}
                        >
                            <span
                                className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-md transition-colors ${
                                    isSelected
                                        ? "border-[#E2CEAB] ring-2 ring-[#CDB988]/40"
                                        : "border-[#2C483A] group-hover:border-[#CDB988]"
                                }`}
                            >
                                {preview ? (
                                    <img
                                        src={preview}
                                        width={44}
                                        height={44}
                                        alt=""
                                        decoding="async"
                                    />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#345246] to-[#07130E]">
                                        <Ban size={16} aria-hidden="true" />
                                    </span>
                                )}
                            </span>
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            {status === "loading" && (
                <p role="status" className="text-xs text-[#BACDC2]">Memuat Latar...</p>
            )}
            {status === "error" && (
                <p role="alert" className="text-xs text-[#F1CAB3]">
                    HDRI gagal dimuat. Pilih ulang untuk mencoba lagi.
                </p>
            )}
        </fieldset>
    );
}
