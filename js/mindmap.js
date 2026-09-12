/**
 * ==========================================================================
 * MAPA MENTAL INTERACTIVO: MOVIMIENTO OSCILATORIO Y MAS (mindmap.js)
 * Desarrollado por el Prof. Camilo Morales & Lic. Elena Valenzuela
 * Nodos interactivos en SVG, detalles al clic y conexiones conceptuales.
 * ==========================================================================
 */

class InteractiveMindMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.nodes = [
            {
                id: 'root',
                title: 'FÍSICA DE OSCILACIONES',
                subtitle: 'Sistemas periódicos y armónicos',
                x: 450, y: 220,
                color: '#1e3a8a',
                desc: 'Estudio de los cuerpos que realizan movimientos de vaivén alrededor de una posición de equilibrio estable bajo la acción de fuerzas restauradoras.',
                eq: '\\Sigma F = -k x',
                category: 'root'
            },
            // Rama 1: Movimiento Oscilatorio General
            {
                id: 'osc_gen',
                parentId: 'root',
                title: 'Movimiento Periódico y Oscilatorio',
                subtitle: 'Fundamentos cinemáticos',
                x: 180, y: 110,
                color: '#0369a1',
                desc: 'Todo movimiento que se repite idénticamente a intervalos regulares de tiempo T. Si además el cuerpo va y viene sobre la misma trayectoria, es oscilatorio.',
                eq: 'T = \\frac{1}{f}',
                category: 'concept'
            },
            {
                id: 'magnitudes',
                parentId: 'osc_gen',
                title: 'Magnitudes del SI',
                subtitle: 'T, f, ω, A, x',
                x: 90, y: 240,
                color: '#0284c7',
                desc: 'Elongación x [m], Amplitud A [m], Período T [s], Frecuencia f [Hz = s⁻¹], y Frecuencia angular ω [rad/s = 2πf].',
                eq: '\\omega = 2\\pi f = \\frac{2\\pi}{T}',
                category: 'units'
            },
            // Rama 2: Movimiento Armónico Simple (MAS)
            {
                id: 'mas_core',
                parentId: 'root',
                title: 'M.A.S. (Modelo Ideal)',
                subtitle: 'Fuerza proporcional a elongación',
                x: 720, y: 110,
                color: '#1d4ed8',
                desc: 'Movimiento rectilíneo periódico originado por una fuerza recuperadora elástica lineal regida por la Ley de Hooke sin disipación de energía.',
                eq: 'F = -kx = m \\frac{d^2x}{dt^2}',
                category: 'mas'
            },
            {
                id: 'diff_eq',
                parentId: 'mas_core',
                title: 'Ecuación Diferencial',
                subtitle: 'Modelo analítico de 2° orden',
                x: 820, y: 240,
                color: '#4338ca',
                desc: 'Ecuación diferencial ordinaria lineal de segundo orden con coeficientes constantes cuya solución describe oscilaciones sinusoidales puras.',
                eq: '\\frac{d^2x}{dt^2} + \\omega^2 x = 0, \\quad \\omega = \\sqrt{\\frac{k}{m}}',
                category: 'math'
            },
            // Rama 3: Cinemática del MAS
            {
                id: 'cinematica',
                parentId: 'root',
                title: 'Cinemática del MAS',
                subtitle: 'x(t), v(t), a(t)',
                x: 320, y: 350,
                color: '#059669',
                desc: 'Las funciones de elongación, velocidad y aceleración son armónicas, existiendo un desfase de π/2 entre x y v, y de π entre x y a.',
                eq: 'x(t) = A\\cos(\\omega t + \\phi)',
                category: 'kinematics'
            },
            // Rama 4: Dinámica y Energía
            {
                id: 'energia',
                parentId: 'root',
                title: 'Conservación de Energía',
                subtitle: 'Ec + Ep = Constante',
                x: 580, y: 350,
                color: '#ea580c',
                desc: 'La energía mecánica total del oscilador se conserva en ausencia de fricción, transformándose continuamente entre energía cinética y energía potencial elástica.',
                eq: 'E_m = \\frac{1}{2}mv^2 + \\frac{1}{2}kx^2 = \\frac{1}{2}kA^2',
                category: 'energy'
            }
        ];

        this.render();
    }

    render() {
        const width = 900;
        const height = 460;

        let svgLines = '';
        this.nodes.forEach(node => {
            if (node.parentId) {
                const parent = this.nodes.find(n => n.id === node.parentId);
                if (parent) {
                    svgLines += `
                        <path d="M ${parent.x} ${parent.y} Q ${(parent.x + node.x) / 2} ${(parent.y + node.y) / 2 - 20} ${node.x} ${node.y}" 
                              stroke="${node.color}" stroke-width="2.2" fill="none" stroke-opacity="0.6" stroke-dasharray="4,2"/>
                    `;
                }
            }
        });

        let svgNodes = '';
        this.nodes.forEach(node => {
            svgNodes += `
                <g class="mindmap-node" data-id="${node.id}" style="cursor: pointer;" transform="translate(${node.x}, ${node.y})">
                    <rect x="-85" y="-30" width="170" height="60" rx="10" fill="#ffffff" stroke="${node.color}" stroke-width="2.5" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))"/>
                    <circle cx="-65" cy="0" r="7" fill="${node.color}"/>
                    <text x="-50" y="-8" font-family="var(--font-heading)" font-size="11" font-weight="700" fill="#0f172a">${node.title}</text>
                    <text x="-50" y="10" font-family="var(--font-ui)" font-size="9" fill="#64748b">${node.subtitle}</text>
                </g>
            `;
        });

        this.container.innerHTML = `
            <div style="position: relative; width: 100%; overflow-x: auto; background: #f8fafc; border-radius: 12px; border: 1px solid var(--border-subtle); padding: 10px;">
                <svg viewBox="0 0 ${width} ${height}" style="width: 100%; min-width: 750px; height: auto; display: block;">
                    ${svgLines}
                    ${svgNodes}
                </svg>
                <div id="mindmap-detail-card" style="margin-top: 15px; padding: 15px 20px; background: #ffffff; border-radius: 10px; border-left: 4px solid #1e3a8a; box-shadow: var(--shadow-sm); display: none;">
                    <h4 id="mm-card-title" style="margin: 0 0 5px 0; color: #1e3a8a;"></h4>
                    <p id="mm-card-desc" style="margin: 0 0 10px 0; font-size: 0.92rem; color: #334155;"></p>
                    <div id="mm-card-eq" style="font-family: var(--font-mono); background: #f1f5f9; padding: 6px 12px; border-radius: 6px; font-size: 0.9rem; display: inline-block;"></div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const nodesElements = this.container.querySelectorAll('.mindmap-node');
        const detailCard = document.getElementById('mindmap-detail-card');
        const cardTitle = document.getElementById('mm-card-title');
        const cardDesc = document.getElementById('mm-card-desc');
        const cardEq = document.getElementById('mm-card-eq');

        nodesElements.forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                const data = this.nodes.find(n => n.id === id);
                if (data && detailCard) {
                    cardTitle.textContent = `${data.title} — ${data.subtitle}`;
                    cardTitle.style.color = data.color;
                    detailCard.style.borderLeftColor = data.color;
                    cardDesc.textContent = data.desc;
                    cardEq.textContent = data.eq;

                    // Renderizar KaTeX si está disponible
                    if (window.katex) {
                        try {
                            window.katex.render(data.eq, cardEq, { throwOnError: false });
                        } catch (e) {
                            cardEq.textContent = data.eq;
                        }
                    }

                    detailCard.style.display = 'block';
                    detailCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });
    }
}

window.InteractiveMindMap = InteractiveMindMap;
