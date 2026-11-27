import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const MAX_PIXEL_RATIO = 1.25;
const FRAME_INTERVAL_MS = 1000 / 60;
const HOT_WAX_TINT = new THREE.Color("#FFB45F");

const clampProgress = (progress) => THREE.MathUtils.clamp(progress, 0, 1);

export default function MalamHardening3D({ progress, waxColor }) {
    const mountRef = useRef(null);
    const progressRef = useRef(clampProgress(progress));
    const renderProgressRef = useRef(null);
    const [hasWebGlError, setHasWebGlError] = useState(false);

    useEffect(() => {
        progressRef.current = clampProgress(progress);
        renderProgressRef.current?.(progressRef.current);
    }, [progress]);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        setHasWebGlError(false);
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
            });
        } catch (error) {
            console.error("Unable to create Malam hardening renderer:", error);
            setHasWebGlError(true);
            return;
        }

        let isMounted = true;
        let isVisible = true;
        let animationFrameId = null;
        let lastRenderedAt = 0;
        let displayedProgress = progressRef.current;
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
        camera.position.set(0, 3.45, 5.2);
        camera.lookAt(0, 0, 0);

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO),
        );
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.setAttribute("aria-hidden", "true");
        container.appendChild(renderer.domElement);

        scene.add(new THREE.HemisphereLight(0xffe4b5, 0x123326, 1.7));

        const keyLight = new THREE.DirectionalLight(0xffdfad, 2.8);
        keyLight.position.set(-3, 5, 4);
        scene.add(keyLight);

        const coolLight = new THREE.DirectionalLight(0x8ec4a7, 1.25);
        coolLight.position.set(4, 2, -3);
        scene.add(coolLight);

        const hotColor = new THREE.Color(waxColor).lerp(HOT_WAX_TINT, 0.48);
        const solidColor = new THREE.Color(waxColor);
        const currentColor = hotColor.clone();

        const waxGeometry = new THREE.SphereGeometry(1.18, 36, 18);
        const originalWaxPositions = Float32Array.from(
            waxGeometry.attributes.position.array,
        );
        const cubeWaxPositions = new Float32Array(originalWaxPositions.length);
        const cubeHalfExtent = 0.92;
        for (
            let offset = 0;
            offset < originalWaxPositions.length;
            offset += 3
        ) {
            const originalX = originalWaxPositions[offset];
            const originalY = originalWaxPositions[offset + 1];
            const originalZ = originalWaxPositions[offset + 2];
            const length = Math.hypot(originalX, originalY, originalZ) || 1;
            const normalizedX = originalX / length;
            const normalizedY = originalY / length;
            const normalizedZ = originalZ / length;
            const largestAxis = Math.max(
                Math.abs(normalizedX),
                Math.abs(normalizedY),
                Math.abs(normalizedZ),
            );
            const cubeProjection = cubeHalfExtent / largestAxis;

            cubeWaxPositions[offset] = normalizedX * cubeProjection;
            cubeWaxPositions[offset + 1] = normalizedY * cubeProjection;
            cubeWaxPositions[offset + 2] = normalizedZ * cubeProjection;
        }
        const waxMaterial = new THREE.MeshPhysicalMaterial({
            color: hotColor,
            emissive: hotColor,
            emissiveIntensity: 0.58,
            roughness: 0.16,
            metalness: 0.03,
            clearcoat: 0.85,
            clearcoatRoughness: 0.12,
            transparent: true,
            opacity: 0.97,
        });
        const wax = new THREE.Mesh(waxGeometry, waxMaterial);
        wax.scale.set(1.15, 0.2, 0.92);
        scene.add(wax);

        const cubeGuideGeometry = new THREE.BoxGeometry(1.52, 1.52, 1.52);
        const cubeEdgesGeometry = new THREE.EdgesGeometry(cubeGuideGeometry);
        cubeGuideGeometry.dispose();
        const cubeEdgesMaterial = new THREE.LineBasicMaterial({
            color: solidColor.clone().multiplyScalar(0.62),
            transparent: true,
            opacity: 0,
            depthWrite: false,
        });
        const cubeEdges = new THREE.LineSegments(
            cubeEdgesGeometry,
            cubeEdgesMaterial,
        );
        scene.add(cubeEdges);

        const lobeGeometry = new THREE.SphereGeometry(0.38, 18, 10);
        const lobeMaterial = waxMaterial.clone();
        const lobes = Array.from({ length: 5 }, (_, index) => {
            const lobe = new THREE.Mesh(lobeGeometry, lobeMaterial);
            lobe.userData.angle = (index / 5) * Math.PI * 2;
            scene.add(lobe);
            return lobe;
        });

        const bubbleGeometry = new THREE.SphereGeometry(0.075, 12, 8);
        const bubbleMaterial = new THREE.MeshPhysicalMaterial({
            color: hotColor,
            emissive: hotColor,
            emissiveIntensity: 0.7,
            roughness: 0.08,
            transparent: true,
            opacity: 0.75,
        });
        const bubbles = Array.from({ length: 4 }, (_, index) => {
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            bubble.userData.angle = index * 1.7 + 0.4;
            bubble.userData.speed = 0.7 + index * 0.13;
            scene.add(bubble);
            return bubble;
        });

        const heatRingGeometry = new THREE.TorusGeometry(1.12, 0.018, 6, 48);
        const heatRingMaterial = new THREE.MeshBasicMaterial({
            color: hotColor,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const heatRings = [0, 1].map((index) => {
            const ring = new THREE.Mesh(heatRingGeometry, heatRingMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = -0.15;
            ring.userData.offset = index * 0.5;
            scene.add(ring);
            return ring;
        });

        const shadowGeometry = new THREE.CircleGeometry(1.55, 40);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x020705,
            transparent: true,
            opacity: 0.42,
            depthWrite: false,
        });
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = -0.31;
        scene.add(shadow);

        const waxLight = new THREE.PointLight(hotColor, 2.6, 4.5, 2);
        waxLight.position.set(0, 1, 1.2);
        scene.add(waxLight);

        const renderScene = (timestamp, nextProgress, animateSurface = true) => {
            const hardenedAmount = THREE.MathUtils.smootherstep(
                nextProgress,
                0,
                1,
            );
            const cubeAmount = THREE.MathUtils.smootherstep(
                hardenedAmount,
                0.2,
                0.96,
            );
            const liquidAmount = 1 - hardenedAmount;
            const time = timestamp / 1000;
            const positionAttribute = waxGeometry.attributes.position;

            for (let index = 0; index < positionAttribute.count; index += 1) {
                const offset = index * 3;
                const originalX = originalWaxPositions[offset];
                const originalY = originalWaxPositions[offset + 1];
                const originalZ = originalWaxPositions[offset + 2];
                const angle = Math.atan2(originalZ, originalX);
                const radius = Math.hypot(originalX, originalZ);
                const wave = animateSurface
                    ? Math.sin(angle * 3 + radius * 5.5 + time * 2.25) *
                      0.09 *
                      liquidAmount
                    : 0;
                const liquidX = originalX * (1 + wave * 0.16);
                const liquidY = originalY + wave;
                const liquidZ = originalZ * (1 - wave * 0.12);

                positionAttribute.setXYZ(
                    index,
                    THREE.MathUtils.lerp(
                        liquidX,
                        cubeWaxPositions[offset],
                        cubeAmount,
                    ),
                    THREE.MathUtils.lerp(
                        liquidY,
                        cubeWaxPositions[offset + 1],
                        cubeAmount,
                    ),
                    THREE.MathUtils.lerp(
                        liquidZ,
                        cubeWaxPositions[offset + 2],
                        cubeAmount,
                    ),
                );
            }
            positionAttribute.needsUpdate = true;
            waxGeometry.computeVertexNormals();

            currentColor.copy(hotColor).lerp(solidColor, hardenedAmount);
            waxMaterial.color.copy(currentColor);
            waxMaterial.emissive.copy(currentColor);
            waxMaterial.emissiveIntensity = THREE.MathUtils.lerp(
                0.58,
                0.025,
                hardenedAmount,
            );
            waxMaterial.roughness = THREE.MathUtils.lerp(
                0.16,
                0.72,
                hardenedAmount,
            );
            waxMaterial.clearcoat = THREE.MathUtils.lerp(
                0.85,
                0.12,
                hardenedAmount,
            );
            waxMaterial.clearcoatRoughness = THREE.MathUtils.lerp(
                0.12,
                0.62,
                hardenedAmount,
            );
            lobeMaterial.color.copy(currentColor);
            lobeMaterial.emissive.copy(currentColor);
            lobeMaterial.emissiveIntensity = waxMaterial.emissiveIntensity;
            lobeMaterial.roughness = waxMaterial.roughness;
            lobeMaterial.clearcoat = waxMaterial.clearcoat;

            const breathing = animateSurface
                ? Math.sin(time * 1.65) * 0.035 * liquidAmount
                : 0;
            const liquidScaleX = 1.15 + breathing - hardenedAmount * 0.06;
            const liquidScaleY = THREE.MathUtils.lerp(
                0.2,
                0.31,
                hardenedAmount,
            );
            const liquidScaleZ = 0.92 - breathing + hardenedAmount * 0.06;
            wax.scale.set(
                THREE.MathUtils.lerp(liquidScaleX, 0.82, cubeAmount),
                THREE.MathUtils.lerp(liquidScaleY, 0.82, cubeAmount),
                THREE.MathUtils.lerp(liquidScaleZ, 0.82, cubeAmount),
            );
            wax.rotation.y =
                (animateSurface
                    ? Math.sin(time * 0.42) * 0.08 * liquidAmount
                    : 0) +
                cubeAmount * 0.58;
            wax.rotation.z = cubeAmount * -0.08;
            cubeEdges.rotation.copy(wax.rotation);
            cubeEdgesMaterial.opacity = THREE.MathUtils.smootherstep(
                cubeAmount,
                0.58,
                1,
            ) * 0.24;

            lobes.forEach((lobe, index) => {
                const angle =
                    lobe.userData.angle +
                    (animateSurface ? time * (0.12 + index * 0.014) : 0);
                const orbit = THREE.MathUtils.lerp(0.98, 0.24, cubeAmount);
                const wobble = animateSurface
                    ? Math.sin(time * 1.8 + index * 1.4) * 0.07 * liquidAmount
                    : 0;
                const lobeMergeAmount = (1 - cubeAmount) ** 2;
                lobe.visible = lobeMergeAmount > 0.002;
                lobe.position.set(
                    Math.cos(angle) * (orbit + wobble),
                    -0.04 + Math.sin(time * 1.4 + index) * 0.025 * liquidAmount,
                    Math.sin(angle) * (orbit - wobble) * 0.78,
                );
                lobe.scale.set(
                    THREE.MathUtils.lerp(0.9, 0.56, hardenedAmount) *
                        lobeMergeAmount,
                    THREE.MathUtils.lerp(0.5, 0.68, hardenedAmount) *
                        lobeMergeAmount,
                    THREE.MathUtils.lerp(0.88, 0.58, hardenedAmount) *
                        lobeMergeAmount,
                );
            });

            bubbleMaterial.opacity = liquidAmount * 0.72;
            bubbles.forEach((bubble, index) => {
                const cycle = (time * bubble.userData.speed + index * 0.24) % 1;
                const radius = 0.24 + index * 0.13;
                bubble.visible = liquidAmount > 0.08;
                bubble.position.set(
                    Math.cos(bubble.userData.angle) * radius,
                    0.18 + cycle * 0.24,
                    Math.sin(bubble.userData.angle) * radius * 0.65,
                );
                bubble.scale.setScalar((0.45 + cycle * 0.7) * liquidAmount);
            });

            heatRingMaterial.color.copy(currentColor);
            heatRingMaterial.opacity = liquidAmount * 0.28;
            heatRings.forEach((ring) => {
                const cycle = animateSurface
                    ? (time * 0.35 + ring.userData.offset) % 1
                    : ring.userData.offset;
                ring.scale.setScalar(0.78 + cycle * 0.5);
            });

            waxLight.color.copy(currentColor);
            waxLight.intensity = THREE.MathUtils.lerp(
                2.6,
                0.12,
                hardenedAmount,
            );
            shadow.scale.setScalar(
                THREE.MathUtils.lerp(1.08, 0.94, hardenedAmount),
            );
            shadowMaterial.opacity = THREE.MathUtils.lerp(
                0.34,
                0.48,
                hardenedAmount,
            );

            renderer.render(scene, camera);
        };

        renderProgressRef.current = (nextProgress) => {
            if (!isMounted) return;

            displayedProgress = nextProgress;
            renderScene(
                performance.now(),
                displayedProgress,
                !prefersReducedMotion,
            );
        };

        const resizeRenderer = () => {
            if (!isMounted) return;

            const width = Math.max(1, container.clientWidth);
            const height = Math.max(1, container.clientHeight);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
            renderScene(
                performance.now(),
                displayedProgress,
                !prefersReducedMotion,
            );
        };

        const resizeObserver = new ResizeObserver(resizeRenderer);
        resizeObserver.observe(container);

        const intersectionObserver = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting;
        });
        intersectionObserver.observe(container);

        const animate = (timestamp) => {
            if (!isMounted) return;

            if (
                isVisible &&
                !document.hidden &&
                timestamp - lastRenderedAt >= FRAME_INTERVAL_MS
            ) {
                lastRenderedAt = timestamp;
                displayedProgress = THREE.MathUtils.lerp(
                    displayedProgress,
                    progressRef.current,
                    0.08,
                );
                renderScene(timestamp, displayedProgress);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        resizeRenderer();
        if (!prefersReducedMotion) {
            animationFrameId = requestAnimationFrame(animate);
        }

        return () => {
            isMounted = false;
            renderProgressRef.current = null;
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            waxGeometry.dispose();
            waxMaterial.dispose();
            cubeEdgesGeometry.dispose();
            cubeEdgesMaterial.dispose();
            lobeGeometry.dispose();
            lobeMaterial.dispose();
            bubbleGeometry.dispose();
            bubbleMaterial.dispose();
            heatRingGeometry.dispose();
            heatRingMaterial.dispose();
            shadowGeometry.dispose();
            shadowMaterial.dispose();
            renderer.dispose();
        };
    }, [waxColor]);

    return (
        <div
            ref={mountRef}
            className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_46%,rgba(255,180,95,0.12),transparent_68%)]"
            role="img"
            aria-label="Animasi 3D malam cair panas yang perlahan mendingin dan berubah menjadi kubus padat"
        >
            {hasWebGlError && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="h-20 w-20 border border-[#F0BD72]/50 bg-gradient-to-br from-[#F2B765] to-[#8B6D45] shadow-[0_0_30px_rgba(240,183,101,0.28)] transition-all duration-1000"
                        style={{
                            borderRadius: `${(1 - clampProgress(progress)) * 50}%`,
                            transform: `scale(${1 - clampProgress(progress) * 0.12}, ${0.55 + clampProgress(progress) * 0.33}) rotate(${clampProgress(progress) * -5}deg)`,
                        }}
                        aria-hidden="true"
                    />
                </div>
            )}
        </div>
    );
}
