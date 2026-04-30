import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon, change, changeLabel, color = 'primary', subtitle }) => {
  const isPositive = parseFloat(change) > 0;
  const isNegative = parseFloat(change) < 0;

  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        <div className={`stat-card__icon stat-icon--${color}`}>{icon}</div>
      </div>
      <div className="stat-card__value">{value}</div>
      {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
      {change !== undefined && (
        <div className={`stat-card__change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          <span>{isPositive ? '▲' : isNegative ? '▼' : '—'} {Math.abs(parseFloat(change) || 0)}%</span>
          {changeLabel && <span className="change-label"> {changeLabel}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
