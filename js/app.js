/**
 * ==========================================================================
 * CUADERNO VIRTUAL DE FÍSICA III - CONTROLADOR PRINCIPAL SPA (app.js)
 * Desarrollado por el Equipo Multidisciplinar de IAs
 * Gestión de páginas, transiciones, portada dinámica vinculada, navegación y KaTeX
 * ==========================================================================
 */

class NotebookApp {
    constructor() {
        this.currentPage = 0; // 0: Portada, 1 a 11: Páginas de contenido
        this.totalPages = 11;

        this.coverStage = document.getElementById('cover-stage');
        this.sheetContainer = document.getElementById('notebook-sheet-container');
        this.pageArticles = document.querySelectorAll('.page-article');
        this.pageSelect = document.getElementById('notebook-page-select');
        this.pageNumberBadge = document.getElementById('sheet-page-badge');
        this.moduleInfo = document.getElementById('sheet-module-info');

        this.btnPrev = document.getElementById('nav-btn-prev');
        this.btnNext = document.getElementById('nav-btn-next');
        this.btnHome = document.getElementById('nav-btn-home');
        this.btnToc = document.getElementById('nav-btn-toc');
        this.tocDrawer = document.getElementById('toc-drawer');
        this.tocBackdrop = document.getElementById('toc-backdrop');
        this.btnFullscreen = document.getElementById('header-btn-fullscreen');

        this.pageTitles = [
            'Portada',
            'Presentación & Índice General',
            'Mapa Mental Interactivo',
            'Línea de Tiempo y Reseña Histórica',
            'Conceptos Fundamentales de Oscilación',
            'Movimiento Armónico Simple & Demostración',
            'Cinemática del MAS: x(t), v(t), a(t)',
            'Plano Cartesiano Estilo GeoGebra',
            'Simulación Física Interactiva Nivel Premium',
            'Taller de Ejercicios: Protocolo de 5 Fases',
            'Glosario Científico Interactivo',
            'Referencias Bibliográficas (Normas APA 7)'
        ];

        this.init();
    }

    init() {
        this.bindNavigationEvents();
        this.bindTocEvents();
        this.bindGlossaryFilter();
        this.bindApaCopyButtons();
        this.renderMathEquations();
        this.setupKeyboardShortcuts();

        // Inicializar componentes interactivos
        if (window.GeogebraPlane) {
            this.geogebra = new window.GeogebraPlane('geogebra-canvas', 'geogebra-canvas-container');
        }

        if (window.InteractiveMindMap) {
            this.mindmap = new window.InteractiveMindMap('interactive-mindmap-container');
        }

        if (window.HarmonicSimulation) {
            this.simulation = new window.HarmonicSimulation();
        }

        // Mostrar vista inicial (Portada)
        this.goToPage(0);
    }

    bindNavigationEvents() {
        // Enlace / Clic Directo sobre la Portada
        const coverBookLink = document.getElementById('cover-book-link');
        if (coverBookLink) {
            coverBookLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPage(1);
            });
        }

        // Botón Comenzar en la Portada
        const btnOpenNotebook = document.getElementById('btn-open-notebook');
        if (btnOpenNotebook) {
            btnOpenNotebook.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToPage(1);
            });
        }

        // Botones de Navegación Inferior
        if (this.btnPrev) {
            this.btnPrev.addEventListener('click', () => {
                if (this.currentPage > 0) this.goToPage(this.currentPage - 1);
            });
        }

        if (this.btnNext) {
            this.btnNext.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1);
            });
        }

        if (this.btnHome) {
            this.btnHome.addEventListener('click', () => {
                this.goToPage(0);
            });
        }

        // Selector Desplegable de Páginas
        if (this.pageSelect) {
            this.pageSelect.addEventListener('change', (e) => {
                const pageNum = parseInt(e.target.value, 10);
                this.goToPage(pageNum);
            });
        }

        // Pantalla Completa
        if (this.btnFullscreen) {
            this.btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }
    }

    bindTocEvents() {
        // Abrir y Cerrar Menú de Índice (TOC Drawer)
        if (this.btnToc && this.tocDrawer && this.tocBackdrop) {
            this.btnToc.addEventListener('click', () => this.toggleToc(true));
            this.tocBackdrop.addEventListener('click', () => this.toggleToc(false));

            const btnCloseToc = document.getElementById('btn-close-toc');
            if (btnCloseToc) btnCloseToc.addEventListener('click', () => this.toggleToc(false));

            // Clic en enlaces del índice
            const tocLinks = document.querySelectorAll('.toc-link');
            tocLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetPage = parseInt(link.getAttribute('data-page'), 10);
                    this.goToPage(targetPage);
                    this.toggleToc(false);
                });
            });
        }
    }

    toggleToc(open) {
        if (this.tocDrawer && this.tocBackdrop) {
            if (open) {
                this.tocDrawer.classList.add('open');
                this.tocBackdrop.classList.add('open');
            } else {
                this.tocDrawer.classList.remove('open');
                this.tocBackdrop.classList.remove('open');
            }
        }
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Ignorar si el usuario está escribiendo en un input o textarea
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                if (this.currentPage > 0) this.goToPage(this.currentPage - 1);
            } else if (e.key === 'Home') {
                this.goToPage(0);
            }
        });
    }

    /**
     * =========================================================================
     * CAMBIO Y CONTROL DE PÁGINAS
     * "No debe mostrar la portada siempre":
     * Si currentPage == 0: Muestra Portada, oculta Hoja de contenido.
     * Si currentPage >= 1: Oculta Portada, muestra Hoja de contenido sobre Hojas.jpg.
     * =========================================================================
     */
    goToPage(pageNum) {
        if (pageNum < 0 || pageNum > this.totalPages) return;
        this.currentPage = pageNum;

        // 1. Manejo de la Portada
        if (this.currentPage === 0) {
            // Mostrar exclusivamente la portada
            if (this.coverStage) this.coverStage.style.display = 'flex';
            if (this.sheetContainer) this.sheetContainer.style.display = 'none';

            if (this.btnPrev) this.btnPrev.disabled = true;
            if (this.btnNext) this.btnNext.disabled = false;
        } else {
            // Ocultar la portada y mostrar las hojas de cuaderno
            if (this.coverStage) this.coverStage.style.display = 'none';
            if (this.sheetContainer) this.sheetContainer.style.display = 'block';

            // Activar únicamente el artículo de la página actual
            this.pageArticles.forEach(article => {
                const articlePage = parseInt(article.getAttribute('data-page'), 10);
                if (articlePage === this.currentPage) {
                    article.style.display = 'block';
                } else {
                    article.style.display = 'none';
                }
            });

            // Actualizar Encabezado de la Hoja
            if (this.pageNumberBadge) {
                this.pageNumberBadge.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
            }

            if (this.moduleInfo) {
                this.moduleInfo.textContent = this.pageTitles[this.currentPage];
            }

            // Habilitar/Deshabilitar botones de paginación
            if (this.btnPrev) this.btnPrev.disabled = false;
            if (this.btnNext) this.btnNext.disabled = this.currentPage === this.totalPages;

            // Refrescar motores interactivos si se llega a su página
            if (this.currentPage === 7 && this.geogebra) {
                setTimeout(() => {
                    this.geogebra.resize();
                    this.geogebra.render();
                }, 100);
            }

            if (this.currentPage === 8 && this.simulation) {
                setTimeout(() => {
                    this.simulation.resize();
                }, 100);
            }
        }

        // Sincronizar el select de la barra inferior
        if (this.pageSelect) {
            this.pageSelect.value = this.currentPage.toString();
        }

        // Marcar enlace activo en el índice (TOC)
        const tocLinks = document.querySelectorAll('.toc-link');
        tocLinks.forEach(link => {
            const p = parseInt(link.getAttribute('data-page'), 10);
            if (p === this.currentPage) link.classList.add('active');
            else link.classList.remove('active');
        });

        // Scroll suave al inicio de la página
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    bindGlossaryFilter() {
        const searchInput = document.getElementById('glossary-search-input');
        const cards = document.querySelectorAll('.glossary-card');

        if (searchInput && cards.length > 0) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                cards.forEach(card => {
                    const title = card.querySelector('.glossary-term')?.textContent.toLowerCase() || '';
                    const def = card.querySelector('.glossary-def')?.textContent.toLowerCase() || '';
                    if (title.includes(term) || def.includes(term)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        }
    }

    bindApaCopyButtons() {
        const copyBtns = document.querySelectorAll('.btn-copy-apa');
        copyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const citationText = btn.getAttribute('data-citation');
                if (citationText) {
                    navigator.clipboard.writeText(citationText).then(() => {
                        const originalHtml = btn.innerHTML;
                        btn.innerHTML = '✓ ¡Copiado!';
                        btn.style.background = '#059669';
                        btn.style.color = '#ffffff';
                        setTimeout(() => {
                            btn.innerHTML = originalHtml;
                            btn.style.background = '';
                            btn.style.color = '';
                        }, 2000);
                    }).catch(() => {});
                }
            });
        });
    }

    renderMathEquations() {
        if (window.renderMathInElement) {
            try {
                window.renderMathInElement(document.body, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            } catch (err) {
                console.warn('Error al procesar KaTeX:', err);
            }
        }
    }
}

// Inicializar la aplicación cuando el documento esté listo
window.addEventListener('DOMContentLoaded', () => {
    window.app = new NotebookApp();
});
