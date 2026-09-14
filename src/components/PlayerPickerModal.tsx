import React, { useState, useMemo } from 'react';
import { Competitor, Match, ActiveSlot } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { Search } from 'lucide-react';
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
    return (
      activeMatches.find((m) => {
        const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
        const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
        return m.id === selectedGameFilter || `${away}@${home}` === selectedGameFilter;
      }) || null
    );
  }, [selectedGameFilter, activeMatches]);

  // Filtered players list based on match filter & search query
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.isArray(allPlayers) ? [...allPlayers] : [];

    // 1. Filter by selected game: strictly players on the two teams of the matchup
    if (activeMatchObj) {
      const away = (activeMatchObj.awayTeamCode || activeMatchObj.away_team || '').trim().toUpperCase();
      const home = (activeMatchObj.homeTeamCode || activeMatchObj.home_team || '').trim().toUpperCase();
      list = list.filter((p) => {
        const code = (p.teamCode || '').trim().toUpperCase();
        return code === away || code === home;
      });
    }

    // 2. Filter by search query if typed
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

    // 3. Default sorting: superstars & highest points lead first
    return list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [allPlayers, activeMatchObj, searchQuery]);

  if (!isOpen) return null;

  const targetTitle = SLOT_TITLES[activeSlot] || 'STAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-3 sm:p-5 rounded-xs my-auto max-h-[92vh] flex flex-col box-border gap-2.5 sm:gap-3">
        
        {/* a) Header: ⭐ PICK STAR [X] with a clean top-right [ ✕ CLOSE ] button */}
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b-2 border-[#d4a86a] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-xl select-none">⭐</span>
            <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase font-bold">
              PICK {targetTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation px-2.5 py-1 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center gap-1 cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5 transition-all font-pixel text-xs rounded-2xs"
            title="Close Picker"
          >
            <span>✕</span>
            <span>CLOSE</span>
          </button>
        </div>

        {/* b) Game Filter Bar: Single clean horizontal scrolling pill bar */}
        <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
          {/* [ ★ ALL STARS ] */}
          <button
            type="button"
            onClick={() => setSelectedGameFilter('ALL')}
            className={`touch-manipulation px-3 py-1.5 font-pixel text-[10px] sm:text-xs border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 ${
              selectedGameFilter === 'ALL'
                ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold'
                : 'bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-[#c99a57]'
            }`}
          >
            ★ ALL STARS
          </button>

          {/* Dynamic Game Pills: [ KC @ BAL ], [ BUF @ MIA ], [ WSH @ PHI ] ... */}
          {activeMatches.map((match) => {
            const away = (match.awayTeamCode || match.away_team || '').trim().toUpperCase();
            const home = (match.homeTeamCode || match.home_team || '').trim().toUpperCase();
            const isSelected = selectedGameFilter === match.id || selectedGameFilter === `${away}@${home}`;

            return (
              <button
                key={match.id}
                type="button"
                onClick={() => setSelectedGameFilter(match.id)}
                className={`touch-manipulation px-2.5 py-1.5 font-pixel text-[10px] sm:text-xs border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 ${
                  isSelected
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold'
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

        {/* c) Search Input: Simple arcade input: "🔍 Search player or team..." */}
        <div className="relative flex items-center shrink-0">
          <Search size={14} className="absolute left-2.5 text-[#784610] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search player or team..."
            className="w-full pl-8 pr-7 py-1.5 sm:py-2 bg-[#ebd2a4] border-2 border-[#c99a57] text-[#5c3509] font-retro text-xs sm:text-sm rounded-xs placeholder:text-[#8c735d] focus:outline-hidden focus:border-[#12579b] focus:bg-[#fae9c8]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-[#784610] hover:text-[#5c3509] font-pixel text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* d) Unified Player Grid (Single Vertical Scroll): 2-col on mobile, 3-col on desktop */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-10 font-retro text-xs text-[#784610]">
              No NFL stars match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredPlayers.map((player) => {
                const isCurrentSlot = player.id === currentSlotPlayerId;
                const { firstName, lastName } = splitPlayerFirstLastName(player.displayName);

                return (
                  <div
                    key={player.id}
                    onClick={() => onInspectPlayer?.(player)}
                    className={`touch-manipulation bg-[#fae5b8] hover:bg-[#fff9ea] border-2 rounded-xs p-2.5 sm:p-3 flex flex-col items-center justify-between cursor-pointer transition-all shadow-[0_3px_0_0_#d4a86a] hover:shadow-[0_4px_0_0_#0a2d52] active:translate-y-0.5 relative select-none ${
                      isCurrentSlot
                        ? 'border-[#12579b] ring-2 ring-[#12579b]/40 bg-[#f8efdc]'
                        : 'border-[#c99a57] hover:border-[#12579b]'
                    }`}
                    title={`Tap to inspect stats for ${player.displayName}`}
                  >
                    {/* Top Row: Team pill & jersey number: [BUF] #17 */}
                    <div className="w-full flex items-center justify-between gap-1 mb-1">
                      <span className="px-1.5 py-0.5 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] font-bold rounded-2xs">
                        {player.teamCode}
                      </span>
                      <div className="flex items-center gap-1 font-pixel text-[9px] font-bold text-[#784610]">
                        <span>#{player.uniformNumber || '—'}</span>
                        <span className="opacity-70">•</span>
                        <span>{player.position || 'STAR'}</span>
                      </div>
                    </div>

                    {/* Middle: Player 8-bit sprite */}
                    <div className="my-1 sm:my-2 flex items-center justify-center">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="md"
                        withShadow={false}
                      />
                    </div>

                    {/* Stacked player name (e.g., JOSH over ALLEN) */}
                    <div className="text-center leading-tight mb-1.5 w-full px-1">
                      {firstName && (
                        <div className="font-pixel text-[9px] sm:text-[10px] text-[#784610] uppercase truncate">
                          {firstName}
                        </div>
                      )}
                      <div className="font-pixel text-xs sm:text-sm font-bold text-[#5c3509] uppercase truncate">
                        {lastName || player.shortName}
                      </div>
                    </div>

                    {/* Large arcade score readout: "59 PTS" */}
                    <div className="w-full mb-2 py-0.5 px-2 bg-[#ebd2a4] border border-[#c99a57] rounded-2xs text-center shadow-2xs">
                      <span className="font-pixel text-xs sm:text-sm font-bold text-[#12579b]">
                        {player.score || 0} PTS
                      </span>
                    </div>

                    {/* Tactile bottom button: [ ⭐ PICK ] */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlayer(player, activeSlot);
                        onClose();
                      }}
                      className="touch-manipulation w-full py-1.5 px-2 bg-[#15803d] hover:bg-[#16a34a] text-white border-2 border-[#052e16] font-pixel text-[10px] sm:text-xs rounded-xs cursor-pointer shadow-[0_2px_0_0_#022c11] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 font-bold"
                    >
                      <span>⭐</span>
                      <span>{isCurrentSlot ? 'SELECTED' : 'PICK'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
