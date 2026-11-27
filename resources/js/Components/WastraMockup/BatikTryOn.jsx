/*
 * <BatikTryOn> props (all optional except `pattern`):
 * 
 *   /** Motif kain (tile yang bisa diulang). String = URL / data URL gambar. 
 *   pattern: PatternSource | null;
 *   /** Naikkan nilainya bila isi canvas/gambar `pattern` diubah di tempat (identitas objek sama). 
 *   patternVersion?: number;
 * 
 *   /** true = kamera menyala. Ubah ke false untuk mematikan kamera. Default true. 
 *   active?: boolean;
 *   /** Unduh model AI segera saat mount walau active=false. Default true. 
 *   preload?: boolean;
 *   facingMode?: 'user' | 'environment';
 *   /** Balik tampilan seperti cermin. Default: true untuk kamera depan. 
 *   mirror?: boolean;
 *   videoConstraints?: MediaTrackConstraints;
 *   modelSources?: ModelSources;
 *   delegate?: 'GPU' | 'CPU';
 * 
 *   /** Skala motif relatif terhadap lebar bahu. Default 1. 
 *   scale?: number;
 *   /** Rotasi motif (derajat). Default 0. 
 *   rotation?: number;
 *   /** Bayangan/kilap dari baju asli, 0–1. Default 0.8. 
 *   shadeStrength?: number;
 *   /** Kepekatan kain, 0–1. Default 0.95. 
 *   opacity?: number;
 *   /** Motif ikut lipatan kain, 0–1. Default 0.5. 
 *   foldStrength?: number;
 *   /** Seberapa kuat motif mengikuti putaran badan, 0–1.5. Default 1. 
 *   turnStrength?: number;
 *   /** Retakan malam khas batik, 0–1. Default 0.3. 
 *   crackStrength?: number;
 *   /** Batas bawah baju terhadap pinggul (pecahan panjang torso, -0.1–0.5). Default 0.1. 
 *   hemOffset?: number;
 *   /** Pemetaan terpisah untuk lengan baju. Default true. 
 *   sleeveMapping?: boolean;
 * 
 *   /** Dipanggil setiap progres loading berubah (unduh model → inisialisasi → selesai). 
 *   onProgress?: (progress: LoadProgress) => void;
 *   /** Dipanggil setiap status berubah. 
 *   onStatusChange?: (status: BatikStatus) => void;
 *   /** Dipanggil sekali ketika kamera + AI sudah berjalan. 
 *   onReady?: () => void;
 *   onError?: (error: BatikError) => void;
 *   /** Dipanggil saat badan mulai/berhenti terdeteksi. 
 *   onBodyDetectedChange?: (found: boolean) => void;
 * 
 *   /** Tampilkan overlay loading bawaan. Default true. 
 *   showLoadingUI?: boolean;
 *   /** Ganti overlay loading bawaan dengan tampilanmu sendiri. 
 *   renderLoading?: (progress: LoadProgress | null, status: BatikStatus) => ReactNode;
 *   className?: string;
 *   style?: CSSProperties;
 *
 * ref handle: { snapshot(type?, quality?) => Promise<Blob|null>, calibrate(), getStatus() }
 * status: idle | loading-models | models-ready | starting-camera | running | stopped | error
 * progress: { stage: "models"|"initializing"|"done", percent: 0-100, loadedBytes, totalBytes }
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, } from 'react';
import { BatikEngine } from './engine';
import { BatikError, createTrackers, loadBatikAssets, } from './models';

export const BATIK_EFFECTS = {
    shadeStrength: { defaultValue: 0.8, max: 1 },
    opacity: { defaultValue: 0.95, max: 1 },
    foldStrength: { defaultValue: 0.5, max: 1 },
    turnStrength: { defaultValue: 1, max: 1.5 },
    crackStrength: { defaultValue: 0.3, max: 1 },
};

const num = (v, d, min, max) => Math.min(max, Math.max(min, v ?? d));
const readEffect = (value, { defaultValue, max }) => num(value, defaultValue, 0, max);

function readParams(p) {
    return {
        scale: num(p.scale, 1, 0.2, 3),
        rotation: p.rotation ?? 0,
        shade: readEffect(p.shadeStrength, BATIK_EFFECTS.shadeStrength),
        opacity: readEffect(p.opacity, BATIK_EFFECTS.opacity),
        fold: readEffect(p.foldStrength, BATIK_EFFECTS.foldStrength),
        turn: readEffect(p.turnStrength, BATIK_EFFECTS.turnStrength),
        crack: readEffect(p.crackStrength, BATIK_EFFECTS.crackStrength),
        hem: num(p.hemOffset, 0.1, -0.1, 0.5),
        sleeves: p.sleeveMapping ?? true,
    };
}
const mb = (b) => (b / 1e6).toFixed(1);
function DefaultLoading({ progress }) {
    const pct = Math.round(progress?.percent ?? 0);
    const label = progress?.stage === 'models'
        ? `Mengunduh model AI… ${mb(progress.loadedBytes)} / ${mb(progress.totalBytes)} MB`
        : 'Menyiapkan AI dan kamera…';
    return (<div role="status" aria-live="polite" style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,.65)',
            color: '#f3e7cf',
            font: '14px system-ui, sans-serif',
            textAlign: 'center',
            padding: 24,
        }}>
      <div style={{ width: 'min(320px, 80%)' }}>
        <div style={{ marginBottom: 10 }}>{label}</div>
        <div style={{ height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#d9a441', transition: 'width .2s' }}/>
        </div>
        <div style={{ marginTop: 6, opacity: 0.8 }}>{pct}%</div>
      </div>
    </div>);
}
export const BatikTryOn = forwardRef(function BatikTryOn(props, ref) {
    const { pattern, patternVersion, active = true, preload = true, facingMode = 'user', videoConstraints, modelSources, delegate = 'GPU', showLoadingUI = true, renderLoading, className, style, } = props;
    const mirrorOn = props.mirror ?? facingMode === 'user';
    const propsRef = useRef(props);
    propsRef.current = props; // callback & parameter selalu versi terbaru tanpa memulai ulang kamera
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const engineRef = useRef(null);
    const patternRef = useRef(null);
    const statusRef = useRef('idle');
    const [status, setStatusState] = useState('idle');
    const [progress, setProgress] = useState(null);
    const [assets, setAssets] = useState(null);
    const setStatus = useCallback((s) => {
        if (statusRef.current === s)
            return;
        statusRef.current = s;
        setStatusState(s);
        propsRef.current.onStatusChange?.(s);
    }, []);
    const report = useCallback((p) => {
        setProgress(p);
        propsRef.current.onProgress?.(p);
    }, []);
    const fail = useCallback((e) => {
        const err = e instanceof BatikError ? e : new BatikError('unknown', e instanceof Error ? e.message : String(e), e);
        setStatus('error');
        propsRef.current.onError?.(err);
    }, [setStatus]);
    // 1) Unduh model (di-cache; komponen lain dengan sumber sama tidak mengunduh ulang)
    const wantModels = preload || active;
    const sourcesKey = JSON.stringify(modelSources ?? {});
    useEffect(() => {
        if (!wantModels)
            return;
        let off = false;
        setStatus('loading-models');
        loadBatikAssets(modelSources, (p) => !off && report(p))
            .then((a) => {
            if (off)
                return;
            setAssets(a);
            setStatus('models-ready');
        })
            .catch((e) => !off && fail(e));
        return () => {
            off = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wantModels, sourcesKey]);
    // 2) Kamera + AI
    useEffect(() => {
        if (!assets)
            return;
        if (!active) {
            if (statusRef.current === 'running' || statusRef.current === 'starting-camera')
                setStatus('stopped');
            return;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas)
            return;

        let off = false;
        let stream = null;
        let engine = null;
        let trackers = null;
        const release = () => {
            if (stream) {
                stream.getTracks().forEach((track) => {
                    track.removeEventListener('ended', handleCameraEnded);
                    track.stop();
                });
                if (video.srcObject === stream) {
                    video.pause();
                    video.srcObject = null;
                }
                stream = null;
            }
            if (engine) {
                if (engineRef.current === engine) {
                    engineRef.current = null;
                }
                engine.destroy();
                engine = null;
            }
            if (trackers) {
                trackers.seg.close();
                trackers.pose.close();
                trackers = null;
            }
        };
        const handleCameraEnded = () => {
            if (off)
                return;
            release();
            fail(new BatikError('camera-unavailable', 'Kamera terputus'));
        };
        (async () => {
            let running = false;
            try {
                setStatus('starting-camera');
                report({ stage: 'initializing', percent: 95, loadedBytes: 0, totalBytes: 0 });
                trackers = await createTrackers(assets, delegate);
                if (off)
                    return;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode, width: { ideal: 960 }, height: { ideal: 720 }, ...videoConstraints },
                        audio: false,
                    });
                }
                catch (e) {
                    const denied = e instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(e.name);
                    throw new BatikError(denied ? 'camera-denied' : 'camera-unavailable', e instanceof Error ? e.message : 'Kamera tidak tersedia', e);
                }
                if (off)
                    return;
                stream.getVideoTracks().forEach((track) => {
                    track.addEventListener('ended', handleCameraEnded, { once: true });
                });
                video.srcObject = stream;
                await video.play();
                if (off || !stream)
                    return;
                engine = new BatikEngine(canvas, video, trackers.seg, trackers.pose, () => readParams(propsRef.current), (found) => propsRef.current.onBodyDetectedChange?.(found));
                if (patternRef.current)
                    engine.setPattern(patternRef.current);
                engineRef.current = engine;
                engine.start();
                report({ stage: 'done', percent: 100, loadedBytes: 0, totalBytes: 0 });
                setStatus('running');
                propsRef.current.onReady?.();
                running = true;
            }
            catch (e) {
                if (!off && statusRef.current !== 'error')
                    fail(e);
            }
            finally {
                // Kamera atau tracker bisa selesai dibuat setelah komponen dilepas.
                if (!running) release();
            }
        })();
        return () => {
            off = true;
            release();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assets, active, facingMode, delegate]);
    // 3) Motif kain
    useEffect(() => {
        let off = false;
        const apply = (src) => {
            if (off || !src)
                return;
            patternRef.current = src;
            engineRef.current?.setPattern(src);
        };
        if (typeof pattern === 'string') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => apply(img);
            img.onerror = () => !off && fail(new BatikError('pattern-load-failed', 'Gagal memuat gambar motif'));
            img.src = pattern;
        }
        else {
            apply(pattern);
        }
        return () => {
            off = true;
        };
    }, [pattern, patternVersion, fail]);
    useImperativeHandle(ref, () => ({
        calibrate: () => engineRef.current?.calibrate(),
        getStatus: () => statusRef.current,
        snapshot: (type = 'image/jpeg', quality = 0.92) => new Promise((resolve) => {
            const c = canvasRef.current;
            if (!c || !engineRef.current)
                return resolve(null);
            const t = document.createElement('canvas');
            t.width = c.width;
            t.height = c.height;
            const g = t.getContext('2d');
            if (!g)
                return resolve(null);
            if (mirrorOn) {
                g.translate(t.width, 0);
                g.scale(-1, 1);
            }
            g.drawImage(c, 0, 0);
            t.toBlob(resolve, type, quality);
        }),
    }), [mirrorOn]);
    const loading = status === 'loading-models' || (active && ['idle', 'models-ready', 'starting-camera'].includes(status));
    return (<div className={className} style={{ position: 'relative', overflow: 'hidden', background: '#000', ...style }}>
      <video ref={videoRef} playsInline muted style={{ display: 'none' }}/>
      <canvas ref={canvasRef} aria-label="Pratinjau kamera dengan motif batik" style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: mirrorOn ? 'scaleX(-1)' : undefined,
            visibility: status === 'running' ? 'visible' : 'hidden',
        }}/>
      {showLoadingUI && loading && (renderLoading ? renderLoading(progress, status) : <DefaultLoading progress={progress}/>)}
    </div>);
});
