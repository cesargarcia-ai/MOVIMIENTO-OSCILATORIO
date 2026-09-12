# MOVIMIENTO-OSCILATORIO
# Generate and export the README.md file so the user can download it
readme_text = """# 🌀 Cuaderno Virtual Interactivo: Movimiento Oscilatorio y M.A.S.

Aplicación web interactiva (**SPA / PWA**) desarrollada como trabajo práctico y académico para la asignatura de **Física III** en la **Universidad Tecnológica de Pereira (UTP)**. 

El proyecto explora los fundamentos teóricos, matemáticos y prácticos del **Movimiento Oscilatorio** y el **Movimiento Armónico Simple (MAS)** mediante simulaciones en tiempo real, representaciones gráficas interactivas estilo GeoGebra y resolución de problemas bajo un protocolo estructurado.

---

## 👥 Integrantes del Proyecto

Este trabajo fue realizado por los estudiantes:
* **Steven Cardona**
* **César García**
* **Leidi López**

🏛️ **Institución:** Universidad Tecnológica de Pereira (UTP)  
📚 **Asignatura:** Física III  

---

## 🚀 Características Principales

* **Cuaderno Virtual Interactivo:** Navegación por páginas interactivas con teoría, historia, glosario y referencias.
* **Simulaciones Físicas en Tiempo Real:** Oscilador masa-resorte, diagrama de fasores en el plano complejo y osciloscopio dinámico.
* **Conservación de la Energía:** Visualización en vivo de la conversión entre energía cinética y energía potencial elástica.
* **Plano Cartesiano Estilo GeoGebra:** Graficador interactivo con soporte para re-escalamiento de ejes, visualización de $x(t)$, $v(t)$, $a(t)$ y personalización gráfica.
* **Mapa Mental Interactivo:** Red conceptual para explorar las relaciones entre las variables físicas.
* **Taller de Problemas Resueltos:** Ejercicios detallados mediante un protocolo científico de 5 fases con código cromático.
* **Soporte PWA / SPA:** Aplicación web progresiva accesible de forma offline e instalable.
* **Renderizado Matemático:** Integración con **KaTeX** para fórmulas y ecuaciones analíticas rigurosas.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 / CSS3** (Modular, sin dependencias de frameworks pesados)
* **JavaScript (ES6+)**
* **Canvas 2D API** (Para los motores de simulación y el plano GeoGebra)
* **KaTeX** (Para renderizado de expresiones matemáticas en LaTeX)
* **PWA (Progressive Web App)** con Service Worker para funcionamiento offline

---

## 📂 Estructura del Proyecto

```text
.
├── index.html              # Archivo principal de la aplicación SPA
├── Portada.jpg             # Imagen de portada del cuaderno
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker para caché offline
├── css/
│   ├── main.css            # Estilos globales y variables
│   ├── notebook.css        # Estilos del cuaderno y componentes UI
│   ├── geogebra.css        # Estilos del graficador cartesiano
│   └── simulations.css     # Estilos del simulador interactivo
└── js/
    ├── app.js              # Lógica general de la aplicación y navegación
    ├── geogebra-plane.js   # Motor gráfico del plano cartesiano
    ├── mindmap.js          # Lógica e interactividad del mapa mental
    └── simulation.js       # Motor físico e interactivo de la simulación
