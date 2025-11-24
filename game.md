# Documento de Diseño del Juego: Estrategia Medieval por Turnos

## 1. Visión General

Un juego de mesa de estrategia por turnos que combina la profundidad táctica de Advance Wars, la gestión de unidades de Clash Royale y el posicionamiento del Ajedrez.

**Temática:** Medieval Fantástico (Caballeros, Arqueros, Magia).

**Objetivo:** Destruir la torre del oponente antes de que él destruya la tuya.

## 2. Tablero de Juego

- **Dimensiones:** Cuadrícula de **7x8** (7 columnas x 8 filas).
- **Disposición:** Los jugadores comienzan en lados opuestos del tablero.
- **Estructuras:** Cada jugador tiene **1 Torre** ubicada en el centro de su fila trasera:
  - **Jugador 1 (Inferior):** Torre en posición (fila 7, columna 3)
  - **Jugador 2 (Superior):** Torre en posición (fila 0, columna 3)
- **HP de las Torres:** 30 puntos de vida cada una.

## 3. Zonas de Invocación

- **Jugador 1:** Puede invocar unidades únicamente en la **fila 6** (segunda fila desde abajo).
- **Jugador 2:** Puede invocar unidades únicamente en la **fila 1** (segunda fila desde arriba).
- Las unidades solo pueden ser invocadas en casillas vacías dentro de estas zonas.

## 4. Cartas y Mazo

- **Tamaño del Mazo:** 7 Cartas por jugador.
- **Mano Inicial:** 5 Cartas robadas aleatoriamente al inicio.
- **Tipos de Cartas:** Unidades de combate con estadísticas variadas.

### 4.1 Cartas Disponibles

#### Caballero Real

- **Coste:** 3 energía
- **HP:** 14
- **Ataque:** 6
- **Defensa:** 2
- **Rango:** 1 (Melee)
- **Velocidad:** 3
- **Tipo:** Unidad Melee
- **Descripción:** Equilibrado y valiente.

#### Arquero del Bosque

- **Coste:** 2 energía
- **HP:** 10
- **Ataque:** 5
- **Defensa:** 0
- **Rango:** 3 (Distancia)
- **Velocidad:** 2
- **Tipo:** Unidad Ranged
- **Descripción:** Ataque a distancia letal.

#### Mago Arcano

- **Coste:** 4 energía
- **HP:** 10
- **Ataque:** 7
- **Defensa:** 0
- **Rango:** 3 (Distancia)
- **Velocidad:** 2
- **Tipo:** Unidad Ranged
- **Descripción:** Daño mágico devastador.

#### Escudero Defensor

- **Coste:** 3 energía
- **HP:** 20
- **Ataque:** 2
- **Defensa:** 5
- **Rango:** 1 (Melee)
- **Velocidad:** 2
- **Tipo:** Unidad Melee
- **Descripción:** Tanque con alta defensa.

#### Lancero de Caballería

- **Coste:** 4 energía
- **HP:** 12
- **Ataque:** 6
- **Defensa:** 2
- **Rango:** 1 (Melee)
- **Velocidad:** 4
- **Tipo:** Unidad Melee
- **Descripción:** Rápido flanqueador.

#### Catapulta de Asedio

- **Coste:** 5 energía
- **HP:** 10
- **Ataque:** 8
- **Defensa:** 0
- **Rango:** 4 (Distancia)
- **Velocidad:** 1
- **Tipo:** Unidad Ranged
- **Descripción:** Lento pero destructor de torres.

#### Sanador del Reino

- **Coste:** 3 energía
- **HP:** 10
- **Ataque:** 2
- **Defensa:** 1
- **Rango:** 2 (Distancia)
- **Velocidad:** 2
- **Tipo:** Unidad Ranged
- **Descripción:** Apoyo vital para las tropas.

## 5. Recursos (Energía)

- **Energía Inicial:** 10 puntos.
- **Energía Máxima:** 10 puntos.
- **Restauración:** +1 Energía al inicio de cada turno (hasta el máximo de 10).

## 6. Estructura del Turno

Los jugadores se alternan por turnos. **Cada turno permite realizar UNA SOLA ACCIÓN PRINCIPAL:**

### Reglas Fundamentales de Turno

1. **Una Acción por Turno:** El jugador puede realizar SOLO UNA de las siguientes acciones:

   - **Invocar** una unidad (termina el turno automáticamente)
   - **Atacar** con una unidad (termina el turno automáticamente)
   - **Terminar turno manualmente** sin hacer nada

2. **Excepción para Unidades Melee:** Las unidades cuerpo a cuerpo pueden **mover Y atacar** en el mismo turno si hay enemigos en rango después del movimiento.

3. **Restricción para Unidades Ranged:** Las unidades a distancia **NO pueden atacar** en el mismo turno en que se movieron. Mover con una unidad ranged termina el turno automáticamente.

### Acciones Disponibles

#### 1. Invocar Unidad

- Gastar Energía igual al Coste de la carta.
- Colocar la unidad en cualquier casilla vacía de tu **zona de invocación** (fila 6 para Jugador 1, fila 1 para Jugador 2).
- **Esta acción termina tu turno inmediatamente.**

#### 2. Mover Unidad

- Seleccionar una unidad en el tablero que no se haya movido este turno.
- Moverla hasta un número de casillas igual a su **Velocidad**.
- El movimiento usa **pathfinding BFS** para validar que el camino esté libre de obstáculos.
- Las unidades no pueden atravesar otras unidades (aliadas o enemigas).
- **Comportamiento según tipo:**
  - **Unidades Melee:** Después de moverse, si hay enemigos en rango, se muestra un prompt preguntando si desea atacar o terminar turno.
  - **Unidades Ranged:** El turno termina automáticamente después de moverse.

#### 3. Atacar

- Las unidades pueden atacar a un enemigo (unidad o torre) dentro de su **Rango**.
- El rango se calcula usando **distancia Manhattan** (suma de diferencias absolutas en filas y columnas).
- La unidad no debe haber atacado ya en este turno.
- **Esta acción termina tu turno inmediatamente.**

#### 4. Terminar Turno Manualmente

- El jugador puede optar por terminar su turno sin realizar ninguna acción.

### Estados de las Unidades

Cada unidad en el tablero tiene dos flags de estado:

- **hasMoved:** Indica si la unidad se movió en el turno actual.
- **hasAttacked:** Indica si la unidad atacó en el turno actual.

Estos estados se resetean al inicio del turno del propietario de la unidad.

## 7. Mecánicas de Combate

### Cálculo de Daño

```
Daño Final = max(1, Ataque del Atacante - Defensa del Defensor)
```

- El daño mínimo siempre es 1, incluso si la defensa es mayor que el ataque.

### Eliminación de Unidades

- Cuando el HP de una unidad llega a 0 o menos, la unidad es eliminada del tablero.

### Destrucción de Torres

- Cuando el HP de una torre llega a 0 o menos, el jugador que la destruyó **gana la partida**.

### Condición de Victoria

- El primer jugador en destruir la torre enemiga gana.

### Animación de Combate

- Cuando ocurre un ataque, se emite un evento `attack_result` con información cinemática:
  - ID del atacante y objetivo
  - Daño infligido
  - Si fue un kill
  - Posiciones de origen y destino
  - Propietarios de ambas unidades

## 8. Modos de Juego

### Modo Multijugador (PvP)

1. Los jugadores entran en cola de matchmaking.
2. Cuando se encuentran 2 jugadores, se crea una partida pendiente.
3. Ambos jugadores deben confirmar la partida.
4. Una vez confirmada, comienza el juego.
5. El Jugador 1 siempre comienza.

### Modo Solo (vs IA)

1. El jugador inicia una partida contra la IA.
2. El jugador es siempre el Jugador 1 y comienza primero.
3. La IA es el Jugador 2 y juega automáticamente cuando es su turno.
4. La IA usa un motor de decisiones (`aiEngine.js`) para elegir sus acciones.
5. La IA respeta las mismas reglas: una acción por turno.

### Comportamiento de la IA

- La IA evalúa todas las acciones posibles (invocar, mover, atacar).
- Prioriza acciones ofensivas y defensivas basándose en heurísticas.
- Respeta las zonas de invocación (solo invoca en fila 1).
- Ejecuta sus acciones con delays para simular pensamiento (1-1.5 segundos).

## 9. Sistema de Comunicación (WebSocket)

### Eventos del Cliente al Servidor

- `find_match`: Buscar partida multijugador
- `leave_queue`: Salir de la cola de matchmaking
- `confirm_match`: Confirmar partida encontrada
- `start_solo_game`: Iniciar partida contra IA
- `summon_unit`: Invocar una unidad
- `move_unit`: Mover una unidad
- `attack_unit`: Atacar con una unidad
- `end_turn`: Terminar turno manualmente

### Eventos del Servidor al Cliente

- `match_found`: Partida encontrada
- `game_start`: Inicio de partida
- `game_update`: Actualización del estado del juego
- `action_prompt`: Prompt para elegir acción (ej: atacar o terminar turno)
- `attack_result`: Resultado de un ataque (para animaciones)
- `game_over`: Fin de partida (victoria o derrota)

## 10. Contenido Inicial (MVP)

### Pantallas Implementadas

- **Menú de Inicio:** Pantalla de bienvenida con opciones de juego.
- **Galería de Cartas:** Vista para inspeccionar todas las cartas disponibles y sus estadísticas.
- **Sección de Reglas:** Explicación detallada de cómo jugar.
- **Matchmaking:** Sistema de búsqueda de partidas y confirmación.
- **Juego Principal:** El tablero interactivo donde ocurre la partida con:
  - Visualización del tablero 7x8
  - Mano de cartas del jugador
  - Indicador de energía
  - Indicador de turno
  - Información del oponente
  - Controles de juego

## 11. Estética

- **Estilo:** Era medieval, caballeros, arqueros, magia.
- **Paleta de Colores:** Tonos medievales con acentos dorados y azules.
- **Gráficos:** Imágenes generadas para las cartas y elementos del juego.
- **UI/UX:** Interfaz moderna con elementos glassmorphism y animaciones suaves.

## 12. Reglas Técnicas Importantes

### Validaciones de Invocación

- La carta debe estar en la mano del jugador.
- El jugador debe tener suficiente energía.
- La casilla objetivo debe estar vacía.
- La casilla objetivo debe estar en la zona de invocación correcta.

### Validaciones de Movimiento

- La unidad debe pertenecer al jugador.
- La unidad no debe haberse movido ya este turno.
- El destino debe estar dentro del rango de velocidad.
- El camino debe estar libre de obstáculos (usando BFS).
- El destino debe estar vacío.

### Validaciones de Ataque

- La unidad debe pertenecer al jugador.
- La unidad no debe haber atacado ya este turno.
- El objetivo debe ser enemigo (unidad o torre).
- El objetivo debe estar dentro del rango de ataque.
- Para unidades ranged: no pueden atacar si se movieron este turno.

## 13. Notas de Desarrollo

### Correcciones Recientes

- **Fix de IA:** La IA ahora respeta la regla de una acción por turno y no puede realizar múltiples invocaciones o acciones en un solo turno.
- **Fix de Zonas de Invocación:** La IA solo puede invocar en su zona correcta (fila 1), no en la zona del jugador.
- **Sistema de Turnos:** Implementación robusta que resetea los estados de las unidades al cambiar de turno.

### Próximas Mejoras Potenciales

- Sistema de robo de cartas al destruir torres.
- Habilidades especiales de unidades.
- Efectos visuales mejorados para combate.
- Sistema de ranking y estadísticas.
- Más cartas y variedad de mazos.
