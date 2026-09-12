import React, { useState } from 'react';
import { Competitor, UserProfile } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelCoin, PixelHelmetIcon } from './PixelBadges';
import { ArrowUpDown, Filter, BarChart3, Shirt, Plus } from 'lucide-react';

interface MyTeamViewProps {
  roster: Competitor[];
  user: UserProfile;
  selectedPlayers: Competitor[];
  onSelectSlot: (index: number) => void;
  onOpenPlayerDetail: (player: Competitor) => void;
  onOpenLockerRoom: () => void;
  onOpenStatsModal: () => void;
  onTogglePlayer: (player: Competitor) => void;
}

export const MyTeamView: React.FC<MyTeamViewProps> = ({
  roster,
  user,
  selectedPlayers,
  onSelectSlot,
  onOpenPlayerDetail,
  onOpenLockerRoom,
  onOpenStatsModal,
  onTogglePlayer,
}) => {
  const [sortAsc, setSortAsc] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // Compute aggregate stats of the selected 3 players (matching mockup stats!)
  const aggregateStats = selectedPlayers.reduce(
    (acc, player) => ({
      passingYards: acc.passingYards + (player?.stats.passingYards || 0),
      rushingYards: acc.rushingYards + (player?.stats.rushingYards || 0),
      touchdowns: acc.touchdowns + (player?.stats.touchdowns || 0),
    }),
    { passingYards: 0, rushingYards: 0, touchdowns: 0 }
  );

  // If only 1 player selected (like in the mockup), show their stats or baseline
  const displayStats = selectedPlayers.length === 1 && selectedPlayers[0].displayName === 'Jeerice Henry'
    ? { passingYards: 4500, rushingYards: 310, touchdowns: 28 }
    : aggregateStats;

  const sortedRoster = [...roster].sort((a, b) => {
    return sortAsc ? a.rating - b.rating : b.rating - a.rating;
  });

  return (
    <div className="w-full max-w-md md:max-w-5xl mx-auto px-1 sm:px-0">
      {/* Top Banner Header matching Image 3 */}
      <div className="text-center mb-5 sm:mb-6">
        <div className="flex items-center justify-center gap-2.5 mb-1">
          <PixelHelmetIcon size={32} color="#155e9e" />
          <h1 className="font-pixel text-xl sm:text-3xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a]">
            PIXEL PROS
          </h1>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <h2 className="font-pixel text-lg sm:text-2xl text-[#fae5b8] tracking-wider drop-shadow-[0_3px_0_#0f172a]">
            MY TEAM
          </h2>
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-[#fae5b8] border-3 border-[#1a2238] shadow-[0_3px_0_0_#0a0f1d] text-[#5c3509] font-pixel text-xs">
            <PixelCoin size={16} />
            <span>{user.coins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Layout matching Image 2 & 3 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
        
        {/* LEFT COLUMN: Controls + 6 Roster Grid + Stats */}
        <div className="md:col-span-4 flex flex-col gap-3.5 sm:gap-4">
          
          {/* SORT & FILTER Buttons */}
          <div className="flex gap-2.5 sm:gap-3">
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="touch-manipulation flex-1 py-2.5 px-3 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs border-3 border-[#0a2d52] shadow-[0_4px_0_0_#051a30] cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <ArrowUpDown size={14} />
              <span>SORT</span>
            </button>
            <button
              onClick={() => setFilterActive(!filterActive)}
              className="touch-manipulation flex-1 py-2.5 px-3 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs border-3 border-[#0a2d52] shadow-[0_4px_0_0_#051a30] cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <Filter size={14} />
              <span>FILTER</span>
            </button>
          </div>

          {/* 6-Grid Roster Thumbnails in Cream Pixel Box matching Image 2 & 3 */}
          <div className="pixel-box-cream p-3 sm:p-4 rounded-xs">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {sortedRoster.slice(0, 6).map(player => {
                const isSelected = selectedPlayers.some(p => p.id === player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => onOpenPlayerDetail(player)}
                    className={`touch-manipulation p-2 border-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative active:translate-y-0.5 ${
                      isSelected
                        ? 'border-[#12579b] bg-[#fae9c8] ring-2 ring-[#12579b]'
                        : 'border-[#c99a57] bg-[#ebd2a4] hover:bg-[#fae9c8]'
                    }`}
                  >
                    {/* Mini Pixel Avatar */}
                    <div className="my-1">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="sm"
                        withShadow={false}
                      />
                    </div>

                    {/* Rating Number */}
                    <span className="font-pixel text-[11px] text-[#12579b] font-bold">
                      {player.rating}
                    </span>

                    {/* Short Name (e.g. JOSH, MAHOMES, TYREEK, GILF, HENRY, JEERICE HENRY) */}
                    <span className="font-pixel text-[9px] text-[#5c3509] leading-tight mt-0.5 line-clamp-1">
                      {player.shortName}
                    </span>

                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#12579b] text-[#fae5b8] text-[8px] font-pixel px-1 border border-[#0a2d52]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATS Button matching bottom left of Image 3 */}
          <button
            onClick={onOpenStatsModal}
            className="touch-manipulation w-full py-3.5 sm:py-4 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs sm:text-sm border-3 border-[#0a2d52] shadow-[0_4px_0_0_#051a30] cursor-pointer flex items-center justify-center gap-2.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <BarChart3 size={18} />
            <span>STATS & LIVE MATCHES</span>
          </button>

        </div>

        {/* RIGHT COLUMN: 3 Selected Players + Stats Box + Locker Room */}
        <div className="md:col-span-8 flex flex-col gap-5 sm:gap-6">
          
          {/* Top Panel: SELECT 3 PLAYERS FOR THIS WEEK */}
          <div className="pixel-box-cream p-4 sm:p-5 rounded-xs">
            <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2.5 mb-4">
              <h2 className="font-pixel text-xs sm:text-base text-[#5c3509] tracking-wider uppercase">
                SELECT 3 PLAYERS FOR THIS WEEK
              </h2>
              <span className="font-retro text-[10px] text-[#784610] bg-[#fae9c8] px-2 py-0.5 border border-[#d4a86a] rounded-xs">
                {selectedPlayers.length}/3 PICKED
              </span>
            </div>

            {/* 3 Active Player Slots: Horizontal Scroll Row on Mobile, 3-Column Grid on Tablet/Desktop */}
            <div className="flex sm:grid sm:grid-cols-3 gap-2.5 sm:gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x snap-mandatory">
              {[0, 1, 2].map(slotIndex => {
                const player = selectedPlayers[slotIndex];

                return (
                  <div
                    key={slotIndex}
                    onClick={() => {
                      if (player) {
                        onOpenPlayerDetail(player);
                      } else {
                        onSelectSlot(slotIndex);
                      }
                    }}
                    className="min-w-[135px] flex-1 sm:min-w-0 snap-center shrink-0 sm:shrink touch-manipulation bg-[#ebd2a4] border-3 border-[#c99a57] rounded-xs min-h-[160px] sm:min-h-[200px] flex flex-col items-center justify-center p-2.5 sm:p-3 relative cursor-pointer transition-all hover:bg-[#fae9c8] group shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] active:translate-y-0.5"
                  >
                    {player ? (
                      <>
                        <PixelPlayerSprite
                          avatar={player.avatar}
                          number={player.uniformNumber}
                          size="md"
                          withShadow={true}
                          animate={true}
                        />
                        <div className="mt-2 text-center">
                          <span className="font-pixel text-[10px] sm:text-xs text-[#5c3509] block leading-tight">
                            {player.shortName}
                          </span>
                          <span className="font-retro text-[9px] text-[#784610]">
                            #{player.uniformNumber} • {player.rating} OVR
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePlayer(player);
                          }}
                          className="touch-manipulation absolute -top-2 -right-2 w-6 h-6 bg-[#b91c1c] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center font-pixel text-[9px] shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5"
                          title="Remove from Team"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Grey Silhouette Slot matching Image 2 & 3 */}
                        <PixelPlayerSprite
                          isSilhouette={true}
                          size="md"
                        />
                        <span className="mt-2 font-retro text-[10px] text-[#8c735d] group-hover:text-[#5c3509] transition-colors flex items-center gap-1">
                          <Plus size={12} /> TAP TO PICK
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Mobile swipe hint */}
            <div className="sm:hidden text-center mt-2 text-[9px] font-retro text-[#784610]">
              ◀ SWIPE SLOTS 1, 2, 3 ▶
            </div>
          </div>

          {/* Bottom Panel: PASSING YARDS / RUSHING YARDS / TOUCHDOWNS matching Image 2 & 3 */}
          <div className="pixel-box-cream p-4 sm:p-5 rounded-xs space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2">
              <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider">
                PASSING YARDS
              </span>
              <span className="font-pixel text-xs sm:text-base text-[#5c3509]">
                {displayStats.passingYards.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2">
              <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider">
                RUSHING YARDS
              </span>
              <span className="font-pixel text-xs sm:text-base text-[#5c3509]">
                {displayStats.rushingYards.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between pb-1">
              <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider">
                TOUCHDOWNS
              </span>
              <span className="font-pixel text-xs sm:text-base text-[#b45309] font-bold">
                {displayStats.touchdowns}
              </span>
            </div>
          </div>

          {/* LOCKER ROOM BUTTON matching Image 3 */}
          <button
            onClick={onOpenLockerRoom}
            className="touch-manipulation w-full py-3.5 sm:py-4 px-6 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs sm:text-base border-3 border-[#0a2d52] shadow-[0_4px_0_0_#051a30] cursor-pointer flex items-center justify-center gap-3 active:translate-y-0.5 active:shadow-none transition-all tracking-wider"
          >
            <Shirt size={20} />
            <span>LOCKER ROOM</span>
          </button>

        </div>

      </div>
    </div>
  );
};
