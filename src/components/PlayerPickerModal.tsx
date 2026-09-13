import React, { useState, useMemo } from 'react';
import { Competitor } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { X, Search, Check, Sparkles } from 'lucide-react';
import { formatPlayerInitialLastName, formatTeamPosSubtitle } from '../utils/formatters';

interface PlayerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotIndex: number;
  allPlayers: Competitor[];
  selectedPlayerIds: string[];
  onSelectPlayer: (player: Competitor, slotIndex: number) => void;
}

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  isOpen,
  onClose,
  slotIndex,
  allPlayers = [],
  selectedPlayerIds = [],
  onSelectPlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = Array.isArray(allPlayers) ? allPlayers : [];
    if (!q) {
      return list.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    return list
      .filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          p.teamCode.toLowerCase().includes(q) ||
          (p.position && p.position.toLowerCase().includes(q))
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [allPlayers, searchQuery]);

  if (!isOpen) return null;

  const currentSlotPlayerId = selectedPlayerIds[slotIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-3 sm:p-5 rounded-xs my-auto max-h-[92vh] flex flex-col box-border">
        
        {/* Red Close Button */}
        <button
          onClick={onClose}
          className="touch-manipulation absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 bg-[#b91c1c] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-[0_3px_0_0_#450a0a] active:translate-y-1 active:shadow-none transition-all font-pixel text-xs z-10"
          title="Close Picker"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-2.5 sm:pb-3 border-b-2 border-[#d4a86a] shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm border border-[#0a2d52] shadow-[0_2px_0_0_#051a30] mb-1.5">
            <Sparkles size={14} className="text-[#fde047]" />
            <span>SELECT STAR {slotIndex + 1}</span>
          </div>
          <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase">
            CHOOSE ACTIVE NFL STAR
          </h2>
          <p className="font-retro text-[10px] sm:text-[11px] text-[#784610] mt-0.5">
            Hydrated live from Supabase competitors table (no position limits)
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-2.5 mb-2 shrink-0">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-[#784610]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NFL stars (Mahomes, Allen, Henry, Lamb, SEA)..."
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-[#ebd2a4] border-2 border-[#c99a57] text-[#5c3509] font-retro text-xs rounded-xs placeholder:text-[#8c735d] focus:outline-hidden focus:border-[#12579b] focus:bg-[#fae9c8]"
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

        {/* Player List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px] max-h-[55vh]">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-[#784610] font-retro text-xs">
              No NFL athletes match "{searchQuery}"
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isCurrentSlot = player.id === currentSlotPlayerId;
              const isOtherSlot = !isCurrentSlot && selectedPlayerIds.includes(player.id);
              const formattedName = formatPlayerInitialLastName(player.displayName);
              const teamPosSubtitle = formatTeamPosSubtitle(player.teamCode, player.position || player.positionGeneric);

              return (
                <div
                  key={player.id}
                  onClick={() => {
                    onSelectPlayer(player, slotIndex);
                    onClose();
                  }}
                  className={`touch-manipulation p-2 sm:p-2.5 border-2 rounded-xs flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-y-0.5 ${
                    isCurrentSlot
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#0a2d52] shadow-[0_3px_0_0_#051a30]'
                      : 'bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  {/* Left Column: Sprite + Name + Team Abbr + Position */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {/* 8-bit Sprite */}
                    <div className="shrink-0">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="sm"
                        withShadow={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-pixel text-xs sm:text-sm tracking-wide truncate ${
                            isCurrentSlot ? 'text-[#fae5b8]' : 'text-[#5c3509]'
                          }`}
                        >
                          {formattedName}
                        </span>
                        {/* 3-Letter Team Abbreviation Badge */}
                        <span
                          className={`px-1.5 py-0.5 font-pixel text-[9px] border rounded-xs shrink-0 ${
                            isCurrentSlot
                              ? 'bg-[#0a2d52] text-[#fae5b8] border-[#38bdf8]/40'
                              : 'bg-[#fae5b8] text-[#12579b] border-[#c99a57] font-bold'
                          }`}
                        >
                          {player.teamCode}
                        </span>
                        {/* Real Position Badge */}
                        <span
                          className={`px-1.5 py-0.5 font-pixel text-[9px] border rounded-xs shrink-0 ${
                            isCurrentSlot
                              ? 'bg-[#0a2d52] text-[#38bdf8] border-[#38bdf8]/40'
                              : 'bg-[#fae9c8] text-[#784610] border-[#d4a86a]'
                          }`}
                        >
                          {player.position || player.positionGeneric || 'STAR'}
                        </span>
                      </div>
                      <div
                        className={`font-retro text-[10px] ${
                          isCurrentSlot ? 'text-[#93c5fd]' : 'text-[#784610]'
                        }`}
                      >
                        #{player.uniformNumber} • {player.teamName}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Score Badge + Action (flex-shrink-0 and whitespace-nowrap) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`px-2 py-1 font-pixel text-[11px] sm:text-xs font-bold border rounded-xs shadow-xs whitespace-nowrap shrink-0 ${
                        isCurrentSlot
                          ? 'bg-[#38bdf8] text-[#080d1a] border-[#0284c7]'
                          : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                      }`}
                    >
                      {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                    </div>

                    <button
                      type="button"
                      className={`px-2 py-1 font-pixel text-[9px] sm:text-[10px] border rounded-xs whitespace-nowrap shrink-0 cursor-pointer transition-all ${
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

        {/* Footer helper */}
        <div className="mt-3 pt-2 border-t border-[#d4a86a] flex items-center justify-between text-[10px] font-retro text-[#784610] shrink-0">
          <span>{filteredPlayers.length} NFL Stars Available</span>
          <span>Tap to pick into STAR {slotIndex + 1}</span>
        </div>

      </div>
    </div>
  );
};
