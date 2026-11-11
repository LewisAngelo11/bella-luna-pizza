# Bella Luna Pizza

Juego web de terror: trabajas el turno de noche en **Bella Luna Pizza**, una pizzería con **reglas extrañas**. Si las rompes, el turno termina… mal.

## Cómo jugar

1. Abre `index.html` con un servidor local (módulos ES):

```bash
cd bella-luna-pizza
python3 -m http.server 8080
```

2. Entra a [http://localhost:8080](http://localhost:8080)
3. Lee el reglamento y firma el contrato
4. Sobrevive de **22:00 a 06:00** (~4–5 minutos reales)

### Controles

| Tecla / acción | Efecto |
|---|---|
| **R** | Abrir / cerrar reglamento |
| **F** | Revisar congelador |
| **D** | Abrir / cerrar cerrojo de la puerta trasera |
| **Espacio** (mantener) | Cerrar los ojos |
| Mover el **ratón** | Mirar alrededor (cámara 3D) |
| **Click izquierdo** en congelador / puerta | Abrir o cerrar |
| **Click derecho** | Girar y mirar la puerta trasera |
| Apuntar a **Mesa 6** | Mirar (peligroso) |
| Botones del panel | Atender o rechazar clientes / teléfono |

### Reglas clave

- Sin sombra → no servir
- Piña después de medianoche → rechazar
- Golpes en el congelador → **no abrir**
- Mesa 6 → máximo 3 segundos
- Teléfono: 2 timbres = contestar · 3 = colgar
- Ojos rojos → pan de ajo
- «El gerente me mandó» → mentira
- Luces parpadeando → cierra los ojos
- Después de las 02:00 → puerta cerrada

## Stack

HTML · CSS · **Babylon.js** · Web Audio API (sonido procedural) · JavaScript modules

### Estructura JS

```
js/
  game.js / audio.js / rules.js / main.js
  renderer.js              → fachada
  render/
    Renderer.js            → orquestador + API pública
    utils.js / materials.js / mesh.js / lights.js / particles.js
    room/                  → piezas de la sala (shell, window, oven…)
    actors/                → cliente y jumpscare
    systems/               → update por frame y calidad adaptativa
```

### Rendimiento 3D

Perfil ligero: resolución adaptativa, tope ~60 FPS, una sola sombra (512), menos luces dinámicas y texturas 256 px sin bump maps.

#### HUD de rendimiento (dev)

```
http://localhost:8080/?perf=1
```

O pulsa **P** en localhost. Muestra FPS, frame/render/GPU ms, draw calls, meshes, luces, shadow casters y geometrías únicas. Al activarse guarda un **baseline** en `sessionStorage` para comparar Δ tras optimizaciones. Off por defecto (sin coste de instrumentación).

#### Fase B (optimización real)

Comparativa aproximada idle (Fase A → B):

| Métrica | Antes | Después |
|---|---|---|
| Shadow casters | ~152 | ~13 |
| Unique geometries | ~190 | ~39 |
| Draw calls | ~930 | ~200 |
| Materials | ~79 | ~61 |
| RenderTargets | ~2.1 ms | ~0.6 ms |

Cambios: casters solo en props grandes, geometría de caja compartida, freeze de estáticos, render 20 FPS en menú/pausa, pausa con pestaña oculta, luces on-demand, update FX ~20 Hz, pick throttled.
