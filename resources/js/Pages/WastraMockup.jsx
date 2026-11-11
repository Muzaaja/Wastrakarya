import React, { useState, useRef, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    RotateCcw, 
    Move, 
    ZoomIn, 
    Download, 
    FileText, 
    Check, 
    Sparkles,
    Sliders
} from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createDefaultKawungPicisTexture, createCustomBatikTexture } from '@/Components/WastraMockup/Shirt3DGenerator';

export default function WastraMockup() {
    const mountRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const shirtMeshRef = useRef(null);
    const textureRef = useRef(null);
    const materialRef = useRef(null);

    // State Parameter 3D
    const [motifScale, setMotifScale] = useState(1.0); // 50% = 0.5, 200% = 2.0
    const [fabricType, setFabricType] = useState('sutra'); // 'sutra' atau 'linen'
    const [activeControlMode, setActiveControlMode] = useState('orbit'); // 'orbit', 'pan', 'zoom'
    const [toastMessage, setToastMessage] = useState(null);

    // State Info Karya
    const [projectTitle, setProjectTitle] = useState('Kawung Picis');
    const [savedDataUrl, setSavedDataUrl] = useState(null);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Muat data karya terakhir dari Studio (LocalStorage)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('wastrakarya_studio_save');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.title && data.title !== 'Karya tanpa judul') {
                    setProjectTitle(data.title);
                } else if (data.motif && data.motif !== 'polos') {
                    // Beri nama sesuai motif batik pakem
                    const motifNames = {
                        kawung: 'Kawung Picis',
                        parang: 'Parang Rusak',
                        ceplok: 'Ceplok Kusumo',
                        truntum: 'Truntum Kencana',
                        sidomukti: 'Sidomukti Keraton',
                        nitik: 'Nitik Karawitan'
                    };
                    setProjectTitle(motifNames[data.motif] || data.motif);
                }
                if (data.dataUrl) {
                    setSavedDataUrl(data.dataUrl);
                }
            }
        } catch (err) {
            console.error('Error reading saved studio data', err);
        }
    }, []);

    // Inisialisasi Three.js Scene, Camera, Lights, dan 3D Shirt Model
    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        // 1. Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // 2. Camera
        const width = container.clientWidth;
        const height = container.clientHeight;
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 0.4, 6.2);
        cameraRef.current = camera;

        // 3. Renderer dengan Anti-Aliasing dan Shadow Map
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            preserveDrawingBuffer: true,
            alpha: true 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 10;
        controls.minDistance = 3;
        controls.maxPolarAngle = Math.PI / 2 + 0.2; // Batasi agar tidak melihat bawah tanah terlalu jauh
        controls.target.set(0, 0.1, 0);
        controlsRef.current = controls;

        // 5. Pencahayaan Studio Mewah (Dramatic Studio Lights)
        // Ambient Light Hijau Hutan Lembut
        const ambientLight = new THREE.AmbientLight(0x1B3428, 0.9);
        scene.add(ambientLight);

        // Key Light (Lampu Utama dari Kiri Atas - Warm White)
        const keyLight = new THREE.DirectionalLight(0xFFF6E8, 2.2);
        keyLight.position.set(-3.5, 4.5, 4.0);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        // Fill Light (Lampu Pengisi dari Kanan Depan - Soft Mint / Sage)
        const fillLight = new THREE.DirectionalLight(0xA4C4B5, 1.1);
        fillLight.position.set(3.5, 2.0, 3.0);
        scene.add(fillLight);

        // Rim Light (Lampu Belakang untuk Aksen Siluet Emas Halus)
        const rimLight = new THREE.DirectionalLight(0xE0CEAB, 1.8);
        rimLight.position.set(0, 3.0, -4.5);
        scene.add(rimLight);

        // Soft Radial Floor Shadow (Bayangan di Bawah Baju)
        const shadowPlaneGeom = new THREE.PlaneGeometry(5, 5);
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const sCtx = shadowCanvas.getContext('2d');
        const grad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 256, 256);
        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({ 
            map: shadowTex, 
            transparent: true, 
            opacity: 0.85,
            depthWrite: false 
        });
        const shadowMesh = new THREE.Mesh(shadowPlaneGeom, shadowMat);
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.set(0, -2.1, 0);
        scene.add(shadowMesh);

        // 6. Buat Tekstur Batik Awal (Kawung Picis) sebagai placeholder
        const initialTex = createDefaultKawungPicisTexture();
        initialTex.wrapS = THREE.RepeatWrapping;
        initialTex.wrapT = THREE.RepeatWrapping;
        initialTex.repeat.set(2, 2);
        initialTex.needsUpdate = true;
        textureRef.current = initialTex;

        // 7. Load model GLTF kemeja dari public/shirt_mockup/scene.gltf
        const loader = new GLTFLoader();
        loader.load(
            '/shirt_mockup/scene.gltf',
            (gltf) => {
                const shirtObject = gltf.scene;

                // Hitung bounding box untuk normalisasi ukuran model
                const box = new THREE.Box3().setFromObject(shirtObject);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.8 / maxDim;

                shirtObject.scale.setScalar(scale);
                // Pindahkan ke pusat, lalu geser sedikit ke bawah
                shirtObject.position.set(
                    -center.x * scale,
                    -center.y * scale + 0.1,
                    -center.z * scale
                );

                // Pasang tekstur batik ke semua mesh
                const batikTex = textureRef.current;
                shirtObject.traverse((node) => {
                    if (node.isMesh) {
                        // Ganti material dengan MeshStandardMaterial menggunakan tekstur batik
                        node.material = new THREE.MeshStandardMaterial({
                            map: batikTex,
                            roughness: 0.38,
                            metalness: 0.08,
                            side: THREE.DoubleSide,
                        });
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });

                shirtMeshRef.current = shirtObject;
                materialRef.current = null; // Material disimpan per-node, bukan satu shared

                scene.add(shirtObject);

                // Jika ada desain pengguna dari LocalStorage, timpa tekstur
                if (savedDataUrl) {
                    createCustomBatikTexture(savedDataUrl, (customTex) => {
                        customTex.wrapS = THREE.RepeatWrapping;
                        customTex.wrapT = THREE.RepeatWrapping;
                        const baseRep = 2 * motifScale;
                        customTex.repeat.set(baseRep, baseRep);
                        customTex.needsUpdate = true;
                        textureRef.current = customTex;
                        shirtObject.traverse((node) => {
                            if (node.isMesh) {
                                node.material.map = customTex;
                                node.material.needsUpdate = true;
                            }
                        });
                    });
                }
            },
            undefined,
            (error) => {
                console.error('GLTF load error:', error);
            }
        );

        // 8. Animasi Render Loop
        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();

            // Rotasi mengambang santai jika kursor tidak sedang berinteraksi
            if (shirtMeshRef.current && (!controls.state || controls.state === -1)) {
                shirtMeshRef.current.rotation.y += 0.0015;
            }

            renderer.render(scene, camera);
        };
        animate();

        // 9. Handle Resize Window
        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const newW = container.clientWidth;
            const newH = container.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup saat komponen unmount
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (renderer.domElement && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    // Update tekstur jika savedDataUrl berubah (setelah scene sudah init)
    useEffect(() => {
        if (!savedDataUrl || !shirtMeshRef.current) return;
        createCustomBatikTexture(savedDataUrl, (customTex) => {
            customTex.wrapS = THREE.RepeatWrapping;
            customTex.wrapT = THREE.RepeatWrapping;
            const baseRep = 2 * motifScale;
            customTex.repeat.set(baseRep, baseRep);
            customTex.needsUpdate = true;
            textureRef.current = customTex;
            shirtMeshRef.current.traverse((node) => {
                if (node.isMesh) {
                    node.material.map = customTex;
                    node.material.needsUpdate = true;
                }
            });
        });
    }, [savedDataUrl]);

    // Update Motif Scale (50% - 200%)
    useEffect(() => {
        if (!textureRef.current) return;
        const baseRep = 2 * motifScale;
        textureRef.current.repeat.set(baseRep, baseRep);
        textureRef.current.needsUpdate = true;
        // Refresh semua mesh material agar texture repeat ter-apply
        if (shirtMeshRef.current) {
            shirtMeshRef.current.traverse((node) => {
                if (node.isMesh && node.material.map) {
                    node.material.map.needsUpdate = true;
                }
            });
        }
    }, [motifScale]);

    // Update Karakteristik Bahan Kain (Sutra vs Linen)
    useEffect(() => {
        if (!shirtMeshRef.current) return;
        shirtMeshRef.current.traverse((node) => {
            if (node.isMesh) {
                if (fabricType === 'sutra') {
                    // Sutra: Halus, berkilau lembut, reflektif
                    node.material.roughness = 0.35;
                    node.material.metalness = 0.1;
                } else {
                    // Linen: Matte, tekstur berserat alami
                    node.material.roughness = 0.88;
                    node.material.metalness = 0.0;
                }
                node.material.needsUpdate = true;
            }
        });
    }, [fabricType]);

    // Kontrol Mode Interaksi (Orbit, Pan, Zoom)
    const handleSetControlMode = (mode) => {
        setActiveControlMode(mode);
        const controls = controlsRef.current;
        if (!controls) return;

        if (mode === 'orbit') {
            controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
            showToast('Mode: Rotasi Bebas (Orbit)');
        } else if (mode === 'pan') {
            controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
            showToast('Mode: Geser Tampilan (Pan)');
        } else if (mode === 'zoom') {
            controls.mouseButtons.LEFT = THREE.MOUSE.DOLLY;
            showToast('Mode: Perbesar / Perkecil (Zoom)');
        }
    };

    // Unduh Mockup (Snapshot High-Res PNG)
    const handleDownloadMockup = () => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        if (!renderer || !scene || !camera) return;

        // Render sekali untuk memastikan buffer terisi
        renderer.render(scene, camera);
        const dataUrl = renderer.domElement.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = `mockup-3d-${projectTitle.toLowerCase().replace(/\s+/g, '-')}-${fabricType}.png`;
        link.href = dataUrl;
        link.click();
        showToast('Mockup 3D berhasil diunduh (PNG)');
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[#07130E] text-[#D8C7A5] select-none font-sans overflow-hidden">
            <Head title={`Simulasi 3D - ${projectTitle} | Wastrakarya`} />

            {/* TOAST NOTIFIKASI */}
            {toastMessage && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#162B21] border border-[#CDB988]/60 text-[#F5EFEB] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm backdrop-blur-md transition-all">
                    <Sparkles size={16} className="text-[#CDB988]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* TOP BAR / NAVBAR */}
            <header className="h-16 px-8 bg-[#091611]/80 backdrop-blur-md border-b border-[#182C24] flex items-center justify-between shrink-0 z-30">
                {/* Logo & Judul Studio */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-baseline gap-2.5 group">
                        <span className="font-heading text-2xl font-bold tracking-wide text-[#E2CEAB] group-hover:text-[#F3E5C8] transition-colors">
                            Wastrakarya
                        </span>
                        <span className="text-[10px] tracking-widest text-[#7E9385] font-semibold uppercase">
                            SIMULASI 3D
                        </span>
                    </Link>
                </div>

                {/* Tombol Kembali ke Studio */}
                <div>
                    <Link
                        href="/canvas"
                        className="flex items-center gap-2 text-xs font-medium text-[#7E9385] hover:text-[#E2CEAB] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#11241C]"
                    >
                        <ArrowLeft size={14} />
                        <span>Kembali ke Studio</span>
                    </Link>
                </div>
            </header>

            {/* MAIN WORKSPACE LAYOUT */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* 1. INFORMASI JUDUL KARYA (KIRI ATAS) */}
                <div className="absolute top-8 left-8 z-20 pointer-events-none">
                    <h1 className="font-heading text-4xl font-bold text-[#E2CEAB] tracking-wide">
                        {projectTitle}
                    </h1>
                    <p className="text-sm text-[#7E9385] mt-1 font-medium">
                        Kemeja lengan panjang
                    </p>
                </div>

                {/* 2. AREA VIEWPORT THREE.JS 3D MOCKUP (TENGAH) */}
                <div className="flex-1 h-full w-full relative flex items-center justify-center overflow-hidden">
                    {/* Radial Spotlight Background Effect */}
                    <div className="absolute inset-0 bg-radial from-[#132A20]/80 via-[#0A1812]/90 to-[#07130E] pointer-events-none" />

                    {/* Kontainer WebGL Three.js */}
                    <div 
                        ref={mountRef} 
                        className="w-full h-full relative cursor-grab active:cursor-grabbing z-10" 
                    />

                    {/* Floating Controls di Bawah Baju (Orbit, Pan, Zoom) */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                        <div className="bg-[#0B1813]/90 backdrop-blur-md border border-[#1E362C] rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl">
                            {/* Tombol Orbit */}
                            <button
                                onClick={() => handleSetControlMode('orbit')}
                                title="Mode Rotasi Bebas"
                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
                                    activeControlMode === 'orbit'
                                        ? 'bg-[#CDB988] text-[#0A1612] shadow-md font-semibold'
                                        : 'text-[#9CB0A4] hover:bg-[#142820] hover:text-[#E2CEAB]'
                                }`}
                            >
                                <RotateCcw size={18} />
                                <span className="text-[10px] mt-1 font-medium">Orbit</span>
                            </button>

                            {/* Tombol Pan */}
                            <button
                                onClick={() => handleSetControlMode('pan')}
                                title="Mode Geser Tampilan"
                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
                                    activeControlMode === 'pan'
                                        ? 'bg-[#CDB988] text-[#0A1612] shadow-md font-semibold'
                                        : 'text-[#9CB0A4] hover:bg-[#142820] hover:text-[#E2CEAB]'
                                }`}
                            >
                                <Move size={18} />
                                <span className="text-[10px] mt-1 font-medium">Pan</span>
                            </button>

                            {/* Tombol Zoom */}
                            <button
                                onClick={() => handleSetControlMode('zoom')}
                                title="Mode Perbesar"
                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
                                    activeControlMode === 'zoom'
                                        ? 'bg-[#CDB988] text-[#0A1612] shadow-md font-semibold'
                                        : 'text-[#9CB0A4] hover:bg-[#142820] hover:text-[#E2CEAB]'
                                }`}
                            >
                                <ZoomIn size={18} />
                                <span className="text-[10px] mt-1 font-medium">Zoom</span>
                            </button>
                        </div>

                        {/* Petunjuk Interaksi Bawah */}
                        <p className="text-[11px] text-[#7E9385]/80 font-medium">
                            Geser untuk memutar · Scroll untuk memperbesar
                        </p>
                    </div>

                    {/* PRATINJAU BUSANA (KIRI BAWAH) */}
                    <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
                        <p className="text-[10px] tracking-widest text-[#7E9385] uppercase font-semibold">
                            PRATINJAU BUSANA
                        </p>
                        <p className="text-xs text-[#E2CEAB] font-medium mt-0.5 capitalize">
                            {fabricType} · Motif {Math.round(motifScale * 100)}%
                        </p>
                    </div>
                </div>

                {/* 3. PANEL SEBELAH KANAN (PARAMETER 3D) */}
                <aside className="w-80 h-full p-6 flex flex-col justify-center z-20 shrink-0">
                    <div className="bg-[#0A1712] border border-[#1E362C] rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
                        <div>
                            {/* Header Panel */}
                            <h2 className="font-heading text-2xl font-semibold text-[#E2CEAB]">
                                Parameter 3D
                            </h2>
                            <p className="text-xs text-[#7E9385] mt-1 mb-6">
                                Sesuaikan tampilan karyamu.
                            </p>

                            {/* Kontrol 1: Motif Scale */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between text-xs mb-3">
                                    <span className="font-medium text-[#BACDC2]">Motif Scale</span>
                                    <span className="bg-[#08140F] border border-[#182C24] text-[#E2CEAB] text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-lg">
                                        {Math.round(motifScale * 100)}%
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="0.5"
                                    max="2.0"
                                    step="0.05"
                                    value={motifScale}
                                    onChange={(e) => setMotifScale(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-[#182C24] rounded-lg appearance-none cursor-pointer accent-[#D5BD8A]"
                                />

                                <div className="flex items-center justify-between text-[11px] text-[#7E9385] mt-1.5">
                                    <span>50%</span>
                                    <span>200%</span>
                                </div>
                            </div>

                            {/* Kontrol 2: Fabric Type (Sutra vs Linen) */}
                            <div className="mb-8">
                                <p className="text-xs font-medium text-[#7E9385] mb-3">
                                    Fabric Type
                                </p>

                                <div className="flex flex-col gap-2.5">
                                    {/* Pilihan: Sutra */}
                                    <div
                                        onClick={() => {
                                            setFabricType('sutra');
                                            showToast('Bahan: Sutra (Kilau Halus)');
                                        }}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                            fabricType === 'sutra'
                                                ? 'bg-[#142920] border-[#CDB988] shadow-sm'
                                                : 'bg-[#08140F] border-[#182C24] hover:border-[#2C483A]'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                                            fabricType === 'sutra' ? 'border-[#CDB988]' : 'border-[#7E9385]'
                                        }`}>
                                            {fabricType === 'sutra' && (
                                                <div className="w-2 h-2 rounded-full bg-[#CDB988]" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-[#F5EFEB]">Sutra</h4>
                                            <p className="text-[11px] text-[#7E9385] mt-0.5">
                                                Halus dengan kilau yang lembut
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pilihan: Linen */}
                                    <div
                                        onClick={() => {
                                            setFabricType('linen');
                                            showToast('Bahan: Linen (Serat Alami)');
                                        }}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                            fabricType === 'linen'
                                                ? 'bg-[#142920] border-[#CDB988] shadow-sm'
                                                : 'bg-[#08140F] border-[#182C24] hover:border-[#2C483A]'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                                            fabricType === 'linen' ? 'border-[#CDB988]' : 'border-[#7E9385]'
                                        }`}>
                                            {fabricType === 'linen' && (
                                                <div className="w-2 h-2 rounded-full bg-[#CDB988]" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-semibold text-[#F5EFEB]">Linen</h4>
                                            <p className="text-[11px] text-[#7E9385] mt-0.5">
                                                Tekstur alami, ringan & berkarakter
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Unduh Mockup */}
                        <div className="pt-4 border-t border-[#182C24]">
                            <div className="flex items-center gap-2 text-xs text-[#7E9385] mb-3">
                                <FileText size={14} className="text-[#CDB988]" />
                                <div>
                                    <p className="font-medium text-[#BACDC2]">Mockup siap diunduh</p>
                                    <p className="text-[10px]">PNG resolusi tinggi</p>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadMockup}
                                className="w-full bg-[#D5BD8A] hover:bg-[#C4AC79] active:scale-95 text-[#0A1612] font-semibold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={16} />
                                <span>Unduh Mockup</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
