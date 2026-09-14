import React, { useState } from 'react';
import { Users, Plus, Lock, Check, X, ShieldAlert } from 'lucide-react';

interface FamilySquadSwitcherProps {
  activeUserName: string;
  roomCode: string;
  squads: Array<{
    userName: string;
    isLocked?: boolean;
    starCount?: number;
    totalScore?: number;
  }>;
  onSelectSquad: (squadName: string) => void;
  onCreateSquad: (squadName: string) => void;
}

export const FamilySquadSwitcher: React.FC<FamilySquadSwitcherProps> = ({
  activeUserName,
  roomCode,
  squads,
  onSelectSquad,
  onCreateSquad,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Normalize active user name for clean comparison
  const normalizedActive = (activeUserName || 'DAD').trim().toUpperCase();

  // Ensure current active user is included in the list of squads if not already present
  const squadMap = new Map<string, { userName: string; isLocked?: boolean; starCount?: number; totalScore?: number }>();
  squads.forEach((s) => {
    const key = (s.userName || '').trim().toUpperCase();
    if (key && !['P', 'PA', 'PAU', 'PAUL J'].includes(key)) {
      squadMap.set(key, { ...s, userName: key });
    }
  });

  if (normalizedActive && !squadMap.has(normalizedActive)) {
    squadMap.set(normalizedActive, { userName: normalizedActive, isLocked: false, starCount: 0 });
  }

  const squadList = Array.from(squadMap.values());

  // Household gamification: find highest score in room
  const maxScore = Math.max(0, ...squadList.map((s) => s.totalScore ?? 0));

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const handleCommitNewSquad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newSquadName.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Please enter a squad name');
      return;
    }
    if (['P', 'PA', 'PAU', 'PAUL J'].includes(clean)) {
      setErrorMsg('Please choose a valid family squad name');
      return;
    }
    if (squadMap.has(clean)) {
      // If squad already exists, simply switch to it!
      onSelectSquad(clean);
      setIsAdding(false);
      setNewSquadName('');
      return;
    }

    onCreateSquad(clean);
    setIsAdding(false);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const quickFamilySuggestions = ['DAD', 'MOM', 'LEO', 'VIOLET', 'KID 1', 'KID 2'];

  return (
    <div className="w-full bg-[#080d1a] border-b-2 border-[#1a264a] box-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-1 sm:py-1.5 box-border">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar flex-nowrap py-0.5">
          
          {/* Left Label: 🛋️ SQUADS: */}
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <span className="text-xs sm:text-sm">🛋️</span>
            <span className="font-pixel text-[10px] sm:text-xs text-[#38bdf8] whitespace-nowrap font-bold">
              SQUADS:
            </span>
          </div>

        {/* Squad Pills List & [+ ADD] Action - Smooth Horizontal Scroll */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar touch-pan-x">
          {squadList.map((squad) => {
            const isActive = squad.userName === normalizedActive;
            const isLeader = maxScore > 0 && (squad.totalScore ?? 0) === maxScore;
            const scoreVal = squad.totalScore ?? 0;

            return (
              <button
                key={squad.userName}
                type="button"
                onClick={() => onSelectSquad(squad.userName)}
                className={`touch-manipulation shrink-0 flex items-center gap-1.5 px-2 sm:px-2.5 py-1 font-pixel text-[10px] sm:text-xs rounded-xs border-2 transition-all cursor-pointer select-none whitespace-nowrap active:translate-y-0.5 ${
                  isActive
                    ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_2px_0_0_#051a30] font-bold'
                    : 'bg-[#1a2238] text-[#94a3b8] hover:text-[#fae5b8] border-[#273552] hover:border-[#38bdf8]/60 hover:bg-[#232e4b]'
                }`}
                title={
                  isLeader
                    ? `👑 Household Leader! ${squad.userName} (${scoreVal} pts)`
                    : isActive
                    ? `Currently editing ${squad.userName}'s squad`
                    : `Switch to ${squad.userName}'s squad`
                }
              >
                {/* 👑 Crown for Household Leader, or ★ for Active Squad */}
                {isLeader ? (
                  <span className="text-xs select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">👑</span>
                ) : isActive ? (
                  <span className="text-[#fde047]">★</span>
                ) : null}

                <span className="truncate max-w-[90px] sm:max-w-none">{squad.userName}</span>

                {/* 🔒 Lock Icon if Picks are Locked */}
                {squad.isLocked && (
                  <span className="text-[10px]" title="Picks Locked">
                    🔒
                  </span>
                )}

                {/* Points Pill (e.g. 84p) */}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-2xs shrink-0 ${
                    isActive
                      ? 'bg-[#0a2d52] text-[#fde047]'
                      : isLeader
                      ? 'bg-[#451a03] text-[#fde047]'
                      : 'bg-[#0f172a] text-[#94a3b8]'
                  }`}
                >
                  {scoreVal}p
                </span>
              </button>
            );
          })}

          {/* [+ ADD] Button to quickly register another child/companion squad */}
          {!isAdding && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="touch-manipulation shrink-0 flex items-center gap-1 px-2 py-1 font-pixel text-[10px] sm:text-xs rounded-xs border-2 border-dashed border-[#16a34a] bg-[#14532d]/40 text-[#4ade80] hover:bg-[#16a34a] hover:text-white transition-all cursor-pointer select-none whitespace-nowrap active:translate-y-0.5 shadow-xs font-bold"
              title="Add another family squad to this room"
            >
              <Plus size={12} />
              <span>+ ADD</span>
            </button>
          )}
        </div>

        {/* Right Side: ● LIVE SYNC status dot */}
        <div className="flex items-center gap-1.5 font-pixel text-[9px] sm:text-[10px] text-[#22c55e] whitespace-nowrap shrink-0 pl-2 select-none">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
          <span className="hidden xs:inline sm:inline tracking-wider">LIVE SYNC</span>
        </div>
      </div>

      {/* Add Squad Inline Prompt Modal / Bar */}
      {isAdding && (
        <div className="mt-2 pt-2 border-t border-[#1a264a] animate-in fade-in slide-in-from-top-1 duration-150">
          <form
            onSubmit={handleCommitNewSquad}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#0c142b] p-2 sm:p-2.5 border-2 border-[#2563eb] rounded-xs shadow-md"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto min-w-0">
              <label htmlFor="new-squad-name-input" className="font-pixel text-[10px] sm:text-xs text-[#38bdf8] whitespace-nowrap">
                NEW SQUAD NAME:
              </label>
              <input
                id="new-squad-name-input"
                type="text"
                autoFocus
                value={newSquadName}
                onChange={(e) => {
                  setNewSquadName(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                placeholder="e.g. MOM or LEO"
                maxLength={14}
                className="bg-[#1a2238] border-2 border-[#38bdf8] text-[#fae5b8] font-pixel text-[11px] sm:text-xs px-2.5 py-1 rounded-2xs focus:outline-none w-full sm:w-36 uppercase placeholder:text-gray-500"
              />
              
              {/* Quick suggestions pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5 w-full sm:w-auto">
                <span className="font-pixel text-[9px] text-[#64748b] shrink-0">QUICK:</span>
                {quickFamilySuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNewSquadName(sug)}
                    className="touch-manipulation font-pixel text-[9px] px-1.5 py-0.5 bg-[#1a2238] hover:bg-[#232e4b] text-[#94a3b8] hover:text-[#fae5b8] border border-[#273552] rounded-2xs cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Cancel and Create side-by-side on mobile */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto justify-end mt-1 sm:mt-0">
              <button
                type="button"
                onClick={handleCancelAdd}
                className="touch-manipulation px-2.5 py-1.5 sm:py-1 bg-[#334155] hover:bg-[#475569] text-white border border-[#1e293b] font-pixel text-[10px] rounded-2xs cursor-pointer active:translate-y-0.5 text-center"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="touch-manipulation px-3 py-1.5 sm:py-1 bg-[#16a34a] hover:bg-[#22c55e] text-white border border-[#14532d] font-pixel text-[10px] rounded-2xs cursor-pointer shadow-sm active:translate-y-0.5 font-bold flex items-center justify-center gap-1 text-center whitespace-nowrap"
              >
                <Check size={11} />
                <span>CREATE SQUAD</span>
              </button>
            </div>
          </form>
          {errorMsg && (
            <div className="mt-1 flex items-center gap-1 text-[#f87171] font-retro text-xs">
              <ShieldAlert size={12} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};
