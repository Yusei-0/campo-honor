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
            Tu misión es destruir las <strong>3 Torres</strong> de tu oponente antes de que él destruya las tuyas.
            Usa tus unidades y hechizos sabiamente para dominar el campo de batalla.
          </p>
        </div>

        <div className="rules-section">
          <h2>🛡️ El Tablero</h2>
          <ul>
            <li>El campo de batalla es una cuadrícula de <strong>10x10</strong>.</li>
            <li>Tus torres están en la fila trasera de tu zona.</li>
            <li>Solo puedes invocar unidades en tu <strong>primera fila</strong>.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>🃏 Cartas y Energía</h2>
          <ul>
            <li>Comienzas con <strong>5 cartas</strong> en mano.</li>
            <li>Tienes <strong>10 de Energía</strong> inicial.</li>
            <li>Recuperas <strong>+1 Energía</strong> cada turno.</li>
            <li>¡Gana energía extra eliminando enemigos!</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>⚔️ Combate</h2>
          <ul>
            <li><strong>Invocar:</strong> Gasta energía para poner una unidad en juego.</li>
            <li><strong>Mover:</strong> Desplaza tus unidades según su velocidad.</li>
            <li><strong>Atacar:</strong> Inflige daño a enemigos en rango.</li>
            <li><strong>Daño:</strong> Ataque - Defensa = Daño a Vida.</li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>🚫 Restricciones</h2>
          <ul>
            <li>Unidades a distancia <strong>NO</strong> pueden mover y atacar en el mismo turno.</li>
            <li>Unidades cuerpo a cuerpo <strong>SÍ</strong> pueden mover y atacar.</li>
            <li>No puedes atravesar unidades enemigas.</li>
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
