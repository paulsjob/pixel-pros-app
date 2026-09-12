import React from 'react';
import { Competitor } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelDiamondCrystal, PixelEmeraldGem } from './PixelBadges';
import { X } from 'lucide-react';

interface PlayerCardModalProps {
  player: Competitor | null;
  onClose: () => void;
  onSelectForTeam?: (player: Competitor) => void;
  isSelectedForTeam?: boolean;
}

export const PlayerCardModal: React.FC<PlayerCardModalProps> = ({
  player,
  onClose,
  onSelectForTeam,
  isSelectedForTeam,
}) => {
  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Outer Card Container matching Image 1 */}
      <div className="relative w-full max-w-lg bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_10px_0_0_#0a0f1d] p-5 sm:p-7 rounded-xs">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 bg-[#b91c1c] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-[0_3px_0_0_#450a0a] active:translate-y-1 active:shadow-none transition-all font-pixel text-xs"
          title="Close Card"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* Title: PLAYER123 / Player Name */}
        <div className="text-center mb-5 pb-3 border-b-3 border-[#e2ba7d]">
          <h2 className="font-pixel text-xl sm:text-2xl text-[#5c3509] tracking-wider uppercase">
            {player.displayName === 'Jeerice Henry' ? 'PLAYER123' : player.displayName}
          </h2>
          <div className="text-[11px] font-retro text-[#8c5211] mt-1">
            {player.teamName} • #{player.uniformNumber} • {player.positionGeneric}
          </div>
        </div>

        {/* Main Content Grid matching Image 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Left Column: Player Sprite on Beige Field */}
          <div className="bg-[#ebd2a4] border-3 border-[#c99a57] rounded-xs flex flex-col items-center justify-center p-4 min-h-[220px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
            <PixelPlayerSprite
              avatar={player.avatar}
              number={player.uniformNumber}
              size="lg"
              withShadow={true}
              animate={true}
            />
            <div className="mt-3 px-3 py-1 bg-[#fae5b8] border-2 border-[#c99a57] text-[#5c3509] font-retro text-xs rounded-xs">
              RATING: <span className="font-bold text-[#b45309]">{player.rating}</span>
            </div>
          </div>

          {/* Right Column: BADGES and SCORE */}
          <div className="flex flex-col justify-between gap-4">
            
            {/* BADGES Box */}
            <div className="bg-[#ebd2a4] border-3 border-[#c99a57] p-4 rounded-xs text-center flex-1 flex flex-col items-center justify-center">
              <span className="font-pixel text-sm text-[#5c3509] tracking-wider uppercase block mb-3">
                BADGES
              </span>
              <div className="flex items-center justify-center gap-4">
                <div title="Emerald Gem Trophy" className="transform hover:scale-110 transition-transform">
                  <PixelEmeraldGem size={42} />
                </div>
                <div title="Diamond Star Crystal" className="transform hover:scale-110 transition-transform">
                  <PixelDiamondCrystal size={42} />
                </div>
              </div>
              <div className="text-[10px] font-retro text-[#784610] mt-3">
                MVP CLUB • 2x BADGE
              </div>
            </div>

            {/* SCORE Box */}
            <div className="bg-[#ebd2a4] border-3 border-[#c99a57] p-4 rounded-xs text-center flex-1 flex flex-col items-center justify-center">
              <span className="font-pixel text-sm text-[#5c3509] tracking-wider uppercase block mb-1">
                SCORE
              </span>
              <div className="font-pixel text-2xl sm:text-3xl text-[#5c3509] tracking-wider font-bold my-1">
                {player.score.toLocaleString()}
              </div>
              <span className="text-[10px] font-retro text-[#784610]">
                WHOLE NUMBER PTS
              </span>
            </div>

          </div>

        </div>

        {/* Real Stats Breakdown */}
        <div className="mt-4 p-3 bg-[#fae9c8] border-2 border-[#d4a86a] rounded-xs grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="block font-retro text-[10px] text-[#784610] uppercase">PASS YARDS</span>
            <span className="font-pixel text-xs text-[#5c3509]">{player.stats.passingYards.toLocaleString()}</span>
          </div>
          <div>
            <span className="block font-retro text-[10px] text-[#784610] uppercase">RUSH YARDS</span>
            <span className="font-pixel text-xs text-[#5c3509]">{player.stats.rushingYards.toLocaleString()}</span>
          </div>
          <div>
            <span className="block font-retro text-[10px] text-[#784610] uppercase">TOUCHDOWNS</span>
            <span className="font-pixel text-xs text-[#b45309] font-bold">{player.stats.touchdowns}</span>
          </div>
        </div>

        {/* Action Button */}
        {onSelectForTeam && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => onSelectForTeam(player)}
              className={`flex-1 py-3 px-4 font-pixel text-xs border-3 border-[#0a2d52] cursor-pointer transition-all ${
                isSelectedForTeam
                  ? 'bg-[#b91c1c] text-[#fae5b8] shadow-[0_4px_0_0_#450a0a]'
                  : 'bg-[#12579b] text-[#fae5b8] shadow-[0_4px_0_0_#051a30] hover:bg-[#186abb]'
              }`}
            >
              {isSelectedForTeam ? 'REMOVE FROM TEAM' : '+ ADD TO MY 3 PLAYERS'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
