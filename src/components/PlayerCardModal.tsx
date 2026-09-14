import React from 'react';
import { Competitor } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { X, Activity } from 'lucide-react';

interface PlayerCardModalProps {
  player: Competitor | null;
  onClose: () => void;
  onSelectForTeam?: (player: Competitor) => void;
  onSwapThisStar?: (player: Competitor) => void;
  onDropPlayer?: (player: Competitor) => void;
  isSelectedForTeam?: boolean;
}

export const PlayerCardModal: React.FC<PlayerCardModalProps> = ({
  player: selectedPlayer,
  onClose,
  onSelectForTeam,
  onSwapThisStar,
  onDropPlayer,
  isSelectedForTeam,
}) => {
  if (!selectedPlayer) return null;

  const passYds = Number(
    selectedPlayer.stats?.pass_yds ??
    selectedPlayer.stats?.passing_yards ??
    selectedPlayer.stats?.passingYards ??
    0
  );
  const rushYds = Number(
    selectedPlayer.stats?.rush_yds ??
    selectedPlayer.stats?.rushing_yards ??
    selectedPlayer.stats?.rushingYards ??
    0
  );
  const recYds = Number(
    selectedPlayer.stats?.rec_yds ??
    selectedPlayer.stats?.receiving_yards ??
    selectedPlayer.stats?.receivingYards ??
    0
  );
  const totalScrimmageYds = passYds + rushYds + recYds;
  const tds = Number(
    selectedPlayer.stats?.tds ??
    selectedPlayer.stats?.touchdowns ??
    0
  );
  const tdPoints = tds * 6;
  const yardPoints = Math.floor(totalScrimmageYds / 10);
  const calculatedTotal = tdPoints + yardPoints;
  const displayScore = selectedPlayer.score || calculatedTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      {/* Outer Card Container */}
      <div className="relative w-full max-w-md bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-3.5 sm:p-5 rounded-xs my-auto max-h-[90vh] flex flex-col justify-between overflow-y-auto box-border">
        
        {/* Red Close Button */}
        <button
          onClick={onClose}
          className="touch-manipulation absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 bg-[#b91c1c] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-[0_3px_0_0_#450a0a] active:translate-y-1 active:shadow-none transition-all font-pixel text-xs z-10"
          title="Cancel / Close Card"
        >
          <X size={16} strokeWidth={3} />
        </button>

        {/* Title: Authentic Player Name & Team / Number */}
        <div className="text-center mb-2 sm:mb-3 pb-2 sm:pb-2.5 border-b-2 border-[#e2ba7d] shrink-0">
          <h2 className="font-pixel text-lg sm:text-2xl text-[#5c3509] tracking-wider uppercase leading-tight">
            {selectedPlayer.displayName}
          </h2>
          <div className="text-[11px] sm:text-xs font-retro text-[#784610] mt-1 flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="px-1.5 sm:px-2 py-0.5 bg-[#fae9c8] border border-[#d4a86a] text-[#12579b] font-pixel text-[9px] sm:text-[10px] font-bold rounded-2xs">
              {selectedPlayer.teamCode}
            </span>
            <span className="font-bold truncate max-w-[120px] sm:max-w-none">{selectedPlayer.teamName}</span>
            <span>•</span>
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#451a03]">#{selectedPlayer.uniformNumber}</span>
            <span>•</span>
            <span className="px-1.5 py-0.5 bg-[#ebd2a4] border border-[#c99a57] font-pixel text-[9px] text-[#5c3509] rounded-2xs font-bold">
              {selectedPlayer.position || 'STAR'}
            </span>
          </div>
        </div>

        {/* Clean Athlete Presentation: Sprite + Live Score */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
          
          {/* Left: Player Sprite & Identity (Scaled down to compact ~80-90px on mobile) */}
          <div className="bg-[#ebd2a4] border-2 border-[#c99a57] rounded-xs flex flex-col items-center justify-center p-2 sm:p-3 min-h-[110px] sm:min-h-[150px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="sm:hidden scale-80 origin-center -my-2">
              <PixelPlayerSprite
                avatar={selectedPlayer.avatar}
                number={selectedPlayer.uniformNumber}
                size="md"
                withShadow={true}
                animate={true}
              />
            </div>
            <div className="hidden sm:block">
              <PixelPlayerSprite
                avatar={selectedPlayer.avatar}
                number={selectedPlayer.uniformNumber}
                size="lg"
                withShadow={true}
                animate={true}
              />
            </div>
            <div className="mt-1 sm:mt-2 px-1.5 sm:px-2.5 py-0.5 bg-[#fae5b8] border border-[#c99a57] text-[#5c3509] font-pixel text-[8px] sm:text-[9px] rounded-xs uppercase tracking-wider font-bold truncate max-w-full">
              #{selectedPlayer.uniformNumber} · {selectedPlayer.teamCode}
            </div>
          </div>

          {/* Right: Big Score Readout */}
          <div className="bg-[#ebd2a4] border-2 border-[#c99a57] p-2 sm:p-3 rounded-xs text-center flex flex-col items-center justify-center min-h-[110px] sm:min-h-[150px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1 text-[#5c3509] font-pixel text-[9px] sm:text-[11px] uppercase tracking-wider mb-0.5">
              <Activity size={12} className="text-[#16a34a]" />
              <span>SCORE</span>
            </div>
            
            <div className="font-pixel text-2xl sm:text-4xl text-[#12579b] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
              {displayScore} PTS
            </div>

            <div className="mt-1 text-[9px] sm:text-[10px] font-retro text-[#784610] px-1.5 sm:px-2 py-0.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs whitespace-nowrap">
              WHOLE NUMBER
            </div>
          </div>

        </div>

        {/* In-Game Raw Stats Boxes */}
        <div className="mt-3">
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {/* Pass Yards Box */}
            <div className="p-1.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs">
              <span className="block font-retro text-[9px] text-[#784610] uppercase tracking-wider font-bold">
                PASS YDS
              </span>
              <span className="font-pixel text-sm sm:text-base text-[#5c3509]">
                {passYds}
              </span>
            </div>

            {/* Rush Yards Box */}
            <div className="p-1.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs">
              <span className="block font-retro text-[9px] text-[#784610] uppercase tracking-wider font-bold">
                RUSH YDS
              </span>
              <span className="font-pixel text-sm sm:text-base text-[#5c3509]">
                {rushYds}
              </span>
            </div>

            {/* Rec Yards Box */}
            <div className="p-1.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs">
              <span className="block font-retro text-[9px] text-[#784610] uppercase tracking-wider font-bold">
                REC YDS
              </span>
              <span className="font-pixel text-sm sm:text-base text-[#5c3509]">
                {recYds}
              </span>
            </div>

            {/* Touchdowns Box */}
            <div className="p-1.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs">
              <span className="block font-retro text-[9px] text-[#784610] uppercase tracking-wider font-bold">
                TOUCHDOWNS
              </span>
              <span className="font-pixel text-sm sm:text-base text-[#b45309] font-bold">
                {tds}
              </span>
            </div>
          </div>
        </div>

        {/* Exact Points Breakdown - Clear Math for Kids & Parents */}
        <div className="mt-3 p-2.5 bg-[#ebd2a4] border-2 border-[#c99a57] rounded-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
          <div className="pb-1 mb-1.5 border-b border-[#c99a57] flex items-center justify-between">
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#5c3509] tracking-wider uppercase flex items-center gap-1 font-bold">
              <span>🧮</span>
              <span>POINTS BREAKDOWN</span>
            </span>
            <span className="font-pixel text-[8px] sm:text-[9px] text-[#784610] bg-[#fae9c8] px-1.5 py-0.5 border border-[#d4a86a] rounded-2xs">
              NO DECIMALS
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-retro text-[#5c3509]">
            {/* Touchdowns */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
              <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                <span>🏈</span>
                <span>{tds} TOUCHDOWNS</span>
              </span>
              <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                ....................................................................
              </span>
              <span className="text-[#b45309] font-bold shrink-0 ml-1.5 whitespace-nowrap">
                +{tdPoints} PTS
              </span>
            </div>

            {/* Scrimmage Yards */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
              <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                <span>⚡</span>
                <span>{totalScrimmageYds} SCRIMMAGE YDS</span>
              </span>
              <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                ....................................................................
              </span>
              <span className="text-[#12579b] font-bold shrink-0 ml-1.5 whitespace-nowrap">
                +{yardPoints} PTS
              </span>
            </div>

            {/* Total: {player.score} PTS */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#12579b] text-[#fae5b8] border-2 border-[#0a2d52] rounded-xs font-pixel text-xs sm:text-sm font-bold shadow-xs mt-1.5">
              <span className="tracking-wider">TOTAL SCORE:</span>
              <span className="text-[#fde047] text-sm sm:text-base font-bold">
                {displayScore} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Full-Width Prominence without redundant bottom Close button */}
        <div className="mt-3.5 space-y-1.5">
          {isSelectedForTeam ? (
            <button
              type="button"
              onClick={() => {
                if (onSwapThisStar) {
                  onSwapThisStar(selectedPlayer);
                } else if (onSelectForTeam) {
                  onSelectForTeam(selectedPlayer);
                }
              }}
              className="touch-manipulation w-full py-2.5 px-3 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] border-3 border-[#0a2d52] font-pixel text-[11px] sm:text-xs rounded-xs cursor-pointer shadow-[0_3px_0_0_#051a30] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 font-bold"
            >
              <span>⇄</span>
              <span>SWAP THIS STAR</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSelectForTeam?.(selectedPlayer);
                onClose();
              }}
              className="touch-manipulation w-full py-2.5 px-3 bg-[#15803d] hover:bg-[#16a34a] text-white border-3 border-[#052e16] font-pixel text-[11px] sm:text-xs rounded-xs cursor-pointer shadow-[0_3px_0_0_#022c11] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 font-bold"
            >
              <span>+</span>
              <span>PICK AS A STAR</span>
            </button>
          )}

          {/* Unobtrusive subtle text link to drop player */}
          {isSelectedForTeam && onDropPlayer && (
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => {
                  onDropPlayer(selectedPlayer);
                  onClose();
                }}
                className="touch-manipulation font-retro text-[11px] text-[#784610]/80 hover:text-[#b91c1c] underline cursor-pointer transition-colors"
              >
                Drop player
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
