import { FramebufferTexture, ShaderMaterial, Vector2, WebGLRenderTarget } from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

const HIGHLIGHT_THRESHOLD = 0.52;
const HIGHLIGHT_KNEE = 0.25;
const STREAK_STEPS = [0.004, 0.016, 0.08];

const vertexShader = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

export function createScreenSpaceLensFlare(renderer) {
    const frame = new FramebufferTexture(1, 1);
    const highlights = new WebGLRenderTarget(1, 1, { depthBuffer: false });
    const streaks = highlights.clone();

    const highlightMaterial = new ShaderMaterial({
        vertexShader,
        uniforms: {
            frame: { value: frame },
            sampleOffset: { value: new Vector2() },
            surroundOffset: { value: new Vector2() },
            threshold: { value: HIGHLIGHT_THRESHOLD },
            knee: { value: HIGHLIGHT_KNEE },
        },
        fragmentShader: /* glsl */ `
            uniform sampler2D frame;
            uniform vec2 sampleOffset;
            uniform vec2 surroundOffset;
            uniform float threshold;
            uniform float knee;
            varying vec2 vUv;

            float brightness(vec2 uv) {
                vec3 color = texture2D(frame, uv).rgb;
                return dot(color, vec3(0.2126, 0.7152, 0.0722));
            }

            void main() {
                vec2 diagonal = vec2(sampleOffset.x, -sampleOffset.y);
                vec4 samples = vec4(
                    brightness(vUv - sampleOffset), brightness(vUv + sampleOffset),
                    brightness(vUv - diagonal), brightness(vUv + diagonal)
                );
                float streak = dot(smoothstep(threshold, threshold + knee, samples), vec4(0.25));

                vec2 horizontal = vec2(surroundOffset.x, 0.0);
                vec2 vertical = vec2(0.0, surroundOffset.y);
                float surroundings = 0.25 * (
                    brightness(vUv - horizontal) + brightness(vUv + horizontal) +
                    brightness(vUv - vertical) + brightness(vUv + vertical)
                );
                float peak = max(max(samples.x, samples.y), max(samples.z, samples.w));
                float glow = smoothstep(0.84, 0.98, peak) * smoothstep(0.04, 0.23, peak - surroundings);

                gl_FragColor = vec4(streak, glow, 0.0, 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
    });

    const streakMaterial = new ShaderMaterial({
        vertexShader,
        uniforms: {
            source: { value: null },
            stepWidth: { value: 0 },
            glowStep: { value: new Vector2() },
        },
        fragmentShader: /* glsl */ `
            uniform sampler2D source;
            uniform float stepWidth;
            uniform vec2 glowStep;
            varying vec2 vUv;

            float sampleStreak(vec2 uv) {
                float edge = min(uv.x, 1.0 - uv.x);
                float feather = max(0.018, 0.8 * stepWidth);
                return texture2D(source, uv).r * smoothstep(0.0, feather, edge);
            }

            void main() {
                vec2 offset = vec2(stepWidth, 0.0);
                vec2 highlights = texture2D(source, vUv).rg;
                float streak = 0.22 * highlights.r;
                streak += 0.19 * (sampleStreak(vUv - offset) + sampleStreak(vUv + offset));
                streak += 0.12 * (sampleStreak(vUv - 2.0 * offset) + sampleStreak(vUv + 2.0 * offset));
                streak += 0.06 * (sampleStreak(vUv - 3.0 * offset) + sampleStreak(vUv + 3.0 * offset));
                streak += 0.02 * (sampleStreak(vUv - 4.0 * offset) + sampleStreak(vUv + 4.0 * offset));

                float glow = highlights.g;
                if (dot(glowStep, glowStep) > 0.0) {
                    // Blur the optical highlights along one axis without stretching them into streaks.
                    vec2 nearOffset = 1.384615 * glowStep;
                    vec2 farOffset = 3.230769 * glowStep;
                    glow = 0.227027 * glow;
                    glow += 0.316216 * (texture2D(source, vUv - nearOffset).g + texture2D(source, vUv + nearOffset).g);
                    glow += 0.070270 * (texture2D(source, vUv - farOffset).g + texture2D(source, vUv + farOffset).g);
                }

                gl_FragColor = vec4(streak, glow, 0.0, 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
    });

    const compositeMaterial = new ShaderMaterial({
        vertexShader,
        uniforms: {
            frame: { value: frame },
            streaks: { value: null },
        },
        fragmentShader: /* glsl */ `
            uniform sampler2D frame;
            uniform sampler2D streaks;
            varying vec2 vUv;

            float sampleGhost(vec2 uv) {
                vec2 edge = min(uv, vec2(1.0) - uv);
                vec2 fade = smoothstep(vec2(0.0), vec2(0.12), edge);
                return texture2D(streaks, uv).g * fade.x * fade.y;
            }

            void main() {
                vec4 base = texture2D(frame, vUv);
                vec2 flare = texture2D(streaks, vUv).rg;
                vec3 streak = vec3(0.14, 0.46, 0.93) * flare.r;
                vec3 halo = vec3(0.14, 0.12, 0.09) * flare.g;

                vec2 center = vec2(0.5);
                vec2 offset = vUv - center;
                vec3 ghosts = vec3(0.043, 0.067, 0.080) * sampleGhost(center - 1.35 * offset);
                ghosts += vec3(0.071, 0.047, 0.063) * sampleGhost(center - 2.8 * offset);

                vec3 remaining = (1.0 - streak) * (1.0 - halo) * (1.0 - ghosts);
                gl_FragColor = vec4(1.0 - (1.0 - base.rgb) * remaining, base.a);
            }
        `,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
    });

    const quad = new FullScreenQuad(highlightMaterial);
    const bufferSize = new Vector2();
    const glowSteps = [new Vector2(), new Vector2(), new Vector2()];

    return {
        render() {
            renderer.getDrawingBufferSize(bufferSize);
            const { x: width, y: height } = bufferSize;
            if (width < 1 || height < 1) return;

            if (frame.image.width !== width || frame.image.height !== height) {
                frame.dispose();
                frame.image.width = width;
                frame.image.height = height;
                frame.needsUpdate = true;

                // Reduce horizontal resolution more than vertical to keep streaks thin.
                const streakWidth = Math.ceil(width / 4);
                const streakHeight = Math.ceil(height / 2);
                highlights.setSize(streakWidth, streakHeight);
                streaks.setSize(streakWidth, streakHeight);
                highlightMaterial.uniforms.sampleOffset.value.set(0.25 / streakWidth, 0.25 / streakHeight);
                highlightMaterial.uniforms.surroundOffset.value.set(0.04 * height / width, 0.04);
                glowSteps[0].set(0.008 * height / width, 0);
                glowSteps[1].set(0, 0.008);
            }

            // Capture the visible, tone-mapped frame after both cameras have rendered.
            renderer.copyFramebufferToTexture(frame);
            renderer.setRenderTarget(highlights);
            quad.material = highlightMaterial;
            quad.render(renderer);

            quad.material = streakMaterial;
            let source = highlights;
            let destination = streaks;
            for (const [index, stepWidth] of STREAK_STEPS.entries()) {
                streakMaterial.uniforms.source.value = source.texture;
                streakMaterial.uniforms.stepWidth.value = stepWidth;
                streakMaterial.uniforms.glowStep.value.copy(glowSteps[index]);
                renderer.setRenderTarget(destination);
                quad.render(renderer);
                [source, destination] = [destination, source];
            }

            compositeMaterial.uniforms.streaks.value = source.texture;
            renderer.setRenderTarget(null);
            quad.material = compositeMaterial;
            quad.render(renderer);
        },

        dispose() {
            quad.dispose();
            frame.dispose();
            highlights.dispose();
            streaks.dispose();
            highlightMaterial.dispose();
            streakMaterial.dispose();
            compositeMaterial.dispose();
        },
    };
}
