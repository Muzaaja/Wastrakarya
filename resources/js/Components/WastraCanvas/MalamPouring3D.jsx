import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ANIMATION_DURATION_SECONDS = 3;
const REDUCED_MOTION_DURATION_SECONDS = 0.5;
const CANTING_MODEL_PATH = "/canting_batik/scene.gltf";
const CANTING_HOLE_LOCAL = new THREE.Vector3(
    4.043715,
    0.014971,
    -2.54949,
);
const CANTING_HOLE_WORLD = new THREE.Vector3(-1.15, -0.72, 0);

const gltfLoader = new GLTFLoader();
let cantingModelPromise = null;

const loadCantingModel = () => {
    if (!cantingModelPromise) {
        cantingModelPromise = gltfLoader.loadAsync(CANTING_MODEL_PATH);
    }

    return cantingModelPromise;
};

const smoothRange = (progress, start, end) =>
    THREE.MathUtils.smootherstep(progress, start, end);

loadCantingModel();

export default function MalamPouring3D({ waxColor, onComplete }) {
    const mountRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadError, setHasLoadError] = useState(false);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        let isMounted = true;
        let animationFrameId = null;
        let animationStartedAt = null;
        let hasCompleted = false;
        let completionTimer = null;
        const disposableGeometries = [];
        const disposableMaterials = [];
        const modelMaterials = [];

        const scene = new THREE.Scene();
        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        const camera = new THREE.PerspectiveCamera(
            35,
            width / height,
            0.1,
            40,
        );
        camera.position.set(0, 4.1, 9);
        camera.lookAt(0, -0.25, 0);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
            });
        } catch (error) {
            console.error("Unable to create Malam pouring renderer:", error);
            setIsLoading(false);
            setHasLoadError(true);
            completionTimer = window.setTimeout(onComplete, 500);

            return () => clearTimeout(completionTimer);
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = false;
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.pointerEvents = "none";
        renderer.domElement.style.width = "100%";
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xd8e3da, 1.35));

        const keyLight = new THREE.DirectionalLight(0xfff1d2, 3.2);
        keyLight.position.set(-4, 6, 5);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x9fc7b2, 1.8);
        fillLight.position.set(5, 2, -3);
        scene.add(fillLight);

        const hotWaxColor = new THREE.Color(waxColor);
        const vesselGroup = new THREE.Group();
        vesselGroup.position.set(CANTING_HOLE_WORLD.x + 0.42, 2.15, 0);
        scene.add(vesselGroup);

        const vesselGeometry = new THREE.CylinderGeometry(
            0.54,
            0.43,
            0.68,
            24,
            1,
            true,
        );
        const vesselMaterial = new THREE.MeshStandardMaterial({
            color: 0x87511f,
            roughness: 0.38,
            metalness: 0.22,
            side: THREE.DoubleSide,
        });
        vesselGroup.add(new THREE.Mesh(vesselGeometry, vesselMaterial));
        disposableGeometries.push(vesselGeometry);
        disposableMaterials.push(vesselMaterial);

        const vesselBottomGeometry = new THREE.CircleGeometry(0.43, 24);
        const vesselBottomMaterial = new THREE.MeshStandardMaterial({
            color: 0x6d3c18,
            roughness: 0.45,
            metalness: 0.18,
        });
        const vesselBottom = new THREE.Mesh(
            vesselBottomGeometry,
            vesselBottomMaterial,
        );
        vesselBottom.position.y = -0.34;
        vesselBottom.rotation.x = -Math.PI / 2;
        vesselGroup.add(vesselBottom);
        disposableGeometries.push(vesselBottomGeometry);
        disposableMaterials.push(vesselBottomMaterial);

        const vesselWaxGeometry = new THREE.CircleGeometry(0.48, 24);
        const vesselWaxMaterial = new THREE.MeshStandardMaterial({
            color: hotWaxColor,
            emissive: hotWaxColor,
            emissiveIntensity: 0.28,
            roughness: 0.3,
        });
        const vesselWax = new THREE.Mesh(
            vesselWaxGeometry,
            vesselWaxMaterial,
        );
        vesselWax.position.y = 0.345;
        vesselWax.rotation.x = -Math.PI / 2;
        vesselGroup.add(vesselWax);
        disposableGeometries.push(vesselWaxGeometry);
        disposableMaterials.push(vesselWaxMaterial);

        const streamCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-0.06, -0.75, 0.03),
            new THREE.Vector3(0.05, -1.55, -0.02),
            new THREE.Vector3(0, -2.28, 0),
        ]);
        const streamGeometry = new THREE.TubeGeometry(
            streamCurve,
            24,
            0.065,
            7,
            false,
        );
        const streamMaterial = new THREE.MeshStandardMaterial({
            color: hotWaxColor,
            emissive: hotWaxColor,
            emissiveIntensity: 0.5,
            roughness: 0.24,
            transparent: true,
            opacity: 0,
        });
        const stream = new THREE.Mesh(streamGeometry, streamMaterial);
        stream.position.set(CANTING_HOLE_WORLD.x, 1.55, 0);
        stream.scale.y = 0.001;
        stream.visible = false;
        scene.add(stream);
        disposableGeometries.push(streamGeometry);
        disposableMaterials.push(streamMaterial);

        const dropletGeometry = new THREE.SphereGeometry(0.075, 10, 8);
        const dropletMaterial = new THREE.MeshStandardMaterial({
            color: hotWaxColor,
            emissive: hotWaxColor,
            emissiveIntensity: 0.42,
            roughness: 0.24,
        });
        const droplets = [0, 1, 2].map(() => {
            const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial);
            droplet.position.set(CANTING_HOLE_WORLD.x, 0.8, 0);
            droplet.visible = false;
            scene.add(droplet);
            return droplet;
        });
        disposableGeometries.push(dropletGeometry);
        disposableMaterials.push(dropletMaterial);

        const reservoirGeometry = new THREE.CylinderGeometry(
            0.14,
            0.14,
            0.045,
            20,
        );
        const reservoirMaterial = new THREE.MeshStandardMaterial({
            color: hotWaxColor,
            emissive: hotWaxColor,
            emissiveIntensity: 0.18,
            roughness: 0.22,
            transparent: true,
            opacity: 0,
        });
        const reservoirFill = new THREE.Mesh(
            reservoirGeometry,
            reservoirMaterial,
        );
        reservoirFill.position.set(
            CANTING_HOLE_WORLD.x,
            CANTING_HOLE_WORLD.y + 0.025,
            CANTING_HOLE_WORLD.z,
        );
        reservoirFill.scale.setScalar(0.18);
        scene.add(reservoirFill);
        disposableGeometries.push(reservoirGeometry);
        disposableMaterials.push(reservoirMaterial);

        const waxLight = new THREE.PointLight(hotWaxColor, 2.2, 3.5, 2);
        waxLight.position.set(
            CANTING_HOLE_WORLD.x,
            CANTING_HOLE_WORLD.y + 0.45,
            1,
        );
        scene.add(waxLight);

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const animationDuration = prefersReducedMotion
            ? REDUCED_MOTION_DURATION_SECONDS
            : ANIMATION_DURATION_SECONDS;

        const finishAnimation = () => {
            if (hasCompleted) return;

            hasCompleted = true;
            completionTimer = window.setTimeout(() => {
                if (isMounted) onComplete();
            }, 80);
        };

        const animate = (timestamp) => {
            if (!isMounted) return;

            if (animationStartedAt !== null) {
                const elapsedSeconds =
                    (timestamp - animationStartedAt) / 1000;
                const progress = Math.min(
                    1,
                    elapsedSeconds / animationDuration,
                );
                const tiltIn = smoothRange(progress, 0.05, 0.22);
                const tiltOut = smoothRange(progress, 0.78, 0.96);
                const pourAmount = Math.max(0.001, tiltIn * (1 - tiltOut));
                const fillAmount = smoothRange(progress, 0.32, 0.76);

                vesselGroup.rotation.z =
                    THREE.MathUtils.lerp(0.08, 0.82, tiltIn) -
                    tiltOut * 0.74;
                vesselGroup.position.y =
                    2.15 - Math.sin(progress * Math.PI) * 0.08;

                stream.scale.y = pourAmount;
                stream.visible = progress > 0.08 && progress < 0.98;
                streamMaterial.opacity = Math.min(1, pourAmount * 2.8);

                const fillScale = 0.18 + fillAmount * 0.82;
                reservoirFill.scale.setScalar(fillScale);
                reservoirMaterial.opacity = fillAmount;
                reservoirMaterial.emissiveIntensity =
                    0.18 + fillAmount * 0.45;

                droplets.forEach((droplet, index) => {
                    const dropletProgress =
                        (progress * 3.1 + index * 0.29) % 1;
                    droplet.visible = pourAmount > 0.12;
                    droplet.position.y = 1.4 - dropletProgress * 1.95;
                    droplet.position.x =
                        CANTING_HOLE_WORLD.x +
                        Math.sin(
                            (dropletProgress + index) * Math.PI * 2,
                        ) *
                            0.025;
                    droplet.scale.setScalar(
                        0.7 + dropletProgress * 0.35,
                    );
                });

                if (progress >= 1) finishAnimation();
            }

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            if (!isMounted) return;

            const nextWidth = Math.max(1, container.clientWidth);
            const nextHeight = Math.max(1, container.clientHeight);
            camera.aspect = nextWidth / nextHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(nextWidth, nextHeight, false);
        };

        window.addEventListener("resize", handleResize);
        animationFrameId = requestAnimationFrame(animate);

        loadCantingModel()
            .then((gltf) => {
                if (!isMounted) return;

                const cantingModel = gltf.scene.clone(true);
                cantingModel.traverse((node) => {
                    if (!node.isMesh) return;

                    if (Array.isArray(node.material)) {
                        node.material = node.material.map((material) => {
                            const clonedMaterial = material.clone();
                            modelMaterials.push(clonedMaterial);
                            return clonedMaterial;
                        });
                    } else if (node.material) {
                        node.material = node.material.clone();
                        modelMaterials.push(node.material);
                    }
                });
                cantingModel.position
                    .copy(CANTING_HOLE_LOCAL)
                    .multiplyScalar(-1);

                const modelScale = new THREE.Group();
                modelScale.scale.setScalar(0.3);
                modelScale.add(cantingModel);

                const modelDirection = new THREE.Group();
                modelDirection.rotation.z = Math.PI;
                modelDirection.add(modelScale);

                const modelOrientation = new THREE.Group();
                modelOrientation.position.copy(CANTING_HOLE_WORLD);
                modelOrientation.rotation.x = Math.PI / 2;
                modelOrientation.add(modelDirection);
                scene.add(modelOrientation);

                setIsLoading(false);
                animationStartedAt = performance.now();
            })
            .catch((error) => {
                console.error("Unable to load canting model:", error);
                if (!isMounted) return;

                setIsLoading(false);
                setHasLoadError(true);
                completionTimer = window.setTimeout(onComplete, 700);
            });

        return () => {
            isMounted = false;
            window.removeEventListener("resize", handleResize);
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
            if (completionTimer !== null) {
                clearTimeout(completionTimer);
            }
            if (
                renderer.domElement &&
                container.contains(renderer.domElement)
            ) {
                container.removeChild(renderer.domElement);
            }

            disposableGeometries.forEach((geometry) => geometry.dispose());
            disposableMaterials.forEach((material) => material.dispose());
            modelMaterials.forEach((material) => material.dispose());
            renderer.dispose();
        };
    }, [onComplete, waxColor]);

    return (
        <div
            ref={mountRef}
            className="absolute inset-0 overflow-hidden rounded-[inherit] bg-[radial-gradient(circle_at_50%_40%,rgba(226,184,107,0.12),transparent_68%)]"
        >
            {isLoading && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#07130E] text-xs font-semibold text-[#CDB988]">
                    Menyiapkan animasi 3D...
                </div>
            )}
            {hasLoadError && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#07130E] px-6 text-center text-xs text-[#9CB0A4]">
                    Animasi 3D tidak dapat dimuat. Melanjutkan ke kanvas...
                </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#091611] to-transparent" />
        </div>
    );
}
