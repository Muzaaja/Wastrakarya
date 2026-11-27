import { useRef, useState } from "react";
import { Camera, Video, VideoOff } from "lucide-react";
import { BatikTryOn } from "./BatikTryOn";

const CAMERA_ERRORS = {
    "insecure-context": "Buka WastraMockup melalui HTTPS untuk menggunakan kamera.",
    "camera-denied": "Izinkan akses kamera di pengaturan browser, lalu coba lagi.",
    "camera-unavailable": "Kamera tidak tersedia. Periksa koneksi kamera dan tutup aplikasi lain yang menggunakannya.",
    "model-load-failed": "Model AI gagal dimuat. Periksa koneksi internet, lalu coba lagi.",
    "webgl-unsupported": "Mode kamera memerlukan browser dan perangkat yang mendukung WebGL.",
};

const PRIMARY_BUTTON = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D5BD8A] px-4 py-2 text-sm font-semibold text-[#0A1612] transition-colors enabled:hover:bg-[#E2CEAB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D5BD8A] disabled:cursor-not-allowed disabled:opacity-40";

export default function CameraMockup({
    pattern,
    scale,
    effects,
    filename,
    hasProjectTitle,
}) {
    const tryOnRef = useRef(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    const [bodyDetected, setBodyDetected] = useState(false);
    const [photoFailed, setPhotoFailed] = useState(false);

    const isActive = !["idle", "stopped", "error"].includes(status);
    const isRunning = status === "running";
    const showFeedback = isRunning && (!bodyDetected || photoFailed);

    const startCamera = () => {
        setBodyDetected(false);
        setPhotoFailed(false);

        if (!navigator.mediaDevices?.getUserMedia) {
            setError(
                window.isSecureContext ? "camera-unavailable" : "insecure-context",
            );
            setStatus("error");
            return;
        }

        setError(null);
        setStatus("loading-models");
    };

    const handleCameraError = ({ code }) => {
        setError(code);
        setStatus("error");
    };

    const downloadPhoto = async () => {
        const tryOn = tryOnRef.current;
        if (!tryOn) return;

        setPhotoFailed(false);
        try {
            const photo = await tryOn.snapshot("image/png");
            if (tryOnRef.current !== tryOn) return;
            if (!photo) {
                setPhotoFailed(true);
                return;
            }

            const url = URL.createObjectURL(photo);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            if (tryOnRef.current === tryOn) setPhotoFailed(true);
        }
    };

    return (
        <section
            aria-label="Coba batik dengan kamera AI"
            className={`flex min-w-0 shrink-0 flex-col items-center justify-center gap-4 px-4 pb-5 lg:min-h-0 lg:flex-1 lg:px-6 ${
                hasProjectTitle ? "pt-16 lg:pt-24" : "pt-5 lg:pt-6"
            }`}
        >
            <div className="relative aspect-[4/3] min-h-60 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#2C483A] bg-[#08140F] lg:aspect-auto lg:max-h-[44rem] lg:flex-1">
                {isActive ? (
                    <BatikTryOn
                        {...effects}
                        ref={tryOnRef}
                        pattern={pattern}
                        scale={scale}
                        onStatusChange={setStatus}
                        onError={handleCameraError}
                        onBodyDetectedChange={setBodyDetected}
                        className="h-full w-full"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto p-4 text-center sm:p-6">
                        <Video
                            size={28}
                            className="shrink-0 text-[#D5BD8A]"
                            aria-hidden="true"
                        />
                        {error ? (
                            <p role="alert" className="max-w-xs text-sm text-[#F1CAB3]">
                                {CAMERA_ERRORS[error] ??
                                    "Pratinjau kamera gagal dimulai. Silakan coba lagi."}
                            </p>
                        ) : (
                            <>
                                <h2 className="font-heading text-2xl font-semibold text-[#E2CEAB]">
                                    Coba batik di baju Anda
                                </h2>
                                <p className="max-w-xs text-sm text-[#A8BCB1]">
                                    Aktifkan kamera dan posisikan bahu hingga pinggang di dalam bingkai.
                                </p>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={startCamera}
                            className={PRIMARY_BUTTON}
                        >
                            {error ? "Coba Lagi" : "Aktifkan Kamera"}
                        </button>
                    </div>
                )}
            </div>

            {isActive && (
                <div className="flex w-full max-w-4xl shrink-0 flex-col items-center gap-2 text-center">
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setStatus("idle")}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#2C483A] bg-[#0B1813] px-4 py-2 text-sm font-semibold text-[#BACDC2] transition-colors hover:bg-[#142820] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D5BD8A]"
                        >
                            <VideoOff size={16} aria-hidden="true" />
                            Matikan Kamera
                        </button>
                        <button
                            type="button"
                            onClick={downloadPhoto}
                            disabled={!isRunning || !bodyDetected}
                            className={PRIMARY_BUTTON}
                        >
                            <Camera size={16} aria-hidden="true" />
                            Unduh Foto
                        </button>
                    </div>
                    {showFeedback && (
                        <p
                            role={photoFailed ? "alert" : "status"}
                            className={`text-xs ${photoFailed ? "text-[#F1CAB3]" : "text-[#A8BCB1]"}`}
                        >
                            {photoFailed
                                ? "Foto gagal diunduh. Silakan coba lagi."
                                : "Posisikan bahu hingga pinggang di dalam bingkai."}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}
