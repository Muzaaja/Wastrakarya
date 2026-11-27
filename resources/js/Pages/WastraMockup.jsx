import React, { useState, useRef, useEffect } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    RotateCcw,
    Move,
    ZoomIn,
    Download,
    Sparkles,
    Loader2,
    Box,
    RectangleHorizontal,
    Shirt,
    Video,
} from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { BATIK_EFFECTS } from "@/Components/WastraMockup/BatikTryOn";
import CameraMockup from "@/Components/WastraMockup/CameraMockup";
import MockupSlider from "@/Components/WastraMockup/MockupSlider";
import SkyboxPicker from "@/Components/WastraMockup/SkyboxPicker";
import { createScreenSpaceLensFlare } from "@/Components/WastraMockup/screenSpaceLensFlare";
import {
    createBatikTexture,
    createCustomBatikPattern,
    createDefaultKawungPicisPattern,
} from "@/Components/WastraMockup/Shirt3DGenerator";
import {
    isStoredDrawingScopedTo,
    normalizeStoredDrawing,
    shouldUseStoredDrawing,
} from "@/Components/WastraCanvas/drawingStorage";

const MOTIF_NAMES = {
    kawung: "Kawung",
    parang: "Parang",
    ceplok: "Ceplok",
    truntum: "Truntum",
    sidomukti: "Sidomukti",
    nitik: "Nitik",
    polos: "Polos",
};

const MOCKUP_MODELS = {
    shirt: {
        label: "Baju",
        icon: Shirt,
        description: "Kemeja lengan panjang",
        path: "/shirt_mockup/scene.gltf",
        rotationY: 0,
    },
    cloth: {
        label: "Kain Gantung",
        icon: RectangleHorizontal,
        description: "Kain gantung",
        path: "/cloth_mockup/hanging-cloth.glb",
        rotationY: Math.PI,
    },
};

const MOCKUP_MODES = [
    { mode: "3d", label: "Mockup 3D", icon: Box },
    { mode: "camera", label: "Kamera AI", icon: Video },
];

const SKYBOX_CAMERA_DISTANCE = 7.3;
const SKYBOX_MIN_FOV = 45;
const SKYBOX_MAX_FOV = 115;

const SKYBOX_ENVIRONMENT_INTENSITY = 0.65;

const CAMERA_EFFECT_LABELS = {
    shadeStrength: "Bayangan dan Kilap Baju",
    opacity: "Kepekatan Motif",
    foldStrength: "Ikuti Lipatan Kain",
    turnStrength: "Ikuti Putaran Badan",
    crackStrength: "Retakan Malam",
};

const CONTROL_MODES = {
    orbit: {
        icon: RotateCcw,
        label: "Orbit",
        description: "Mode Rotasi Bebas",
        mouseButton: THREE.MOUSE.ROTATE,
    },
    pan: {
        icon: Move,
        label: "Pan",
        description: "Mode Geser Tampilan",
        mouseButton: THREE.MOUSE.PAN,
    },
    zoom: {
        icon: ZoomIn,
        label: "Zoom",
        description: "Mode Perbesar / Perkecil",
        mouseButton: THREE.MOUSE.DOLLY,
    },
};

const disposeMockupModel = (model) => {
    model.traverse((node) => {
        if (!node.isMesh) return;

        node.geometry?.dispose();

        const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];
        materials.forEach((material) => material?.dispose());
    });
};

export default function WastraMockup({
    initialDrawing = null,
    mockupId = null,
}) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const controlsRef = useRef(null);
    const mockupModelRef = useRef(null);
    const textureRef = useRef(null);
    const captureMockupRef = useRef(null);

    // State Parameter 3D
    const [motifScale, setMotifScale] = useState(1.0); // 50% = 0.5, 200% = 2.0
    const motifScaleRef = useRef(motifScale);
    const [cameraEffects, setCameraEffects] = useState(() =>
        Object.fromEntries(
            Object.entries(BATIK_EFFECTS).map(([prop, { defaultValue }]) => [
                prop,
                defaultValue,
            ]),
        ),
    );
    const [fabricType, setFabricType] = useState("sutra"); // 'sutra' atau 'linen'
    const fabricTypeRef = useRef(fabricType);
    const [mockupMode, setMockupMode] = useState("3d");
    const [modelType, setModelType] = useState("shirt");
    const [skyboxFile, setSkyboxFile] = useState(null);
    const [skyboxStatus, setSkyboxStatus] = useState("idle");
    const [skyboxBrightness, setSkyboxBrightness] = useState(0.35);
    const skyboxBrightnessRef = useRef(skyboxBrightness);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [modelLoadError, setModelLoadError] = useState(false);
    const [activeControlMode, setActiveControlMode] = useState("orbit");
    const activeControlModeRef = useRef(activeControlMode);
    const [autoRotate, setAutoRotate] = useState(true);
    const autoRotateRef = useRef(autoRotate);
    const [rotationDegrees, setRotationDegrees] = useState(0);
    const [toastMessage, setToastMessage] = useState(null);

    motifScaleRef.current = motifScale;
    fabricTypeRef.current = fabricType;
    skyboxBrightnessRef.current = skyboxBrightness;

    // State Info Karya
    const [projectTitle, setProjectTitle] = useState(null);
    const [pattern, setPattern] = useState(null);
    const defaultPatternRef = useRef(null);

    const isCameraMode = mockupMode === "camera";

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Auth user (shared secara global oleh middleware Inertia)
    const { auth } = usePage().props;
    const user = auth?.user ?? null;

    // Gunakan motif dan warna kain yang sama untuk model 3D dan kamera.
    useEffect(() => {
        let drawing = initialDrawing;

        // Snapshot hanya menjadi pemulihan ketika cocok dengan kanvas dan pengguna,
        // serta lebih baru dari data server atau server belum memiliki gambar.
        try {
            const snapshot = sessionStorage.getItem(
                "wastrakarya_mockup_snapshot",
            );
            if (snapshot) {
                const parsedSnapshot = JSON.parse(snapshot);
                const isMatchingScope = isStoredDrawingScopedTo(
                    parsedSnapshot,
                    {
                        canvasId: mockupId,
                        userId: user?.id ?? null,
                        ownerId: initialDrawing?.user_id ?? null,
                        allowLegacyGuest: !user,
                    },
                );

                if (
                    isMatchingScope &&
                    shouldUseStoredDrawing(parsedSnapshot, initialDrawing)
                ) {
                    drawing = parsedSnapshot;
                }
            }
        } catch (err) {
            console.error("Error reading mockup snapshot", err);
        }

        // Halaman mockup tamu tetap menggunakan simpanan lokal seperti sebelumnya.
        if (!drawing && !mockupId && !user) {
            try {
                const saved = localStorage.getItem("wastrakarya_studio_save");
                if (saved) {
                    const parsedDrawing = JSON.parse(saved);
                    if (
                        isStoredDrawingScopedTo(parsedDrawing, {
                            canvasId: null,
                            userId: null,
                            allowLegacyGuest: true,
                        })
                    ) {
                        drawing = parsedDrawing;
                    }
                }
            } catch (err) {
                console.error("Error reading saved studio data", err);
            }
        }

        const normalizedDrawing = normalizeStoredDrawing(drawing);
        const drawingDataUrl = normalizedDrawing.dataUrl;
        defaultPatternRef.current ??= createDefaultKawungPicisPattern();
        setPattern(defaultPatternRef.current);

        if (drawingDataUrl) {
            setProjectTitle(
                drawing.title ||
                    MOTIF_NAMES[drawing.motif] ||
                    drawing.motif ||
                    null,
            );

            let isCancelled = false;
            createCustomBatikPattern(
                drawingDataUrl,
                normalizedDrawing.fabricColor,
                (drawingPattern) => {
                    if (!isCancelled) setPattern(drawingPattern);
                },
            );

            return () => {
                isCancelled = true;
            };
        }

        setProjectTitle(null);
    }, [initialDrawing, mockupId, user]);

    // Inisialisasi Three.js Scene, Camera, Lights, dan tekstur batik
    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: true,
                alpha: true,
            });
        } catch (error) {
            console.error("Gagal menyiapkan pratinjau 3D", error);
            setIsModelLoading(false);
            setModelLoadError(true);
            return;
        }

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const skyboxScene = new THREE.Scene();
        skyboxScene.backgroundBlurriness = 0.05;
        const lensFlare = createScreenSpaceLensFlare(renderer);
        const skyboxCamera = new THREE.PerspectiveCamera(
            SKYBOX_MIN_FOV,
            width / height,
            0.1,
            100,
        );

        const camera = new THREE.PerspectiveCamera(
            40,
            width / height,
            0.1,
            100,
        );
        camera.position.set(0, 0.4, 6.2);

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);

        // Orbit Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 10;
        controls.minDistance = 3;
        controls.maxPolarAngle = Math.PI / 2 + 0.2; // Batasi agar tidak melihat bawah tanah terlalu jauh
        controls.target.set(0, 0.1, 0);
        controls.mouseButtons.LEFT =
            CONTROL_MODES[activeControlModeRef.current].mouseButton;
        controlsRef.current = controls;

        // Pencahayaan studio
        // Ambient Light Hijau Hutan Lembut
        const ambientLight = new THREE.AmbientLight(0x1b3428, 0.9);
        scene.add(ambientLight);

        // Key Light (Lampu Utama dari Kiri Atas - Warm White)
        const keyLight = new THREE.DirectionalLight(0xfff6e8, 2.2);
        keyLight.position.set(-3.5, 4.5, 4.0);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        // Fill Light (Lampu Pengisi dari Kanan Depan - Soft Mint / Sage)
        const fillLight = new THREE.DirectionalLight(0xa4c4b5, 1.1);
        fillLight.position.set(3.5, 2.0, 3.0);
        scene.add(fillLight);

        // Rim Light (Lampu Belakang untuk Aksen Siluet Emas Halus)
        const rimLight = new THREE.DirectionalLight(0xe0ceab, 1.8);
        rimLight.position.set(0, 3.0, -4.5);
        scene.add(rimLight);

        // Soft Radial Floor Shadow (Bayangan di Bawah Baju)
        const shadowPlaneGeom = new THREE.PlaneGeometry(5, 5);
        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const sCtx = shadowCanvas.getContext("2d");
        const grad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
        grad.addColorStop(0, "rgba(0, 0, 0, 0.45)");
        grad.addColorStop(0.5, "rgba(0, 0, 0, 0.2)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 256, 256);
        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
        });
        const shadowMesh = new THREE.Mesh(shadowPlaneGeom, shadowMat);
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.set(0, -2.1, 0);
        scene.add(shadowMesh);

        const renderMockup = () => {
            skyboxScene.background = scene.environment;
            if (skyboxScene.background) {
                const brightness = skyboxBrightnessRef.current;
                skyboxScene.backgroundIntensity = brightness;
                scene.environmentIntensity = SKYBOX_ENVIRONMENT_INTENSITY * brightness;
                const skyboxFov = THREE.MathUtils.mapLinear(
                    controls.getDistance(),
                    controls.minDistance,
                    controls.maxDistance,
                    SKYBOX_MIN_FOV,
                    SKYBOX_MAX_FOV,
                );
                if (Math.abs(skyboxCamera.fov - skyboxFov) > 0.01) {
                    skyboxCamera.fov = skyboxFov;
                    skyboxCamera.updateProjectionMatrix();
                }

                skyboxCamera.quaternion.copy(camera.quaternion);
                renderer.render(skyboxScene, skyboxCamera);
                renderer.autoClearColor = false;
            }

            try {
                renderer.render(scene, camera);
            } finally {
                renderer.autoClearColor = true;
            }

            if (skyboxScene.background) {
                lensFlare.render();
            }
        };

        captureMockupRef.current = () => {
            renderMockup();
            return renderer.domElement.toDataURL("image/png");
        };

        // Animasi Render Loop
        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();

            // Rotasi mengambang santai jika kursor tidak sedang berinteraksi
            if (
                autoRotateRef.current &&
                mockupModelRef.current &&
                (!controls.state || controls.state === -1)
            ) {
                mockupModelRef.current.rotation.y += 0.0015;
            }

            renderMockup();
        };
        animate();

        // Handle Resize
        let lastWidth = width;
        let lastHeight = height;
        const resizeObserver = new ResizeObserver(() => {
            const newW = container.clientWidth;
            const newH = container.clientHeight;
            if (!newW || !newH || (newW === lastWidth && newH === lastHeight)) {
                return;
            }
            lastWidth = newW;
            lastHeight = newH;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            skyboxCamera.aspect = camera.aspect;
            skyboxCamera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        });
        resizeObserver.observe(container);

        // Cleanup saat komponen unmount
        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
            controls.dispose();
            if (
                renderer.domElement &&
                container.contains(renderer.domElement)
            ) {
                container.removeChild(renderer.domElement);
            }
            if (mockupModelRef.current) {
                scene.remove(mockupModelRef.current);
                disposeMockupModel(mockupModelRef.current);
                mockupModelRef.current = null;
            }
            textureRef.current?.dispose();
            scene.environment?.dispose();
            scene.environment = null;
            skyboxScene.background = null;
            lensFlare.dispose();
            shadowPlaneGeom.dispose();
            shadowMat.dispose();
            shadowTex.dispose();
            keyLight.shadow.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            textureRef.current = null;
            sceneRef.current = null;
            controlsRef.current = null;
            captureMockupRef.current = null;
        };
    }, [isCameraMode]);

    useEffect(() => {
        const scene = sceneRef.current;
        const controls = controlsRef.current;
        if (isCameraMode || !skyboxFile || !scene || !controls) return;

        const abortController = new AbortController();
        const { signal } = abortController;
        let texture;
        setSkyboxStatus("loading");

        const loadSkybox = async () => {
            try {
                const Loader = skyboxFile.endsWith(".exr")
                    ? (await import("three/addons/loaders/EXRLoader.js")).EXRLoader
                    : (await import("three/addons/loaders/HDRLoader.js")).HDRLoader;
                const response = await fetch(`/hdri/${encodeURIComponent(skyboxFile)}`, { signal });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.arrayBuffer();
                if (signal.aborted) return;

                texture = new Loader().createDataTexture(data);
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = texture;

                const distance = controls.getDistance();
                if (distance < SKYBOX_CAMERA_DISTANCE) {
                    controls.dollyOut(distance / SKYBOX_CAMERA_DISTANCE);
                }

                setSkyboxStatus("ready");
            } catch (error) {
                if (signal.aborted) return;

                console.error(`HDRI load error for ${skyboxFile}:`, error);
                setSkyboxFile(null);
                setSkyboxStatus("error");
            }
        };

        loadSkybox();

        return () => {
            abortController.abort();
            if (texture && scene.environment === texture) {
                scene.environment = null;
                texture.dispose();
            }
        };
    }, [isCameraMode, skyboxFile]);

    // Muat dan ganti model mockup tanpa membuat ulang scene WebGL
    useEffect(() => {
        const scene = sceneRef.current;
        if (isCameraMode || !scene) return;

        const selectedModel = MOCKUP_MODELS[modelType];
        let isCancelled = false;
        setIsModelLoading(true);
        setModelLoadError(false);

        const loader = new GLTFLoader();
        loader.load(
            selectedModel.path,
            (gltf) => {
                const mockupObject = gltf.scene;

                if (isCancelled) {
                    disposeMockupModel(mockupObject);
                    return;
                }

                mockupObject.rotation.y = selectedModel.rotationY;
                mockupObject.updateMatrixWorld(true);

                const box = new THREE.Box3().setFromObject(mockupObject);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDimension = Math.max(size.x, size.y, size.z);
                const normalizedScale = 3.8 / maxDimension;

                mockupObject.scale.setScalar(normalizedScale);
                mockupObject.position.set(
                    -center.x * normalizedScale,
                    -center.y * normalizedScale + 0.1,
                    -center.z * normalizedScale,
                );

                const isSilk = fabricTypeRef.current === "sutra";
                mockupObject.traverse((node) => {
                    if (!node.isMesh) return;

                    node.material = new THREE.MeshStandardMaterial({
                        map: textureRef.current,
                        roughness: isSilk ? 0.35 : 0.88,
                        metalness: isSilk ? 0.1 : 0,
                        side: THREE.DoubleSide,
                    });
                    node.castShadow = true;
                    node.receiveShadow = true;
                });

                const previousModel = mockupModelRef.current;
                scene.add(mockupObject);
                mockupModelRef.current = mockupObject;
                if (!autoRotateRef.current) {
                    setRotationDegrees(THREE.MathUtils.radToDeg(mockupObject.rotation.y));
                }

                if (previousModel) {
                    scene.remove(previousModel);
                    disposeMockupModel(previousModel);
                }

                setIsModelLoading(false);
            },
            undefined,
            (error) => {
                if (isCancelled) return;

                console.error(`GLTF load error for ${modelType}:`, error);
                setIsModelLoading(false);
                setModelLoadError(true);
            },
        );

        return () => {
            isCancelled = true;
        };
    }, [isCameraMode, modelType]);

    // Buat tekstur Three.js dari kanvas motif.
    useEffect(() => {
        if (isCameraMode || !pattern) return;

        const texture = createBatikTexture(pattern);
        const baseRepeat = 2 * motifScaleRef.current;
        texture.repeat.set(baseRepeat, baseRepeat);

        const previousTexture = textureRef.current;
        textureRef.current = texture;
        mockupModelRef.current?.traverse((node) => {
            if (node.isMesh) {
                node.material.map = texture;
                node.material.needsUpdate = true;
            }
        });
        previousTexture?.dispose();
    }, [isCameraMode, pattern]);

    // Update Motif Scale (50% - 200%)
    useEffect(() => {
        if (!textureRef.current) return;
        const baseRep = 2 * motifScale;
        textureRef.current.repeat.set(baseRep, baseRep);
        textureRef.current.needsUpdate = true;
        // Refresh semua mesh material agar texture repeat ter-apply
        if (mockupModelRef.current) {
            mockupModelRef.current.traverse((node) => {
                if (node.isMesh && node.material.map) {
                    node.material.map.needsUpdate = true;
                }
            });
        }
    }, [motifScale]);

    // Update Karakteristik Bahan Kain (Sutra vs Linen)
    useEffect(() => {
        if (!mockupModelRef.current) return;
        mockupModelRef.current.traverse((node) => {
            if (node.isMesh) {
                if (fabricType === "sutra") {
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
        activeControlModeRef.current = mode;
        const controls = controlsRef.current;
        if (!controls) return;

        const { mouseButton, description } = CONTROL_MODES[mode];
        controls.mouseButtons.LEFT = mouseButton;
        showToast(description);
    };

    const handleToggleAutoRotate = () => {
        const nextAutoRotate = !autoRotate;
        autoRotateRef.current = nextAutoRotate;
        setAutoRotate(nextAutoRotate);

        if (!nextAutoRotate && mockupModelRef.current) {
            const degrees = THREE.MathUtils.radToDeg(mockupModelRef.current.rotation.y);
            setRotationDegrees(Math.round(THREE.MathUtils.euclideanModulo(degrees, 360)));
        }
    };

    const handleManualRotation = (degrees) => {
        if (!mockupModelRef.current) return;

        mockupModelRef.current.rotation.y = THREE.MathUtils.degToRad(degrees);
        setRotationDegrees(degrees);
    };

    const normalizedTitle = (projectTitle || "wastra")
        .toLowerCase()
        .replace(/\s+/g, "-");

    // Unduh Mockup (Snapshot High-Res PNG)
    const handleDownloadMockup = () => {
        const dataUrl = captureMockupRef.current?.();
        if (!dataUrl) return;

        const link = document.createElement("a");
        link.download = `mockup-3d-${normalizedTitle}-${modelType}-${fabricType}.png`;
        link.href = dataUrl;
        link.click();
        showToast("Mockup 3D berhasil diunduh (PNG)");
    };

    return (
        <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#07130E] font-sans text-[#D8C7A5] select-none">
            <Head title={projectTitle ? `Mockup ${projectTitle}` : "WastraMockup"} />

            {/* TOAST NOTIFIKASI */}
            {toastMessage && (
                <div
                    role="status"
                    className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#162B21] border border-[#CDB988]/60 text-[#F5EFEB] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-sm backdrop-blur-md transition-all"
                >
                    <Sparkles size={16} className="text-[#CDB988]" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* TOP BAR / NAVBAR */}
            <header className="h-16 px-4 sm:px-8 bg-[#091611]/80 backdrop-blur-md border-b border-[#182C24] flex items-center justify-between gap-2 shrink-0 z-30">
                {/* Logo & Judul Studio */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <img width={40} src="/logo-wastrakarya.svg" alt="" />
                        <span className="font-heading text-xl sm:text-2xl font-bold tracking-wide text-[#E2CEAB] group-hover:text-[#F3E5C8] transition-colors">
                            Wastrakarya
                        </span>
                    </Link>
                </div>

                {/* Tombol Kembali ke Studio */}
                <div>
                    <Link
                        href={mockupId ? `/canvas/${mockupId}` : "/canvas"}
                        className="flex items-center gap-2 text-xs font-medium text-[#7E9385] hover:text-[#E2CEAB] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#11241C]"
                    >
                        <ArrowLeft size={14} />
                        <span>Kembali ke Studio</span>
                    </Link>
                </div>
            </header>

            <div className="flex shrink-0 flex-col items-center gap-2.5 border-b border-[#182C24] bg-[#091611] px-3 py-2.5">
                <div
                    role="group"
                    aria-label="Pilih mode mockup"
                    className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl border border-[#1E362C] bg-[#07130E] p-1"
                >
                    {MOCKUP_MODES.map(({ mode, label, icon: Icon }) => (
                        <button
                            key={mode}
                            type="button"
                            aria-pressed={mockupMode === mode}
                            onClick={() => setMockupMode(mode)}
                            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5BD8A] sm:gap-2 sm:text-sm ${
                                mockupMode === mode
                                    ? "bg-[#CDB988] text-[#0A1612]"
                                    : "text-[#A8BCB1] hover:bg-[#142820] hover:text-[#E2CEAB]"
                            }`}
                        >
                            <Icon
                                size={16}
                                className="shrink-0"
                                aria-hidden="true"
                            />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>

                {!isCameraMode && (
                    <div role="group" aria-label="Pilih model 3D" className="flex gap-2">
                        {Object.entries(MOCKUP_MODELS).map(([type, { label, icon: Icon }]) => (
                            <button
                                key={type}
                                type="button"
                                aria-pressed={modelType === type}
                                onClick={() => setModelType(type)}
                                className={`flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D5BD8A] ${
                                    modelType === type
                                        ? "border-[#CDB988] bg-[#142920] text-[#E2CEAB]"
                                        : "border-[#1E362C] text-[#A8BCB1] hover:bg-[#142820] hover:text-[#E2CEAB]"
                                }`}
                            >
                                <Icon size={14} className="shrink-0" aria-hidden="true" />
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* MAIN WORKSPACE LAYOUT */}
            <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
                {/* 1. INFORMASI JUDUL KARYA (KIRI ATAS) */}
                {projectTitle && (
                    <div
                        className={`pointer-events-none absolute top-4 left-4 z-20 max-w-[80%] lg:top-8 lg:left-8 lg:max-w-[50%] ${
                            isCameraMode
                                ? ""
                                : "rounded-xl bg-[#0B1813]/90 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4 sm:py-3"
                        }`}
                    >
                        <h1 className="truncate font-heading text-2xl font-bold tracking-wide text-[#E2CEAB] lg:text-4xl">
                            {projectTitle}
                        </h1>
                        {!isCameraMode && (
                            <p className="mt-1 text-sm font-medium text-[#BACDC2]">
                                {MOCKUP_MODELS[modelType].description}
                            </p>
                        )}
                    </div>
                )}

                {isCameraMode ? (
                    <CameraMockup
                        pattern={pattern}
                        scale={motifScale}
                        effects={cameraEffects}
                        filename={`mockup-kamera-${normalizedTitle}.png`}
                        hasProjectTitle={Boolean(projectTitle)}
                    />
                ) : (
                    <div className="relative flex h-[50dvh] min-h-[18rem] min-w-0 shrink-0 items-center justify-center overflow-hidden lg:h-auto lg:min-h-0 lg:flex-1">
                        {/* Radial Spotlight Background Effect */}
                        <div className="absolute inset-0 bg-radial from-[#132A20]/80 via-[#0A1812]/90 to-[#07130E] pointer-events-none" />

                        {/* Kontainer WebGL Three.js */}
                        <div
                            ref={mountRef}
                            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                        />

                        {/* Status pemuatan model saat pengguna mengganti mockup */}
                        {(isModelLoading || modelLoadError) && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                <div className="flex items-center gap-2.5 rounded-full border border-[#2C483A] bg-[#0B1813]/90 px-4 py-2 text-xs font-medium text-[#BACDC2] shadow-xl backdrop-blur-md">
                                    {isModelLoading ? (
                                        <>
                                            <Loader2
                                                size={16}
                                                className="animate-spin text-[#D5BD8A]"
                                            />
                                            <span>
                                                Memuat model{" "}
                                                {MOCKUP_MODELS[modelType].label}...
                                            </span>
                                        </>
                                    ) : (
                                        <span>Model gagal dimuat.</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Floating Controls di Bawah Baju (Orbit, Pan, Zoom) */}
                        <div className="absolute inset-x-0 bottom-4 z-20 flex flex-col items-center gap-2 lg:bottom-10">
                            {!autoRotate && (
                                <label className="flex w-64 max-w-[90%] flex-col gap-1 rounded-xl border border-[#1E362C] bg-[#0B1813]/90 px-3 py-2 text-xs text-[#BACDC2] shadow-md backdrop-blur-md">
                                    <span className="flex justify-between gap-2">
                                        Rotasi model
                                        <span aria-hidden="true">{rotationDegrees}°</span>
                                    </span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        value={rotationDegrees}
                                        aria-label="Rotasi model"
                                        aria-valuetext={`${rotationDegrees} derajat`}
                                        disabled={isModelLoading || modelLoadError}
                                        onChange={(event) => handleManualRotation(event.currentTarget.valueAsNumber)}
                                        className="h-6 w-full cursor-pointer accent-[#D5BD8A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D5BD8A] disabled:cursor-not-allowed"
                                    />
                                </label>
                            )}
                            <div className="bg-[#0B1813]/90 backdrop-blur-md border border-[#1E362C] rounded-2xl p-1.5 flex items-center gap-2 shadow-2xl">
                                {Object.entries(CONTROL_MODES).map(
                                    ([mode, { icon: Icon, label, description }]) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => handleSetControlMode(mode)}
                                            aria-pressed={activeControlMode === mode}
                                            title={description}
                                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
                                                activeControlMode === mode
                                                    ? "bg-[#CDB988] text-[#0A1612] shadow-md font-semibold"
                                                    : "text-[#9CB0A4] hover:bg-[#142820] hover:text-[#E2CEAB]"
                                            }`}
                                        >
                                            <Icon size={18} aria-hidden="true" />
                                            <span className="mt-1 text-[10px] font-medium">
                                                {label}
                                            </span>
                                        </button>
                                    ),
                                )}
                                <button
                                    type="button"
                                    onClick={handleToggleAutoRotate}
                                    aria-label="Rotasi otomatis"
                                    aria-pressed={autoRotate}
                                    title="Rotasi otomatis"
                                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D5BD8A] ${
                                        autoRotate
                                            ? "bg-[#CDB988] text-[#0A1612] shadow-md font-semibold"
                                            : "text-[#9CB0A4] hover:bg-[#142820] hover:text-[#E2CEAB]"
                                    }`}
                                >
                                    <Shirt size={18} aria-hidden="true" />
                                    <span className="mt-1 text-[10px] font-medium">Otomatis</span>
                                </button>
                            </div>

                            {/* Petunjuk Interaksi Bawah */}
                            <p className="rounded-full bg-[#0B1813]/90 px-3 py-1 text-center text-[11px] font-medium text-[#BACDC2] shadow-md backdrop-blur-sm">
                                Geser untuk memutar · Scroll untuk memperbesar
                            </p>
                        </div>
                    </div>
                )}

                {/* 3. PANEL SEBELAH KANAN (PARAMETER 3D) */}
                <aside className="z-20 flex w-full shrink-0 flex-col justify-center p-4 lg:h-full lg:w-80 lg:p-6">
                    <div className="flex max-h-full flex-col justify-between rounded-2xl border border-[#1E362C] bg-[#0A1712] p-5 shadow-2xl lg:overflow-y-auto lg:p-6">
                        <div>
                            {/* Header Panel */}
                            <h2 className="font-heading text-2xl font-semibold text-[#E2CEAB]">
                                {isCameraMode ? "Pengaturan Kamera" : "Parameter 3D"}
                            </h2>

                            <div className="flex flex-col gap-3 pt-5">
                                <MockupSlider
                                    label="Skala Motif"
                                    value={motifScale}
                                    min={0.5}
                                    max={2}
                                    step={0.05}
                                    onChange={setMotifScale}
                                    showLimits
                                />

                                {!isCameraMode && (
                                    <SkyboxPicker
                                        value={skyboxFile}
                                        status={skyboxStatus}
                                        onChange={(file) => {
                                            if (!file) setSkyboxStatus("idle");
                                            setSkyboxFile(file);
                                        }}
                                    />
                                )}

                                {!isCameraMode && skyboxFile && (
                                    <MockupSlider
                                        label="Kecerahan Latar"
                                        value={skyboxBrightness}
                                        max={1}
                                        step={0.05}
                                        onChange={setSkyboxBrightness}
                                        showLimits
                                    />
                                )}

                                {isCameraMode &&
                                    Object.entries(CAMERA_EFFECT_LABELS).map(
                                        ([prop, label]) => (
                                            <MockupSlider
                                                key={prop}
                                                label={label}
                                                value={cameraEffects[prop]}
                                                max={BATIK_EFFECTS[prop].max}
                                                onChange={(value) =>
                                                    setCameraEffects((current) => ({
                                                        ...current,
                                                        [prop]: value,
                                                    }))
                                                }
                                            />
                                        ),
                                    )}
                            </div>

                            {!isCameraMode && (
                                <div className="pb-8 pt-6">
                                    <p className="text-xs font-medium text-[#7E9385] mb-3">
                                        Tipe Kain
                                    </p>

                                    <div className="flex flex-col gap-2.5">
                                        {/* Pilihan: Sutra */}
                                        <div
                                            onClick={() => {
                                                setFabricType("sutra");
                                                showToast(
                                                    "Bahan: Sutra (Kilau Halus)",
                                                );
                                            }}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                                fabricType === "sutra"
                                                    ? "bg-[#142920] border-[#CDB988] shadow-sm"
                                                    : "bg-[#08140F] border-[#182C24] hover:border-[#2C483A]"
                                            }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                                                    fabricType === "sutra"
                                                        ? "border-[#CDB988]"
                                                        : "border-[#7E9385]"
                                                }`}
                                            >
                                                {fabricType === "sutra" && (
                                                    <div className="w-2 h-2 rounded-full bg-[#CDB988]" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-[#F5EFEB]">
                                                    Sutra
                                                </h4>
                                                <p className="text-[11px] text-[#7E9385] mt-0.5">
                                                    Halus dengan kilau yang lembut
                                                </p>
                                            </div>
                                        </div>

                                        {/* Pilihan: Linen */}
                                        <div
                                            onClick={() => {
                                                setFabricType("linen");
                                                showToast(
                                                    "Bahan: Linen (Serat Alami)",
                                                );
                                            }}
                                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                                                fabricType === "linen"
                                                    ? "bg-[#142920] border-[#CDB988] shadow-sm"
                                                    : "bg-[#08140F] border-[#182C24] hover:border-[#2C483A]"
                                            }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                                                    fabricType === "linen"
                                                        ? "border-[#CDB988]"
                                                        : "border-[#7E9385]"
                                                }`}
                                            >
                                                {fabricType === "linen" && (
                                                    <div className="w-2 h-2 rounded-full bg-[#CDB988]" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-[#F5EFEB]">
                                                    Linen
                                                </h4>
                                                <p className="text-[11px] text-[#7E9385] mt-0.5">
                                                    Tekstur alami, ringan &
                                                    berkarakter
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tombol Unduh Mockup */}
                        {!isCameraMode && (
                            <div className="pt-4 border-t border-[#182C24]">
                                <button
                                    type="button"
                                    onClick={handleDownloadMockup}
                                    className="w-full bg-[#D5BD8A] hover:bg-[#C4AC79] active:scale-95 text-[#0A1612] font-semibold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    <span>Unduh Mockup</span>
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}
