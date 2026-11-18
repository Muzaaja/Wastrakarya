import { useCallback, useEffect, useRef, useState } from "react";

export default function useToast() {
    const [toastMessage, setToastMessage] = useState(null);
    const toastTimerRef = useRef(null);

    const showToast = useCallback((message) => {
        if (toastTimerRef.current) {
            window.clearTimeout(toastTimerRef.current);
        }

        setToastMessage(message);
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage(null);
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

    return { toastMessage, showToast };
}
