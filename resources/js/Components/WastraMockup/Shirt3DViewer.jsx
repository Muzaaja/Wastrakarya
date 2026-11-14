import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createDefaultKawungPicisTexture } from '@/Components/WastraMockup/Shirt3DGenerator';
import { Loader2 } from 'lucide-react';

export default function Shirt3DViewer({ className = '' }) {
    const mountRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        // 1. Scene
        const scene = new THREE.Scene();

        // 2. Camera
        const width = container.clientWidth || 400;
        const height = container.clientHeight || 450;
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(0, 0.4, 6.2);

        // 3. Renderer dengan Anti-Aliasing dan background transparan
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true 
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = false;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        container.appendChild(renderer.domElement);

        // 4. Orbit Controls (Interaksi mouse / touch)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false; // Matikan zoom agar scroll landing page tidak macet
        controls.maxPolarAngle = Math.PI / 2 + 0.15;
        controls.minPolarAngle = Math.PI / 3;
        controls.target.set(0, 0.1, 0);

        // 5. Pencahayaan Studio Mewah (Dramatic Studio Lights)
        const ambientLight = new THREE.AmbientLight(0x1B3428, 1.0);
        scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xFFF6E8, 2.2);
        keyLight.position.set(-3.5, 4.5, 4.0);
        keyLight.castShadow = true;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xA4C4B5, 1.1);
        fillLight.position.set(3.5, 2.0, 3.0);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xE0CEAB, 1.8);
        rimLight.position.set(0, 3.0, -4.5);
        scene.add(rimLight);

        // 6. Buat Tekstur Batik Kawung Picis
        const batikTex = createDefaultKawungPicisTexture();
        batikTex.wrapS = THREE.RepeatWrapping;
        batikTex.wrapT = THREE.RepeatWrapping;
        batikTex.repeat.set(2, 2);
        batikTex.needsUpdate = true;

        // 7. Load model GLTF kemeja
        let shirtObject = null;
        let isMounted = true;
        const loader = new GLTFLoader();
        loader.load(
            '/shirt_mockup/scene.gltf',
            (gltf) => {
                if (!isMounted) return;
                shirtObject = gltf.scene;

                // Normalisasi skala & posisi kemeja ke tengah panggung
                const box = new THREE.Box3().setFromObject(shirtObject);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 3.8 / maxDim;

                shirtObject.scale.setScalar(scale);
                shirtObject.position.set(
                    -center.x * scale,
                    -center.y * scale + 0.1,
                    -center.z * scale
                );

                // Pasang material dan tekstur batik ke mesh kemeja
                shirtObject.traverse((node) => {
                    if (node.isMesh) {
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

                scene.add(shirtObject);
                setIsLoading(false);
            },
            undefined,
            (error) => {
                console.error('GLTF load error in Shirt3DViewer:', error);
                if (isMounted) setIsLoading(false);
            }
        );

        // 8. Render Loop & Animasi rotasi santai
        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();

            // Berputar pelan saat user tidak sedang memutar/drag objek
            if (shirtObject && (!controls.state || controls.state === -1)) {
                shirtObject.rotation.y += 0.0025;
            }

            renderer.render(scene, camera);
        };
        animate();

        // 9. Resize Handler
        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const newW = container.clientWidth;
            const newH = container.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };
        window.addEventListener('resize', handleResize);

        // 10. Cleanup
        return () => {
            isMounted = false;
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (renderer.domElement && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div className={`relative w-full h-full min-h-[380px] flex items-center justify-center select-none ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-primary z-10">
                    <Loader2 className="w-9 h-9 animate-spin text-primary" />
                    <span className="text-sm font-medium text-white/70 tracking-wide">
                        Memuat Mahakarya 3D...
                    </span>
                </div>
            )}
            <div 
                ref={mountRef} 
                className="w-full h-full min-h-[380px] cursor-grab active:cursor-grabbing"
                title="Geser mouse untuk memutar kemeja 3D"
            />
        </div>
    );
}
