import React from 'react';
import { Competitor, ActiveSlot, SquadSlots, Match } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { Sparkles, X, Lock } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';
import { formatRealtimeGameSituationCompact } from '../utils/teamData';

interface MyTeamViewProps {
  slots: SquadSlots;
  userName: string;
  roomCode: string;
  isLocked?: boolean;
  matches?: Match[];
  onCommitUserName?: (name: string) => void;
  onCommitRoomCode?: (code: string) => void;
  onSelectSlot: (slotKey: ActiveSlot) => void;
  onClearSlot: (slotKey: ActiveSlot) => void;
  onToggleLock?: () => void;
  onLockedSlotAttempt?: () => void;
  onInspectPlayer?: (player: Competitor) => void;
}

const SLOT_CONFIG: { key: ActiveSlot; label: string }[] = [
  { key: 'star1', label: 'STAR 1' },
  { key: 'star2', label: 'STAR 2' },
  { key: 'star3', label: 'STAR 3' },
];

export const MyTeamView: React.FC<MyTeamViewProps> = ({
  slots,
  userName,
  roomCode,
  isLocked = false,
  matches = [],
  onSelectSlot,
  onClearSlot,
  onToggleLock,
  onLockedSlotAttempt,
  onInspectPlayer,
}) => {
  // Count how many stars are set
  const filledSlots = [slots.star1, slots.star2, slots.star3].filter(Boolean) as Competitor[];
  const filledCount = filledSlots.length;

  return (
    <div className="w-full box-border">
      
      {/* Centered Hero Focus: 3 Star Podiums */}
      <div className="pixel-box-cream p-3.5 sm:p-5 md:p-6 rounded-xs w-full shadow-[0_8px_0_0_#0a0f1d] border-4 border-[#1a2238] box-border">
        
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2 mb-3 sm:mb-4">
          <h2 className="font-pixel text-xs sm:text-base text-[#5c3509] tracking-wider uppercase flex items-center gap-2">
            <Sparkles size={16} className="text-[#b45309]" />
            <span>YOUR 3 NFL STARS</span>
          </h2>
          <span className="font-pixel text-[11px] sm:text-xs text-[#fae5b8] bg-[#12579b] px-2.5 py-1 border border-[#0a2d52] rounded-xs shrink-0 whitespace-nowrap font-bold">
            {filledCount}/3 SET
          </span>
        </div>

        {/* 3 Prominent Star Podiums with generous breathing room */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
          {SLOT_CONFIG.map(({ key, label }) => {
            const player = slots[key];
            const { firstName, lastName } = player
              ? splitPlayerFirstLastName(player.displayName)
              : { firstName: '', lastName: '' };

            const playerTeam = (player?.teamCode || '').trim().toUpperCase();
            const playerMatch = player
              ? (matches || []).find((m) => {
                  const h = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
                  const a = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
                  return h === playerTeam || a === playerTeam;
                })
              : null;

            const gameSituation = playerMatch ? formatRealtimeGameSituationCompact(playerMatch) : null;

            const passYds = Number(
              player?.stats?.pass_yds ??
              player?.stats?.passing_yards ??
              player?.stats?.passingYards ??
              0
            );
            const rushYds = Number(
              player?.stats?.rush_yds ??
              player?.stats?.rushing_yards ??
              player?.stats?.rushingYards ??
              0
            );
            const recYds = Number(
              player?.stats?.rec_yds ??
              player?.stats?.receiving_yards ??
              player?.stats?.receivingYards ??
              0
            );
            const totalYds = passYds + rushYds + recYds;
            const tds = Number(
              player?.stats?.tds ??
              player?.stats?.touchdowns ??
              0
            );

            return (
              <div
                key={key}
                onClick={() => {
                  if (player) {
                    onInspectPlayer?.(player);
                  } else {
                    if (isLocked) {
                      if (onLockedSlotAttempt) onLockedSlotAttempt();
                      return;
                    }
                    onSelectSlot(key);
                  }
                }}
                className={`touch-manipulation rounded-xs min-h-[270px] sm:min-h-[310px] flex flex-col items-center justify-between p-3.5 sm:p-4 relative transition-all box-border ${
                  isLocked && !player
                    ? 'bg-[#e4cb9c] border-3 border-[#94713a] cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
                    : 'bg-[#ebd2a4] border-3 border-[#c99a57] cursor-pointer hover:bg-[#fae9c8] group shadow-[0_4px_0_0_#a77b3b] active:translate-y-0.5'
                }`}
              >
                {/* Star Slot Badge Header */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-[10px] sm:text-xs border border-[#0a2d52] rounded-xs shadow-xs font-bold tracking-wider whitespace-nowrap">
                    {label}
                  </span>

                  {/* [X] Reset button: strictly resets this specific slot to null */}
                  {player && !isLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSlot(key);
                      }}
                      className="touch-manipulation w-6 h-6 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border border-[#1a2238] flex items-center justify-center font-pixel text-xs rounded-2xs active:translate-y-0.5 shrink-0 shadow-xs cursor-pointer"
                      title={`Clear ${label}`}
                    >
                      <X size={14} />
                    </button>
                  )}

                  {isLocked && (
                    <span className="text-[#15803d] font-pixel text-xs" title="Slot Locked">
                      🔒
                    </span>
                  )}
                </div>

                {player ? (
                  <div className="w-full flex-1 flex flex-col items-center justify-between">
                    {/* Large 8-bit Player Sprite on Pedestal (Primary Focal Point) */}
                    <div className="my-2">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="md"
                        withShadow={true}
                        animate={true}
                      />
                    </div>

                    {/* Stacked Full Name (Arcade Typography - NEVER Truncated) */}
                    <div className="w-full text-center my-1 px-1">
                      {firstName && (
                        <div className="font-pixel text-xs sm:text-sm text-[#784610] tracking-wider leading-tight uppercase">
                          {firstName}
                        </div>
                      )}
                      <div className="font-pixel text-sm sm:text-base text-[#451a03] tracking-wide leading-tight font-bold uppercase break-words">
                        {lastName}
                      </div>

                      {/* (#15 · KC · QB) Subtitle */}
                      <div className="mt-0.5 font-retro text-xs sm:text-[13px] text-[#5c3509] font-bold">
                        (#{player.uniformNumber} · {player.teamCode} · {player.position || 'STAR'})
                      </div>

                      {/* Subtle Kickoff / Matchup Time directly beneath team/position (No extra nested border box) */}
                      {gameSituation ? (
                        <div className="w-full text-center mt-1">
                          {gameSituation.isLive ? (
                            <div className="flex items-center justify-center gap-1.5 font-pixel text-[10px] text-[#b91c1c] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
                              <span>{gameSituation.statusLine}</span>
                              <span className="text-[#991b1b]">·</span>
                              <span>{gameSituation.scoreLine}</span>
                            </div>
                          ) : gameSituation.isFinal ? (
                            <div className="font-pixel text-[10px] text-[#64748b] font-bold">
                              {gameSituation.statusLine} · {gameSituation.scoreLine}
                            </div>
                          ) : (
                            <div className="font-retro text-xs sm:text-[13px] text-[#784610]/90 font-bold">
                              {gameSituation.statusLine} · {gameSituation.scoreLine}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Direct Live Stats (Streamlined without heavy nested box) */}
                    <div className="w-full text-center mt-1.5">
                      <span className="font-pixel text-[10px] sm:text-[11px] text-[#5c3509] font-bold whitespace-nowrap">
                        {tds > 0 || totalYds > 0
                          ? `${tds} TD · ${totalYds} YDS`
                          : '0 TD · 0 YDS'}
                      </span>
                    </div>

                    {/* Bold Whole-Number PTS Badge (Primary Focal Point) */}
                    <div className="w-full mt-2 text-center">
                      <div className="w-full py-1.5 sm:py-2 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm border-2 border-[#0a2d52] shadow-[0_3px_0_0_#051a30] rounded-xs font-bold whitespace-nowrap">
                        {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty Slot - Pulsing Gold Dashed Container: [ + TAP TO PICK STAR ] */
                  <div className="flex-1 flex flex-col items-center justify-center py-6 w-full border-2 border-dashed border-[#b45309] rounded-xs group-hover:border-[#12579b] group-hover:bg-[#f6ebd4] transition-all my-2 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-[#fae5b8] border-2 border-[#b45309] flex items-center justify-center text-[#b45309] group-hover:text-[#12579b] group-hover:border-[#12579b] group-hover:scale-110 transition-all mb-2 shadow-xs">
                      <span className="font-pixel text-xl font-bold">+</span>
                    </div>
                    <span className="font-pixel text-xs sm:text-sm text-[#b45309] group-hover:text-[#12579b] text-center px-1 font-bold">
                      [ + TAP TO PICK STAR ]
                    </span>
                    <span className="font-retro text-[11px] text-[#784610] mt-1">
                      ASSIGN {label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Arcade Lock / Unlock Action Bar (Grounded Full-Width Control Deck Spanning Cards) */}
        <div className="mt-4 w-full box-border">
          {isLocked ? (
            /* STATE A: LOCKED (Confirmed & In the Vault) */
            <div className="w-full px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#064e3b] text-[#fae5b8] border-3 border-[#047857] shadow-[0_4px_0_0_#022c22] rounded-xs flex items-center justify-between gap-2 sm:gap-4 box-border">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-pixel text-xs sm:text-sm text-[#fde047] font-bold tracking-wider truncate flex items-center gap-2">
                  <span className="text-sm select-none">🔒</span>
                  <span>SQUAD LOCKED</span>
                </span>
              </div>
              {onToggleLock && (
                <button
                  type="button"
                  onClick={onToggleLock}
                  className="touch-manipulation px-3 sm:px-4 py-1.5 bg-transparent hover:bg-[#047857]/60 text-[#fae5b8]/80 hover:text-white font-pixel text-[10px] sm:text-xs border border-[#34d399]/40 hover:border-[#34d399] rounded-xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
                  title="Unlock squad to make substitutions"
                >
                  ✏️ Edit Squad
                </button>
              )}
            </div>
          ) : filledCount === 3 ? (
            /* STATE B: UNLOCKED (3/3 Stars Selected - Ready to Submit) */
            <div className="w-full px-3.5 sm:px-5 py-2.5 sm:py-3 bg-[#0f172a] text-[#fae5b8] border-3 border-[#1e293b] shadow-[0_4px_0_0_#020617] rounded-xs flex items-center justify-between gap-2 sm:gap-4 box-border">
              <div className="flex items-center gap-2 min-w-0 shrink-0">
                <span className="px-2.5 py-1 bg-[#1e293b] border border-[#334155] rounded-2xs font-pixel text-[10px] sm:text-xs text-[#38bdf8] font-bold tracking-wider whitespace-nowrap">
                  ⭐ 3/3 READY!
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleLock}
                className="touch-manipulation px-4 sm:px-6 py-2 bg-[#facc15] hover:bg-[#fde047] text-[#451a03] font-pixel text-[11px] sm:text-xs border-2 border-[#ca8a04] rounded-xs cursor-pointer shadow-[0_2px_0_0_#854d0e] animate-pulse active:translate-y-0.5 whitespace-nowrap shrink-0 font-bold tracking-wide"
              >
                ⚡ LOCK SQUAD ⚡
              </button>
            </div>
          ) : (
            /* STATE C: INCOMPLETE (< 3 Stars Selected) */
            <button
              type="button"
              disabled
              className="w-full py-2.5 sm:py-3 px-4 bg-[#ebd2a4] text-[#784610] border-3 border-[#c99a57] rounded-xs font-pixel text-[10px] sm:text-xs flex items-center justify-center gap-2 opacity-80 cursor-not-allowed font-bold select-none box-border"
            >
              <span>🔒</span>
              <span>PICK 3 STARS TO LOCK ({filledCount}/3)</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
