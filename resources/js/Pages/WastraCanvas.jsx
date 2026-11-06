import React, { useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import * as PIXI from 'pixi.js';

export default function WastraCanvas() {
    const canvasContainer = useRef(null);
    const appRef = useRef(null);

    useEffect(() => {
        // Fungsi asinkron untuk menginisialisasi PixiJS V8
        const initPixi = async () => {
            const app = new PIXI.Application();
            
            // Setup ukuran dan warna latar (krem khas kain mori)
            await app.init({ 
                width: 800, 
                height: 600, 
                backgroundColor: 0xf5f5dc,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
            });
            
            // Masukkan elemen <canvas> Pixi ke dalam <div> React
            if (canvasContainer.current) {
                canvasContainer.current.appendChild(app.canvas);
            }
            appRef.current = app;

            // Tambahkan Teks Sederhana ke tengah kanvas
            const textStyle = new PIXI.TextStyle({
                fontFamily: 'serif',
                fontSize: 28,
                fill: 0x5c4033, // Warna cokelat gelap batik
                fontWeight: 'bold'
            });
            
            const welcomeText = new PIXI.Text({ text: 'Kain Mori Digital Siap Digores!', style: textStyle });
            welcomeText.x = 400 - (welcomeText.width / 2);
            welcomeText.y = 300 - (welcomeText.height / 2);
            
            app.stage.addChild(welcomeText);
        };

        initPixi();

        // Cleanup memori saat pindah halaman (Penting untuk UI/UX)
        return () => {
            if (appRef.current) {
                appRef.current.destroy(true);
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col items-center py-10 font-sans">
            <Head title="WastraCanvas - Reka Motif" />
            
            <h1 className="text-4xl font-bold text-amber-900 mb-2">WastraCanvas</h1>
            <p className="text-gray-600 mb-8">Ruang Reka Motif Pintar (Area Drag-and-Drop)</p>
            
            {/* Wadah Kanvas dengan bingkai estetis Tailwind */}
            <div 
                ref={canvasContainer} 
                className="border-8 border-amber-800 shadow-2xl rounded-md overflow-hidden"
            ></div>
        </div>
    );
}