import { Sparkles } from "lucide-react";

export default function ToastNotification({ message }) {
    if (!message) {
        return null;
    }

    return (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#162B21] border border-[#CDB988]/60 text-[#F5EFEB] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm backdrop-blur-md transition-all">
            <Sparkles size={16} className="text-[#CDB988]" />
            <span>{message}</span>
        </div>
    );
}
