import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const MAX_PIXEL_RATIO = 1.2;
const ACTIVE_FRAME_INTERVAL_MS = 1000 / 40;
const IDLE_FRAME_INTERVAL_MS = 1000 / 24;
const CLOTH_MINIMUM_Y = -0.08;
const CLOTH_MAXIMUM_Y = 1.72;
const CLOTH_START_Y = 1.55;
const CLOTH_SUBMERGED_Y = 0.46;
const CLOTH_LIFTED_Y = 1.46;
const CLOTH_WIDTH = 3.2;
const CLOTH_HEIGHT = 3.05;
const CLOTH_SCALE = 0.92;
const LIQUID_Y = -0.28;

const clothVertexShader = `
    uniform float uTime;

    varying vec2 vUv;
    varying float vWorldY;
    varying float vFoldLight;

    void main() {
        vUv = uv;

        vec3 displacedPosition = position;
        float horizontalEdge = abs(position.x) / 1.6;
        float verticalWeight = smoothstep(-1.5, 1.5, position.y);
        float broadFold = sin(
            (position.y * 3.15) +
            (position.x * 1.2) +
            (uTime * 1.75)
        );
        float fineFold = sin(
            (position.x * 6.4) -
            (position.y * 1.8) -
            (uTime * 2.35)
        );

        displacedPosition.z += broadFold * 0.105;
        displacedPosition.z += fineFold * 0.035 * (0.4 + horizontalEdge);
        displacedPosition.x += sin(
            (position.y * 2.2) + (uTime * 1.25)
        ) * 0.035 * verticalWeight;

        vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
        vWorldY = worldPosition.y;
        vFoldLight = broadFold * 0.5 + 0.5;

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`;

const clothFragmentShader = `
    uniform sampler2D uPencilTexture;
    uniform sampler2D uWaxTexture;
    uniform vec3 uDyeColor;
    uniform vec3 uFabricColor;
    uniform float uDyeAmount;
    uniform float uLiquidY;

    varying vec2 vUv;
    varying float vWorldY;
    varying float vFoldLight;

    void main() {
        vec4 pencil = texture2D(uPencilTexture, vUv);
        vec4 wax = texture2D(uWaxTexture, vUv);
        vec3 artworkColor = mix(pencil.rgb, wax.rgb, wax.a);
        float artworkStrength = pencil.a + wax.a * (1.0 - pencil.a);
        vec3 naturalCloth = mix(
            uFabricColor,
            artworkColor,
            artworkStrength
        );
        float submergedAmount = 1.0 - smoothstep(
            uLiquidY - 0.06,
            uLiquidY + 0.34,
            vWorldY
        );
        float dyeAmount = clamp(max(uDyeAmount, submergedAmount * 0.62), 0.0, 1.0);
        vec3 dyedCloth = uDyeColor * (0.78 + naturalCloth * 0.22);
        vec3 resistedColor = mix(dyedCloth, wax.rgb, wax.a * 0.92);
        vec3 finalColor = mix(naturalCloth, resistedColor, dyeAmount);
        finalColor = mix(finalColor, dyedCloth, pencil.a * dyeAmount);

        float warp = sin(vUv.x * 920.0) * 0.5 + 0.5;
        float weft = sin(vUv.y * 920.0) * 0.5 + 0.5;
        float weave = (warp + weft) * 0.5;
        float foldShade = mix(0.86, 1.08, vFoldLight);
        finalColor *= foldShade * mix(0.965, 1.025, weave);

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

const liquidVertexShader = `
    uniform float uTime;

    varying vec2 vUv;

    void main() {
        vUv = uv;
        vec3 displacedPosition = position;
        displacedPosition.z += sin((position.x * 3.8) + (uTime * 1.8)) * 0.018;
        displacedPosition.z += cos((position.y * 4.6) - (uTime * 1.35)) * 0.014;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
`;

const liquidFragmentShader = `
    uniform vec3 uDyeColor;
    uniform float uTime;
    uniform float uActivity;

    varying vec2 vUv;

    void main() {
        float radialDistance = distance(vUv, vec2(0.5));
        float glint = sin(
            (vUv.x * 24.0) +
            (vUv.y * 18.0) +
            (uTime * 2.2)
        ) * 0.5 + 0.5;
        float edge = smoothstep(0.5, 0.1, radialDistance);
        vec3 color = mix(uDyeColor * 0.48, uDyeColor * 1.22, glint * 0.24);
        color += vec3(0.12, 0.18, 0.16) * uActivity * edge;
        gl_FragColor = vec4(color, 0.9);
    }
`;

const createFallbackTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
};

export default function DyeingVat3D({
    dyeColor,
    fabricColor,
    isIntroComplete,
    onClothLifted,
    onSubmergedChange,
    soakProgress,
    stage,
    pencilTextureUrl,
    waxTextureUrl,
}) {
    const mountRef = useRef(null);
    const runtimeRef = useRef(null);
    const latestPropsRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);

    latestPropsRef.current = {
        dyeColor,
        fabricColor,
        isIntroComplete,
        onClothLifted,
        onSubmergedChange,
        soakProgress,
        stage,
    };

    useEffect(() => {
        runtimeRef.current?.syncState();
    }, [dyeColor, fabricColor, isIntroComplete, soakProgress, stage]);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) {
            return undefined;
        }

        setIsLoading(true);
        setHasLoadError(false);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: window.devicePixelRatio <= 1.5,
                powerPreference: "high-performance",
            });
        } catch (error) {
            console.error("Unable to create dyeing renderer:", error);
            setHasLoadError(true);
            setIsLoading(false);
            return undefined;
        }

        let isMounted = true;
        let isSceneVisible = true;
        let animationFrameId = null;
        let previousFrameAt = 0;
        let previousTimestamp = 0;
        let activePointerId = null;
        let isDragging = false;
        let dragOffsetY = 0;
        let clothCurrentY = CLOTH_START_Y;
        let clothTargetY = CLOTH_START_Y;
        let previousClothY = CLOTH_START_Y;
        let lastSubmergedState = false;
        let hasReportedLift = false;
        const disposableGeometries = [];
        const disposableMaterials = [];
        const disposableTextures = [];

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x04100c, 0.055);

        const isConstrainedDevice =
            window.innerWidth < 768 ||
            (navigator.hardwareConcurrency ?? 8) <= 4;
        const radialSegments = isConstrainedDevice ? 36 : 48;
        const clothSegments = isConstrainedDevice ? 18 : 24;

        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
        camera.position.set(0, 1.25, 8.4);
        camera.lookAt(0, -0.2, 0);

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
        );
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.shadowMap.enabled = !isConstrainedDevice;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.touchAction = "none";
        renderer.domElement.style.width = "100%";
        renderer.domElement.tabIndex = 0;
        renderer.domElement.setAttribute("role", "application");
        renderer.domElement.setAttribute(
            "aria-label",
            "Kain batik tiga dimensi di atas kuali pewarna. Gunakan drag atau tombol panah untuk mencelupkan dan mengangkat kain.",
        );
        container.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xd7f2ea, 0x04100c, 1.9));

        const keyLight = new THREE.DirectionalLight(0xffe4bd, 3.2);
        keyLight.position.set(-4.5, 6.5, 5.5);
        keyLight.castShadow = !isConstrainedDevice;
        keyLight.shadow.mapSize.set(384, 384);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x71bfce, 2.4);
        rimLight.position.set(5, 2.8, -4);
        scene.add(rimLight);

        const dyeGlow = new THREE.PointLight(dyeColor, 2.2, 6, 2);
        dyeGlow.position.set(0, 0.1, 1.4);
        scene.add(dyeGlow);

        const floorGeometry = new THREE.CircleGeometry(4.7, radialSegments);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x071a13,
            metalness: 0.02,
            roughness: 0.94,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2.08;
        floor.receiveShadow = true;
        scene.add(floor);
        disposableGeometries.push(floorGeometry);
        disposableMaterials.push(floorMaterial);

        const stageRingGeometry = new THREE.RingGeometry(
            2.6,
            4.25,
            radialSegments,
        );
        const stageRingMaterial = new THREE.MeshBasicMaterial({
            color: 0x15382d,
            opacity: 0.34,
            side: THREE.DoubleSide,
            transparent: true,
        });
        const stageRing = new THREE.Mesh(
            stageRingGeometry,
            stageRingMaterial,
        );
        stageRing.rotation.x = -Math.PI / 2;
        stageRing.position.y = -2.065;
        scene.add(stageRing);
        disposableGeometries.push(stageRingGeometry);
        disposableMaterials.push(stageRingMaterial);

        const potProfile = [
            new THREE.Vector2(1.2, -1.72),
            new THREE.Vector2(1.48, -1.6),
            new THREE.Vector2(1.67, -1.08),
            new THREE.Vector2(1.82, -0.42),
            new THREE.Vector2(1.85, -0.05),
            new THREE.Vector2(1.73, 0.2),
            new THREE.Vector2(1.57, 0.26),
        ];
        const potGeometry = new THREE.LatheGeometry(
            potProfile,
            radialSegments,
        );
        const potMaterial = new THREE.MeshPhysicalMaterial({
            clearcoat: 0.28,
            clearcoatRoughness: 0.64,
            color: 0x132a24,
            metalness: 0.72,
            roughness: 0.48,
        });
        const pot = new THREE.Mesh(potGeometry, potMaterial);
        pot.castShadow = !isConstrainedDevice;
        pot.receiveShadow = !isConstrainedDevice;
        scene.add(pot);
        disposableGeometries.push(potGeometry);
        disposableMaterials.push(potMaterial);

        const rimGeometry = new THREE.TorusGeometry(
            1.71,
            0.095,
            10,
            radialSegments,
        );
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x29483e,
            metalness: 0.78,
            roughness: 0.36,
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.21;
        rim.castShadow = !isConstrainedDevice;
        scene.add(rim);
        disposableGeometries.push(rimGeometry);
        disposableMaterials.push(rimMaterial);

        const handleGeometry = new THREE.TorusGeometry(
            0.47,
            0.07,
            10,
            36,
        );
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x1d3830,
            metalness: 0.72,
            roughness: 0.45,
        });
        const leftHandle = new THREE.Mesh(
            handleGeometry,
            handleMaterial,
        );
        leftHandle.position.set(-1.79, -0.42, 0);
        leftHandle.rotation.y = Math.PI / 2;
        leftHandle.scale.set(1, 1.3, 1);
        const rightHandle = leftHandle.clone();
        rightHandle.position.x = 1.79;
        scene.add(leftHandle, rightHandle);
        disposableGeometries.push(handleGeometry);
        disposableMaterials.push(handleMaterial);

        const liquidGeometry = new THREE.CircleGeometry(
            1.56,
            radialSegments,
        );
        const liquidMaterial = new THREE.ShaderMaterial({
            depthWrite: false,
            fragmentShader: liquidFragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                uActivity: { value: 0 },
                uDyeColor: { value: new THREE.Color(dyeColor) },
                uTime: { value: 0 },
            },
            vertexShader: liquidVertexShader,
        });
        const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
        liquid.rotation.x = -Math.PI / 2;
        liquid.position.y = LIQUID_Y;
        liquid.renderOrder = 2;
        scene.add(liquid);
        disposableGeometries.push(liquidGeometry);
        disposableMaterials.push(liquidMaterial);

        const rippleGeometry = new THREE.TorusGeometry(0.72, 0.018, 6, 48);
        const rippleMaterial = new THREE.MeshBasicMaterial({
            blending: THREE.AdditiveBlending,
            color: dyeColor,
            depthWrite: false,
            opacity: 0,
            transparent: true,
        });
        const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
        ripple.rotation.x = Math.PI / 2;
        ripple.position.y = LIQUID_Y + 0.025;
        ripple.renderOrder = 3;
        scene.add(ripple);
        disposableGeometries.push(rippleGeometry);
        disposableMaterials.push(rippleMaterial);

        const bubbleGeometry = new THREE.SphereGeometry(0.035, 8, 8);
        const bubbleMaterial = new THREE.MeshBasicMaterial({
            color: 0xd5eff0,
            opacity: 0.34,
            transparent: true,
        });
        const bubbleCount = isConstrainedDevice ? 6 : 8;
        const bubbles = Array.from({ length: bubbleCount }, (_, index) => {
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            const angle = (index / bubbleCount) * Math.PI * 2;
            const radius = 0.38 + (index % 3) * 0.32;
            bubble.position.set(
                Math.cos(angle) * radius,
                LIQUID_Y + 0.02,
                Math.sin(angle) * radius,
            );
            bubble.userData.phase = index * 0.63;
            scene.add(bubble);
            return bubble;
        });
        disposableGeometries.push(bubbleGeometry);
        disposableMaterials.push(bubbleMaterial);

        const fallbackTexture = createFallbackTexture();
        fallbackTexture.anisotropy = Math.min(
            4,
            renderer.capabilities.getMaxAnisotropy(),
        );
        disposableTextures.push(fallbackTexture);

        const clothGeometry = new THREE.PlaneGeometry(
            CLOTH_WIDTH,
            CLOTH_HEIGHT,
            clothSegments,
            clothSegments,
        );
        const clothMaterial = new THREE.ShaderMaterial({
            fragmentShader: clothFragmentShader,
            side: THREE.DoubleSide,
            uniforms: {
                uDyeAmount: { value: 0 },
                uDyeColor: { value: new THREE.Color(dyeColor) },
                uFabricColor: { value: new THREE.Color(fabricColor) },
                uLiquidY: { value: LIQUID_Y },
                uPencilTexture: { value: fallbackTexture },
                uTime: { value: 0 },
                uWaxTexture: { value: fallbackTexture },
            },
            vertexShader: clothVertexShader,
        });
        const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
        cloth.position.y = (CLOTH_HEIGHT * (1 - CLOTH_SCALE)) / 2;
        cloth.scale.setScalar(CLOTH_SCALE);
        cloth.castShadow = !isConstrainedDevice;
        cloth.receiveShadow = !isConstrainedDevice;
        disposableGeometries.push(clothGeometry);
        disposableMaterials.push(clothMaterial);

        const rodGeometry = new THREE.CylinderGeometry(0.055, 0.055, 3.48, 16);
        const rodMaterial = new THREE.MeshStandardMaterial({
            color: 0x9a7141,
            metalness: 0.04,
            roughness: 0.72,
        });
        const rod = new THREE.Mesh(rodGeometry, rodMaterial);
        rod.position.y = 1.57;
        rod.rotation.z = Math.PI / 2;
        rod.castShadow = !isConstrainedDevice;
        disposableGeometries.push(rodGeometry);
        disposableMaterials.push(rodMaterial);

        const clothGroup = new THREE.Group();
        clothGroup.position.set(0, CLOTH_START_Y, 0.12);
        clothGroup.rotation.y = -0.1;
        clothGroup.add(cloth, rod);
        scene.add(clothGroup);

        const textureLoader = new THREE.TextureLoader();
        const configureTexture = (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(
                2,
                renderer.capabilities.getMaxAnisotropy(),
            );
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            disposableTextures.push(texture);

            return texture;
        };
        const loadTexture = (textureUrl) =>
            new Promise((resolve, reject) => {
                textureLoader.load(textureUrl, resolve, undefined, reject);
            });

        void Promise.all([
            loadTexture(pencilTextureUrl),
            loadTexture(waxTextureUrl),
        ])
            .then(([pencilTexture, waxTexture]) => {
                if (!isMounted) {
                    pencilTexture.dispose();
                    waxTexture.dispose();
                    return;
                }

                clothMaterial.uniforms.uPencilTexture.value =
                    configureTexture(pencilTexture);
                clothMaterial.uniforms.uWaxTexture.value =
                    configureTexture(waxTexture);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Unable to load batik cloth textures:", error);
                if (isMounted) {
                    setHasLoadError(true);
                    setIsLoading(false);
                }
            });

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const pointerWorld = new THREE.Vector3();
        const dragPlane = new THREE.Plane(
            new THREE.Vector3(0, 0, 1),
            -clothGroup.position.z,
        );

        const setPointerFromEvent = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
        };

        const canDragForStage = () =>
            latestPropsRef.current.isIntroComplete &&
            ["dipping", "soaking", "lifting"].includes(
                latestPropsRef.current.stage,
            );

        const handlePointerDown = (event) => {
            if (!canDragForStage()) {
                return;
            }

            setPointerFromEvent(event);
            const intersections = raycaster.intersectObjects(
                [cloth, rod],
                false,
            );

            if (intersections.length === 0) {
                return;
            }

            raycaster.ray.intersectPlane(dragPlane, pointerWorld);
            dragOffsetY = clothCurrentY - pointerWorld.y;
            activePointerId = event.pointerId;
            isDragging = true;
            renderer.domElement.setPointerCapture(event.pointerId);
            renderer.domElement.style.cursor = "grabbing";
        };

        const handlePointerMove = (event) => {
            if (!isDragging || event.pointerId !== activePointerId) {
                return;
            }

            setPointerFromEvent(event);
            if (!raycaster.ray.intersectPlane(dragPlane, pointerWorld)) {
                return;
            }

            clothTargetY = THREE.MathUtils.clamp(
                pointerWorld.y + dragOffsetY,
                CLOTH_MINIMUM_Y,
                CLOTH_MAXIMUM_Y,
            );
        };

        const finishPointerDrag = (event) => {
            if (event.pointerId !== activePointerId) {
                return;
            }

            if (renderer.domElement.hasPointerCapture(event.pointerId)) {
                renderer.domElement.releasePointerCapture(event.pointerId);
            }
            activePointerId = null;
            isDragging = false;
            renderer.domElement.style.cursor = canDragForStage()
                ? "grab"
                : "default";
        };

        const handleKeyDown = (event) => {
            if (!canDragForStage()) {
                return;
            }

            const movement = event.shiftKey ? 0.3 : 0.16;
            if (event.key === "ArrowDown") {
                event.preventDefault();
                clothTargetY = Math.max(
                    CLOTH_MINIMUM_Y,
                    clothTargetY - movement,
                );
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                clothTargetY = Math.min(
                    CLOTH_MAXIMUM_Y,
                    clothTargetY + movement,
                );
            } else if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();
                clothTargetY =
                    latestPropsRef.current.stage === "lifting"
                        ? CLOTH_MAXIMUM_Y
                        : CLOTH_MINIMUM_Y;
            }
        };

        renderer.domElement.addEventListener(
            "pointerdown",
            handlePointerDown,
        );
        renderer.domElement.addEventListener(
            "pointermove",
            handlePointerMove,
        );
        renderer.domElement.addEventListener(
            "pointerup",
            finishPointerDrag,
        );
        renderer.domElement.addEventListener(
            "pointercancel",
            finishPointerDrag,
        );
        renderer.domElement.addEventListener("keydown", handleKeyDown);

        const syncState = () => {
            const current = latestPropsRef.current;
            const nextDyeColor = new THREE.Color(current.dyeColor);
            clothMaterial.uniforms.uDyeColor.value.copy(nextDyeColor);
            clothMaterial.uniforms.uFabricColor.value.set(
                current.fabricColor,
            );
            liquidMaterial.uniforms.uDyeColor.value.copy(nextDyeColor);
            rippleMaterial.color.copy(nextDyeColor).offsetHSL(0, -0.08, 0.24);
            dyeGlow.color.copy(nextDyeColor).offsetHSL(0, -0.12, 0.18);
            clothGroup.visible = current.isIntroComplete;

            if (current.stage === "choosing") {
                clothTargetY = CLOTH_START_Y;
                hasReportedLift = false;
            } else if (current.stage === "complete") {
                clothTargetY = CLOTH_MAXIMUM_Y;
            } else if (current.stage !== "lifting") {
                hasReportedLift = false;
            }

            renderer.domElement.style.cursor = canDragForStage()
                ? "grab"
                : "default";
        };
        runtimeRef.current = { syncState };
        syncState();

        const resizeRenderer = () => {
            const width = Math.max(1, container.clientWidth);
            const height = Math.max(1, container.clientHeight);
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        resizeRenderer();

        const resizeObserver = new ResizeObserver(resizeRenderer);
        resizeObserver.observe(container);

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isSceneVisible = entry.isIntersecting;
            },
            { threshold: 0.01 },
        );
        intersectionObserver.observe(container);

        const renderFrame = (timestamp) => {
            if (!isMounted) {
                return;
            }

            animationFrameId = window.requestAnimationFrame(renderFrame);
            const frameInterval = isDragging ||
                latestPropsRef.current.stage === "dipping" ||
                latestPropsRef.current.stage === "soaking" ||
                latestPropsRef.current.stage === "lifting"
                ? ACTIVE_FRAME_INTERVAL_MS
                : IDLE_FRAME_INTERVAL_MS;
            if (
                !isSceneVisible ||
                timestamp - previousFrameAt < frameInterval
            ) {
                return;
            }

            const deltaSeconds = Math.min(
                0.05,
                previousTimestamp === 0
                    ? 0.016
                    : (timestamp - previousTimestamp) / 1000,
            );
            previousTimestamp = timestamp;
            previousFrameAt = timestamp;
            const elapsedSeconds = timestamp / 1000;
            const current = latestPropsRef.current;

            const easing = 1 - Math.exp(-deltaSeconds * 8.5);
            clothCurrentY = THREE.MathUtils.lerp(
                clothCurrentY,
                clothTargetY,
                easing,
            );
            const clothVelocity = (clothCurrentY - previousClothY) /
                Math.max(deltaSeconds, 0.001);
            previousClothY = clothCurrentY;
            const idleFloat =
                current.stage === "choosing" || current.stage === "complete"
                    ? Math.sin(elapsedSeconds * 1.35) * 0.035
                    : 0;

            clothGroup.position.y = clothCurrentY + idleFloat;
            clothGroup.rotation.z = THREE.MathUtils.lerp(
                clothGroup.rotation.z,
                THREE.MathUtils.clamp(-clothVelocity * 0.018, -0.12, 0.12) +
                    Math.sin(elapsedSeconds * 0.7) * 0.012,
                0.08,
            );
            clothGroup.rotation.y =
                -0.1 + Math.sin(elapsedSeconds * 0.82) * 0.035;

            const dyeAmount =
                current.stage === "lifting" || current.stage === "complete"
                    ? 1
                    : current.soakProgress / 100;
            clothMaterial.uniforms.uTime.value = elapsedSeconds;
            clothMaterial.uniforms.uDyeAmount.value = THREE.MathUtils.lerp(
                clothMaterial.uniforms.uDyeAmount.value,
                dyeAmount,
                0.06,
            );
            liquidMaterial.uniforms.uTime.value = elapsedSeconds;

            const isSubmerged =
                clothCurrentY <= CLOTH_SUBMERGED_Y && canDragForStage();
            liquidMaterial.uniforms.uActivity.value = THREE.MathUtils.lerp(
                liquidMaterial.uniforms.uActivity.value,
                isSubmerged ? 1 : 0.12,
                0.08,
            );

            if (isSubmerged !== lastSubmergedState) {
                lastSubmergedState = isSubmerged;
                current.onSubmergedChange(isSubmerged);
            }

            if (
                current.stage === "lifting" &&
                clothCurrentY >= CLOTH_LIFTED_Y &&
                !hasReportedLift
            ) {
                hasReportedLift = true;
                current.onClothLifted();
            }

            const rippleStrength = isSubmerged ? 1 : 0;
            const rippleCycle = (elapsedSeconds * 0.72) % 1;
            ripple.scale.setScalar(0.75 + rippleCycle * 1.05);
            rippleMaterial.opacity =
                rippleStrength * (1 - rippleCycle) * 0.52;

            for (const bubble of bubbles) {
                const phase =
                    (elapsedSeconds * 0.38 + bubble.userData.phase) % 1;
                bubble.position.y = LIQUID_Y + 0.025 + phase * 0.15;
                bubble.scale.setScalar(0.45 + phase * 0.85);
                bubble.visible = isSubmerged;
            }

            pot.rotation.y = Math.sin(elapsedSeconds * 0.22) * 0.012;
            renderer.render(scene, camera);
        };
        animationFrameId = window.requestAnimationFrame(renderFrame);

        return () => {
            isMounted = false;
            runtimeRef.current = null;

            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
            }

            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            renderer.domElement.removeEventListener(
                "pointerdown",
                handlePointerDown,
            );
            renderer.domElement.removeEventListener(
                "pointermove",
                handlePointerMove,
            );
            renderer.domElement.removeEventListener(
                "pointerup",
                finishPointerDrag,
            );
            renderer.domElement.removeEventListener(
                "pointercancel",
                finishPointerDrag,
            );
            renderer.domElement.removeEventListener(
                "keydown",
                handleKeyDown,
            );

            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }

            disposableGeometries.forEach((geometry) => geometry.dispose());
            disposableMaterials.forEach((material) => material.dispose());
            disposableTextures.forEach((texture) => texture.dispose());
            renderer.renderLists.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
        };
    }, [pencilTextureUrl, waxTextureUrl]);

    return (
        <div ref={mountRef} className="absolute inset-0">
            {isLoading && (
                <div className="pointer-events-none absolute inset-0 z-10 bg-[#06130F]/25" />
            )}
            {hasLoadError && (
                <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 mx-auto w-fit rounded-full border border-[#D8C48F]/25 bg-[#07130E]/85 px-4 py-2 text-xs text-[#E8D8AA] backdrop-blur-md">
                    Tekstur kain memakai warna mori bawaan.
                </div>
            )}
        </div>
    );
}
