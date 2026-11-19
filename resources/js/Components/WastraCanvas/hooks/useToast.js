import { useCallback, useEffect, useRef, useState } from "react";

export default function useToast() {
    const [toast, setToast] = useState({ message: null, type: "info" });
    const toastTimerRef = useRef(null);

    const showToast = useCallback((message, type = "info") => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }

        setToast({ message, type });
        toastTimerRef.current = window.setTimeout(() => {
            setToast({ message: null, type: "info" });
            toastTimerRef.current = null;
        }, 3000);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                window.clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    return { 
        toastMessage: toast.message, 
        toastType: toast.type, 
        showToast 
    };
}
