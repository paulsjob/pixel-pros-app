import React, { useState, useMemo } from 'react';
import { Competitor, Match, ActiveSlot } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { X, Search, Sparkles } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';

interface PlayerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlot: ActiveSlot;
  allPlayers: Competitor[];
  currentSlotPlayerId?: string | null;
  selectedPlayerIds?: string[];
  matches?: Match[];
  onSelectPlayer: (player: Competitor, targetSlot: ActiveSlot) => void;
  onInspectPlayer?: (player: Competitor) => void;
}

const SLOT_TITLES: Record<ActiveSlot, string> = {
  star1: 'STAR 1',
  star2: 'STAR 2',
  star3: 'STAR 3',
};

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  isOpen,
  onClose,
  activeSlot,
  allPlayers = [],
  currentSlotPlayerId,
  selectedPlayerIds = [],
  matches = [],
  onSelectPlayer,
  onInspectPlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL');

  // Available real matches strictly from Supabase
  const activeMatches = useMemo(() => {
    return Array.isArray(matches) ? matches : [];
  }, [matches]);

  // Selected game filter match object (if not ALL)
  const activeMatchObj = useMemo(() => {
    if (selectedGameFilter === 'ALL') return null;
    return activeMatches.find((m) => {
      const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
      const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
      return m.id === selectedGameFilter || `${away}@${home}` === selectedGameFilter;
    }) || null;
  }, [selectedGameFilter, activeMatches]);

  // Filtered players list based on match filter & search query
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.isArray(allPlayers) ? [...allPlayers] : [];

    // Filter by selected game first: strictly players on the two teams of the match
    if (activeMatchObj) {
      const away = (activeMatchObj.awayTeamCode || activeMatchObj.away_team || '').trim().toUpperCase();
      const home = (activeMatchObj.homeTeamCode || activeMatchObj.home_team || '').trim().toUpperCase();
      list = list.filter((p) => {
        const code = (p.teamCode || '').trim().toUpperCase();
        return code === away || code === home;
      });
    }

    // Filter by search query if typed
    if (q) {
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          p.teamCode.toLowerCase().includes(q) ||
          (p.position && p.position.toLowerCase().includes(q))
      );
    }

    // Sort by points descending so live top scorers lead the list
    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [allPlayers, activeMatchObj, searchQuery]);

  // Household superstars for the pinned row from real Supabase competitors
  const superstarPlayers = useMemo(() => {
    const list = Array.isArray(allPlayers) ? allPlayers : [];
    if (list.length === 0) return [];
    const targetNames = [
      'josh allen',
      'derrick henry',
      'saquon barkley',
      'patrick mahomes',
      'ceedee lamb',
      'justin jefferson',
      'jalen hurts',
      'lamar jackson',
      'trevor lawrence',
      'c.j. stroud',
      'joe burrow',
      'baker mayfield'
    ];
    const found: Competitor[] = [];
    targetNames.forEach((name) => {
      const p = list.find((item) => item.displayName.toLowerCase().includes(name));
      if (p && !found.some((f) => f.id === p.id)) {
        found.push(p);
      }
    });
    if (found.length < 12) {
      const remaining = [...list].sort((a, b) => (b.score || 0) - (a.score || 0));
      for (const p of remaining) {
        if (!found.some((f) => f.id === p.id)) {
          found.push(p);
          if (found.length >= 12) break;
        }
      }
    }
    return found;
  }, [allPlayers]);

  if (!isOpen) return null;

  const targetTitle = SLOT_TITLES[activeSlot] || 'STAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-3 sm:p-5 rounded-xs my-auto max-h-[94vh] flex flex-col box-border">
        
        {/* Red Retro Close Button */}
        <button
          onClick={onClose}
          className="touch-manipulation absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 bg-[#b91c1c] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-[0_3px_0_0_#450a0a] active:translate-y-1 active:shadow-none transition-all font-pixel text-xs z-10"
          title="Close Picker"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-2 border-b-2 border-[#d4a86a] shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm border border-[#0a2d52] shadow-[0_2px_0_0_#051a30] mb-1">
            <Sparkles size={14} className="text-[#fde047]" />
            <span>PICK YOUR {targetTitle}</span>
          </div>
          <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase">
            WHOLE-NUMBER NFL STAR PICKER
          </h2>
          <p className="font-retro text-[10px] sm:text-[11px] text-[#784610]">
            Tap a game pill to pick guys from the match on TV, or grab a superstar below!
          </p>
        </div>

        {/* MATCH FILTER TABS: Horizontal Touch-Friendly Game Pills */}
        <div className="mt-2.5 pb-1 shrink-0">
          <div className="text-[10px] font-pixel text-[#784610] uppercase mb-1 flex items-center gap-1">
            <span>📺 FILTER BY GAME ON TV:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar touch-pan-x">
            {/* [ ALL ] Pill */}
            <button
              onClick={() => setSelectedGameFilter('ALL')}
              className={`touch-manipulation px-2.5 py-1.5 font-pixel text-[10px] sm:text-xs border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 ${
                selectedGameFilter === 'ALL'
                  ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30]'
                  : 'bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-[#c99a57]'
              }`}
            >
              ★ ALL
            </button>

            {/* Individual Game Pills: [ WSH @ PHI ] [ BUF @ HOU ] [ CHI @ CAR ] ... */}
            {activeMatches.map((match) => {
              const away = (match.awayTeamCode || match.away_team || '').trim().toUpperCase();
              const home = (match.homeTeamCode || match.home_team || '').trim().toUpperCase();
              const isSelected = selectedGameFilter === match.id || selectedGameFilter === `${away}@${home}`;
              return (
                <button
                  key={match.id}
                  onClick={() => setSelectedGameFilter(match.id)}
                  className={`touch-manipulation px-2.5 py-1.5 font-pixel text-[10px] sm:text-xs border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 ${
                    isSelected
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30]'
                      : 'bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  <span className="font-bold">{away}</span>
                  <span className="opacity-70 mx-1">@</span>
                  <span className="font-bold">{home}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active game filter banner if a game is selected */}
        {activeMatchObj && (
          <div className="mb-2 p-1.5 bg-[#e0f2fe] border border-[#0284c7] rounded-xs flex items-center justify-between shrink-0">
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#0369a1]">
              FILTERED: <span className="font-bold">{activeMatchObj.awayTeamCode || activeMatchObj.away_team} @ {activeMatchObj.homeTeamCode || activeMatchObj.home_team}</span> ({filteredPlayers.length} players)
            </span>
            <button
              onClick={() => setSelectedGameFilter('ALL')}
              className="font-pixel text-[9px] text-[#b91c1c] underline hover:text-[#7f1d1d] cursor-pointer"
            >
              CLEAR FILTER
            </button>
          </div>
        )}

        {/* PINNED TOP SUPERSTARS ROW: One-Tap Access to Household Stars */}
        {selectedGameFilter === 'ALL' && !searchQuery && (
          <div className="mb-2 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-pixel text-[#784610] uppercase flex items-center gap-1">
                <span className="text-[#b45309]">★</span> TOP SUPERSTARS:
              </span>
              <span className="text-[9px] font-retro text-[#784610]">One-tap quick assign</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar touch-pan-x">
              {superstarPlayers.map((player) => {
                const isCurrentSlot = player.id === currentSlotPlayerId;
                const { firstName, lastName } = splitPlayerFirstLastName(player.displayName);
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      onSelectPlayer(player, activeSlot);
                      onClose();
                    }}
                    className={`touch-manipulation flex flex-col items-center justify-between p-2 min-w-[110px] sm:min-w-[124px] border-2 rounded-xs shrink-0 cursor-pointer transition-all active:translate-y-0.5 ${
                      isCurrentSlot
                        ? 'bg-[#155e9e] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30]'
                        : 'bg-[#fae5b8] hover:bg-[#fff5e0] text-[#5c3509] border-[#c99a57]'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between gap-1 mb-1">
                      <span className="px-1 py-0.2 bg-[#12579b] text-[#fae5b8] font-pixel text-[8px] rounded-2xs font-bold">
                        {player.teamCode}
                      </span>
                      <span className="font-pixel text-[8px] text-[#784610] font-bold">
                        {player.position}
                      </span>
                    </div>

                    <div className="my-0.5">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="sm"
                        withShadow={false}
                      />
                    </div>

                    {/* Stacked Full Name (No truncation) */}
                    <div className="text-center mt-1 leading-tight w-full">
                      {firstName && (
                        <div className="font-pixel text-[8px] sm:text-[9px] opacity-80 uppercase">
                          {firstName}
                        </div>
                      )}
                      <div className="font-pixel text-[9px] sm:text-[11px] font-bold uppercase break-words">
                        {lastName}
                      </div>
                    </div>

                    <span className="mt-1 px-1.5 py-0.5 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] font-bold rounded-2xs whitespace-nowrap">
                      {player.score ? `${player.score} PTS` : '0 PTS'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Minimal Search Bar for Parents Typing Specific Names */}
        <div className="mb-2 shrink-0">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-[#784610]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player, team, or position (e.g. Allen, Henry, Chiefs, QB)..."
              className="w-full pl-8 pr-7 py-1.5 bg-[#ebd2a4] border-2 border-[#c99a57] text-[#5c3509] font-retro text-xs rounded-xs placeholder:text-[#8c735d] focus:outline-hidden focus:border-[#12579b] focus:bg-[#fae9c8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-[#784610] hover:text-[#5c3509] font-pixel text-[10px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Indicator */}
        {activeMatchObj && (
          <div className="mb-2 px-2.5 py-1 bg-[#12579b]/10 border border-[#12579b]/30 rounded-xs flex items-center justify-between text-[10px] font-pixel text-[#12579b] shrink-0">
            <span>SHOWING PLAYERS FOR: {activeMatchObj.awayTeam} vs {activeMatchObj.homeTeam}</span>
            <button
              onClick={() => setSelectedGameFilter('ALL')}
              className="text-[#b91c1c] hover:underline cursor-pointer"
            >
              CLEAR GAME FILTER [✕]
            </button>
          </div>
        )}

        {/* PLAYERS VERTICAL LIST (Touch-Friendly Rows) */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[160px] max-h-[46vh]">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 font-retro text-xs text-[#784610]">
              No NFL stars match the current filter.
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isCurrentSlot = player.id === currentSlotPlayerId;
              const isOtherSlot = !isCurrentSlot && selectedPlayerIds.includes(player.id);
              const { firstName, lastName } = splitPlayerFirstLastName(player.displayName);

              return (
                <div
                  key={player.id}
                  onClick={() => {
                    onSelectPlayer(player, activeSlot);
                    onClose();
                  }}
                  className={`touch-manipulation p-2 sm:p-2.5 border-2 rounded-xs flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-y-0.5 ${
                    isCurrentSlot
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#0a2d52] shadow-[0_3px_0_0_#051a30]'
                      : 'bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  {/* Left Column: 8-Bit Sprite + Name + Team Abbreviation + Position */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="shrink-0">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="sm"
                        withShadow={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="leading-tight mr-1">
                          {firstName && (
                            <div
                              className={`font-pixel text-[9px] sm:text-[10px] uppercase opacity-80 ${
                                isCurrentSlot ? 'text-[#fae5b8]' : 'text-[#784610]'
                              }`}
                            >
                              {firstName}
                            </div>
                          )}
                          <div
                            className={`font-pixel text-xs sm:text-sm tracking-wide font-bold uppercase ${
                              isCurrentSlot ? 'text-[#fae5b8]' : 'text-[#5c3509]'
                            }`}
                          >
                            {lastName}
                          </div>
                        </div>

                        {/* Team Code Badge */}
                        <span
                          className={`px-1.5 py-0.5 font-pixel text-[9px] border rounded-xs shrink-0 font-bold ${
                            isCurrentSlot
                              ? 'bg-[#0a2d52] text-[#fae5b8] border-[#38bdf8]/40'
                              : 'bg-[#fae5b8] text-[#12579b] border-[#c99a57]'
                          }`}
                        >
                          {player.teamCode}
                        </span>

                        {/* Position Badge */}
                        <span
                          className={`px-1.5 py-0.5 font-pixel text-[9px] border rounded-xs shrink-0 ${
                            isCurrentSlot
                              ? 'bg-[#0a2d52] text-[#38bdf8] border-[#38bdf8]/40'
                              : 'bg-[#fae9c8] text-[#784610] border-[#d4a86a]'
                          }`}
                        >
                          {player.position || 'STAR'}
                        </span>
                      </div>

                      <div
                        className={`font-retro text-[10px] mt-0.5 ${
                          isCurrentSlot ? 'text-[#93c5fd]' : 'text-[#784610]'
                        }`}
                      >
                        #{player.uniformNumber} • {player.teamName}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Whole Number Points Badge + Pick Button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div
                      className={`px-2 py-1 font-pixel text-[11px] sm:text-xs font-bold border rounded-xs shadow-xs whitespace-nowrap shrink-0 ${
                        isCurrentSlot
                          ? 'bg-[#38bdf8] text-[#080d1a] border-[#0284c7]'
                          : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                      }`}
                    >
                      {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                    </div>

                    {onInspectPlayer && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectPlayer(player);
                        }}
                        className="touch-manipulation p-1 px-1.5 bg-[#fae5b8] hover:bg-white text-[#5c3509] border border-[#c99a57] font-pixel text-[9px] rounded-xs cursor-pointer shadow-xs active:translate-y-0.5"
                        title={`Inspect real stats for ${player.displayName}`}
                      >
                        INFO
                      </button>
                    )}

                    <button
                      type="button"
                      className={`px-2.5 py-1 font-pixel text-[9px] sm:text-[10px] border rounded-xs whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                        isCurrentSlot
                          ? 'bg-[#166534] text-[#fae5b8] border-[#14532d]'
                          : 'bg-[#fae5b8] hover:bg-white text-[#5c3509] border-[#c99a57]'
                      }`}
                    >
                      {isCurrentSlot ? 'CURRENT' : isOtherSlot ? 'SWAP' : 'PICK'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Helper */}
        <div className="mt-2.5 pt-2 border-t border-[#d4a86a] text-center text-[10px] font-retro text-[#784610] shrink-0">
          Selected player is placed directly into {targetTitle}. Tap any player above to assign!
        </div>

      </div>
    </div>
  );
};
