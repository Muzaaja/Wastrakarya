import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

const DEFAULT_POSITION = { x: 12, y: 12 };
const PANEL_MARGIN = 12;

function isStoredPosition(value) {
    return (
        value &&
        Number.isFinite(value.x) &&
        Number.isFinite(value.y)
    );
}

function resolveDefaultPosition(defaultPosition, container, panel) {
    const resolvedPosition =
        typeof defaultPosition === "function"
            ? defaultPosition({ container, panel })
            : defaultPosition;

    return isStoredPosition(resolvedPosition)
        ? resolvedPosition
        : DEFAULT_POSITION;
}

export default function useDraggablePanel({
    containerRef,
    defaultPosition = DEFAULT_POSITION,
    panelRef,
    storageKey,
    visibleHandleRef,
}) {
    const initialPosition = resolveDefaultPosition(defaultPosition, null, null);
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const defaultPositionRef = useRef(defaultPosition);
    const positionRef = useRef(initialPosition);
    const dragRef = useRef(null);

    defaultPositionRef.current = defaultPosition;

    const getDefaultPosition = useCallback(() => {
        return resolveDefaultPosition(
            defaultPositionRef.current,
            containerRef.current,
            panelRef.current,
        );
    }, [containerRef, panelRef]);

    const clampPosition = useCallback(
        (nextPosition) => {
            const container = containerRef.current;
            const panel = panelRef.current;

            if (!container || !panel) {
                return nextPosition;
            }

            const visibleHandle = visibleHandleRef?.current ?? panel;
            const panelBounds = panel.getBoundingClientRect();
            const visibleHandleBounds = visibleHandle.getBoundingClientRect();
            const visibleHandleOffset = {
                bottom: visibleHandleBounds.bottom - panelBounds.top,
                left: visibleHandleBounds.left - panelBounds.left,
                right: visibleHandleBounds.right - panelBounds.left,
                top: visibleHandleBounds.top - panelBounds.top,
            };
            const minimumX = PANEL_MARGIN - visibleHandleOffset.left;
            const minimumY = PANEL_MARGIN - visibleHandleOffset.top;
            const maximumX = Math.max(
                minimumX,
                container.clientWidth -
                    visibleHandleOffset.right -
                    PANEL_MARGIN,
            );
            const maximumY = Math.max(
                minimumY,
                container.clientHeight -
                    visibleHandleOffset.bottom -
                    PANEL_MARGIN,
            );

            return {
                x: Math.min(Math.max(nextPosition.x, minimumX), maximumX),
                y: Math.min(Math.max(nextPosition.y, minimumY), maximumY),
            };
        },
        [containerRef, panelRef, visibleHandleRef],
    );

    const updatePosition = useCallback(
        (nextPosition) => {
            const clampedPosition = clampPosition(nextPosition);
            positionRef.current = clampedPosition;
            setPosition(clampedPosition);

            return clampedPosition;
        },
        [clampPosition],
    );

    const savePosition = useCallback(
        (nextPosition) => {
            if (!storageKey) {
                return;
            }

            window.localStorage.setItem(
                storageKey,
                JSON.stringify(nextPosition),
            );
        },
        [storageKey],
    );

    const resetPosition = useCallback(() => {
        const nextPosition = updatePosition(getDefaultPosition());
        savePosition(nextPosition);

        return nextPosition;
    }, [getDefaultPosition, savePosition, updatePosition]);

    useLayoutEffect(() => {
        let storedPosition = null;

        if (storageKey) {
            try {
                storedPosition = JSON.parse(
                    window.localStorage.getItem(storageKey),
                );
            } catch (_) {
                window.localStorage.removeItem(storageKey);
            }
        }

        if (isStoredPosition(storedPosition)) {
            updatePosition(storedPosition);
            return;
        }

        updatePosition(getDefaultPosition());
    }, [getDefaultPosition, storageKey, updatePosition]);

    useEffect(() => {
        const container = containerRef.current;
        const panel = panelRef.current;

        if (!container || !panel) {
            return;
        }

        const keepPanelInBounds = () => {
            updatePosition(positionRef.current);
        };
        const resizeObserver = new ResizeObserver(keepPanelInBounds);

        resizeObserver.observe(container);
        resizeObserver.observe(panel);
        window.addEventListener("resize", keepPanelInBounds);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", keepPanelInBounds);
        };
    }, [containerRef, panelRef, updatePosition]);

    const handlePointerDown = useCallback(
        (event) => {
            if (event.button !== 0) {
                return;
            }

            const container = containerRef.current;
            const panel = panelRef.current;

            if (!container || !panel) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.setPointerCapture(event.pointerId);

            const panelBounds = panel.getBoundingClientRect();
            dragRef.current = {
                pointerId: event.pointerId,
                offsetX: event.clientX - panelBounds.left,
                offsetY: event.clientY - panelBounds.top,
            };
            setIsDragging(true);
        },
        [containerRef, panelRef],
    );

    const handlePointerMove = useCallback(
        (event) => {
            const drag = dragRef.current;
            const container = containerRef.current;

            if (!drag || !container || drag.pointerId !== event.pointerId) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const containerBounds = container.getBoundingClientRect();
            updatePosition({
                x: event.clientX - containerBounds.left - drag.offsetX,
                y: event.clientY - containerBounds.top - drag.offsetY,
            });
        },
        [containerRef, updatePosition],
    );

    const handlePointerEnd = useCallback(
        (event) => {
            if (dragRef.current?.pointerId !== event.pointerId) {
                return;
            }

            event.stopPropagation();
            dragRef.current = null;
            setIsDragging(false);
            savePosition(positionRef.current);
        },
        [savePosition],
    );

    const handleKeyDown = useCallback(
        (event) => {
            if (event.key === "Home") {
                event.preventDefault();
                resetPosition();
                return;
            }

            const movement = event.shiftKey ? 24 : 8;
            const offsets = {
                ArrowDown: { x: 0, y: movement },
                ArrowLeft: { x: -movement, y: 0 },
                ArrowRight: { x: movement, y: 0 },
                ArrowUp: { x: 0, y: -movement },
            };
            const offset = offsets[event.key];

            if (!offset) {
                return;
            }

            event.preventDefault();
            const nextPosition = updatePosition({
                x: positionRef.current.x + offset.x,
                y: positionRef.current.y + offset.y,
            });
            savePosition(nextPosition);
        },
        [resetPosition, savePosition, updatePosition],
    );

    return {
        dragHandleProps: {
            onDoubleClick: resetPosition,
            onKeyDown: handleKeyDown,
            onPointerCancel: handlePointerEnd,
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerEnd,
            role: "button",
            tabIndex: 0,
        },
        isDragging,
        position,
        resetPosition,
    };
}
