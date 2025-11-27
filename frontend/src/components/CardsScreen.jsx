import React, { useState, useEffect } from 'react';
import './CardsScreen.css';
import cardsData from '../../../card.json';
import { useTranslation } from 'react-i18next';

// Import PNGs directly
import knightPng from '../../cards/card_knight.png';
import archerPng from '../../cards/card_archer.png';
import magePng from '../../cards/card_mage.png';
import shieldPng from '../../cards/card_shield.png';
import lancerPng from '../../cards/card_lancer.png';
import catapultPng from '../../cards/card_catapult.png';
import healerPng from '../../cards/card_healer.png';

// Map card IDs or types to images
const getImageForCard = (card) => {
  if (card.id.includes('knight')) return knightPng;
  if (card.id.includes('archer')) return archerPng;
  if (card.id.includes('mage')) return magePng;
  if (card.id.includes('shield')) return shieldPng;
  if (card.id.includes('lancer')) return lancerPng;
  if (card.id.includes('catapult')) return catapultPng;
  if (card.id.includes('healer')) return healerPng;
  return knightPng; // Default
};

const Card = ({ card }) => {
  const { t } = useTranslation();
  const imageSrc = getImageForCard(card);

  return (
    <div className="card-item">
      <div className="card-inner">
        <div className="card-front">
          <div className="card-cost">{card.cost}</div>
          <div className="card-image-container">
            <img src={imageSrc} alt={card.name} className="card-image" />
          </div>
          <div className="card-header">
            <h3 className="card-name">{t(`cards:${card.id}.name`)}</h3>
            <span className="card-type">{card.isRanged ? t('cards.types.ranged') : t('cards.types.melee')}</span>
          </div>
          <div className="card-stats">
            <div className="stat-row">
              <span className="stat-label">{t('cards.stats.hp')}</span>
              <span>{card.maxHp}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('cards.stats.atk')}</span>
              <span>{card.attack}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('cards.stats.def')}</span>
              <span>{card.defense}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('cards.stats.rng')}</span>
              <span>{card.range}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">{t('cards.stats.spd')}</span>
              <span>{card.speed}</span>
            </div>
          </div>
        </div>
        <div className="card-back">
            <div className="card-description">
                <p>{t(`cards:${card.id}.description`)}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

const CardsScreen = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="cards-screen">
      <h1 className="cards-title">{t('cards.title')}</h1>
      <div className="cards-container">
        {cardsData.map(card => (
          <Card key={card.id} card={card} />
        ))}
      </div>

      <button className="back-btn" onClick={onBack} title="Volver al Menú">
        <svg className="back-icon" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
    </div>
  );
};

export default CardsScreen;
