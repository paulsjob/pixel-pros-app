import React from 'react';
import { Competitor, ActiveSlot, SquadSlots, Match } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmetIcon } from './PixelBadges';
import { RoomSetupBar } from './RoomSetupBar';
import { Sparkles, X, Lock } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';
import { formatRealtimeGameSituation } from '../utils/teamData';

interface MyTeamViewProps {
  slots: SquadSlots;
  userName: string;
  roomCode: string;
  isLocked?: boolean;
  matches?: Match[];
  onCommitUserName: (name: string) => void;
  onCommitRoomCode: (code: string) => void;
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
  onCommitUserName,
  onCommitRoomCode,
  onSelectSlot,
  onClearSlot,
  onToggleLock,
  onLockedSlotAttempt,
  onInspectPlayer,
}) => {
  // Count how many stars are set
  const filledSlots = [slots.star1, slots.star2, slots.star3].filter(Boolean) as Competitor[];
  const filledCount = filledSlots.length;

  // Total team points from active stars
  const totalTeamPoints = filledSlots.reduce((sum, p) => sum + (p?.score || 0), 0);

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-4 box-border">
      
      {/* Shared Multi-Device Room Setup Bar (Keystroke Spam Free) */}
      <RoomSetupBar
        userName={userName}
        roomCode={roomCode}
        onCommitUserName={onCommitUserName}
        onCommitRoomCode={onCommitRoomCode}
      />

      {/* Hero Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <PixelHelmetIcon size={30} color="#155e9e" />
          <h1 className="font-pixel text-xl sm:text-3xl text-[#fae5b8] tracking-wider drop-shadow-[0_3px_0_#0f172a]">
            MY SQUAD
          </h1>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#12579b] border-2 border-[#0a2d52] shadow-[0_3px_0_0_#051a30] text-[#fae5b8] font-pixel text-xs sm:text-sm whitespace-nowrap">
            <span className="text-[#38bdf8]">TOTAL:</span>
            <span className="text-[#fde047] font-bold">{totalTeamPoints.toLocaleString()} PTS</span>
          </div>
        </div>
      </div>

      {/* Centered Hero Focus: 3 Star Podiums */}
      <div className="pixel-box-cream p-3 sm:p-6 rounded-xs w-full max-w-3xl mx-auto shadow-[0_8px_0_0_#0a0f1d] border-4 border-[#1a2238] box-border">
        
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2.5 mb-4 sm:mb-5">
          <h2 className="font-pixel text-sm sm:text-lg text-[#5c3509] tracking-wider uppercase flex items-center gap-2">
            <Sparkles size={18} className="text-[#b45309]" />
            <span>YOUR 3 NFL STARS</span>
          </h2>
          <span className="font-pixel text-xs sm:text-sm text-[#fae5b8] bg-[#12579b] px-3 py-1 border border-[#0a2d52] rounded-xs shrink-0 whitespace-nowrap font-bold">
            {filledCount}/3 SET
          </span>
        </div>

        {/* 3 Prominent Centered Star Podiums (fillable and clearable in ANY order) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 w-full">
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

            const isGameLive =
              playerMatch &&
              (playerMatch.status === 'live' ||
                (playerMatch.periodLabel && (playerMatch.periodLabel.includes('Q') || playerMatch.periodLabel.includes('th') || playerMatch.periodLabel.includes('1st') || playerMatch.periodLabel.includes('2nd') || playerMatch.periodLabel.includes('3rd') || playerMatch.periodLabel.includes('Half'))));

            const isGameFinal =
              playerMatch &&
              (playerMatch.status === 'final' ||
                (playerMatch.periodLabel && playerMatch.periodLabel.toLowerCase().includes('final')) ||
                (playerMatch.quarter_time && playerMatch.quarter_time.toLowerCase().includes('final')));

            const gameSituation = playerMatch ? formatRealtimeGameSituation(playerMatch) : null;

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
                className={`touch-manipulation rounded-xs min-h-[260px] sm:min-h-[300px] flex flex-col items-center justify-between p-3 sm:p-4 relative transition-all box-border ${
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
                    {/* Large 8-bit Player Sprite */}
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
                      <div className="mt-1 font-retro text-xs sm:text-[13px] text-[#5c3509] font-bold">
                        (#{player.uniformNumber} · {player.teamCode} · {player.position || 'STAR'})
                      </div>
                    </div>

                    {/* Real-Time Game Situation pill from matches record e.g. "Final · BUF 36 - HOU 31" or "Q4 · BUF 30 - HOU 28" */}
                    {gameSituation ? (
                      <div className={`w-full mt-1 py-1 px-1.5 border rounded-xs text-center shadow-2xs ${
                        isGameLive
                          ? 'bg-[#fef3c7] border-[#f59e0b]'
                          : isGameFinal
                          ? 'bg-[#e2e8f0] border-[#94a3b8]'
                          : 'bg-[#fae9c8] border-[#d4a86a]'
                      }`}>
                        <div className={`font-pixel text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          isGameLive
                            ? 'text-[#92400e]'
                            : isGameFinal
                            ? 'text-[#334155]'
                            : 'text-[#784610]'
                        }`}>
                          {isGameLive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-ping shrink-0" />
                          )}
                          <span className="truncate">{gameSituation}</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Direct Live Stats on Card (e.g. 4 TD · 358 YDS) */}
                    <div className="w-full mt-1.5 py-1 px-2 bg-[#fae5b8]/80 border border-[#c99a57] rounded-xs text-center">
                      <div className="font-pixel text-[10px] sm:text-[11px] text-[#5c3509] font-bold whitespace-nowrap">
                        {tds > 0 || totalYds > 0
                          ? `${tds} TD · ${totalYds} YDS`
                          : '0 TD · 0 YDS'}
                      </div>
                    </div>

                    {/* Bold Whole-Number PTS Badge */}
                    <div className="w-full mt-2 text-center">
                      <div className="px-2.5 py-1.5 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm border-2 border-[#0a2d52] shadow-[0_3px_0_0_#051a30] rounded-xs font-bold whitespace-nowrap">
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

        {/* Centered [ LOCK PICKS ] Action Engine */}
        <div className="mt-5 w-full max-w-md mx-auto">
          {isLocked ? (
            <div className="p-3 bg-[#15803d] text-[#fae5b8] border-3 border-[#052e16] shadow-[0_4px_0_0_#022c11] rounded-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <div className="w-8 h-8 rounded-xs bg-[#22c55e] text-[#052e16] flex items-center justify-center font-pixel text-base shrink-0 shadow-xs">
                  🔒
                </div>
                <div>
                  <div className="font-pixel text-xs sm:text-sm text-white font-bold tracking-wider">
                    PICKS LOCKED FOR GAME DAY
                  </div>
                  <div className="font-retro text-[10px] sm:text-[11px] text-[#bbf7d0]">
                    Picks locked on Couch Board. Slot substitutions disabled.
                  </div>
                </div>
              </div>
              {onToggleLock && (
                <button
                  onClick={onToggleLock}
                  className="touch-manipulation px-3 py-1.5 bg-[#fae5b8] hover:bg-white text-[#15803d] font-pixel text-xs border-2 border-[#052e16] rounded-xs cursor-pointer shadow-xs active:translate-y-0.5 whitespace-nowrap shrink-0 font-bold"
                >
                  🔓 UNLOCK PICKS
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onToggleLock}
              disabled={filledCount < 3}
              className={`touch-manipulation w-full py-3 px-4 font-pixel text-xs sm:text-sm border-3 rounded-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5 ${
                filledCount === 3
                  ? 'bg-[#b45309] hover:bg-[#d97706] text-[#fae5b8] border-[#78350f] shadow-[0_4px_0_0_#451a03]'
                  : 'bg-[#ebd2a4] text-[#784610] border-[#c99a57] opacity-80 cursor-not-allowed'
              }`}
            >
              <Lock size={16} className="shrink-0" />
              <span className="tracking-wider font-bold">
                {filledCount === 3
                  ? 'LOCK PICKS (SUBMIT LINEUP)'
                  : `PICK ALL 3 STARS TO LOCK (${filledCount}/3)`}
              </span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
