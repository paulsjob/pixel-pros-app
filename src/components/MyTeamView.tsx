import React, { useState } from 'react';
import { Competitor, UserProfile } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmetIcon } from './PixelBadges';
import { RoomSetupBar } from './RoomSetupBar';
import { ArrowUpDown, BarChart3, Sparkles, X } from 'lucide-react';

interface MyTeamViewProps {
  roster: Competitor[];
  user: UserProfile;
  selectedPlayers: Competitor[];
  userName: string;
  roomCode: string;
  onUserNameChange: (name: string) => void;
  onRoomCodeChange: (code: string) => void;
  onSelectSlot: (index: number) => void;
  onOpenPlayerDetail: (player: Competitor) => void;
  onOpenStatsModal: () => void;
  onTogglePlayer: (player: Competitor) => void;
  onClearSlot?: (index: number) => void;
}

const STAR_LABELS = ['STAR 1', 'STAR 2', 'STAR 3'];

export const MyTeamView: React.FC<MyTeamViewProps> = ({
  roster = [],
  user,
  selectedPlayers = [],
  userName,
  roomCode,
  onUserNameChange,
  onRoomCodeChange,
  onSelectSlot,
  onOpenPlayerDetail,
  onOpenStatsModal,
  onTogglePlayer,
  onClearSlot,
}) => {
  const [sortAsc, setSortAsc] = useState(false);

  const safeSelected = Array.isArray(selectedPlayers) ? selectedPlayers : [];
  const safeRoster = Array.isArray(roster) ? roster : [];

  // Total team points from the 3 active stars
  const totalTeamPoints = safeSelected.reduce((sum, p) => sum + (p?.score || 0), 0);

  // Compute aggregate stats of the selected 3 players
  const aggregateStats = safeSelected.reduce(
    (acc, player) => ({
      passingYards: acc.passingYards + (player?.stats?.passingYards || 0),
      rushingYards: acc.rushingYards + (player?.stats?.rushingYards || 0),
      touchdowns: acc.touchdowns + (player?.stats?.touchdowns || 0),
    }),
    { passingYards: 0, rushingYards: 0, touchdowns: 0 }
  );

  const sortedRoster = safeRoster.slice().sort((a, b) => {
    const scoreA = a?.score ?? 0;
    const scoreB = b?.score ?? 0;
    return sortAsc ? scoreA - scoreB : scoreB - scoreA;
  });

  return (
    <div className="w-full max-w-md md:max-w-5xl mx-auto px-0 box-border overflow-hidden">
      
      {/* Shared Multi-Device Room Setup Bar */}
      <RoomSetupBar
        userName={userName}
        roomCode={roomCode}
        onUserNameChange={onUserNameChange}
        onRoomCodeChange={onRoomCodeChange}
      />

      {/* Top Banner Header */}
      <div className="text-center mb-3 sm:mb-5">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <PixelHelmetIcon size={28} color="#155e9e" />
          <h1 className="font-pixel text-lg sm:text-2xl text-[#fae5b8] tracking-wider drop-shadow-[0_3px_0_#0f172a]">
            MY TEAM
          </h1>
          <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-[#12579b] border-2 border-[#0a2d52] shadow-[0_3px_0_0_#051a30] text-[#fae5b8] font-pixel text-[11px] sm:text-xs whitespace-nowrap">
            <span className="text-[#38bdf8]">TOTAL:</span>
            <span>{totalTeamPoints.toLocaleString()} PTS</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* LEFT COLUMN: All NFL Stars Pool + Quick Controls + Stats Modal Launcher */}
        <div className="md:col-span-4 flex flex-col gap-3.5 sm:gap-4 order-2 md:order-1">
          
          {/* SORT Button (Points High / Low) */}
          <div className="flex gap-2.5">
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="touch-manipulation flex-1 py-2 px-3 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs border-3 border-[#0a2d52] shadow-[0_4px_0_0_#051a30] cursor-pointer flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <ArrowUpDown size={14} />
              <span>{sortAsc ? 'LOWEST PTS' : 'TOP PTS'}</span>
            </button>
            <div className="px-3 py-2 bg-[#ebd2a4] border-2 border-[#c99a57] text-[#5c3509] font-retro text-xs rounded-xs flex items-center justify-center whitespace-nowrap">
              {safeRoster.length} NFL STARS
            </div>
          </div>

          {/* Roster Pool Thumbnails in Cream Pixel Box */}
          <div className="pixel-box-cream p-3 rounded-xs">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#d4a86a]">
              <span className="font-pixel text-[11px] text-[#5c3509] tracking-wider">
                TAP ANY STAR TO INSPECT
              </span>
              <span className="font-retro text-[10px] text-[#784610]">
                {safeSelected.length}/3 PICKED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {sortedRoster.map((player) => {
                const isSelected = safeSelected.some((p) => p.id === player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => onOpenPlayerDetail(player)}
                    className={`touch-manipulation p-2 border-2 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative active:translate-y-0.5 rounded-xs ${
                      isSelected
                        ? 'border-[#12579b] bg-[#fae9c8] ring-2 ring-[#12579b]'
                        : 'border-[#c99a57] bg-[#ebd2a4] hover:bg-[#fae9c8]'
                    }`}
                  >
                    {/* Mini Pixel Avatar */}
                    <div className="my-0.5">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="sm"
                        withShadow={false}
                      />
                    </div>

                    {/* Team Code Badge */}
                    <span className="px-1.5 py-0.2 bg-[#fae5b8] text-[#12579b] border border-[#c99a57] font-pixel text-[8px] font-bold rounded-2xs">
                      {player.teamCode}
                    </span>

                    {/* Player Name */}
                    <span className="font-pixel text-[9px] text-[#5c3509] leading-tight mt-1 line-clamp-1">
                      {player.displayName}
                    </span>

                    {/* Score */}
                    <span className="font-pixel text-[9px] text-[#12579b] font-bold whitespace-nowrap">
                      {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                    </span>

                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 bg-[#12579b] text-[#fae5b8] text-[8px] font-pixel px-1 border border-[#0a2d52]">
                        ★
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STATS Button */}
          <button
            onClick={onOpenStatsModal}
            className="touch-manipulation w-full px-4 py-2.5 sm:py-3 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] font-pixel text-xs sm:text-sm border-3 border-[#0a2d52] shadow-[0_4px_0_0_#051a30] cursor-pointer flex items-center justify-center gap-2 text-center active:translate-y-0.5 active:shadow-none transition-all box-border"
          >
            <BarChart3 size={18} className="shrink-0" />
            <span className="leading-tight tracking-wider">STATS & LIVE MATCHES</span>
          </button>

        </div>

        {/* RIGHT COLUMN: 3 Star Slots + Combined Output */}
        <div className="md:col-span-8 flex flex-col gap-4 sm:gap-6 w-full max-w-full overflow-hidden box-border order-1 md:order-2">
          
          {/* Top Panel: PICK ANY 3 STARS */}
          <div className="pixel-box-cream p-3 sm:p-5 rounded-xs w-full max-w-full overflow-hidden box-border">
            <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2.5 mb-3 sm:mb-4">
              <div>
                <h2 className="font-pixel text-xs sm:text-base text-[#5c3509] tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#b45309]" />
                  <span>PICK ANY 3 STARS</span>
                </h2>
                <p className="font-retro text-[10px] sm:text-[11px] text-[#784610] mt-0.5">
                  Dead-Simple Couch Model: Pick ANY 3 real NFL players for your room
                </p>
              </div>
              <span className="font-pixel text-[11px] sm:text-xs text-[#fae5b8] bg-[#12579b] px-2.5 py-1 border border-[#0a2d52] rounded-xs shrink-0 whitespace-nowrap">
                {safeSelected.length}/3 SET
              </span>
            </div>

            {/* 3 Ultra-Clean STAR Slots */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
              {[0, 1, 2].map((slotIndex) => {
                const player = safeSelected[slotIndex];
                const starLabel = STAR_LABELS[slotIndex];

                return (
                  <div
                    key={slotIndex}
                    onClick={() => onSelectSlot(slotIndex)}
                    className="touch-manipulation bg-[#ebd2a4] border-3 border-[#c99a57] rounded-xs min-h-[190px] sm:min-h-[230px] flex flex-col items-center justify-between p-2 sm:p-3.5 relative cursor-pointer transition-all hover:bg-[#fae9c8] group shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] active:translate-y-0.5 box-border"
                  >
                    {/* Star Slot Badge Header */}
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] sm:text-[11px] border border-[#0a2d52] rounded-xs shadow-xs font-bold tracking-wider whitespace-nowrap">
                        {starLabel}
                      </span>
                      {player && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onClearSlot) {
                              onClearSlot(slotIndex);
                            } else {
                              onTogglePlayer(player);
                            }
                          }}
                          className="touch-manipulation w-5 h-5 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border border-[#1a2238] flex items-center justify-center font-pixel text-[9px] rounded-2xs active:translate-y-0.5 shrink-0"
                          title={`Clear ${starLabel}`}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {player ? (
                      <>
                        {/* Big 8-bit Player Sprite */}
                        <div className="my-1 sm:my-2">
                          <PixelPlayerSprite
                            avatar={player.avatar}
                            number={player.uniformNumber}
                            size="md"
                            withShadow={true}
                            animate={true}
                          />
                        </div>

                        {/* Player Name & Team Abbreviation */}
                        <div className="mt-1 text-center w-full min-w-0">
                          <span className="font-pixel text-[11px] sm:text-xs text-[#5c3509] block leading-tight truncate font-bold">
                            {player.displayName}
                          </span>
                          <div className="flex items-center justify-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 bg-[#fae5b8] text-[#12579b] border border-[#c99a57] font-pixel text-[9px] font-bold rounded-2xs">
                              {player.teamCode}
                            </span>
                            <span className="font-retro text-[9px] sm:text-[10px] text-[#784610]">
                              #{player.uniformNumber}
                            </span>
                          </div>
                        </div>

                        {/* Bold Score Badge */}
                        <div className="w-full mt-2 text-center">
                          <div className="px-2 py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-[10px] sm:text-xs border border-[#0a2d52] shadow-[0_2px_0_0_#051a30] rounded-xs font-bold whitespace-nowrap">
                            {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Empty Slot - Prompt to Pick */
                      <div className="flex-1 flex flex-col items-center justify-center py-4 w-full border-2 border-dashed border-[#c99a57] rounded-xs group-hover:border-[#12579b] group-hover:bg-[#f6ebd4] transition-all my-2">
                        <div className="w-10 h-10 rounded-full bg-[#fae5b8] border-2 border-[#c99a57] flex items-center justify-center text-[#12579b] group-hover:scale-110 transition-transform mb-2">
                          <span className="font-pixel text-lg font-bold">+</span>
                        </div>
                        <span className="font-pixel text-[10px] sm:text-xs text-[#5c3509] group-hover:text-[#12579b] text-center px-1">
                          TAP TO PICK
                        </span>
                        <span className="font-retro text-[9px] text-[#784610] mt-0.5">
                          ANY NFL STAR
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COMBINED 3-STAR OUTPUT */}
          <div className="pixel-box-cream p-3 sm:p-4 rounded-xs space-y-2.5">
            <div className="flex justify-between items-center border-b border-[#d4a86a] pb-2">
              <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider">
                COMBINED 3-STAR OUTPUT
              </span>
              <span className="font-pixel text-xs sm:text-sm text-[#12579b] font-bold whitespace-nowrap">
                {totalTeamPoints.toLocaleString()} TOTAL PTS
              </span>
            </div>

            <div className="flex justify-between items-center whitespace-nowrap">
              <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider whitespace-nowrap">
                PASSING YARDS
              </span>
              <span className="font-pixel text-xs sm:text-base text-[#5c3509] whitespace-nowrap ml-2">
                {aggregateStats.passingYards.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center whitespace-nowrap">
              <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider whitespace-nowrap">
                RUSHING YARDS
              </span>
              <span className="font-pixel text-xs sm:text-base text-[#5c3509] whitespace-nowrap ml-2">
                {aggregateStats.rushingYards.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center whitespace-nowrap pb-0.5">
              <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider whitespace-nowrap">
                TOUCHDOWNS
              </span>
              <span className="font-pixel text-xs sm:text-base text-[#b45309] font-bold whitespace-nowrap ml-2">
                {aggregateStats.touchdowns}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
