import React from 'react';
import './RulesScreen.css';

const RulesScreen = ({ onBack }) => {
  return (
    <div className="rules-screen">
      <div className="rules-container">
        <h1 className="rules-title">Reglas del Juego</h1>

        <div className="rules-section">
          <h2>🎯 Objetivo</h2>
          <p>
            Tu misión es destruir la <strong>Torre Enemiga</strong> (30 HP) antes de que destruyan la tuya.
            Usa tus unidades sabiamente para dominar el campo de batalla.
          </p>
        </div>

        <div className="rules-section">
          <h2>🛡️ El Tablero</h2>
          <ul>
            <li>El campo de batalla es una cuadrícula de <strong>7x8</strong>.</li>
            <li>Tu torre está en la fila trasera de tu zona.</li>
            <li>Solo puedes invocar unidades en tu <strong>zona de invocación</strong> (marcada al seleccionar carta).</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>🃏 Cartas y Energía</h2>
          <ul>
            <li>Comienzas con <strong>5 cartas</strong> en mano.</li>
            <li>Tienes <strong>10 de Energía</strong> inicial.</li>
            <li>Recuperas <strong>+1 Energía</strong> cada turno.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>⚔️ Combate</h2>
          <ul>
            <li><strong>Invocar:</strong> Gasta energía para poner una unidad en juego. Termina tu turno.</li>
            <li><strong>Mover:</strong> Desplaza tus unidades según su velocidad. Puedes atacar después de mover.</li>
            <li><strong>Atacar:</strong> Inflige daño a enemigos en rango. Atacar termina tu turno.</li>
            <li><strong>Daño:</strong> Ataque - Defensa = Daño a Vida.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>🚫 Restricciones</h2>
          <ul>
            <li>No puedes atravesar unidades enemigas ni obstáculos.</li>
            <li>Cada unidad solo puede mover y atacar una vez por turno.</li>
          </ul>
        </div>
      </div>

      <button className="back-btn" onClick={onBack} title="Volver al Menú">
        <svg className="back-icon" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
    </div>
  );
};

export default RulesScreen;
