export default function CanvasAnimationStyles() {
    return (
        <style>{`
            @keyframes wiggle {
                0%, 100% { transform: translateX(0) rotate(0deg); box-shadow: 0 0 0 0 rgba(232,141,141,0); }
                25% { transform: translateX(-5px) rotate(-2deg); box-shadow: 0 0 0 6px rgba(232,141,141,0.5); }
                75% { transform: translateX(5px) rotate(2deg); box-shadow: 0 0 0 6px rgba(232,141,141,0.5); }
            }
            .animate-wiggle {
                animation: wiggle 0.5s ease-in-out;
            }

            @keyframes flameFlicker {
                0%, 100% { transform: rotate(-45deg) scale(1, 1); opacity: 0.95; }
                35% { transform: rotate(-45deg) scale(0.9, 1.16); opacity: 1; }
                65% { transform: rotate(-45deg) scale(1.08, 0.94); opacity: 0.86; }
            }
            .flame-shape {
                position: absolute;
                left: 50%;
                bottom: 0;
                transform-origin: 50% 50%;
                border-radius: 0 50% 50% 50%;
                animation: flameFlicker 0.6s ease-in-out infinite;
            }
            @keyframes emberGlow {
                0%, 100% { opacity: 0.55; transform: translateX(-50%) scale(1); }
                50% { opacity: 0.95; transform: translateX(-50%) scale(1.18); }
            }
            @keyframes steamRise {
                0% { opacity: 0; transform: translateY(10px) scale(0.75); }
                30% { opacity: 0.5; }
                100% { opacity: 0; transform: translateY(-58px) scale(1.35); }
            }
            .steam-wisp {
                animation: steamRise 2.3s ease-out infinite;
            }
            @keyframes waxSimmer {
                0%, 100% { transform: translateX(-50%) translateY(0) scaleX(1); filter: brightness(0.95); }
                50% { transform: translateX(-50%) translateY(-2px) scaleX(1.04); filter: brightness(1.12); }
            }
            .animate-wax-simmer {
                animation: waxSimmer 1.4s ease-in-out infinite;
            }
        `}</style>
    );
}
