import React from 'react';
import './RulesScreen.css';
import { useTranslation } from 'react-i18next';

const RulesScreen = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="rules-screen">
      <div className="rules-container">
        <h1 className="rules-title">{t('rules.title')}</h1>

        <div className="rules-section">
          <h2>🎯 {t('rules.objective.title')}</h2>
          <p dangerouslySetInnerHTML={{ __html: t('rules.objective.description') }}></p>
        </div>

        <div className="rules-section">
          <h2>🛡️ {t('rules.board.title')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('rules.board.grid') }}></li>
            <li>{t('rules.board.tower')}</li>
            <li dangerouslySetInnerHTML={{ __html: t('rules.board.summonZone') }}></li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>🃏 {t('rules.cards.title')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('rules.cards.startingHand') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('rules.cards.startingEnergy') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('rules.cards.energyRegen') }}></li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>⚔️ {t('rules.combat.title')}</h2>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: t('rules.combat.summon') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('rules.combat.move') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('rules.combat.attack') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('rules.combat.damage') }}></li>
          </ul>
        </div>

        <div className="rules-section">
          <h2>🚫 {t('rules.restrictions.title')}</h2>
          <ul>
            <li>{t('rules.restrictions.noTraverse')}</li>
            <li>{t('rules.restrictions.oncePerTurn')}</li>
          </ul>
        </div>
      </div>

      <button className="back-btn" onClick={onBack} title={t('common.back')}>
        <svg className="back-icon" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
    </div>
  );
};

export default RulesScreen;
