# Documento de Diseño del Juego: Estrategia Medieval por Turnos

## 1. Visión General
Un juego de mesa de estrategia por turnos que combina la profundidad táctica de Advance Wars, la gestión de unidades de Clash Royale y el posicionamiento del Ajedrez.
**Temática:** Medieval Fantástico (Caballeros, Arqueros, Magia).
**Objetivo:** Destruir las 3 torres del oponente antes de que él destruya las tuyas.

## 2. Tablero de Juego
- **Dimensiones:** Cuadrícula de 10x10.
- **Disposición:** Los jugadores comienzan en lados opuestos del tablero.
- **Estructuras:** Cada jugador tiene 3 Torres ubicadas en su zona inicial (fila trasera).

## 3. Cartas y Mazo
- **Tamaño del Mazo:** 7 Cartas por jugador.
- **Mano Inicial:** 5 Cartas robadas aleatoriamente al inicio.
- **Tipos de Cartas:** Unidades de combate con estadísticas variadas.

## 4. Estadísticas de las Unidades
Cada carta/unidad posee los siguientes atributos:
- **Vida (HP):** Puntos de salud.
- **Coste:** Energía necesaria para invocarla.
- **Ataque:** Daño infligido al enemigo.
- **Defensa:** Reducción de daño recibido.
- **Rango de Ataque:** Distancia a la que puede atacar (1 para cuerpo a cuerpo, >1 para distancia).
- **Velocidad:** Número de casillas que puede moverse por turno.
- **Habilidad Especial:** Efecto único (activo o pasivo).

## 5. Recursos (Energía)
- **Energía Inicial:** 10 puntos.
- **Restauración:** +1 Energía al inicio de cada turno.
- **Bonificaciones:**
  - **Eliminar Unidad Enemiga:** +1 Energía adicional inmediatamente.
  - **Destruir Torre Enemiga:** Robar 1 carta del mazo.

## 6. Estructura del Turno
Los jugadores se alternan por turnos. En su turno, un jugador puede realizar las siguientes acciones con sus cartas y unidades:

### Acciones Disponibles
1.  **Invocar:**
    - Gastar Energía igual al Coste de la carta.
    - Colocar la unidad en cualquier casilla vacía de la **primera fila** del jugador.
2.  **Mover:**
    - Seleccionar una unidad en el tablero.
    - Moverla hasta un número de casillas igual a su **Velocidad**.
    - Las unidades no pueden atravesar enemigos u obstáculos (salvo habilidades especiales).
3.  **Atacar:**
    - Las unidades pueden atacar a un enemigo dentro de su **Rango**.
    - **Requisito de Posición:** Para atacar, la unidad debe quedar "de frente" a la carta enemiga (en una casilla válida dentro del rango).
    - **Restricción de Movimiento y Ataque:**
        - **Unidades a Distancia:** NO pueden atacar en el mismo turno en que se movieron.
        - **Unidades Melee:** Pueden mover y atacar en el mismo turno.

## 7. Mecánicas de Combate
- **Cálculo de Daño:** (Ataque del Atacante) - (Defensa del Defensor) = Daño a la Vida.
- **Condición de Victoria:** El primer jugador en destruir las 3 torres enemigas gana.

## 8. Contenido Inicial (MVP)
- **Menú de Inicio:** Pantalla de bienvenida.
- **Galería de Cartas:** Vista para inspeccionar todas las cartas disponibles y sus estadísticas.
- **Sección de Reglas:** Explicación detallada de cómo jugar.
- **Juego Principal:** El tablero interactivo donde ocurre la partida.

## 9. Estética
- **Estilo:** Era medieval, caballeros, arqueros, magia.
- **Gráficos:** Imágenes generadas en formato SVG para las cartas y elementos.
