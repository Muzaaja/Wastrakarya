import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const POT_MODEL_PATH = "/cooking_pot/scene.gltf";
const MAX_PIXEL_RATIO = 1.35;
const FRAME_INTERVAL_MS = 1000 / 60;
const POT_WIDTH = 4.2;
const POT_BOTTOM_Y = -1.12;
const CUBE_START_POSITION = new THREE.Vector3(-2.45, 0.62, 1.35);

const vertexShader = `
    uniform float uTime;
    uniform float uIntensity;

    varying vec2 vUv;

    void main() {
        vUv = uv;

        vec3 displacedPosition = position;
        float topWeight = smoothstep(0.05, 1.0, uv.y);
        displacedPosition.x += sin((uTime * 4.2) + (uv.y * 7.0))
            * 0.09
            * topWeight
            * uIntensity;

        gl_Position = projectionMatrix
            * modelViewMatrix
            * vec4(displacedPosition, 1.0);
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform float uIntensity;

    varying vec2 vUv;

    float random(vec2 coordinates) {
        return fract(
            sin(dot(coordinates, vec2(12.9898, 78.233))) * 43758.5453
        );
    }

    float noise(vec2 coordinates) {
        vec2 cell = floor(coordinates);
        vec2 local = fract(coordinates);
        local = local * local * (3.0 - (2.0 * local));

        float bottomLeft = random(cell);
        float bottomRight = random(cell + vec2(1.0, 0.0));
        float topLeft = random(cell + vec2(0.0, 1.0));
        float topRight = random(cell + vec2(1.0, 1.0));

        return mix(
            mix(bottomLeft, bottomRight, local.x),
            mix(topLeft, topRight, local.x),
            local.y
        );
    }

    void main() {
        vec2 uv = vUv;
        float centeredX = (uv.x - 0.5) * 2.0;
        float turbulence = noise(
            vec2((centeredX * 2.2) + 4.0, (uv.y * 4.0) - (uTime * 3.2))
        );
        float sway = (turbulence - 0.5) * 0.34 * uv.y;
        float width = mix(0.82, 0.07, pow(uv.y, 0.72));
        float normalizedEdge = abs(centeredX + sway) / max(width, 0.001);
        float body = 1.0 - smoothstep(0.58, 1.0, normalizedEdge);
        float baseFade = smoothstep(0.0, 0.11, uv.y);
        float tipFade = 1.0 - smoothstep(0.7, 1.0, uv.y);
        float detail = mix(0.72, 1.0, turbulence);
        float alpha = body * baseFade * tipFade * detail * uIntensity;

        float core = 1.0 - smoothstep(0.0, 0.52, abs(centeredX + sway));
        vec3 emberColor = vec3(0.86, 0.08, 0.015);
        vec3 orangeColor = vec3(1.0, 0.32, 0.035);
        vec3 hotColor = vec3(1.0, 0.88, 0.38);
        vec3 flameColor = mix(emberColor, orangeColor, uv.y + 0.12);
        flameColor = mix(flameColor, hotColor, core * (1.0 - uv.y * 0.55));

        gl_FragColor = vec4(flameColor * (1.0 + core * 0.28), alpha);
    }
`;

const gltfLoader = new GLTFLoader();
let potModelPromise = null;

const loadPotModel = () => {
    if (!potModelPromise) {
        potModelPromise = gltfLoader.loadAsync(POT_MODEL_PATH);
    }

    return potModelPromise;
};

void loadPotModel().catch(() => {});

const clampHeatingProgress = (progress) =>
    THREE.MathUtils.clamp(progress / 100, 0, 1);

export default function MalamHeating3D({
    heatingProgress,
    isDraggingMalam,
    isMalamInPot,
    isPotDragOver,
    malamState,
    onDragStateChange,
    onMalamPlaced,
    onPotDragOverChange,
    waxColor,
    waxColorName,
}) {
    const mountRef = useRef(null);
    const runtimeRef = useRef(null);
    const latestPropsRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);

    latestPropsRef.current = {
        heatingProgress,
        isMalamInPot,
        malamState,
        onDragStateChange,
        onMalamPlaced,
        onPotDragOverChange,
        waxColor,
    };

    useEffect(() => {
        runtimeRef.current?.syncState();
    }, [heatingProgress, isMalamInPot, malamState, waxColor]);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) {
            return;
        }

        setHasLoadError(false);
        setIsLoading(true);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: window.devicePixelRatio <= 1.5,
                powerPreference: "high-performance",
            });
        } catch (error) {
            console.error("Unable to create Malam heating renderer:", error);
            setHasLoadError(true);
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        let isSceneVisible = true;
        let isPotReady = false;
        let animationFrameId = null;
        let lastRenderedAt = 0;
        let previousTimestamp = 0;
        let activePointerId = null;
        let isDragging = false;
        let isOverPot = false;
        let model = null;
        const disposableGeometries = [];
        const disposableMaterials = [];

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 40);
        camera.position.set(0, 2.9, 8.6);
        camera.lookAt(0, -0.35, 0);

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
        );
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        renderer.shadowMap.enabled = false;
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.touchAction = "none";
        renderer.domElement.style.width = "100%";
        container.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffe7bd, 0x071b13, 1.85));

        const keyLight = new THREE.DirectionalLight(0xffd9a0, 3.1);
        keyLight.position.set(-4, 6, 5);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x82bea0, 1.6);
        rimLight.position.set(5, 2, -4);
        scene.add(rimLight);

        const waxColorValue = new THREE.Color(waxColor);
        const cubeGeometry = new THREE.BoxGeometry(0.92, 0.92, 0.92, 2, 2, 2);
        const cubeMaterial = new THREE.MeshPhysicalMaterial({
            color: waxColorValue,
            clearcoat: 0.72,
            clearcoatRoughness: 0.2,
            emissive: waxColorValue,
            emissiveIntensity: 0.06,
            metalness: 0.02,
            roughness: 0.38,
        });
        const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const cubeEdgesGeometry = new THREE.EdgesGeometry(cubeGeometry, 26);
        const cubeEdgesMaterial = new THREE.LineBasicMaterial({
            color: waxColorValue.clone().multiplyScalar(0.62),
            transparent: true,
            opacity: 0.58,
        });
        const cubeEdges = new THREE.LineSegments(
            cubeEdgesGeometry,
            cubeEdgesMaterial,
        );
        const cubeVisual = new THREE.Group();
        cubeVisual.add(cubeMesh, cubeEdges);
        const cubeGroup = new THREE.Group();
        cubeGroup.position.copy(CUBE_START_POSITION);
        cubeGroup.add(cubeVisual);
        scene.add(cubeGroup);
        disposableGeometries.push(cubeGeometry, cubeEdgesGeometry);
        disposableMaterials.push(cubeMaterial, cubeEdgesMaterial);

        const liquidGeometry = new THREE.CylinderGeometry(
            1.12,
            1.12,
            0.075,
            32,
        );
        const liquidMaterial = new THREE.MeshPhysicalMaterial({
            color: waxColorValue,
            clearcoat: 0.88,
            clearcoatRoughness: 0.12,
            emissive: waxColorValue,
            emissiveIntensity: 0.22,
            metalness: 0,
            opacity: 0,
            roughness: 0.22,
            transparent: true,
        });
        const liquidWax = new THREE.Mesh(liquidGeometry, liquidMaterial);
        liquidWax.visible = false;
        scene.add(liquidWax);
        disposableGeometries.push(liquidGeometry);
        disposableMaterials.push(liquidMaterial);

        const dropRingGeometry = new THREE.TorusGeometry(1.18, 0.035, 6, 48);
        const dropRingMaterial = new THREE.MeshBasicMaterial({
            blending: THREE.AdditiveBlending,
            color: 0xd9bb7e,
            depthWrite: false,
            opacity: 0.55,
            transparent: true,
        });
        const dropRing = new THREE.Mesh(dropRingGeometry, dropRingMaterial);
        dropRing.rotation.x = Math.PI / 2;
        scene.add(dropRing);
        disposableGeometries.push(dropRingGeometry);
        disposableMaterials.push(dropRingMaterial);

        const burnerGeometry = new THREE.CylinderGeometry(0.86, 1.03, 0.2, 24);
        const burnerMaterial = new THREE.MeshStandardMaterial({
            color: 0x111b16,
            metalness: 0.55,
            roughness: 0.52,
        });
        const burner = new THREE.Mesh(burnerGeometry, burnerMaterial);
        scene.add(burner);
        disposableGeometries.push(burnerGeometry);
        disposableMaterials.push(burnerMaterial);

        const flameGeometry = new THREE.PlaneGeometry(1.62, 1.62, 1, 1);
        const flameMaterial = new THREE.ShaderMaterial({
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                uIntensity: { value: 0 },
                uTime: { value: 0 },
            },
            vertexShader,
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.renderOrder = 3;
        scene.add(flame);
        disposableGeometries.push(flameGeometry);
        disposableMaterials.push(flameMaterial);

        const fireLight = new THREE.PointLight(0xff7d2f, 0, 4.6, 2);
        scene.add(fireLight);

        const shadowGeometry = new THREE.CircleGeometry(2.45, 36);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x020705,
            depthWrite: false,
            opacity: 0.52,
            transparent: true,
        });
        const stageShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        stageShadow.rotation.x = -Math.PI / 2;
        stageShadow.position.set(0, POT_BOTTOM_Y - 0.7, -0.1);
        scene.add(stageShadow);
        disposableGeometries.push(shadowGeometry);
        disposableMaterials.push(shadowMaterial);

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const pointerWorld = new THREE.Vector3();
        const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.35);
        const cubeDesiredPosition = CUBE_START_POSITION.clone();
        const potDropPosition = new THREE.Vector3(0, 0.58, 0.72);
        let potDropRadius = 1.2;
        let potDropHeight = 0.72;

        const updatePointer = (event) => {
            const bounds = renderer.domElement.getBoundingClientRect();
            pointer.set(
                ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
                -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
            );
            raycaster.setFromCamera(pointer, camera);
        };

        const reportDragging = (nextIsDragging) => {
            if (isDragging === nextIsDragging) {
                return;
            }

            isDragging = nextIsDragging;
            latestPropsRef.current.onDragStateChange(nextIsDragging);
        };

        const reportPotDragOver = (nextIsOverPot) => {
            if (isOverPot === nextIsOverPot) {
                return;
            }

            isOverPot = nextIsOverPot;
            latestPropsRef.current.onPotDragOverChange(nextIsOverPot);
        };

        const isPointerOverPot = () => {
            const normalizedX =
                (pointerWorld.x - potDropPosition.x) / potDropRadius;
            const normalizedY =
                (pointerWorld.y - potDropPosition.y) / potDropHeight;

            return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
        };

        const placeMalam = () => {
            const currentProps = latestPropsRef.current;
            if (
                currentProps.malamState !== "preparing" ||
                currentProps.isMalamInPot
            ) {
                return;
            }

            cubeDesiredPosition.copy(potDropPosition);
            reportDragging(false);
            reportPotDragOver(false);
            currentProps.onMalamPlaced();
        };

        const resetMalamPosition = () => {
            cubeDesiredPosition.copy(CUBE_START_POSITION);
            reportDragging(false);
            reportPotDragOver(false);
        };

        const handlePointerDown = (event) => {
            const currentProps = latestPropsRef.current;
            if (
                !isPotReady ||
                currentProps.malamState !== "preparing" ||
                currentProps.isMalamInPot
            ) {
                return;
            }

            updatePointer(event);
            if (raycaster.intersectObject(cubeMesh, false).length === 0) {
                return;
            }

            event.preventDefault();
            activePointerId = event.pointerId;
            renderer.domElement.setPointerCapture(event.pointerId);
            container.focus({ preventScroll: true });
            renderer.domElement.style.cursor = "grabbing";
            reportDragging(true);
        };

        const handlePointerMove = (event) => {
            updatePointer(event);

            if (!isDragging || activePointerId !== event.pointerId) {
                const currentProps = latestPropsRef.current;
                const isCubeHover =
                    isPotReady &&
                    currentProps.malamState === "preparing" &&
                    !currentProps.isMalamInPot &&
                    raycaster.intersectObject(cubeMesh, false).length > 0;
                renderer.domElement.style.cursor = isCubeHover
                    ? "grab"
                    : "default";
                return;
            }

            event.preventDefault();
            if (!raycaster.ray.intersectPlane(dragPlane, pointerWorld)) {
                return;
            }

            cubeGroup.position.set(
                THREE.MathUtils.clamp(pointerWorld.x, -3.05, 3.05),
                THREE.MathUtils.clamp(pointerWorld.y, -0.35, 1.65),
                dragPlane.constant * -1,
            );
            reportPotDragOver(isPointerOverPot());
        };

        const finishPointerDrag = (event, shouldPlaceMalam) => {
            if (!isDragging || activePointerId !== event.pointerId) {
                return;
            }

            if (renderer.domElement.hasPointerCapture(event.pointerId)) {
                renderer.domElement.releasePointerCapture(event.pointerId);
            }

            activePointerId = null;
            renderer.domElement.style.cursor = "grab";

            if (shouldPlaceMalam && isOverPot) {
                placeMalam();
                return;
            }

            resetMalamPosition();
        };

        const handlePointerUp = (event) => finishPointerDrag(event, true);
        const handlePointerCancel = (event) => finishPointerDrag(event, false);

        renderer.domElement.addEventListener("pointerdown", handlePointerDown);
        renderer.domElement.addEventListener("pointermove", handlePointerMove);
        renderer.domElement.addEventListener("pointerup", handlePointerUp);
        renderer.domElement.addEventListener("pointercancel", handlePointerCancel);

        const syncState = () => {
            const currentProps = latestPropsRef.current;
            const nextWaxColor = new THREE.Color(currentProps.waxColor);
            cubeMaterial.color.copy(nextWaxColor);
            cubeMaterial.emissive.copy(nextWaxColor);
            cubeEdgesMaterial.color
                .copy(nextWaxColor)
                .multiplyScalar(0.62);
            liquidMaterial.color.copy(nextWaxColor);
            liquidMaterial.emissive.copy(nextWaxColor);

            if (!isDragging) {
                cubeDesiredPosition.copy(
                    currentProps.isMalamInPot
                        ? potDropPosition
                        : CUBE_START_POSITION,
                );
            }
        };

        runtimeRef.current = { placeMalam, syncState };
        syncState();

        const resizeRenderer = () => {
            const width = Math.max(1, container.clientWidth);
            const height = Math.max(1, container.clientHeight);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
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

        void loadPotModel()
            .then((gltf) => {
                if (!isMounted) {
                    return;
                }

                model = gltf.scene.clone(true);
                model.traverse((object) => {
                    if (!object.isMesh) {
                        return;
                    }

                    object.castShadow = false;
                    object.receiveShadow = false;
                    object.frustumCulled = true;

                    const materials = Array.isArray(object.material)
                        ? object.material
                        : [object.material];
                    materials.forEach((material) => {
                        [
                            material.map,
                            material.metalnessMap,
                            material.normalMap,
                            material.roughnessMap,
                        ].forEach((texture) => {
                            if (texture) {
                                texture.anisotropy = Math.min(
                                    4,
                                    renderer.capabilities.getMaxAnisotropy(),
                                );
                            }
                        });
                    });
                });

                model.updateMatrixWorld(true);
                const initialBounds = new THREE.Box3().setFromObject(model);
                const initialSize = initialBounds.getSize(new THREE.Vector3());
                const modelScale = POT_WIDTH / Math.max(initialSize.x, 0.001);
                model.scale.multiplyScalar(modelScale);
                model.updateMatrixWorld(true);

                const scaledBounds = new THREE.Box3().setFromObject(model);
                const scaledSize = scaledBounds.getSize(new THREE.Vector3());
                const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
                model.position.x -= scaledCenter.x;
                model.position.y += POT_BOTTOM_Y - scaledBounds.min.y;
                model.position.z -= scaledCenter.z;
                model.updateMatrixWorld(true);
                scene.add(model);

                const potTopY = POT_BOTTOM_Y + scaledSize.y;
                potDropPosition.set(0, potTopY - 0.34, 0.72);
                potDropRadius = Math.max(0.9, scaledSize.x * 0.29);
                potDropHeight = Math.max(0.58, scaledSize.y * 0.42);
                dropRing.position.set(0, potTopY + 0.015, 0.12);
                dropRing.scale.setScalar(potDropRadius / 1.18);
                liquidWax.position.set(0, potTopY - 0.035, 0.05);
                liquidWax.scale.setScalar(potDropRadius / 1.2);
                burner.position.set(0, POT_BOTTOM_Y - 0.28, 0.05);
                flame.position.set(
                    0,
                    POT_BOTTOM_Y + 0.02,
                    scaledSize.z / 2 + 0.12,
                );
                flame.scale.set(1.18, 0.5, 1);
                fireLight.position.set(
                    0,
                    POT_BOTTOM_Y + 0.08,
                    scaledSize.z / 2 + 0.35,
                );

                isPotReady = true;
                syncState();
                setIsLoading(false);
            })
            .catch((error) => {
                if (!isMounted) {
                    return;
                }

                console.error("Unable to load cooking pot model:", error);
                setHasLoadError(true);
                setIsLoading(false);
            });

        const animate = (timestamp) => {
            if (!isMounted) {
                return;
            }

            animationFrameId = window.requestAnimationFrame(animate);
            if (
                !isSceneVisible ||
                document.hidden ||
                timestamp - lastRenderedAt < FRAME_INTERVAL_MS
            ) {
                return;
            }

            const deltaSeconds = Math.min(
                0.1,
                previousTimestamp === 0
                    ? FRAME_INTERVAL_MS / 1000
                    : (timestamp - previousTimestamp) / 1000,
            );
            previousTimestamp = timestamp;
            lastRenderedAt = timestamp;

            const currentProps = latestPropsRef.current;
            const isHeating = currentProps.malamState === "heating";
            const normalizedProgress = clampHeatingProgress(
                currentProps.heatingProgress,
            );
            const easedProgress = THREE.MathUtils.smootherstep(
                normalizedProgress,
                0,
                1,
            );
            const positionDamping = 1 - Math.exp(-deltaSeconds * 11);

            if (!isDragging) {
                cubeGroup.position.lerp(cubeDesiredPosition, positionDamping);
            }

            cubeVisual.position.y =
                !currentProps.isMalamInPot && !isDragging
                    ? Math.sin(timestamp * 0.0026) * 0.055
                    : 0;
            cubeVisual.rotation.y += deltaSeconds * (isHeating ? 0.22 : 0.38);
            cubeVisual.rotation.x = isDragging
                ? -0.16
                : Math.sin(timestamp * 0.0014) * 0.035;
            cubeVisual.scale.set(
                1 + easedProgress * 0.5,
                1 - easedProgress * 0.82,
                1 + easedProgress * 0.38,
            );
            cubeMaterial.emissiveIntensity = isHeating
                ? THREE.MathUtils.lerp(0.08, 0.34, easedProgress)
                : 0.06;

            liquidWax.visible = currentProps.isMalamInPot && isHeating;
            liquidMaterial.opacity = easedProgress * 0.92;
            liquidWax.scale.y = 1;
            liquidWax.scale.x =
                (potDropRadius / 1.2) * (0.22 + easedProgress * 0.78);
            liquidWax.scale.z = liquidWax.scale.x;

            dropRing.visible =
                currentProps.malamState === "preparing" &&
                !currentProps.isMalamInPot;
            dropRingMaterial.color.set(isOverPot ? 0xffd875 : 0xd9bb7e);
            dropRingMaterial.opacity = isOverPot
                ? 0.95
                : 0.42 + Math.sin(timestamp * 0.004) * 0.12;
            dropRing.scale.y = isOverPot ? 1.08 : 1;

            const targetFireIntensity = isHeating ? 1 : 0;
            flameMaterial.uniforms.uIntensity.value = THREE.MathUtils.lerp(
                flameMaterial.uniforms.uIntensity.value,
                targetFireIntensity,
                1 - Math.exp(-deltaSeconds * 8),
            );
            flameMaterial.uniforms.uTime.value = timestamp / 1000;
            fireLight.intensity =
                flameMaterial.uniforms.uIntensity.value *
                (3.1 + Math.sin(timestamp * 0.018) * 0.35);

            renderer.render(scene, camera);
        };
        animationFrameId = window.requestAnimationFrame(animate);

        return () => {
            isMounted = false;
            runtimeRef.current = null;
            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
            }

            latestPropsRef.current.onDragStateChange(false);
            latestPropsRef.current.onPotDragOverChange(false);
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
            renderer.domElement.removeEventListener("pointerup", handlePointerUp);
            renderer.domElement.removeEventListener(
                "pointercancel",
                handlePointerCancel,
            );

            if (model) {
                scene.remove(model);
            }
            disposableGeometries.forEach((geometry) => geometry.dispose());
            disposableMaterials.forEach((material) => material.dispose());
            renderer.renderLists.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, []);

    const handleKeyDown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        runtimeRef.current?.placeMalam();
    };

    return (
        <div
            ref={mountRef}
            role="button"
            tabIndex={0}
            aria-busy={isLoading}
            aria-disabled={malamState !== "preparing" || isMalamInPot}
            aria-grabbed={isDraggingMalam}
            aria-label={
                isMalamInPot
                    ? `Kubus malam ${waxColorName} sudah berada di dalam kuali 3D.`
                    : `Adegan 3D kubus malam ${waxColorName} dan kuali. Seret kubus ke mulut kuali, atau tekan Enter.`
            }
            onKeyDown={handleKeyDown}
            className="absolute inset-0 overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#E2B86B] focus-visible:ring-inset"
        >
            {isLoading && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#07130E]/85 text-xs font-semibold text-[#CDB988]">
                    Memuat kuali 3D...
                </div>
            )}

            {hasLoadError && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#07130E] px-6 text-center text-xs font-semibold text-[#E2CEAB]">
                    Model kuali 3D tidak dapat dimuat pada perangkat ini.
                </div>
            )}
        </div>
    );
}
