import { useEffect, useRef } from "react";

const ANIMATION_DURATION_MS = 1550;
const FRAME_INTERVAL_MS = 1000 / 75;
const MAX_PIXEL_RATIO = 1.15;
const WEAVE_TEXTURE_SIZE = 32;
const INITIAL_CLOTH_SCALE = 0.82;
const RESTING_CLOTH_SCALE = 1.08;
const MAX_FOLD_AMPLITUDE = 0.52;
const NORMAL_LIGHTING_TRANSITION_START = 0.7;

const clamp = (value, minimum, maximum) =>
    Math.min(Math.max(value, minimum), maximum);

const easeOutQuart = (progress) => 1 - Math.pow(1 - progress, 4);

const createWeaveBumpTexture = (THREE, renderer) => {
    const weaveCanvas = document.createElement("canvas");
    weaveCanvas.width = WEAVE_TEXTURE_SIZE;
    weaveCanvas.height = WEAVE_TEXTURE_SIZE;

    const context = weaveCanvas.getContext("2d");

    if (!context) {
        return null;
    }

    const imageData = context.createImageData(
        WEAVE_TEXTURE_SIZE,
        WEAVE_TEXTURE_SIZE,
    );

    for (let y = 0; y < WEAVE_TEXTURE_SIZE; y += 1) {
        for (let x = 0; x < WEAVE_TEXTURE_SIZE; x += 1) {
            const pixelIndex = (y * WEAVE_TEXTURE_SIZE + x) * 4;
            const warpThread = Math.pow(
                (Math.cos((x / 8) * Math.PI * 2) + 1) * 0.5,
                8,
            );
            const weftThread = Math.pow(
                (Math.cos((y / 8) * Math.PI * 2) + 1) * 0.5,
                8,
            );
            const warpIsRaised =
                (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
            const wovenHeight = warpIsRaised
                ? warpThread * 0.88 + weftThread * 0.34
                : warpThread * 0.34 + weftThread * 0.88;
            const fiberVariation = ((x * 13 + y * 7) % 17) / 17;
            const height = Math.round(
                88 + wovenHeight * 126 + fiberVariation * 12,
            );

            imageData.data[pixelIndex] = height;
            imageData.data[pixelIndex + 1] = height;
            imageData.data[pixelIndex + 2] = height;
            imageData.data[pixelIndex + 3] = 255;
        }
    }

    context.putImageData(imageData, 0, 0);

    const weaveTexture = new THREE.CanvasTexture(weaveCanvas);
    weaveTexture.wrapS = THREE.RepeatWrapping;
    weaveTexture.wrapT = THREE.RepeatWrapping;
    weaveTexture.repeat.set(48, 48);
    weaveTexture.anisotropy = Math.min(
        4,
        renderer.capabilities.getMaxAnisotropy(),
    );

    return weaveTexture;
};

export default function CanvasClothReveal3D({
    canvasHeight,
    canvasWidth,
    onComplete,
    sourceCanvasRef,
}) {
    const mountRef = useRef(null);

    useEffect(() => {
        const container = mountRef.current;
        const sourceCanvas = sourceCanvasRef.current;

        if (!container || !sourceCanvas) {
            onComplete();
            return undefined;
        }

        if (
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            onComplete();
            return undefined;
        }

        let animationFrameId = null;
        let disposed = false;
        let renderer = null;
        let geometry = null;
        let material = null;
        let normalLightingMaterial = null;
        let shadowMaterial = null;
        let texture = null;
        let weaveBumpTexture = null;

        const finishAnimation = () => {
            if (!disposed) {
                onComplete();
            }
        };

        const startAnimation = async () => {
            let THREE;

            try {
                THREE = await import("three");
            } catch (error) {
                console.error("Unable to load the canvas cloth renderer:", error);
                finishAnimation();
                return;
            }

            if (disposed) {
                return;
            }

            try {
                renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: window.devicePixelRatio <= 1.5,
                    powerPreference: "high-performance",
                });
            } catch (error) {
                console.error("Unable to create the canvas cloth renderer:", error);
                finishAnimation();
                return;
            }

            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
            );
            renderer.setSize(canvasWidth, canvasHeight, false);
            renderer.setClearColor(0x000000, 0);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            renderer.domElement.setAttribute("aria-hidden", "true");
            renderer.domElement.className = "block h-full w-full";
            container.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(
                -1.08,
                1.08,
                1.08,
                -1.08,
                0.1,
                20,
            );
            camera.position.set(0, 0, 5);

            const isConstrainedDevice =
                window.innerWidth < 768 ||
                (navigator.hardwareConcurrency ?? 8) <= 4;
            const segmentCount = isConstrainedDevice ? 20 : 36;

            geometry = new THREE.PlaneGeometry(
                2,
                2,
                segmentCount,
                segmentCount,
            );
            const restingPositions = Float32Array.from(
                geometry.attributes.position.array,
            );

            texture = new THREE.CanvasTexture(sourceCanvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(
                4,
                renderer.capabilities.getMaxAnisotropy(),
            );
            weaveBumpTexture = createWeaveBumpTexture(THREE, renderer);

            material = new THREE.MeshPhysicalMaterial({
                map: texture,
                bumpMap: weaveBumpTexture,
                bumpScale: 0.0055,
                roughness: 0.9,
                metalness: 0,
                sheen: 0.28,
                sheenColor: new THREE.Color(0xffffff),
                sheenRoughness: 0.82,
                side: THREE.DoubleSide,
            });

            const cloth = new THREE.Mesh(geometry, material);
            cloth.castShadow = true;
            cloth.receiveShadow = true;

            normalLightingMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                opacity: 0,
                side: THREE.DoubleSide,
                toneMapped: false,
                transparent: true,
                depthWrite: false,
            });

            const normalLightingOverlay = new THREE.Mesh(
                geometry,
                normalLightingMaterial,
            );
            normalLightingOverlay.position.z = 0.001;
            normalLightingOverlay.renderOrder = 1;
            cloth.add(normalLightingOverlay);

            shadowMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    animationSeconds: { value: 0 },
                    shadowStrength: { value: 1 },
                },
                vertexShader: `
                    uniform float animationSeconds;
                    uniform float shadowStrength;
                    varying float vFoldShadow;

                    void main() {
                        float travelingRipple = sin(
                            position.x * 5.1 +
                            position.y * 2.35 -
                            animationSeconds * 9.4
                        );
                        float broadFold = sin(
                            (position.y + 1.05) * 3.14159265 * 1.28 +
                            animationSeconds * 5.6
                        );
                        float diagonalFold = sin(
                            position.x * 2.7 -
                            position.y * 3.6 +
                            animationSeconds * 4.2
                        );
                        float fineWrinkle = sin(
                            position.x * 11.5 +
                            position.y * 7.8 -
                            animationSeconds * 12.5
                        );
                        float trailingEdge = pow(
                            (position.y + 1.0) * 0.5,
                            2.0
                        );
                        float edgeFlutter = sin(
                            position.x * 3.8 -
                            animationSeconds * 7.2
                        ) * trailingEdge;
                        float foldProfile =
                            travelingRipple * 0.52 +
                            broadFold * 0.36 +
                            diagonalFold * 0.18 +
                            fineWrinkle * 0.08 +
                            edgeFlutter * 0.24;
                        float creaseShade = pow(
                            clamp((0.16 - foldProfile) / 1.16, 0.0, 1.0),
                            1.05
                        );
                        float crossingShade = pow(
                            clamp(-diagonalFold, 0.0, 1.0),
                            2.0
                        );
                        float edgeShade = smoothstep(
                            0.88,
                            1.0,
                            max(abs(position.x), abs(position.y))
                        );

                        vFoldShadow = clamp(
                            shadowStrength *
                                (creaseShade * 0.72 + crossingShade * 0.14) +
                                edgeShade * 0.07,
                            0.0,
                            0.72
                        );
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    varying float vFoldShadow;

                    void main() {
                        gl_FragColor = vec4(0.025, 0.025, 0.025, vFoldShadow);
                    }
                `,
                transparent: true,
                depthWrite: false,
                depthTest: false,
                side: THREE.DoubleSide,
            });

            const foldShadowOverlay = new THREE.Mesh(
                geometry,
                shadowMaterial,
            );
            foldShadowOverlay.position.z = 0.002;
            foldShadowOverlay.renderOrder = 2;
            cloth.add(foldShadowOverlay);
            scene.add(cloth);

            scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 0.75));

            const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
            keyLight.position.set(-3.8, 2.8, 2.4);
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.set(
                isConstrainedDevice ? 512 : 1024,
                isConstrainedDevice ? 512 : 1024,
            );
            keyLight.shadow.camera.left = -2.4;
            keyLight.shadow.camera.right = 2.4;
            keyLight.shadow.camera.top = 2.4;
            keyLight.shadow.camera.bottom = -2.4;
            keyLight.shadow.camera.near = 0.5;
            keyLight.shadow.camera.far = 12;
            keyLight.shadow.bias = -0.00025;
            keyLight.shadow.normalBias = 0.018;
            scene.add(keyLight);

            const rimLight = new THREE.DirectionalLight(0xffffff, 0.38);
            rimLight.position.set(3.4, -1.2, 2.8);
            scene.add(rimLight);

            let animationStartedAt = null;
            let previousFrameAt = 0;

            const renderFrame = (timestamp) => {
                if (disposed) {
                    return;
                }

                if (animationStartedAt === null) {
                    animationStartedAt = timestamp;
                }

                if (timestamp - previousFrameAt < FRAME_INTERVAL_MS) {
                    animationFrameId = window.requestAnimationFrame(renderFrame);
                    return;
                }
                previousFrameAt = timestamp;

                const elapsed = timestamp - animationStartedAt;
                const progress = clamp(
                    elapsed / ANIMATION_DURATION_MS,
                    0,
                    1,
                );
                const flightProgress = easeOutQuart(progress);
                const remainingMotion = Math.pow(1 - progress, 1.75);
                const settlingOscillation =
                    Math.sin(progress * Math.PI * 5.2) * remainingMotion;
                normalLightingMaterial.opacity =
                    THREE.MathUtils.smootherstep(
                        progress,
                        NORMAL_LIGHTING_TRANSITION_START,
                        1,
                    );

                cloth.position.y =
                    -3.05 * (1 - flightProgress) +
                    settlingOscillation * 0.09;
                cloth.position.z =
                    -1.35 * (1 - flightProgress) +
                    Math.sin(progress * Math.PI) * 0.32;
                cloth.rotation.x =
                    -1.16 * (1 - flightProgress) +
                    settlingOscillation * 0.12;
                cloth.rotation.y =
                    0.11 * (1 - flightProgress) -
                    settlingOscillation * 0.035;
                cloth.rotation.z =
                    -0.045 * (1 - flightProgress) +
                    settlingOscillation * 0.012;

                const scale =
                    INITIAL_CLOTH_SCALE +
                    flightProgress *
                        (RESTING_CLOTH_SCALE - INITIAL_CLOTH_SCALE) +
                    settlingOscillation * 0.012;
                cloth.scale.set(scale, scale, scale);

                const positions = geometry.attributes.position;
                const waveAmplitude = MAX_FOLD_AMPLITUDE * remainingMotion;
                const animationSeconds = elapsed / 1000;
                shadowMaterial.uniforms.animationSeconds.value =
                    animationSeconds;
                shadowMaterial.uniforms.shadowStrength.value = clamp(
                    Math.pow(1 - progress, 0.9) * 1.2,
                    0,
                    1.2,
                );

                for (let index = 0; index < positions.count; index += 1) {
                    const offset = index * 3;
                    const restingX = restingPositions[offset];
                    const restingY = restingPositions[offset + 1];
                    const verticalPosition = (restingY + 1) * 0.5;
                    const trailingEdgeWeight = 0.5 + verticalPosition * 0.5;
                    const travelingRipple = Math.sin(
                        restingX * 5.1 +
                            restingY * 2.35 -
                            animationSeconds * 9.4,
                    );
                    const broadFold = Math.sin(
                        (restingY + 1.05) * Math.PI * 1.28 +
                            animationSeconds * 5.6,
                    );
                    const diagonalFold = Math.sin(
                        restingX * 2.7 -
                            restingY * 3.6 +
                            animationSeconds * 4.2,
                    );
                    const fineWrinkle = Math.sin(
                        restingX * 11.5 +
                            restingY * 7.8 -
                            animationSeconds * 12.5,
                    );
                    const edgeFlutter =
                        Math.sin(
                            restingX * 3.8 - animationSeconds * 7.2,
                        ) * Math.pow(verticalPosition, 2);
                    const foldProfile =
                        travelingRipple * 0.52 +
                        broadFold * 0.36 +
                        diagonalFold * 0.18 +
                        fineWrinkle * 0.08 +
                        edgeFlutter * 0.24;

                    positions.setXYZ(
                        index,
                        restingX +
                            diagonalFold * waveAmplitude * 0.045,
                        restingY +
                            broadFold * waveAmplitude * 0.07 *
                                trailingEdgeWeight,
                        waveAmplitude *
                            trailingEdgeWeight *
                            foldProfile,
                    );
                }

                positions.needsUpdate = true;
                geometry.computeVertexNormals();
                if (elapsed < 120) {
                    texture.needsUpdate = true;
                }
                renderer.render(scene, camera);

                if (progress < 1) {
                    animationFrameId = window.requestAnimationFrame(renderFrame);
                    return;
                }

                animationFrameId = window.requestAnimationFrame(
                    finishAnimation,
                );
            };

            animationFrameId = window.requestAnimationFrame(renderFrame);
        };

        startAnimation();

        return () => {
            disposed = true;

            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
            }
            if (renderer?.domElement && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }

            geometry?.dispose();
            material?.dispose();
            normalLightingMaterial?.dispose();
            shadowMaterial?.dispose();
            texture?.dispose();
            weaveBumpTexture?.dispose();
            renderer?.renderLists?.dispose();
            renderer?.dispose();
            renderer?.forceContextLoss();
        };
    }, [canvasHeight, canvasWidth, onComplete, sourceCanvasRef]);

    return (
        <div
            ref={mountRef}
            className="pointer-events-none absolute left-0 top-0 z-[5]"
            style={{ height: canvasHeight, width: canvasWidth }}
            role="img"
            aria-label="Kanvas kain tiga dimensi terbang masuk ke ruang kerja"
        />
    );
}
