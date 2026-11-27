import { FRAGMENT_SHADER } from './shader';
import { BatikError } from './models';
const VERT = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const TILE = 256;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export class BatikEngine {
    constructor(out, cam, seg, pose, getParams, onBody) {
        this.out = out;
        this.cam = cam;
        this.seg = seg;
        this.pose = pose;
        this.getParams = getParams;
        this.onBody = onBody;
        this.gc = document.createElement('canvas');
        this.locs = new Map();
        this.tile = document.createElement('canvas');
        this.texDirty = true;
        this.mk = document.createElement('canvas');
        this.alpha = new Float32Array(0);
        this.sm = document.createElement('canvas');
        this.cut = { ok: false, X: 0.5, Y: 1, sl: 0 };
        this.poseLost = 99;
        this.pf = 0;
        this.G = null; // bahu L/R, pinggul L/R, siku L/R, pergelangan L/R (px)
        this.visS = [0, 0, 0, 0];
        this.yawS = 0;
        this.refR = 0;
        this.lastR0 = 1;
        this.exuPrev = null;
        this.refL = 0.4;
        this.bodyFound = false;
        this.running = false;
        this.lastT = -1;
        this.tick = () => {
            if (!this.running)
                return;
            const c = this.cam;
            if (c.readyState >= 2 && c.currentTime !== this.lastT) {
                this.lastT = c.currentTime;
                try {
                    if (this.pf++ % 2 === 0)
                        this.trackPose();
                    this.seg.segmentForVideo(c, performance.now(), (r) => this.onMask(r));
                    this.render();
                }
                catch (e) {
                    console.error('[BatikTryOn]', e);
                }
            }
            if ('requestVideoFrameCallback' in c)
                c.requestVideoFrameCallback(this.tick);
            else
                requestAnimationFrame(this.tick);
        };
        const octx = out.getContext('2d');
        const mctx = this.mk.getContext('2d');
        const smc = this.sm.getContext('2d', { willReadFrequently: true });
        const gl = this.gc.getContext('webgl', { preserveDrawingBuffer: true });
        if (!octx || !mctx || !smc)
            throw new BatikError('unknown', 'Canvas 2D tidak tersedia');
        if (!gl)
            throw new BatikError('webgl-unsupported', 'WebGL tidak didukung perangkat ini');
        this.octx = octx;
        this.mctx = mctx;
        this.smc = smc;
        this.gl = gl;
        this.sm.width = 48;
        this.sm.height = 36;
        this.tile.width = this.tile.height = TILE;
        const tg = this.tile.getContext('2d');
        if (tg) {
            tg.fillStyle = '#3b2314';
            tg.fillRect(0, 0, TILE, TILE);
        }
        const sh = (type, src) => {
            const o = gl.createShader(type);
            gl.shaderSource(o, src);
            gl.compileShader(o);
            if (!gl.getShaderParameter(o, gl.COMPILE_STATUS))
                throw new BatikError('webgl-unsupported', gl.getShaderInfoLog(o) ?? 'Shader gagal dikompilasi');
            return o;
        };
        const pr = gl.createProgram();
        gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
        gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS))
            throw new BatikError('webgl-unsupported', gl.getProgramInfoLog(pr) ?? 'Program WebGL gagal di-link');
        gl.useProgram(pr);
        this.prog = pr;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const tex = (unit) => {
            const t = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, t);
            return t;
        };
        const linear = () => {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        };
        this.tileTex = tex(0);
        tex(1);
        linear();
        tex(2);
        linear();
        gl.uniform1i(this.u('tex'), 0);
        gl.uniform1i(this.u('vid'), 1);
        gl.uniform1i(this.u('msk'), 2);
    }
    u(name) {
        let l = this.locs.get(name);
        if (l === undefined) {
            l = this.gl.getUniformLocation(this.prog, name);
            this.locs.set(name, l);
        }
        return l;
    }
    /** Ganti motif kain (kanvas/gambar/bitmap apa pun; otomatis diskalakan ke 256×256 agar bisa di-mipmap). */
    setPattern(src) {
        const g = this.tile.getContext('2d');
        if (!g)
            return;
        g.clearRect(0, 0, TILE, TILE);
        g.drawImage(src, 0, 0, TILE, TILE);
        this.texDirty = true;
    }
    /** Anggap posisi badan saat ini sebagai menghadap lurus ke kamera (0°). */
    calibrate() {
        this.refR = this.lastR0;
        this.yawS = 0;
    }
    start() {
        const w = this.cam.videoWidth;
        const h = this.cam.videoHeight;
        this.out.width = w;
        this.out.height = h;
        this.mk.width = w;
        this.mk.height = h;
        this.alpha = new Float32Array(w * h);
        this.running = true;
        this.lastT = -1;
        this.tick();
    }
    stop() {
        this.running = false;
    }
    destroy() {
        this.stop();
        this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    setBody(found) {
        if (found !== this.bodyFound) {
            this.bodyFound = found;
            this.onBody(found);
        }
    }
    trackPose() {
        const w = this.out.width;
        const h = this.out.height;
        const P = this.getParams();
        const pr = this.pose.detectForVideo(this.cam, performance.now());
        const L = pr.landmarks?.[0];
        const WL = pr.worldLandmarks?.[0];
        const cut = this.cut;
        if (!L) {
            if (++this.poseLost > 12) {
                cut.ok = false;
                this.setBody(false);
            }
            return;
        }
        this.poseLost = 0;
        this.setBody(true);
        // garis batas bawah baju di pinggul, mengikuti kemiringan badan (celana tidak diberi batik)
        const sh = (L[11].y + L[12].y) / 2;
        const hy = (L[23].y + L[24].y) / 2;
        const hx = (L[23].x + L[24].x) / 2;
        const Y = hy + Math.max(0.05, hy - sh) * P.hem;
        const dx = (L[24].x - L[23].x) * w;
        const dy = (L[24].y - L[23].y) * h;
        const sl = clamp(dy / (Math.abs(dx) < 1 ? (dx < 0 ? -1 : 1) : dx), -1, 1);
        if (!cut.ok) {
            this.cut = { ok: true, X: hx, Y, sl };
        }
        else {
            cut.X += (hx - cut.X) * 0.4;
            cut.Y += (Y - cut.Y) * 0.4;
            cut.sl += (sl - cut.sl) * 0.4;
        }
        // sendi: bahu, pinggul, siku, pergelangan; filter adaptif (halus saat diam, responsif saat bergerak)
        const q = [11, 12, 23, 24, 13, 14, 15, 16].flatMap((i) => [L[i].x * w, L[i].y * h]);
        if (this.G) {
            let sp = 0;
            for (let i = 0; i < 8; i++)
                sp += Math.abs(q[i] - this.G[i]);
            const k = Math.min(0.85, 0.12 + (sp / 8) * 0.05);
            this.G = this.G.map((v, i) => v + (q[i] - v) * k);
        }
        else
            this.G = q;
        const G = this.G;
        const vz = (i) => L[i].visibility ?? 1;
        const raw = [
            Math.min(vz(11), vz(13)),
            Math.min(vz(13), vz(15)),
            Math.min(vz(12), vz(14)),
            Math.min(vz(14), vz(16)),
        ];
        this.visS = this.visS.map((x, i) => x + (raw[i] - x) * 0.3);
        // putaran badan (yaw): lebar bahu di layar + kedalaman bahu 3D (besar sudut), posisi hidung (arah)
        const el = Math.hypot(G[2] - G[0], G[3] - G[1]) || 1;
        const mx = (G[0] + G[2]) / 2;
        const my = (G[1] + G[3]) / 2;
        const tl = Math.hypot((G[4] + G[6]) / 2 - mx, (G[5] + G[7]) / 2 - my) || 1;
        this.lastR0 = Math.min(1.8, el / tl);
        if (!this.refR || this.lastR0 > this.refR)
            this.refR = this.lastR0;
        else
            this.refR = Math.max(this.refR * 0.9997, this.lastR0);
        let mag = Math.acos(Math.min(1, this.lastR0 / this.refR));
        if (WL)
            mag = 0.4 * mag + 0.6 * Math.atan2(Math.abs(WL[12].z - WL[11].z), Math.abs(WL[12].x - WL[11].x));
        mag = Math.min(1.2, Math.max(0, mag - 0.08));
        const sgn = clamp((L[0].x * w - mx) / el / 0.08, -1, 1); // + = badan menghadap kanan layar
        this.yawS += (sgn * mag - this.yawS) * 0.3;
    }
    onMask(res) {
        const m = res.categoryMask;
        if (!m)
            return;
        const d = m.getAsUint8Array();
        const w = m.width;
        const h = m.height;
        if (this.mk.width !== w || this.mk.height !== h) {
            this.mk.width = w;
            this.mk.height = h;
            this.alpha = new Float32Array(w * h);
        }
        const img = this.mctx.createImageData(w, h);
        const px = img.data;
        const al = this.alpha;
        const cut = this.cut;
        for (let i = 0; i < d.length; i++) {
            const x = i % w;
            const y = (i / w) | 0;
            const lim = cut.ok ? cut.Y * h + cut.sl * (x - cut.X * w) : 1e9;
            const t = d[i] === 4 && y <= lim ? 1 : 0; // kategori 4 = pakaian, hanya bagian atas
            const a = (al[i] = al[i] * 0.55 + t * 0.45); // haluskan antar-frame
            if (a > 0.04)
                px[i * 4 + 3] = Math.min(255, a * 300);
        }
        this.mctx.putImageData(img, 0, 0);
    }
    shirtLum() {
        this.smc.drawImage(this.cam, 0, 0, 48, 36);
        const d = this.smc.getImageData(0, 0, 48, 36).data;
        const W = this.mk.width;
        const H = this.mk.height;
        let t = 0;
        let n = 0;
        for (let y = 0; y < 36; y++)
            for (let x = 0; x < 48; x++)
                if (this.alpha[((y * H) / 36 | 0) * W + ((x * W) / 48 | 0)] > 0.6) {
                    const i = (y * 48 + x) * 4;
                    t += (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
                    n++;
                }
        if (n > 20)
            this.refL += (t / n - this.refL) * 0.12;
    }
    render() {
        const { out, octx, cam } = this;
        const w = out.width;
        const h = out.height;
        octx.globalCompositeOperation = 'source-over';
        octx.globalAlpha = 1;
        octx.drawImage(cam, 0, 0, w, h);
        if (this.cut.ok && this.G) {
            this.drawGL(w, h);
            octx.globalAlpha = clamp(this.getParams().opacity, 0, 1);
            octx.drawImage(this.gc, 0, 0);
            octx.globalAlpha = 1;
        }
    }
    drawGL(w, h) {
        const { gl } = this;
        const g = this.G;
        const P = this.getParams();
        const f = (n, v) => gl.uniform1f(this.u(n), v);
        const v2 = (n, x, y) => gl.uniform2f(this.u(n), x, y);
        if (this.gc.width !== w || this.gc.height !== h) {
            this.gc.width = w;
            this.gc.height = h;
        }
        gl.viewport(0, 0, w, h);
        this.shirtLum();
        if (this.texDirty) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tileTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.tile);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            this.texDirty = false;
        }
        gl.activeTexture(gl.TEXTURE1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.cam);
        gl.activeTexture(gl.TEXTURE2);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.mk);
        const mx = (g[0] + g[2]) / 2;
        const my = (g[1] + g[3]) / 2;
        const hx = (g[4] + g[6]) / 2;
        const hy = (g[5] + g[7]) / 2;
        const ex = [g[2] - g[0], g[3] - g[1]];
        const el = Math.hypot(ex[0], ex[1]) || 1;
        let ey = [hx - mx, hy - my];
        if (Math.hypot(ey[0], ey[1]) < 8)
            ey = [0, el];
        const hipW = clamp(Math.hypot(g[6] - g[4], g[7] - g[5]), 0.6 * el, 1.2 * el);
        let exu = [ex[0] / el, ex[1] / el];
        if (el < 0.12 * Math.hypot(ey[0], ey[1]) && this.exuPrev)
            exu = this.exuPrev;
        else
            this.exuPrev = exu; // saat hampir menyamping, sumbu bahu tak stabil
        const yaw = this.yawS * P.turn;
        const cy = Math.max(Math.cos(yaw), 0.3);
        f('yaw', yaw);
        v2('res', w, h);
        v2('M', mx, my);
        v2('ey', ey[0], ey[1]);
        v2('exu', exu[0], exu[1]);
        f('shW', el * 1.25);
        f('hipW', hipW * 1.25);
        f('tilePx', Math.max(20, (el / cy) * 0.75 * P.scale));
        f('rot', (P.rotation * Math.PI) / 180);
        f('disp', P.fold * el * 0.9);
        const sl = [
            Math.hypot(g[8] - g[0], g[9] - g[1]),
            Math.hypot(g[12] - g[8], g[13] - g[9]),
            Math.hypot(g[10] - g[2], g[11] - g[3]),
            Math.hypot(g[14] - g[10], g[15] - g[11]),
        ];
        v2('uLs', g[0], g[1]);
        v2('uRs', g[2], g[3]);
        v2('uLe', g[8], g[9]);
        v2('uRe', g[10], g[11]);
        v2('uLw', g[12], g[13]);
        v2('uRw', g[14], g[15]);
        const en = this.visS.map((x, i) => (P.sleeves && x > 0.5 && sl[i] > 0.12 * el ? 1 : 0));
        gl.uniform4f(this.u('en'), en[0], en[1], en[2], en[3]);
        f('refL', this.refL);
        f('shadeK', P.shade);
        f('crack', P.crack);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
