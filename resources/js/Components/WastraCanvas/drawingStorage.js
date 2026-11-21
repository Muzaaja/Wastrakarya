const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const normalizedId = (value) =>
    value === null || value === undefined || value === ""
        ? null
        : String(value);

export const normalizeStoredDrawing = (drawing) => ({
    ...drawing,
    canvasId: drawing?.canvasId ?? null,
    userId: drawing?.userId ?? null,
    fabricColor: drawing?.fabricColor ?? drawing?.fabric_color ?? null,
    tileFreeDrawing:
        drawing?.tileFreeDrawing ?? drawing?.tile_free_drawing ?? false,
    dataUrl: drawing?.dataUrl ?? drawing?.data_url ?? null,
    pencilDataUrl: drawing?.pencilDataUrl ?? drawing?.pencil_data_url ?? null,
    waxDataUrl: drawing?.waxDataUrl ?? drawing?.wax_data_url ?? null,
    updatedAt: drawing?.updatedAt ?? drawing?.updated_at ?? null,
});

export const hasStoredArtwork = (drawing) => {
    const normalizedDrawing = normalizeStoredDrawing(drawing);

    return Boolean(
        normalizedDrawing.dataUrl ||
        normalizedDrawing.pencilDataUrl ||
        normalizedDrawing.waxDataUrl,
    );
};

export const isStoredDrawingScopedTo = (
    drawing,
    { canvasId, userId, ownerId = null, allowLegacyGuest = false },
) => {
    if (!drawing || normalizedId(drawing.canvasId) !== normalizedId(canvasId)) {
        return false;
    }

    if (hasOwn(drawing, "userId")) {
        return normalizedId(drawing.userId) === normalizedId(userId);
    }

    if (userId !== null && userId !== undefined) {
        return normalizedId(ownerId) === normalizedId(userId);
    }

    return allowLegacyGuest && normalizedId(drawing.canvasId) === null;
};

export const shouldUseStoredDrawing = (storedDrawing, serverDrawing) => {
    if (!hasStoredArtwork(storedDrawing)) {
        return false;
    }

    if (!hasStoredArtwork(serverDrawing)) {
        return true;
    }

    const storedUpdatedAt = Date.parse(
        normalizeStoredDrawing(storedDrawing).updatedAt || "",
    );
    const serverUpdatedAt = Date.parse(
        normalizeStoredDrawing(serverDrawing).updatedAt || "",
    );

    return (
        Number.isFinite(storedUpdatedAt) &&
        Number.isFinite(serverUpdatedAt) &&
        storedUpdatedAt > serverUpdatedAt
    );
};

export const removeStoredDrawingIfMatching = (storage, key, scope) => {
    try {
        const storedValue = storage.getItem(key);
        if (!storedValue) {
            return;
        }

        const drawing = JSON.parse(storedValue);
        if (isStoredDrawingScopedTo(drawing, scope)) {
            storage.removeItem(key);
        }
    } catch (error) {
        console.error(`Gagal membersihkan snapshot ${key}`, error);
    }
};
