# Bella Luna Pizza

Juego web de terror: trabajas el turno de noche en **Bella Luna Pizza**, una pizzería con **reglas extrañas**. Si las rompes, el turno termina… mal.

## Cómo jugar

1. Abre `index.html` con un servidor local (módulos ES):

```bash
cd pizzeria-medianoche
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

HTML · CSS · **Three.js** · Web Audio API (sonido procedural) · JavaScript modules
