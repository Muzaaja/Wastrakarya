import { useEffect, useRef } from "react";

const OPEN_DURATION_MS = 1280;
const CLOSE_DURATION_MS = 1040;
const FRAME_INTERVAL_MS = 1000 / 60;
const MAX_PIXEL_RATIO = 1.15;

const clamp = (value, minimum, maximum) =>
    Math.min(Math.max(value, minimum), maximum);

const easeInOutCubic = (progress) =>
    progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

const smoothstep = (minimum, maximum, value) => {
    const progress = clamp(
        (value - minimum) / Math.max(0.0001, maximum - minimum),
        0,
        1,
    );

    return progress * progress * (3 - 2 * progress);
};

const normalizeRect = (rect) => ({
    height: Math.max(1, rect?.height ?? 1),
    left: rect?.left ?? 0,
    top: rect?.top ?? 0,
    width: Math.max(1, rect?.width ?? 1),
});

const getFallbackTargetRect = (sceneRect) => ({
    height: sceneRect.height * 0.6,
    left: sceneRect.left + sceneRect.width * 0.2,
    top: sceneRect.top + sceneRect.height * 0.055,
    width: sceneRect.width * 0.6,
});

const getProjectedTargetRect = (THREE, sceneElement) => {
    const sceneRect = normalizeRect(
        sceneElement?.getBoundingClientRect() ?? {
            height: window.innerHeight,
            left: 0,
            top: 0,
            width: window.innerWidth,
        },
    );

    if (!sceneElement || sceneRect.width <= 1 || sceneRect.height <= 1) {
        return getFallbackTargetRect(sceneRect);
    }

    const camera = new THREE.PerspectiveCamera(
        34,
        sceneRect.width / sceneRect.height,
        0.1,
        40,
    );
    camera.position.set(0, 1.25, 8.4);
    camera.lookAt(0, -0.2, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    const clothMatrix = new THREE.Matrix4();
    const clothQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, -0.1, 0),
    );
    clothMatrix.compose(
        new THREE.Vector3(0, 1.55, 0.12),
        clothQuaternion,
        new THREE.Vector3(1, 1, 1),
    );

    const projectedCorners = [
        [-1.6, -1.525],
        [1.6, -1.525],
        [-1.6, 1.525],
        [1.6, 1.525],
    ].map(([x, y]) => {
        const point = new THREE.Vector3(x, y, 0)
            .applyMatrix4(clothMatrix)
            .project(camera);

        return {
            x: sceneRect.left + ((point.x + 1) * 0.5) * sceneRect.width,
            y: sceneRect.top + ((1 - point.y) * 0.5) * sceneRect.height,
        };
    });
    const xCoordinates = projectedCorners.map(({ x }) => x);
    const yCoordinates = projectedCorners.map(({ y }) => y);
    const left = Math.min(...xCoordinates);
    const right = Math.max(...xCoordinates);
    const top = Math.min(...yCoordinates);
    const bottom = Math.max(...yCoordinates);

    if (![left, right, top, bottom].every(Number.isFinite)) {
        return getFallbackTargetRect(sceneRect);
    }

    return {
        height: bottom - top,
        left,
        top,
        width: right - left,
    };
};

const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormalView;

    void main() {
        vUv = uv;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D uArtworkTexture;
    uniform vec3 uFabricColor;
    uniform float uFoldProgress;
    uniform float uOpacity;

    varying vec2 vUv;
    varying vec3 vNormalView;

    void main() {
        vec4 artwork = texture2D(uArtworkTexture, vUv);
        vec3 clothColor = mix(uFabricColor, artwork.rgb, artwork.a);
        vec3 lightDirection = normalize(vec3(-0.36, 0.58, 1.0));
        float diffuse = max(dot(normalize(vNormalView), lightDirection), 0.0);
        float foldLight = mix(1.0, 0.76 + diffuse * 0.34, uFoldProgress);
        float warp = sin(vUv.x * 860.0) * 0.5 + 0.5;
        float weft = sin(vUv.y * 860.0) * 0.5 + 0.5;
        float weave = mix(1.0, 0.975 + (warp + weft) * 0.025, uFoldProgress);

        gl_FragColor = vec4(clothColor * foldLight * weave, uOpacity);
    }
`;

export default function DyeingClothMorph3D({
    direction,
    fabricColor,
    onComplete,
    onHandoff,
    onReady,
    sceneRef,
    sourceRect: sourceRectValue,
    textureUrl,
}) {
    const mountRef = useRef(null);
    const sourceRectRef = useRef(sourceRectValue);
    sourceRectRef.current = sourceRectValue;

    useEffect(() => {
        const container = mountRef.current;
        const sourceRect = sourceRectRef.current;
        if (!container || !direction || !textureUrl || !sourceRect) {
            return undefined;
        }

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const animationFrameId = window.requestAnimationFrame(() => {
                onReady(direction);
                onHandoff(direction);
                onComplete(direction);
            });

            return () => window.cancelAnimationFrame(animationFrameId);
        }

        let animationFrameId = null;
        let disposed = false;
        let geometry = null;
        let material = null;
        let renderer = null;
        let texture = null;
        let resizeObserver = null;
        let hasHandedOff = false;
        let hasReportedReady = false;

        const finishWithoutAnimation = () => {
            if (disposed) {
                return;
            }

            onReady(direction);
            onHandoff(direction);
            onComplete(direction);
        };

        const startAnimation = async () => {
            let THREE;

            try {
                THREE = await import("three");
            } catch (error) {
                console.error("Unable to load the cloth morph renderer:", error);
                finishWithoutAnimation();
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
                console.error("Unable to create the cloth morph renderer:", error);
                finishWithoutAnimation();
                return;
            }

            renderer.setPixelRatio(
                Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
            );
            renderer.setClearColor(0x000000, 0);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.domElement.setAttribute("aria-hidden", "true");
            renderer.domElement.className = "block h-full w-full";
            renderer.domElement.style.filter =
                "drop-shadow(0 24px 30px rgba(0, 0, 0, 0.42))";
            container.appendChild(renderer.domElement);

            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 2200);
            camera.position.z = 1000;

            const isConstrainedDevice =
                window.innerWidth < 768 ||
                (navigator.hardwareConcurrency ?? 8) <= 4;
            const segmentCount = isConstrainedDevice ? 18 : 26;
            geometry = new THREE.PlaneGeometry(
                1,
                1,
                segmentCount,
                segmentCount,
            );
            const restingPositions = Float32Array.from(
                geometry.attributes.position.array,
            );

            material = new THREE.ShaderMaterial({
                fragmentShader,
                side: THREE.DoubleSide,
                transparent: true,
                uniforms: {
                    uArtworkTexture: { value: null },
                    uFabricColor: { value: new THREE.Color(fabricColor) },
                    uFoldProgress: { value: 0 },
                    uOpacity: { value: 1 },
                },
                vertexShader,
            });

            const cloth = new THREE.Mesh(geometry, material);
            scene.add(cloth);

            const textureLoader = new THREE.TextureLoader();
            try {
                texture = await textureLoader.loadAsync(textureUrl);
            } catch (error) {
                console.error("Unable to load the cloth morph texture:", error);
                finishWithoutAnimation();
                return;
            }

            if (disposed) {
                texture.dispose();
                return;
            }

            texture.colorSpace = THREE.SRGBColorSpace;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = Math.min(
                2,
                renderer.capabilities.getMaxAnisotropy(),
            );
            material.uniforms.uArtworkTexture.value = texture;

            let viewportWidth = 1;
            let viewportHeight = 1;
            let targetRect = getProjectedTargetRect(THREE, sceneRef.current);

            const resizeRenderer = () => {
                viewportWidth = Math.max(1, window.innerWidth);
                viewportHeight = Math.max(1, window.innerHeight);
                renderer.setSize(viewportWidth, viewportHeight, false);
                camera.left = -viewportWidth / 2;
                camera.right = viewportWidth / 2;
                camera.top = viewportHeight / 2;
                camera.bottom = -viewportHeight / 2;
                camera.updateProjectionMatrix();
                targetRect = getProjectedTargetRect(
                    THREE,
                    sceneRef.current,
                );
            };
            resizeRenderer();
            resizeObserver = new ResizeObserver(resizeRenderer);
            resizeObserver.observe(document.documentElement);

            const normalizedSourceRect = normalizeRect(sourceRect);
            const duration =
                direction === "opening"
                    ? OPEN_DURATION_MS
                    : CLOSE_DURATION_MS;
            let animationStartedAt = null;
            let previousFrameAt = 0;

            const renderFrame = (timestamp) => {
                if (disposed) {
                    return;
                }

                animationFrameId = window.requestAnimationFrame(renderFrame);
                if (timestamp - previousFrameAt < FRAME_INTERVAL_MS) {
                    return;
                }
                previousFrameAt = timestamp;

                if (animationStartedAt === null) {
                    animationStartedAt = timestamp;
                }

                const rawProgress = clamp(
                    (timestamp - animationStartedAt) / duration,
                    0,
                    1,
                );
                const travelProgress = easeInOutCubic(rawProgress);
                const clothProgress =
                    direction === "opening"
                        ? travelProgress
                        : 1 - travelProgress;
                const foldProgress = smoothstep(0.08, 0.92, clothProgress);
                const sourceCenterX =
                    normalizedSourceRect.left +
                    normalizedSourceRect.width / 2;
                const sourceCenterY =
                    normalizedSourceRect.top +
                    normalizedSourceRect.height / 2;
                const targetCenterX = targetRect.left + targetRect.width / 2;
                const targetCenterY = targetRect.top + targetRect.height / 2;
                const distance = Math.hypot(
                    targetCenterX - sourceCenterX,
                    targetCenterY - sourceCenterY,
                );
                const flightArc =
                    Math.sin(rawProgress * Math.PI) *
                    Math.min(54, distance * 0.1);
                const centerX = THREE.MathUtils.lerp(
                    sourceCenterX,
                    targetCenterX,
                    clothProgress,
                );
                const centerY = THREE.MathUtils.lerp(
                    sourceCenterY,
                    targetCenterY,
                    clothProgress,
                );
                const clothWidth = THREE.MathUtils.lerp(
                    normalizedSourceRect.width,
                    targetRect.width,
                    clothProgress,
                );
                const clothHeight = THREE.MathUtils.lerp(
                    normalizedSourceRect.height,
                    targetRect.height,
                    clothProgress,
                );
                const rotationX = -0.055 * foldProgress;
                const rotationY = -0.085 * foldProgress;
                const rotationZ = -0.012 * foldProgress;

                cloth.position.set(
                    centerX - viewportWidth / 2,
                    viewportHeight / 2 - centerY + flightArc,
                    Math.sin(rawProgress * Math.PI) * 36,
                );
                cloth.rotation.set(rotationX, rotationY, rotationZ);
                cloth.scale.set(
                    clothWidth / Math.cos(rotationY),
                    clothHeight / Math.cos(rotationX),
                    Math.min(clothWidth, clothHeight),
                );

                const positions = geometry.attributes.position;
                const animationSeconds = timestamp / 1000;
                for (let index = 0; index < positions.count; index += 1) {
                    const offset = index * 3;
                    const restingX = restingPositions[offset];
                    const restingY = restingPositions[offset + 1];
                    const clothX = restingX * 3.2;
                    const clothY = restingY * 3.05;
                    const horizontalEdge = Math.abs(clothX) / 1.6;
                    const verticalWeight = smoothstep(
                        -1.5,
                        1.5,
                        clothY,
                    );
                    const broadFold = Math.sin(
                        clothY * 3.15 +
                            clothX * 1.2 +
                            animationSeconds * 1.75,
                    );
                    const fineFold = Math.sin(
                        clothX * 6.4 -
                            clothY * 1.8 -
                            animationSeconds * 2.35,
                    );
                    const xOffset =
                        (Math.sin(
                            clothY * 2.2 + animationSeconds * 1.25,
                        ) *
                            0.035 *
                            verticalWeight) /
                        3.2;
                    const zOffset =
                        (broadFold * 0.105 +
                            fineFold * 0.035 * (0.4 + horizontalEdge)) /
                        3.05;

                    positions.setXYZ(
                        index,
                        restingX + xOffset * foldProgress,
                        restingY,
                        zOffset * foldProgress,
                    );
                }
                positions.needsUpdate = true;
                geometry.computeVertexNormals();

                material.uniforms.uFoldProgress.value = foldProgress;
                material.uniforms.uOpacity.value =
                    direction === "opening"
                        ? 1 - smoothstep(0.88, 1, rawProgress)
                        : 1;
                renderer.render(scene, camera);

                if (!hasReportedReady) {
                    hasReportedReady = true;
                    onReady(direction);
                }

                if (
                    !hasHandedOff &&
                    (direction === "closing" || rawProgress >= 0.88)
                ) {
                    hasHandedOff = true;
                    onHandoff(direction);
                }

                if (rawProgress >= 1) {
                    window.cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                    onComplete(direction);
                }
            };

            animationFrameId = window.requestAnimationFrame(renderFrame);
        };

        void startAnimation();

        return () => {
            disposed = true;

            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
            }
            resizeObserver?.disconnect();
            if (
                renderer?.domElement &&
                container.contains(renderer.domElement)
            ) {
                container.removeChild(renderer.domElement);
            }

            geometry?.dispose();
            material?.dispose();
            texture?.dispose();
            renderer?.renderLists?.dispose();
            renderer?.dispose();
            renderer?.forceContextLoss();
        };
    }, [
        direction,
        fabricColor,
        onComplete,
        onHandoff,
        onReady,
        sceneRef,
        textureUrl,
    ]);

    return (
        <div
            ref={mountRef}
            className="pointer-events-none fixed inset-0 z-30"
            role="img"
            aria-label="Kanvas batik berubah secara halus menjadi kain tiga dimensi"
        />
    );
}
