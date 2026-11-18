import { useCallback, useEffect, useState } from "react";
import { getRequestHeaders } from "../http";

export default function useSavedDrawings({ showToast, user }) {
    const [savedDrawings, setSavedDrawings] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);

    const fetchSavedDrawings = useCallback(async () => {
        if (!user) {
            setSavedDrawings([]);
            return;
        }

        setSavedLoading(true);

        try {
            const response = await fetch("/api/user-drawings", {
                headers: getRequestHeaders(),
            });

            if (!response.ok) {
                throw new Error("Gagal memuat simpanan karya");
            }

            const data = await response.json();
            if (Array.isArray(data)) {
                setSavedDrawings(data);
            } else if (data && Array.isArray(data.own)) {
                setSavedDrawings([...data.own, ...(data.shared || [])]);
            } else {
                setSavedDrawings([]);
            }
        } catch (error) {
            console.error(error);
            showToast("Gagal memuat simpanan karya");
        } finally {
            setSavedLoading(false);
        }
    }, [showToast, user]);

    const handleDeleteDrawing = useCallback(
        async (drawingId) => {
            if (!window.confirm("Yakin ingin menghapus simpanan karya ini?")) {
                return;
            }

            try {
                const response = await fetch(
                    `/api/user-drawings/${drawingId}`,
                    {
                        method: "DELETE",
                        headers: getRequestHeaders(),
                    },
                );

                if (!response.ok) {
                    throw new Error("Gagal menghapus");
                }

                await fetchSavedDrawings();
                showToast("Karya berhasil dihapus dari simpanan.");
            } catch (error) {
                console.error(error);
                showToast("Gagal menghapus karya");
            }
        },
        [fetchSavedDrawings, showToast],
    );

    useEffect(() => {
        if (user) {
            void fetchSavedDrawings();
        } else {
            setSavedDrawings([]);
        }
    }, [fetchSavedDrawings, user]);

    return {
        fetchSavedDrawings,
        handleDeleteDrawing,
        savedDrawings,
        savedLoading,
    };
}
