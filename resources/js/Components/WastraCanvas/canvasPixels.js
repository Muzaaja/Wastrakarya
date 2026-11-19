import { PENCIL_COLOR } from "./constants";

const PENCIL_TOLERANCE = 28;
const PENCIL_RED = Number.parseInt(PENCIL_COLOR.slice(1, 3), 16);
const PENCIL_GREEN = Number.parseInt(PENCIL_COLOR.slice(3, 5), 16);
const PENCIL_BLUE = Number.parseInt(PENCIL_COLOR.slice(5, 7), 16);

const isLegacyPencilPixel = (pixels, index) =>
    pixels[index + 3] > 0 &&
    Math.abs(pixels[index] - PENCIL_RED) <= PENCIL_TOLERANCE &&
    Math.abs(pixels[index + 1] - PENCIL_GREEN) <= PENCIL_TOLERANCE &&
    Math.abs(pixels[index + 2] - PENCIL_BLUE) <= PENCIL_TOLERANCE;

export const clearCanvas = (canvas) => {
    canvas
        .getContext("2d")
        .clearRect(0, 0, canvas.width, canvas.height);
};

export const removePencilBeneathWax = (
    pencilCanvas,
    waxCanvas,
    x = 0,
    y = 0,
    width = pencilCanvas.width,
    height = pencilCanvas.height,
) => {
    const sourceX = Math.max(0, Math.floor(x));
    const sourceY = Math.max(0, Math.floor(y));
    const sourceWidth = Math.min(
        pencilCanvas.width - sourceX,
        Math.ceil(width),
    );
    const sourceHeight = Math.min(
        pencilCanvas.height - sourceY,
        Math.ceil(height),
    );

    if (sourceWidth <= 0 || sourceHeight <= 0) {
        return;
    }

    const pencilContext = pencilCanvas.getContext("2d");
    const waxContext = waxCanvas.getContext("2d", {
        willReadFrequently: true,
    });
    const pencilImage = pencilContext.getImageData(
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
    );
    const waxImage = waxContext.getImageData(
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
    );

    for (let index = 3; index < waxImage.data.length; index += 4) {
        if (waxImage.data[index] > 0) {
            pencilImage.data[index] = 0;
        }
    }

    pencilContext.putImageData(pencilImage, sourceX, sourceY);
};

export const loadCanvasDataUrl = (canvas, dataUrl) =>
    new Promise((resolve, reject) => {
        if (!dataUrl) {
            clearCanvas(canvas);
            resolve();
            return;
        }

        const image = new Image();
        image.onload = () => {
            const context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve();
        };
        image.onerror = reject;
        image.src = dataUrl;
    });

export const splitLegacyArtwork = (
    legacyCanvas,
    pencilCanvas,
    waxCanvas,
) => {
    const legacyContext = legacyCanvas.getContext("2d", {
        willReadFrequently: true,
    });
    const legacyImage = legacyContext.getImageData(
        0,
        0,
        legacyCanvas.width,
        legacyCanvas.height,
    );
    const pencilImage = new ImageData(
        legacyCanvas.width,
        legacyCanvas.height,
    );
    const waxImage = new ImageData(
        legacyCanvas.width,
        legacyCanvas.height,
    );

    for (let index = 0; index < legacyImage.data.length; index += 4) {
        const target = isLegacyPencilPixel(legacyImage.data, index)
            ? pencilImage.data
            : waxImage.data;

        target[index] = legacyImage.data[index];
        target[index + 1] = legacyImage.data[index + 1];
        target[index + 2] = legacyImage.data[index + 2];
        target[index + 3] = legacyImage.data[index + 3];
    }

    pencilCanvas.getContext("2d").putImageData(pencilImage, 0, 0);
    waxCanvas.getContext("2d").putImageData(waxImage, 0, 0);
};
