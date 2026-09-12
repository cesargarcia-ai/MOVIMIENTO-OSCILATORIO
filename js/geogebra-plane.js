/**
 * ==========================================================================
 * PLANO CARTESIANO INTERACTIVO ESTILO "GEOGEBRA" (geogebra-plane.js)
 * Desarrollado por el Dr. Lucas Baum & Ing. Mateo Rossi
 * Cuadrícula mayor, cuadrícula menor milimetrada, reglas en ejes,
 * marcas, ticks adaptativos, re-escalamiento manual de ejes y barra flotante.
 * ==========================================================================
 */

class GeogebraPlane {
    constructor(canvasId, containerId) {
        this.canvas = document.getElementById(canvasId);
        this.container = document.getElementById(containerId);
        if (!this.canvas || !this.container) return;

        this.ctx = this.canvas.getContext('2d');

        // Estado del Plano
        this.originX = 0; // Coordenada pixel del origen (0,0)
        this.originY = 0;
        this.scaleX = 60; // Pixeles por unidad matemática en X
        this.scaleY = 60; // Pixeles por unidad matemática en Y
        this.dpr = window.devicePixelRatio || 1;

        // Modos de Interacción
        this.mode = 'pan'; // 'pan', 'select', 'scale-x', 'scale-y'
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.hoverAxis = null; // 'x', 'y', o null
        this.selectedPoint = null;

        // Estilos Gráficos (Configurables desde la Paleta)
        this.styles = {
            color: '#2563eb',          // Azul por defecto
            lineWidth: 2.5,
            lineStyle: 'solid',         // 'solid', 'dashed', 'dotted'
            fillArea: false,
            showPoints: true,
            gridMajorColor: '#cbd5e1',
            gridMinorColor: 'rgba(203, 213, 225, 0.45)', // Papel milimetrado fino
            axisColor: '#0f172a',
            axisTextColor: '#334155'
        };

        // Parámetros del Movimiento Armónico Simple
        this.params = {
            A: 2.0,       // Amplitud [m]
            omega: 1.5,   // Frecuencia angular [rad/s]
            phi: 0.0      // Fase inicial [rad]
        };

        // Función activa a graficar
        this.activeFunction = 'all'; // 'elongation', 'velocity', 'acceleration', 'all', 'custom'
        this.customFormula = 'A * cos(omega * t + phi)';

        this.init();
    }

    init() {
        this.resize();
        this.resetView();
        this.bindEvents();
        this.bindControls();
        this.render();

        window.addEventListener('resize', () => {
            this.resize();
            this.render();
        });
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height || 480;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    }

    resetView() {
        // Centrar origen en el centro o un poco a la izquierda para ver t >= 0
        this.originX = this.width * 0.25;
        this.originY = this.height * 0.5;
        this.scaleX = 65;
        this.scaleY = 65;
        this.selectedPoint = null;
        this.render();
    }

    // Conversión Matemáticas <-> Pixeles de Pantalla
    toScreenX(mathX) {
        return this.originX + mathX * this.scaleX;
    }

    toScreenY(mathY) {
        return this.originY - mathY * this.scaleY;
    }

    toMathX(screenX) {
        return (screenX - this.originX) / this.scaleX;
    }

    toMathY(screenY) {
        return (this.originY - screenY) / this.scaleY;
    }

    // Cálculo Inteligente de Intervalos (Nice Numbers)
    calculateStep(scale) {
        const targetPixelSpacing = 70;
        const rawStep = targetPixelSpacing / scale;
        const power = Math.floor(Math.log10(rawStep));
        const fraction = rawStep / Math.pow(10, power);

        let niceFraction;
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;

        return niceFraction * Math.pow(10, power);
    }

    bindEvents() {
        // Detección de Posición y Re-escalamiento Manual de Ejes
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Soporte Táctil para Dispositivos Móviles
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.handleMouseUp());
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Actualizar Visor de Coordenadas
        const mathX = this.toMathX(mouseX);
        const mathY = this.toMathY(mouseY);
        const coordOverlay = document.getElementById('geogebra-coord-readout');
        if (coordOverlay) {
            coordOverlay.textContent = `t = ${mathX.toFixed(2)} s, y = ${mathY.toFixed(2)}`;
        }

        if (!this.isDragging) {
            // Comprobar si el cursor está sobre el Eje X o Eje Y para re-escalamiento manual
            const distToYAxis = Math.abs(mouseX - this.originX);
            const distToXAxis = Math.abs(mouseY - this.originY);

            if (distToYAxis < 18) {
                this.hoverAxis = 'y';
                this.canvas.style.cursor = 'ns-resize'; // Reescalar eje vertical
            } else if (distToXAxis < 18) {
                this.hoverAxis = 'x';
                this.canvas.style.cursor = 'ew-resize'; // Reescalar eje horizontal
            } else {
                this.hoverAxis = null;
                this.canvas.style.cursor = this.mode === 'select' ? 'crosshair' : 'grab';
            }
        } else {
            const dx = mouseX - this.lastMousePos.x;
            const dy = mouseY - this.lastMousePos.y;

            if (this.hoverAxis === 'x') {
                // Re-escalamiento manual del eje X (con mouse o dedos)
                const factor = 1 + dx * 0.01;
                this.scaleX = Math.max(10, Math.min(600, this.scaleX * factor));
            } else if (this.hoverAxis === 'y') {
                // Re-escalamiento manual del eje Y (con mouse o dedos)
                const factor = 1 - dy * 0.01;
                this.scaleY = Math.max(10, Math.min(600, this.scaleY * factor));
            } else {
                // Arrastre general del lienzo (Pan)
                this.originX += dx;
                this.originY += dy;
            }

            this.lastMousePos = { x: mouseX, y: mouseY };
            this.render();
        }
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.lastMousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        if (!this.hoverAxis) {
            this.canvas.style.cursor = 'grabbing';
        }

        if (this.mode === 'select') {
            const mathX = this.toMathX(this.lastMousePos.x);
            const mathY = this.evaluateActiveFunction(mathX);
            this.selectedPoint = { x: mathX, y: mathY };
            this.render();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.hoverAxis = null;
        this.canvas.style.cursor = this.mode === 'select' ? 'crosshair' : 'grab';
    }

    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;

        // Zoom centrado en la posición del puntero
        const mathXBefore = this.toMathX(mouseX);
        const mathYBefore = this.toMathY(mouseY);

        this.scaleX = Math.max(10, Math.min(600, this.scaleX * zoomFactor));
        this.scaleY = Math.max(10, Math.min(600, this.scaleY * zoomFactor));

        this.originX = mouseX - mathXBefore * this.scaleX;
        this.originY = mouseY + mathYBefore * this.scaleY;

        this.render();
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.isDragging = true;
            this.lastMousePos = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };

            const distToYAxis = Math.abs(this.lastMousePos.x - this.originX);
            const distToXAxis = Math.abs(this.lastMousePos.y - this.originY);

            if (distToYAxis < 25) this.hoverAxis = 'y';
            else if (distToXAxis < 25) this.hoverAxis = 'x';
            else this.hoverAxis = null;
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = touch.clientX - rect.left;
            const mouseY = touch.clientY - rect.top;

            const dx = mouseX - this.lastMousePos.x;
            const dy = mouseY - this.lastMousePos.y;

            if (this.hoverAxis === 'x') {
                this.scaleX = Math.max(10, Math.min(600, this.scaleX * (1 + dx * 0.015)));
            } else if (this.hoverAxis === 'y') {
                this.scaleY = Math.max(10, Math.min(600, this.scaleY * (1 - dy * 0.015)));
            } else {
                this.originX += dx;
                this.originY += dy;
            }

            this.lastMousePos = { x: mouseX, y: mouseY };
            this.render();
        }
    }

    bindControls() {
        // Botones de la Barra Flotante
        const btnZoomIn = document.getElementById('geo-btn-zoom-in');
        if (btnZoomIn) btnZoomIn.addEventListener('click', () => {
            this.zoom(1.2);
        });

        const btnZoomOut = document.getElementById('geo-btn-zoom-out');
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => {
            this.zoom(0.83);
        });

        const btnReset = document.getElementById('geo-btn-reset');
        if (btnReset) btnReset.addEventListener('click', () => {
            this.resetView();
        });

        const btnPan = document.getElementById('geo-btn-pan');
        const btnSelect = document.getElementById('geo-btn-select');

        if (btnPan) btnPan.addEventListener('click', () => {
            this.mode = 'pan';
            btnPan.classList.add('active');
            if (btnSelect) btnSelect.classList.remove('active');
            this.canvas.style.cursor = 'grab';
        });

        if (btnSelect) btnSelect.addEventListener('click', () => {
            this.mode = 'select';
            btnSelect.classList.add('active');
            if (btnPan) btnPan.classList.remove('active');
            this.canvas.style.cursor = 'crosshair';
        });

        // Menú de Paleta de Estilos Gráficos
        const btnPalette = document.getElementById('geo-btn-palette');
        const popover = document.getElementById('geogebra-palette-popover');
        if (btnPalette && popover) {
            btnPalette.addEventListener('click', (e) => {
                e.stopPropagation();
                popover.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!popover.contains(e.target) && e.target !== btnPalette) {
                    popover.classList.remove('show');
                }
            });
        }

        // Swatches de Color
        const swatches = document.querySelectorAll('.color-swatch');
        swatches.forEach(sw => {
            sw.addEventListener('click', () => {
                swatches.forEach(s => s.classList.remove('selected'));
                sw.classList.add('selected');
                this.styles.color = sw.getAttribute('data-color');
                this.render();
            });
        });

        // Grosor de Línea
        const strokeSlider = document.getElementById('geo-stroke-slider');
        if (strokeSlider) {
            strokeSlider.addEventListener('input', (e) => {
                this.styles.lineWidth = parseFloat(e.target.value);
                const label = document.getElementById('geo-stroke-val');
                if (label) label.textContent = `${this.styles.lineWidth}px`;
                this.render();
            });
        }

        // Relleno bajo la Curva
        const fillAreaCheck = document.getElementById('geo-fill-area-check');
        if (fillAreaCheck) {
            fillAreaCheck.addEventListener('change', (e) => {
                this.styles.fillArea = e.target.checked;
                this.render();
            });
        }

        // Puntos Notables
        const showPointsCheck = document.getElementById('geo-show-points-check');
        if (showPointsCheck) {
            showPointsCheck.addEventListener('change', (e) => {
                this.styles.showPoints = e.target.checked;
                this.render();
            });
        }

        // Sliders de Parámetros MAS
        const sliderA = document.getElementById('geo-param-A');
        const sliderOmega = document.getElementById('geo-param-omega');
        const sliderPhi = document.getElementById('geo-param-phi');

        if (sliderA) sliderA.addEventListener('input', (e) => {
            this.params.A = parseFloat(e.target.value);
            const val = document.getElementById('geo-val-A');
            if (val) val.textContent = `${this.params.A.toFixed(1)} m`;
            this.render();
        });

        if (sliderOmega) sliderOmega.addEventListener('input', (e) => {
            this.params.omega = parseFloat(e.target.value);
            const val = document.getElementById('geo-val-omega');
            if (val) val.textContent = `${this.params.omega.toFixed(1)} rad/s`;
            this.render();
        });

        if (sliderPhi) sliderPhi.addEventListener('input', (e) => {
            this.params.phi = parseFloat(e.target.value);
            const val = document.getElementById('geo-val-phi');
            if (val) val.textContent = `${(this.params.phi / Math.PI).toFixed(2)}π rad`;
            this.render();
        });

        // Botones Presets
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFunction = btn.getAttribute('data-fn');
                this.render();
            });
        });
    }

    zoom(factor) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const mathXBefore = this.toMathX(centerX);
        const mathYBefore = this.toMathY(centerY);

        this.scaleX = Math.max(10, Math.min(600, this.scaleX * factor));
        this.scaleY = Math.max(10, Math.min(600, this.scaleY * factor));

        this.originX = centerX - mathXBefore * this.scaleX;
        this.originY = centerY + mathYBefore * this.scaleY;

        this.render();
    }

    evaluateActiveFunction(t) {
        const { A, omega, phi } = this.params;
        switch (this.activeFunction) {
            case 'elongation':
                return A * Math.cos(omega * t + phi);
            case 'velocity':
                return -A * omega * Math.sin(omega * t + phi);
            case 'acceleration':
                return -A * omega * omega * Math.cos(omega * t + phi);
            default:
                return A * Math.cos(omega * t + phi);
        }
    }

    // =========================================================================
    // RENDERIZADO DEL PLANO ESTILO GEOGEBRA
    // =========================================================================
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Fondo Blanco Cálido Científico
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawMillimeterGrid();
        this.drawAxesAndRules();
        this.drawCurves();
        this.drawNotablePoints();
        this.drawSelectedPoint();
    }

    // Cuadrícula Mayor y Menor (Estilo Papel Milimetrado)
    drawMillimeterGrid() {
        const ctx = this.ctx;
        const stepX = this.calculateStep(this.scaleX);
        const stepY = this.calculateStep(this.scaleY);

        const minMathX = this.toMathX(0);
        const maxMathX = this.toMathX(this.width);
        const minMathY = this.toMathY(this.height);
        const maxMathY = this.toMathY(0);

        // 1. Cuadrícula Menor (Subdivisiones milimétricas: 5 divisiones por paso principal)
        const subStepX = stepX / 5;
        const subStepY = stepY / 5;

        ctx.beginPath();
        ctx.strokeStyle = this.styles.gridMinorColor;
        ctx.lineWidth = 0.6;

        // Líneas verticales menores
        const firstSubX = Math.floor(minMathX / subStepX) * subStepX;
        for (let x = firstSubX; x <= maxMathX; x += subStepX) {
            const screenX = this.toScreenX(x);
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, this.height);
        }

        // Líneas horizontales menores
        const firstSubY = Math.floor(minMathY / subStepY) * subStepY;
        for (let y = firstSubY; y <= maxMathY; y += subStepY) {
            const screenY = this.toScreenY(y);
            ctx.moveTo(0, screenY);
            ctx.lineTo(this.width, screenY);
        }
        ctx.stroke();

        // 2. Cuadrícula Mayor
        ctx.beginPath();
        ctx.strokeStyle = this.styles.gridMajorColor;
        ctx.lineWidth = 1.0;

        const firstX = Math.floor(minMathX / stepX) * stepX;
        for (let x = firstX; x <= maxMathX; x += stepX) {
            const screenX = this.toScreenX(x);
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, this.height);
        }

        const firstY = Math.floor(minMathY / stepY) * stepY;
        for (let y = firstY; y <= maxMathY; y += stepY) {
            const screenY = this.toScreenY(y);
            ctx.moveTo(0, screenY);
            ctx.lineTo(this.width, screenY);
        }
        ctx.stroke();
    }

    // Reglas sobre los Ejes, Marcas, Ticks y Números
    drawAxesAndRules() {
        const ctx = this.ctx;
        const stepX = this.calculateStep(this.scaleX);
        const stepY = this.calculateStep(this.scaleY);

        const minMathX = this.toMathX(0);
        const maxMathX = this.toMathX(this.width);
        const minMathY = this.toMathY(this.height);
        const maxMathY = this.toMathY(0);

        // Posición del Eje dentro de la pantalla o fijado en el borde si sale de vista
        const clampedY = Math.max(25, Math.min(this.height - 25, this.originY));
        const clampedX = Math.max(35, Math.min(this.width - 35, this.originX));

        ctx.strokeStyle = this.styles.axisColor;
        ctx.fillStyle = this.styles.axisTextColor;
        ctx.lineWidth = 1.8;
        ctx.font = '11px var(--font-mono)';

        // 1. Eje X
        ctx.beginPath();
        ctx.moveTo(0, clampedY);
        ctx.lineTo(this.width, clampedY);
        ctx.stroke();

        // Flecha Eje X
        ctx.beginPath();
        ctx.moveTo(this.width - 8, clampedY - 4);
        ctx.lineTo(this.width, clampedY);
        ctx.lineTo(this.width - 8, clampedY + 4);
        ctx.fillStyle = this.styles.axisColor;
        ctx.fill();

        // Etiqueta Eje X
        ctx.textAlign = 'right';
        ctx.fillText('tiempo t (s)', this.width - 14, clampedY - 8);

        // Marcas y Números en Eje X
        const firstX = Math.floor(minMathX / stepX) * stepX;
        for (let x = firstX; x <= maxMathX; x += stepX) {
            if (Math.abs(x) < 1e-6) continue; // Origen tratado aparte
            const sx = this.toScreenX(x);

            // Regla milimetrada con marcas intermedias
            ctx.beginPath();
            ctx.moveTo(sx, clampedY - 5);
            ctx.lineTo(sx, clampedY + 5);
            ctx.stroke();

            // Número sobre la marca
            ctx.textAlign = 'center';
            const text = Number(x.toFixed(4)).toString();
            ctx.fillText(text, sx, clampedY + 16);
        }

        // 2. Eje Y
        ctx.beginPath();
        ctx.moveTo(clampedX, 0);
        ctx.lineTo(clampedX, this.height);
        ctx.stroke();

        // Flecha Eje Y
        ctx.beginPath();
        ctx.moveTo(clampedX - 4, 8);
        ctx.lineTo(clampedX, 0);
        ctx.lineTo(clampedX + 4, 8);
        ctx.fill();

        // Etiqueta Eje Y
        ctx.textAlign = 'left';
        ctx.fillText('magnitud', clampedX + 8, 14);

        // Marcas y Números en Eje Y
        const firstY = Math.floor(minMathY / stepY) * stepY;
        for (let y = firstY; y <= maxMathY; y += stepY) {
            if (Math.abs(y) < 1e-6) continue;
            const sy = this.toScreenY(y);

            ctx.beginPath();
            ctx.moveTo(clampedX - 5, sy);
            ctx.lineTo(clampedX + 5, sy);
            ctx.stroke();

            ctx.textAlign = 'right';
            const text = Number(y.toFixed(4)).toString();
            ctx.fillText(text, clampedX - 8, sy + 4);
        }

        // Número '0' en el Origen
        ctx.textAlign = 'right';
        ctx.fillText('0', clampedX - 6, clampedY + 14);

        // Destacar si el usuario está haciendo hover sobre algún eje para reescalar
        if (this.hoverAxis === 'x') {
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, clampedY);
            ctx.lineTo(this.width, clampedY);
            ctx.stroke();
        } else if (this.hoverAxis === 'y') {
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(clampedX, 0);
            ctx.lineTo(clampedX, this.height);
            ctx.stroke();
        }
    }

    // Trazo de Curvas con Estilos Gráficos
    drawCurves() {
        const { A, omega, phi } = this.params;

        if (this.activeFunction === 'all') {
            // Modo Comparativo: Traza Elongación, Velocidad y Aceleración simultáneamente
            this.drawSingleCurve((t) => A * Math.cos(omega * t + phi), '#2563eb', 2.8, 'solid', 'x(t)');
            this.drawSingleCurve((t) => -A * omega * Math.sin(omega * t + phi), '#059669', 2.0, 'dashed', 'v(t)');
            this.drawSingleCurve((t) => -A * omega * omega * Math.cos(omega * t + phi), '#dc2626', 1.8, 'dotted', 'a(t)');
            this.drawLegendAll();
        } else {
            // Función Individual Seleccionada con los Estilos de la Paleta
            let fn;
            let label = '';
            if (this.activeFunction === 'elongation') {
                fn = (t) => A * Math.cos(omega * t + phi);
                label = 'x(t) = A·cos(ωt + φ)';
            } else if (this.activeFunction === 'velocity') {
                fn = (t) => -A * omega * Math.sin(omega * t + phi);
                label = 'v(t) = -Aω·sin(ωt + φ)';
            } else if (this.activeFunction === 'acceleration') {
                fn = (t) => -A * omega * omega * Math.cos(omega * t + phi);
                label = 'a(t) = -Aω²·cos(ωt + φ)';
            }

            this.drawSingleCurve(fn, this.styles.color, this.styles.lineWidth, this.styles.lineStyle, label, this.styles.fillArea);
        }
    }

    drawSingleCurve(fn, color, lineWidth, lineStyle, label, fillArea = false) {
        const ctx = this.ctx;
        const pixelStep = 2; // Alta resolución de muestreo

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        if (lineStyle === 'dashed') ctx.setLineDash([8, 6]);
        else if (lineStyle === 'dotted') ctx.setLineDash([3, 4]);
        else ctx.setLineDash([]);

        let first = true;
        for (let px = 0; px <= this.width; px += pixelStep) {
            const mathT = this.toMathX(px);
            const mathY = fn(mathT);
            const py = this.toScreenY(mathY);

            if (first) {
                ctx.moveTo(px, py);
                first = false;
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.stroke();

        // Relleno bajo la curva si está activo
        if (fillArea) {
            ctx.lineTo(this.width, this.toScreenY(0));
            ctx.lineTo(0, this.toScreenY(0));
            ctx.closePath();
            ctx.fillStyle = color.replace(')', ', 0.12)').replace('rgb', 'rgba').replace('#', 'rgba(');
            // Fallback con hex a rgba
            ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
            ctx.fill();
        }

        ctx.restore();
    }

    drawLegendAll() {
        const ctx = this.ctx;
        const x = 16;
        const y = 20;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x - 6, y - 12, 230, 75);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(x - 6, y - 12, 230, 75);

        ctx.font = 'bold 11px var(--font-mono)';

        // x(t)
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 25, y); ctx.stroke();
        ctx.fillStyle = '#2563eb';
        ctx.fillText('x(t): Elongación [m]', x + 35, y + 4);

        // v(t)
        ctx.strokeStyle = '#059669';
        ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(x, y + 22); ctx.lineTo(x + 25, y + 22); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#059669';
        ctx.fillText('v(t): Velocidad [m/s]', x + 35, y + 26);

        // a(t)
        ctx.strokeStyle = '#dc2626';
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, y + 44); ctx.lineTo(x + 25, y + 44); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#dc2626';
        ctx.fillText('a(t): Aceleración [m/s²]', x + 35, y + 48);

        ctx.restore();
    }

    // Puntos Notables (Máximos, Mínimos y Cruces por Cero)
    drawNotablePoints() {
        if (!this.styles.showPoints || this.activeFunction === 'all') return;

        const ctx = this.ctx;
        const { A, omega, phi } = this.params;
        const minT = this.toMathX(0);
        const maxT = this.toMathX(this.width);

        // Periodo T = 2pi / omega
        const T = (2 * Math.PI) / omega;
        const firstK = Math.floor((minT * omega + phi) / Math.PI);
        const lastK = Math.ceil((maxT * omega + phi) / Math.PI);

        ctx.save();
        for (let k = firstK; k <= lastK; k++) {
            const t = (k * Math.PI - phi) / omega;
            if (t >= minT && t <= maxT) {
                const y = this.evaluateActiveFunction(t);
                const sx = this.toScreenX(t);
                const sy = this.toScreenY(y);

                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.strokeStyle = this.styles.color;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawSelectedPoint() {
        if (!this.selectedPoint) return;
        const ctx = this.ctx;
        const sx = this.toScreenX(this.selectedPoint.x);
        const sy = this.toScreenY(this.selectedPoint.y);

        ctx.save();
        // Círculo resaltado
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Líneas punteadas hacia los ejes
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;

        // Hacia Eje X
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, this.originY);
        ctx.stroke();

        // Hacia Eje Y
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(this.originX, sy);
        ctx.stroke();

        // Tooltip del punto
        const text = `(${this.selectedPoint.x.toFixed(2)}, ${this.selectedPoint.y.toFixed(2)})`;
        ctx.font = 'bold 11px var(--font-mono)';
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx + 8, sy - 22, 100, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, sx + 14, sy - 8);

        ctx.restore();
    }
}

// Exportar globalmente
window.GeogebraPlane = GeogebraPlane;
