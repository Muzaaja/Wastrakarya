import { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import {
    autoTraceMotifWax,
    BATIK_MOTIFS,
} from "../BatikMotifs";
import {
    CANVAS_HEIGHT,
    CANVAS_SYNC_CHUNK_SIZE,
    CANVAS_SYNC_MAX_CHUNKS,
    CANVAS_SYNC_TIMEOUT_MS,
    CANVAS_TILE_SIZE,
    CANVAS_WIDTH,
} from "../constants";
import getEcho from "@/echo";

export default function useCanvasCollaboration({
    applyMotifSelection,
    canvasChannelRef,
    cantingSize,
    drawRemoteLineBetween,
    getArtworkCanvas,
    loadedDrawingId,
    projectTitle,
    renderMainCanvasRef,
    selectedMotif,
    setProjectTitle,
    setShareType,
    showToast,
    user,
    waxColor,
}) {
    const [activeCollaborators, setActiveCollaborators] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState({});
    const currentChannelDrawingIdRef = useRef(null);
    const incomingCanvasSyncsRef = useRef(new Map());
    const collabStateRef = useRef({
        userId: user?.id ?? null,
        userName: user?.name ?? null,
        projectTitle,
        cantingSize,
        waxColor,
        selectedMotif,
    });

    useEffect(() => {
        collabStateRef.current = {
            userId: user?.id ?? null,
            userName: user?.name ?? null,
            projectTitle,
            cantingSize,
            waxColor,
            selectedMotif,
        };
    }, [
        cantingSize,
        projectTitle,
        selectedMotif,
        user?.id,
        user?.name,
        waxColor,
    ]);

    useEffect(() => {
        const userId = user?.id ?? null;
        if (!userId || !loadedDrawingId) {
            if (canvasChannelRef.current) {
                const echo = getEcho();
                if (echo && currentChannelDrawingIdRef.current) {
                    echo.leave(`canvas.${currentChannelDrawingIdRef.current}`);
                }
                canvasChannelRef.current = null;
                currentChannelDrawingIdRef.current = null;
            }
            setActiveCollaborators([]);
            setRemoteCursors({});
            return;
        }

        const echo = getEcho();
        if (!echo) {
            return;
        }

        const channelName = `canvas.${loadedDrawingId}`;
        if (
            canvasChannelRef.current &&
            currentChannelDrawingIdRef.current === loadedDrawingId
        ) {
            return;
        }

        if (canvasChannelRef.current && currentChannelDrawingIdRef.current) {
            echo.leave(`canvas.${currentChannelDrawingIdRef.current}`);
            canvasChannelRef.current = null;
        }

        currentChannelDrawingIdRef.current = loadedDrawingId;
        const channel = echo.join(channelName);
        canvasChannelRef.current = channel;

        const applySyncedCanvas = (dataUrl) => {
            const artwork = getArtworkCanvas();
            if (!artwork || !dataUrl) {
                return;
            }

            const context = artwork.getContext("2d");
            const image = new Image();
            image.onload = () => {
                context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                context.drawImage(image, 0, 0);
                renderMainCanvasRef.current();
            };
            image.src = dataUrl;
        };

        channel
            .here((members) => {
                const activeMembers = members || [];
                setActiveCollaborators(activeMembers);

                const syncSource =
                    activeMembers.find(
                        (member) =>
                            String(member.id) !== String(userId) &&
                            member.is_owner,
                    ) ||
                    activeMembers.find(
                        (member) => String(member.id) !== String(userId),
                    );

                if (syncSource) {
                    channel.whisper("request_sync", {
                        requesterId: userId,
                        sourceUserId: syncSource.id,
                    });
                }
            })
            .joining((member) => {
                setActiveCollaborators((previousMembers) => [
                    ...previousMembers.filter(
                        (existingMember) => existingMember.id !== member.id,
                    ),
                    member,
                ]);
                showToast(`${member.name} bergabung ke sesi kolaborasi`);
            })
            .leaving((member) => {
                setActiveCollaborators((previousMembers) =>
                    previousMembers.filter(
                        (existingMember) => existingMember.id !== member.id,
                    ),
                );
                setRemoteCursors((previousCursors) => {
                    const nextCursors = { ...previousCursors };
                    delete nextCursors[member.id];
                    return nextCursors;
                });
                showToast(`${member.name} meninggalkan sesi kolaborasi`);
            })
            .listenForWhisper("stroke", (data) => {
                if (!data || !data.p1 || !data.p2) {
                    return;
                }

                const { cantingSize: fallbackSize, waxColor: fallbackColor } =
                    collabStateRef.current;
                drawRemoteLineBetween(
                    data.p1,
                    data.p2,
                    data.size || fallbackSize,
                    data.color || fallbackColor || "#CDB988",
                    Boolean(data.erase),
                );
            })
            .listenForWhisper("cursor", (data) => {
                if (
                    !data ||
                    !data.userId ||
                    data.userId === collabStateRef.current.userId
                ) {
                    return;
                }

                setRemoteCursors((previousCursors) => ({
                    ...previousCursors,
                    [data.userId]: {
                        x: data.x,
                        y: data.y,
                        userName: data.userName,
                        tool: data.tool,
                        color: data.color,
                        updatedAt: Date.now(),
                    },
                }));
            })
            .listenForWhisper("clear", (data) => {
                const artwork = getArtworkCanvas();
                if (!artwork) {
                    return;
                }

                const context = artwork.getContext("2d");
                context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                renderMainCanvasRef.current();
                showToast(
                    `${data?.userName || "Kolaborator"} membersihkan kanvas`,
                );
            })
            .listenForWhisper("trace", (data) => {
                const artwork = getArtworkCanvas();
                if (!artwork || !data?.motif) {
                    return;
                }

                const { cantingSize: fallbackSize, waxColor: fallbackColor } =
                    collabStateRef.current;
                const context = artwork.getContext("2d");
                const centerX = CANVAS_WIDTH / 2;
                const centerY = CANVAS_HEIGHT / 2;
                const scale =
                    Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / CANVAS_TILE_SIZE;

                context.save();
                context.translate(centerX, centerY);
                context.scale(scale, scale);
                context.translate(
                    -CANVAS_TILE_SIZE / 2,
                    -CANVAS_TILE_SIZE / 2,
                );
                autoTraceMotifWax(
                    context,
                    data.motif,
                    CANVAS_TILE_SIZE,
                    data.color || fallbackColor,
                    data.size || fallbackSize,
                );
                context.restore();
                renderMainCanvasRef.current();
                showToast(
                    `${data?.userName || "Kolaborator"} menjiplak motif ${data.motif}`,
                );
            })
            .listenForWhisper("motif", (data) => {
                if (
                    !data?.motif ||
                    String(data.userId) === String(userId) ||
                    (data.targetUserId &&
                        String(data.targetUserId) !== String(userId)) ||
                    !BATIK_MOTIFS.some((motif) => motif.id === data.motif)
                ) {
                    return;
                }

                applyMotifSelection(data.motif, { markUnsaved: true });
                showToast(
                    `${data.userName || "Kolaborator"} mengganti motif menjadi ${data.motif}`,
                );
            })
            .listenForWhisper("request_sync", (data) => {
                if (
                    !data?.requesterId ||
                    String(data.requesterId) === String(userId) ||
                    (data.sourceUserId &&
                        String(data.sourceUserId) !== String(userId))
                ) {
                    return;
                }

                channel.whisper("motif", {
                    motif: collabStateRef.current.selectedMotif,
                    userId,
                    userName: collabStateRef.current.userName,
                    targetUserId: data.requesterId,
                });

                const artwork = getArtworkCanvas();
                if (!artwork) {
                    return;
                }

                const dataUrl = artwork.toDataURL();
                const totalChunks = Math.ceil(
                    dataUrl.length / CANVAS_SYNC_CHUNK_SIZE,
                );

                if (
                    totalChunks === 0 ||
                    totalChunks > CANVAS_SYNC_MAX_CHUNKS
                ) {
                    console.warn(
                        "Canvas snapshot is too large to synchronize safely.",
                    );
                    return;
                }

                const syncId = `${loadedDrawingId}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                for (
                    let chunkIndex = 0;
                    chunkIndex < totalChunks;
                    chunkIndex++
                ) {
                    const start = chunkIndex * CANVAS_SYNC_CHUNK_SIZE;
                    channel.whisper("sync_state_chunk", {
                        syncId,
                        targetUserId: data.requesterId,
                        chunkIndex,
                        totalChunks,
                        chunk: dataUrl.slice(
                            start,
                            start + CANVAS_SYNC_CHUNK_SIZE,
                        ),
                    });
                }
            })
            .listenForWhisper("sync_state_chunk", (data) => {
                if (
                    typeof data?.syncId !== "string" ||
                    data.syncId.length > 128 ||
                    String(data.targetUserId) !== String(userId) ||
                    typeof data.chunk !== "string"
                ) {
                    return;
                }

                const chunkIndex = Number(data.chunkIndex);
                const totalChunks = Number(data.totalChunks);

                if (
                    !Number.isInteger(chunkIndex) ||
                    !Number.isInteger(totalChunks) ||
                    chunkIndex < 0 ||
                    totalChunks < 1 ||
                    totalChunks > CANVAS_SYNC_MAX_CHUNKS ||
                    chunkIndex >= totalChunks ||
                    data.chunk.length > CANVAS_SYNC_CHUNK_SIZE
                ) {
                    return;
                }

                let syncState = incomingCanvasSyncsRef.current.get(
                    data.syncId,
                );

                if (!syncState) {
                    const timeoutId = window.setTimeout(() => {
                        incomingCanvasSyncsRef.current.delete(data.syncId);
                    }, CANVAS_SYNC_TIMEOUT_MS);

                    syncState = {
                        chunks: new Array(totalChunks),
                        receivedChunks: 0,
                        timeoutId,
                    };
                    incomingCanvasSyncsRef.current.set(data.syncId, syncState);
                }

                if (
                    syncState.chunks.length !== totalChunks ||
                    syncState.chunks[chunkIndex] !== undefined
                ) {
                    return;
                }

                syncState.chunks[chunkIndex] = data.chunk;
                syncState.receivedChunks += 1;

                if (syncState.receivedChunks === totalChunks) {
                    window.clearTimeout(syncState.timeoutId);
                    incomingCanvasSyncsRef.current.delete(data.syncId);
                    applySyncedCanvas(syncState.chunks.join(""));
                }
            })
            .listen("CanvasUpdated", (event) => {
                const accessRulesChanged =
                    event.action === "share_type_changed" ||
                    event.action === "collaborator_removed";

                if (accessRulesChanged) {
                    if (event.action === "share_type_changed") {
                        setShareType(event.share_type);
                    }

                    const authorizedCollaboratorIds = Array.isArray(
                        event.authorized_collaborator_ids,
                    )
                        ? event.authorized_collaborator_ids
                        : [];
                    const isUnauthorizedForEmailSharing =
                        event.share_type === "specific_users" &&
                        !authorizedCollaboratorIds.some(
                            (authorizedUserId) =>
                                String(authorizedUserId) === String(userId),
                        );

                    if (
                        (event.disconnect_collaborators === true ||
                            isUnauthorizedForEmailSharing) &&
                        String(event.user_id) !== String(userId)
                    ) {
                        echo.leave(channelName);
                        canvasChannelRef.current = null;
                        currentChannelDrawingIdRef.current = null;
                        setActiveCollaborators([]);
                        setRemoteCursors({});
                        router.reload({
                            replace: true,
                            preserveState: false,
                            preserveScroll: false,
                        });

                        return;
                    }

                    if (event.action === "share_type_changed") {
                        showToast(
                            "Pengaturan izin berbagi diperbarui oleh pemilik",
                        );
                    }
                } else if (
                    event.action === "updated" ||
                    event.action === "saved"
                ) {
                    if (
                        event.title &&
                        event.title !== collabStateRef.current.projectTitle
                    ) {
                        setProjectTitle(event.title);
                    }
                    if (
                        event.motif &&
                        BATIK_MOTIFS.some(
                            (motif) => motif.id === event.motif,
                        )
                    ) {
                        applyMotifSelection(event.motif);
                    }
                    showToast(
                        `Kanvas diperbarui oleh ${event.user_name || "kolaborator"}`,
                    );
                }
            });

        return () => {
            for (const syncState of incomingCanvasSyncsRef.current.values()) {
                window.clearTimeout(syncState.timeoutId);
            }
            incomingCanvasSyncsRef.current.clear();

            const currentEcho = getEcho();
            if (currentEcho) {
                currentEcho.leave(channelName);
            }
            if (canvasChannelRef.current === channel) {
                canvasChannelRef.current = null;
            }
            if (currentChannelDrawingIdRef.current === loadedDrawingId) {
                currentChannelDrawingIdRef.current = null;
            }
        };
    }, [
        applyMotifSelection,
        canvasChannelRef,
        drawRemoteLineBetween,
        getArtworkCanvas,
        loadedDrawingId,
        renderMainCanvasRef,
        setProjectTitle,
        setShareType,
        showToast,
        user?.id,
    ]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            const now = Date.now();
            setRemoteCursors((previousCursors) => {
                let changed = false;
                const nextCursors = {};

                for (const [userId, cursor] of Object.entries(
                    previousCursors,
                )) {
                    if (now - cursor.updatedAt < 3000) {
                        nextCursors[userId] = cursor;
                    } else {
                        changed = true;
                    }
                }

                return changed ? nextCursors : previousCursors;
            });
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, []);

    return { activeCollaborators, remoteCursors };
}
