import React from 'react';
import { AvatarConfig } from '../types';

interface PixelPlayerSpriteProps {
  avatar?: AvatarConfig;
  number?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSilhouette?: boolean;
  withShadow?: boolean;
  className?: string;
  animate?: boolean;
}

export const PixelPlayerSprite: React.FC<PixelPlayerSpriteProps> = ({
  avatar = {
    helmetColor: '#155e9e',
    jerseyColor: '#155e9e',
    stripeColor: '#ffffff',
    skinTone: '#d98c55',
    number: 88,
  },
  number,
  size = 'md',
  isSilhouette = false,
  withShadow = true,
  className = '',
  animate = false,
}) => {
  const displayNum = number ?? avatar.number ?? 88;

  // Scaling dimensions
  const scaleMap = {
    sm: { width: 52, height: 72 },
    md: { width: 84, height: 116 },
    lg: { width: 140, height: 190 },
    xl: { width: 190, height: 260 },
  };

  const { width, height } = scaleMap[size];

  if (isSilhouette) {
    // Exact grey-brown silhouette as seen in Image 2 and 3
    return (
      <div
        className={`relative flex items-center justify-center select-none ${className}`}
        style={{ width, height }}
      >
        <svg
          viewBox="0 0 36 50"
          width={width}
          height={height}
          style={{ shapeRendering: 'crispEdges' }}
          className="filter drop-shadow-sm opacity-65 hover:opacity-85 transition-opacity"
        >
          {/* Silhouette body & helmet */}
          <g fill="#a69480">
            {/* Helmet */}
            <rect x="11" y="5" width="14" height="15" rx="1" />
            <rect x="9" y="8" width="18" height="11" />
            {/* Facemask hint */}
            <rect x="18" y="14" width="7" height="6" fill="#8f7d6a" />
            {/* Neck & Shoulders */}
            <rect x="12" y="20" width="12" height="4" fill="#998774" />
            <rect x="8" y="22" width="20" height="10" />
            {/* Arms */}
            <rect x="6" y="24" width="4" height="11" />
            <rect x="26" y="24" width="4" height="11" />
            {/* Torso */}
            <rect x="10" y="25" width="16" height="11" fill="#968471" />
            {/* Legs */}
            <rect x="11" y="36" width="6" height="10" fill="#8a7866" />
            <rect x="19" y="36" width="6" height="10" fill="#8a7866" />
            {/* Cleats */}
            <rect x="9" y="44" width="8" height="4" fill="#756453" />
            <rect x="19" y="44" width="8" height="4" fill="#756453" />
          </g>
        </svg>
      </div>
    );
  }

  const helmet = avatar.helmetColor || '#155e9e';
  const jersey = avatar.jerseyColor || '#155e9e';
  const stripe = avatar.stripeColor || '#ffffff';
  const skin = avatar.skinTone || '#d98c55';

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className} ${
        animate ? 'animate-bounce-subtle' : ''
      }`}
      style={{ width, height }}
    >
      <svg
        viewBox="0 0 38 52"
        width={width}
        height={height}
        style={{ shapeRendering: 'crispEdges' }}
        className="overflow-visible"
      >
        {/* Subtle Turf Ground Shadow as seen in Image 1 & 2 */}
        {withShadow && (
          <ellipse
            cx="19"
            cy="48.5"
            rx="14"
            ry="3.2"
            fill="#8ce6f4"
            opacity="0.85"
          />
        )}

        {/* 1. HELMET */}
        {/* Helmet Base */}
        <rect x="10" y="4" width="16" height="15" fill={helmet} />
        <rect x="8" y="7" width="20" height="11" fill={helmet} />
        {/* Helmet top highlight / bevel */}
        <rect x="11" y="3" width="14" height="2" fill={stripe} opacity="0.3" />
        {/* White Center Stripe */}
        <rect x="16" y="3" width="4" height="15" fill={stripe} />
        {/* Helmet ear dark hole */}
        <rect x="9" y="13" width="2" height="3" fill="#082b4a" />
        {/* Helmet back shadow */}
        <rect x="8" y="15" width="4" height="3" fill="#0a3254" />

        {/* 2. FACE & FACEMASK */}
        {/* Face skin */}
        <rect x="13" y="11" width="12" height="7" fill={skin} />
        {/* Pixel Eyes */}
        <rect x="15" y="13" width="2" height="2" fill="#2c1a0c" />
        <rect x="21" y="13" width="2" height="2" fill="#2c1a0c" />
        {/* Facemask / Grill Bars */}
        <rect x="12" y="16" width="14" height="2" fill="#e8edf2" />
        <rect x="13" y="18" width="12" height="1.5" fill="#c4d0dc" />
        {/* Vertical grill bars */}
        <rect x="14" y="16" width="1.5" height="3.5" fill="#8b9dae" />
        <rect x="18" y="16" width="1.5" height="3.5" fill="#8b9dae" />
        <rect x="22" y="16" width="1.5" height="3.5" fill="#8b9dae" />

        {/* 3. UPPER BODY / JERSEY */}
        {/* Neck collar */}
        <rect x="14" y="20" width="8" height="2" fill={jersey} />
        {/* Shoulder Pads & Jersey */}
        <rect x="7" y="22" width="22" height="14" fill={jersey} />
        {/* White sleeve stripes */}
        <rect x="6" y="24" width="3" height="2" fill={stripe} />
        <rect x="27" y="24" width="3" height="2" fill={stripe} />
        <rect x="6" y="27" width="3" height="1.5" fill={stripe} />
        <rect x="27" y="27" width="3" height="1.5" fill={stripe} />

        {/* Arms / Skin */}
        <rect x="7" y="29" width="3" height="7" fill={skin} />
        <rect x="26" y="29" width="3" height="6" fill={skin} />

        {/* Football tucked in left arm (matches mockup image 1 & 2) */}
        <ellipse cx="27" cy="32" rx="3.5" ry="2.2" fill="#78350f" transform="rotate(35 27 32)" />
        <rect x="26" y="31" width="2" height="1" fill="#ffffff" opacity="0.9" />

        {/* Jersey Number: 88, 85, etc. */}
        <g fill="#ffffff">
          {displayNum === 88 ? (
            // Double 8 pixel art
            <>
              {/* Left 8 */}
              <rect x="12" y="25" width="5" height="8" fill="#ffffff" />
              <rect x="13" y="26" width="3" height="2" fill={jersey} />
              <rect x="13" y="29" width="3" height="3" fill={jersey} />
              {/* Right 8 */}
              <rect x="19" y="25" width="5" height="8" fill="#ffffff" />
              <rect x="20" y="26" width="3" height="2" fill={jersey} />
              <rect x="20" y="29" width="3" height="3" fill={jersey} />
            </>
          ) : (
            // Generic dynamic pixel number render
            <text
              x="18"
              y="32"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="'Press Start 2P', monospace"
              fontSize="7"
              fontWeight="bold"
            >
              {displayNum}
            </text>
          )}
        </g>

        {/* 4. LEGS & PANTS */}
        <rect x="11" y="36" width="6" height="9" fill={jersey} />
        <rect x="19" y="36" width="6" height="9" fill={jersey} />
        {/* Pants side stripe */}
        <rect x="11" y="37" width="1.5" height="7" fill={stripe} />
        <rect x="23.5" y="37" width="1.5" height="7" fill={stripe} />

        {/* 5. CLEATS & SOCKS */}
        {/* Ankle tape / white socks */}
        <rect x="10" y="44" width="7" height="2" fill="#ffffff" />
        <rect x="19" y="44" width="7" height="2" fill="#ffffff" />
        {/* Blue shoes */}
        <rect x="9" y="46" width="8.5" height="2.5" fill="#082b4a" />
        <rect x="18.5" y="46" width="8.5" height="2.5" fill="#082b4a" />
        {/* White bottom cleat sole */}
        <rect x="8.5" y="48" width="9" height="1" fill="#ffffff" />
        <rect x="18" y="48" width="9" height="1" fill="#ffffff" />
      </svg>
    </div>
  );
};
