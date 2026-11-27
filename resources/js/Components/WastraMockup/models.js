export class BatikError extends Error {
    constructor(code, message, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'BatikError';
    }
}
const DEFAULT_SOURCES = {
    wasmBaseUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm',
    segmenterModelUrl: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
    poseModelUrl: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
};
// Perkiraan ukuran bila Content-Length tidak tersedia.
const EST_SEG = 16400000;
const EST_POSE = 5800000;
async function fetchBytes(url, onChunk) {
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Gagal mengunduh ${url} (${res.status})`);
    const total = Number(res.headers.get('content-length')) || 0;
    if (!res.body) {
        const buf = new Uint8Array(await res.arrayBuffer());
        onChunk(buf.length, buf.length);
        return buf;
    }
    const reader = res.body.getReader();
    const chunks = [];
    let loaded = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            break;
        chunks.push(value);
        loaded += value.length;
        onChunk(loaded, total);
    }
    const out = new Uint8Array(loaded);
    let off = 0;
    for (const c of chunks) {
        out.set(c, off);
        off += c.length;
    }
    return out;
}
const cache = new Map();
/**
 * Mengunduh model sekali saja (di-cache di memori). Pemanggil berikutnya dengan sumber
 * yang sama langsung mendapat hasil, dan listener-nya tetap menerima progres terakhir.
 * Bisa dipanggil lebih awal (mis. saat halaman dibuka) untuk pemanasan.
 */
export function loadBatikAssets(sources = {}, onProgress) {
    const s = { ...DEFAULT_SOURCES, ...sources };
    const key = JSON.stringify(s);
    let entry = cache.get(key);
    if (!entry) {
        const e = { listeners: new Set(), last: null, promise: null };
        const emit = (p) => {
            e.last = p;
            e.listeners.forEach((f) => f(p));
        };
        e.promise = (async () => {
            emit({ stage: 'models', percent: 0, loadedBytes: 0, totalBytes: EST_SEG + EST_POSE });
            const { FilesetResolver, ImageSegmenter, PoseLandmarker } = await import('@mediapipe/tasks-vision');
            const fileset = await FilesetResolver.forVisionTasks(s.wasmBaseUrl);
            const seg = { l: 0, t: EST_SEG };
            const pose = { l: 0, t: EST_POSE };
            const update = () => {
                const l = seg.l + pose.l;
                const t = seg.t + pose.t;
                emit({ stage: 'models', percent: Math.min(0.99, l / t) * 90, loadedBytes: l, totalBytes: t });
            };
            const [segmenter, poseBuf] = await Promise.all([
                fetchBytes(s.segmenterModelUrl, (l, t) => {
                    seg.l = l;
                    if (t)
                        seg.t = t;
                    update();
                }),
                fetchBytes(s.poseModelUrl, (l, t) => {
                    pose.l = l;
                    if (t)
                        pose.t = t;
                    update();
                }),
            ]);
            emit({ stage: 'initializing', percent: 90, loadedBytes: seg.t + pose.t, totalBytes: seg.t + pose.t });
            return { fileset, segmenter, pose: poseBuf, ImageSegmenter, PoseLandmarker };
        })().catch((err) => {
            cache.delete(key);
            throw new BatikError('model-load-failed', err instanceof Error ? err.message : String(err), err);
        });
        cache.set(key, e);
        entry = e;
    }
    if (onProgress) {
        entry.listeners.add(onProgress);
        if (entry.last)
            onProgress(entry.last);
    }
    const listener = onProgress;
    const e2 = entry;
    return e2.promise.finally(() => {
        if (listener)
            e2.listeners.delete(listener);
    });
}
/** Membuat instance segmenter + pose dari file yang sudah diunduh (GPU, otomatis jatuh ke CPU). */
export async function createTrackers(assets, delegate = 'GPU') {
    const withFallback = async (make) => {
        if (delegate === 'CPU')
            return make('CPU');
        try {
            return await make('GPU');
        }
        catch {
            return make('CPU');
        }
    };
    let seg;
    try {
        seg = await withFallback((d) => assets.ImageSegmenter.createFromOptions(assets.fileset, {
            baseOptions: { modelAssetBuffer: assets.segmenter.slice(), delegate: d },
            runningMode: 'VIDEO',
            outputCategoryMask: true,
            outputConfidenceMasks: false,
        }));
        const pose = await withFallback((d) => assets.PoseLandmarker.createFromOptions(assets.fileset, {
            baseOptions: { modelAssetBuffer: assets.pose.slice(), delegate: d },
            runningMode: 'VIDEO',
            numPoses: 1,
        }));
        return { seg, pose };
    }
    catch (err) {
        seg?.close();
        throw new BatikError('model-load-failed', err instanceof Error ? err.message : String(err), err);
    }
}
