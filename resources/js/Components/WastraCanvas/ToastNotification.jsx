import { AlertCircle, Sparkles } from "lucide-react";

export default function ToastNotification({ message, type = "info" }) {
    if (!message) {
        return null;
    }

    const isError = type === "error";

    return (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm backdrop-blur-md transition-all ${
            isError
                ? "bg-[#331616] border border-red-500/60 text-red-100"
                : "bg-[#162B21] border border-[#CDB988]/60 text-[#F5EFEB]"
        }`}>
            {isError ? (
                <AlertCircle size={16} className="text-red-400 shrink-0" />
            ) : (
                <Sparkles size={16} className="text-[#CDB988] shrink-0" />
            )}
            <span>{message}</span>
        </div>
    );
}
