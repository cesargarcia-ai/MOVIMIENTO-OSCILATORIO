/**
 * ==========================================================================
 * SIMULADOR FÍSICO INTERACTIVO DE OSCILADOR ARMÓNICO (simulation.js)
 * Desarrollado por la Dra. Sophia Vance & Ing. Mateo Rossi
 * Sistema masa-resorte, diagrama de fasores, osciloscopio en tiempo real
 * y barras dinámicas de conservación de energía mecánica.
 * ==========================================================================
 */

class HarmonicSimulation {
    constructor() {
        this.simCanvas = document.getElementById('sim-canvas');
        this.fasorCanvas = document.getElementById('fasor-canvas');
        this.oscCanvas = document.getElementById('oscilloscope-canvas');

        if (!this.simCanvas || !this.fasorCanvas || !this.oscCanvas) return;

        this.simCtx = this.simCanvas.getContext('2d');
        this.fasorCtx = this.fasorCanvas.getContext('2d');
        this.oscCtx = this.oscCanvas.getContext('2d');

        this.dpr = window.devicePixelRatio || 1;

        // Parámetros Físicos
        this.m = 1.0;         // Masa [kg]
        this.k = 25.0;        // Constante elástica [N/m]
        this.A = 1.5;         // Amplitud [m]
        this.phi = 0.0;       // Fase inicial [rad]

        // Variables de Estado
        this.t = 0.0;         // Tiempo simulado [s]
        this.isPlaying = true;
        this.timeScale = 1.0; // Velocidad de reproducción (1.0 = normal, 0.5 = lenta)
        this.history = [];    // Historial para el osciloscopio
        this.maxHistory = 400;

        this.lastFrameTime = performance.now();

        this.init();
    }

    init() {
        this.resize();
        this.bindEvents();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const setCanvasSize = (canvas, ctx) => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * this.dpr;
            canvas.height = rect.height * this.dpr;
            ctx.scale(this.dpr, this.dpr);
            return { width: rect.width, height: rect.height };
        };

        this.simDim = setCanvasSize(this.simCanvas, this.simCtx);
        this.fasorDim = setCanvasSize(this.fasorCanvas, this.fasorCtx);
        this.oscDim = setCanvasSize(this.oscCanvas, this.oscCtx);
    }

    bindEvents() {
        // Botones de Reproducción
        const btnPlay = document.getElementById('sim-btn-play');
        const btnPause = document.getElementById('sim-btn-pause');
        const btnReset = document.getElementById('sim-btn-reset');
        const btnSlow = document.getElementById('sim-btn-slow');
        const btnStep = document.getElementById('sim-btn-step');

        if (btnPlay) btnPlay.addEventListener('click', () => { this.isPlaying = true; });
        if (btnPause) btnPause.addEventListener('click', () => { this.isPlaying = false; });
        if (btnReset) btnReset.addEventListener('click', () => {
            this.t = 0;
            this.history = [];
        });

        if (btnSlow) btnSlow.addEventListener('click', () => {
            this.timeScale = this.timeScale === 1.0 ? 0.35 : 1.0;
            btnSlow.textContent = this.timeScale === 1.0 ? '🐢 Lenta' : '⚡ Normal';
        });

        if (btnStep) btnStep.addEventListener('click', () => {
            this.isPlaying = false;
            this.step(0.04);
        });

        // Sliders de Parámetros Físicos
        const sliderM = document.getElementById('sim-param-m');
        const sliderK = document.getElementById('sim-param-k');
        const sliderA = document.getElementById('sim-param-A');
        const sliderPhi = document.getElementById('sim-param-phi');

        if (sliderM) sliderM.addEventListener('input', (e) => {
            this.m = parseFloat(e.target.value);
            const val = document.getElementById('sim-val-m');
            if (val) val.textContent = `${this.m.toFixed(2)} kg`;
        });

        if (sliderK) sliderK.addEventListener('input', (e) => {
            this.k = parseFloat(e.target.value);
            const val = document.getElementById('sim-val-k');
            if (val) val.textContent = `${this.k.toFixed(1)} N/m`;
        });

        if (sliderA) sliderA.addEventListener('input', (e) => {
            this.A = parseFloat(e.target.value);
            const val = document.getElementById('sim-val-A');
            if (val) val.textContent = `${this.A.toFixed(2)} m`;
        });

        if (sliderPhi) sliderPhi.addEventListener('input', (e) => {
            this.phi = parseFloat(e.target.value);
            const val = document.getElementById('sim-val-phi');
            if (val) val.textContent = `${(this.phi / Math.PI).toFixed(2)}π rad`;
        });
    }

    step(dt) {
        this.t += dt;
        const omega = Math.sqrt(this.k / this.m);
        const x = this.A * Math.cos(omega * this.t + this.phi);
        const v = -this.A * omega * Math.sin(omega * this.t + this.phi);
        const a = -omega * omega * x;

        // Guardar para el osciloscopio
        this.history.push({ t: this.t, x, v, a });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        this.updateTelemetry(x, v, a, omega);
        this.updateEnergy(x, v);
    }

    updateTelemetry(x, v, a, omega) {
        const T = (2 * Math.PI) / omega;
        const f = 1 / T;

        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setTxt('telem-t', `${this.t.toFixed(2)} s`);
        setTxt('telem-x', `${x.toFixed(3)} m`);
        setTxt('telem-v', `${v.toFixed(3)} m/s`);
        setTxt('telem-a', `${a.toFixed(3)} m/s²`);
        setTxt('telem-T', `${T.toFixed(3)} s`);
        setTxt('telem-f', `${f.toFixed(3)} Hz`);
        setTxt('telem-omega', `${omega.toFixed(3)} rad/s`);
    }

    updateEnergy(x, v) {
        const Ec = 0.5 * this.m * v * v;
        const Ep = 0.5 * this.k * x * x;
        const Em = Ec + Ep; // Constante = 0.5 * k * A^2

        const maxE = 0.5 * this.k * Math.max(2.5, this.A) * Math.max(2.5, this.A);

        const pctEc = Math.min(100, (Ec / (Em || 1)) * 100);
        const pctEp = Math.min(100, (Ep / (Em || 1)) * 100);

        const fillEc = document.getElementById('energy-fill-kinetic');
        const fillEp = document.getElementById('energy-fill-potential');
        const valEc = document.getElementById('energy-val-kinetic');
        const valEp = document.getElementById('energy-val-potential');
        const valEm = document.getElementById('energy-val-total');

        if (fillEc) fillEc.style.width = `${pctEc}%`;
        if (fillEp) fillEp.style.width = `${pctEp}%`;

        if (valEc) valEc.textContent = `${Ec.toFixed(2)} J`;
        if (valEp) valEp.textContent = `${Ep.toFixed(2)} J`;
        if (valEm) valEm.textContent = `${Em.toFixed(2)} J`;
    }

    animate() {
        const now = performance.now();
        const deltaSeconds = Math.min(0.1, (now - this.lastFrameTime) / 1000);
        this.lastFrameTime = now;

        if (this.isPlaying) {
            this.step(deltaSeconds * this.timeScale);
        }

        const omega = Math.sqrt(this.k / this.m);
        const currentX = this.A * Math.cos(omega * this.t + this.phi);
        const currentV = -this.A * omega * Math.sin(omega * this.t + this.phi);

        this.drawSpringMass(currentX);
        this.drawFasor(omega);
        this.drawOscilloscope();

        requestAnimationFrame(() => this.animate());
    }

    // =========================================================================
    // 1. DIBUJO DEL OSCILADOR MASA-RESORTE
    // =========================================================================
    drawSpringMass(x) {
        const ctx = this.simCtx;
        const { width, height } = this.simDim;
        ctx.clearRect(0, 0, width, height);

        const wallX = 50;
        const groundY = height * 0.72;
        const centerLineY = groundY - 45;
        const eqX = width * 0.55; // Posición de equilibrio x = 0
        const scalePixelsPerMeter = 70; // 1 metro = 70px

        const massX = eqX + x * scalePixelsPerMeter;
        const massWidth = 70;
        const massHeight = 60;
        const massTopY = groundY - massHeight;

        // 1. Suelo y Pared
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, groundY, width, 14); // Suelo

        ctx.fillStyle = '#475569';
        ctx.fillRect(0, 20, wallX, groundY - 20); // Pared fija izquierda

        // Rayado de pared
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        for (let y = 30; y < groundY; y += 15) {
            ctx.beginPath();
            ctx.moveTo(wallX, y);
            ctx.lineTo(wallX - 15, y + 15);
            ctx.stroke();
        }

        // 2. Línea de Equilibrio x = 0 (Centrada)
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(eqX + massWidth / 2, 30);
        ctx.lineTo(eqX + massWidth / 2, groundY);
        ctx.stroke();

        ctx.font = 'bold 11px var(--font-mono)';
        ctx.fillStyle = '#059669';
        ctx.textAlign = 'center';
        ctx.fillText('x = 0 (Equilibrio)', eqX + massWidth / 2, 24);

        // Líneas de Amplitud Máxima ±A
        const maxPosScreen = eqX + this.A * scalePixelsPerMeter + massWidth / 2;
        const minPosScreen = eqX - this.A * scalePixelsPerMeter + massWidth / 2;

        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(maxPosScreen, 45); ctx.lineTo(maxPosScreen, groundY);
        ctx.moveTo(minPosScreen, 45); ctx.lineTo(minPosScreen, groundY);
        ctx.stroke();

        ctx.fillStyle = '#dc2626';
        ctx.fillText('+A', maxPosScreen, 40);
        ctx.fillText('-A', minPosScreen, 40);
        ctx.restore();

        // 3. Regla Milimetrada debajo del bloque
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(wallX, groundY + 8);
        ctx.lineTo(width - 20, groundY + 8);
        ctx.stroke();

        for (let m = -3; m <= 3; m += 0.5) {
            const rx = eqX + massWidth / 2 + m * scalePixelsPerMeter;
            if (rx > wallX && rx < width - 20) {
                const tickH = m % 1 === 0 ? 8 : 4;
                ctx.beginPath();
                ctx.moveTo(rx, groundY + 8);
                ctx.lineTo(rx, groundY + 8 + tickH);
                ctx.stroke();

                if (m % 1 === 0) {
                    ctx.font = '10px var(--font-mono)';
                    ctx.fillStyle = '#64748b';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${m}m`, rx, groundY + 26);
                }
            }
        }

        // 4. Resorte Metálico Espiralado Dinámico
        this.drawHelicalSpring(wallX, centerLineY, massX, centerLineY);

        // 5. Bloque de Masa m
        ctx.save();
        const massGrad = ctx.createLinearGradient(massX, massTopY, massX, groundY);
        massGrad.addColorStop(0, '#3b82f6');
        massGrad.addColorStop(1, '#1d4ed8');

        ctx.fillStyle = massGrad;
        ctx.fillRect(massX, massTopY, massWidth, massHeight);
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.strokeRect(massX, massTopY, massWidth, massHeight);

        // Etiqueta de masa en el bloque
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px var(--font-heading)';
        ctx.textAlign = 'center';
        ctx.fillText(`m = ${this.m} kg`, massX + massWidth / 2, massTopY + massHeight / 2 - 4);
        ctx.font = '11px var(--font-mono)';
        ctx.fillText(`x: ${x.toFixed(2)}m`, massX + massWidth / 2, massTopY + massHeight / 2 + 14);

        // Vector Fuerza Restauradora F = -kx
        const F = -this.k * x;
        const forceScale = 0.8;
        const forceArrowLen = Math.max(-90, Math.min(90, F * forceScale));

        if (Math.abs(forceArrowLen) > 6) {
            const arrowY = massTopY - 14;
            const arrowStartX = massX + massWidth / 2;
            const arrowEndX = arrowStartX + forceArrowLen;

            ctx.strokeStyle = '#ea580c';
            ctx.fillStyle = '#ea580c';
            ctx.lineWidth = 2.5;

            ctx.beginPath();
            ctx.moveTo(arrowStartX, arrowY);
            ctx.lineTo(arrowEndX, arrowY);
            ctx.stroke();

            // Punta de flecha
            const dir = forceArrowLen > 0 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(arrowEndX, arrowY);
            ctx.lineTo(arrowEndX - dir * 8, arrowY - 4);
            ctx.lineTo(arrowEndX - dir * 8, arrowY + 4);
            ctx.closePath();
            ctx.fill();

            ctx.font = 'bold 10px var(--font-mono)';
            ctx.textAlign = forceArrowLen > 0 ? 'left' : 'right';
            ctx.fillText(`F_rest = ${F.toFixed(1)} N`, arrowEndX + dir * 6, arrowY + 3);
        }

        ctx.restore();
    }

    // Trazado realista de resorte espiral
    drawHelicalSpring(startX, startY, endX, endY) {
        const ctx = this.simCtx;
        const coils = 16;
        const springLen = endX - startX;
        const coilWidth = springLen / coils;
        const coilHeight = 16;

        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        for (let i = 0; i <= coils; i++) {
            const cx = startX + i * coilWidth;
            const cy = (i % 2 === 0) ? startY - coilHeight : startY + coilHeight;
            if (i === 0 || i === coils) {
                ctx.lineTo(cx, startY);
            } else {
                ctx.lineTo(cx, cy);
            }
        }
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
    }

    // =========================================================================
    // 2. DIAGRAMA DE FASOR ROTANTE (PROYECCIÓN CIRCULAR)
    // =========================================================================
    drawFasor(omega) {
        const ctx = this.fasorCtx;
        const { width, height } = this.fasorDim;
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.38;

        const theta = omega * this.t + this.phi;

        // Círculo de referencia de radio A
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Ejes Complejos (Re e Im)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);

        ctx.beginPath();
        ctx.moveTo(10, cy); ctx.lineTo(width - 10, cy); // Eje Real
        ctx.moveTo(cx, 10); ctx.lineTo(cx, height - 10); // Eje Imag
        ctx.stroke();

        ctx.font = '10px var(--font-mono)';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Re', width - 20, cy - 6);
        ctx.fillText('Im', cx + 6, 20);

        // Vector Fasor Rotante
        const tipX = cx + radius * Math.cos(theta);
        const tipY = cy - radius * Math.sin(theta); // Invertir Y para sentido antihorario matemático

        ctx.setLineDash([]);
        ctx.strokeStyle = '#7c3aed';
        ctx.fillStyle = '#7c3aed';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Flecha de punta del fasor
        const arrowAngle = Math.atan2(cy - tipY, tipX - cx);
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Proyección sobre el Eje Real (Demuestra que MAS es la proyección del MCU)
        ctx.strokeStyle = '#2563eb';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX, cy);
        ctx.stroke();

        // Punto de Elongación proyectado en el eje
        ctx.beginPath();
        ctx.arc(tipX, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px var(--font-mono)';
        ctx.fillStyle = '#7c3aed';
        ctx.textAlign = 'center';
        ctx.fillText('Fasor A·e^(i(ωt+φ))', cx, height - 14);

        ctx.restore();
    }

    // =========================================================================
    // 3. OSCILOSCOPIO DINÁMICO EN TIEMPO REAL (x(t))
    // =========================================================================
    drawOscilloscope() {
        const ctx = this.oscCtx;
        const { width, height } = this.oscDim;
        ctx.clearRect(0, 0, width, height);

        const centerY = height / 2;
        const scaleY = (height * 0.38) / Math.max(1.5, this.A);

        // Cuadrícula del osciloscopio
        ctx.save();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;

        for (let y = 10; y < height; y += 25) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
        for (let x = 10; x < width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }

        // Línea central de cero
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(width, centerY); ctx.stroke();

        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.2;
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 6;

            const dx = width / this.maxHistory;

            for (let i = 0; i < this.history.length; i++) {
                const px = i * dx;
                const py = centerY - this.history[i].x * scaleY;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Inicializar cuando cargue el DOM
window.HarmonicSimulation = HarmonicSimulation;
