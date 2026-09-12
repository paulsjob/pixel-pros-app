import React, { useState } from 'react';
import { Competitor, Match } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { Activity, Flame, ChevronDown, ChevronUp, Wrench, Trophy } from 'lucide-react';

interface LiveScoresViewProps {
  matches: Match[];
  competitors: Competitor[];
  onSelectPlayer?: (player: Competitor) => void;
  onSimulatePlay?: (player: Competitor, eventName: string, points: number) => void;
}

// Utility to ensure standard 3-letter retro ticker abbreviation
export function getTeamAbbr(team: string): string {
  if (!team) return 'TEAM';
  const clean = team.trim().toUpperCase();
  const knownMap: Record<string, string> = {
    'KANSAS CITY': 'KC',
    'KANSAS': 'KC',
    'KC KINGDOM': 'KC',
    'KC': 'KC',
    'BUFFALO': 'BUF',
    'BUFFALO RUSH': 'BUF',
    'BUF': 'BUF',
    'BALTIMORE': 'BAL',
    'BALTIMORE POWER': 'BAL',
    'BAL': 'BAL',
    'DALLAS': 'DAL',
    'BLUE STARS': 'DAL',
    'DAL': 'DAL',
    'MIAMI': 'MIA',
    'MIAMI SPEED': 'MIA',
    'MIAMI UNITED': 'MIA',
    'MIA': 'MIA',
    'GOLDEN STATE': 'GSW',
    'GSW': 'GSW',
    'SEATTLE': 'SEA',
    'BAY HAWKS': 'SEA',
    'SEA': 'SEA',
  };
  if (knownMap[clean]) return knownMap[clean];
  if (clean.length <= 4) return clean;
  const words = clean.split(/\s+/);
  if (words.length > 1) {
    return words.map((w) => w[0]).join('').slice(0, 3);
  }
  return clean.slice(0, 3);
}

export const LiveScoresView: React.FC<LiveScoresViewProps> = ({
  matches = [],
  competitors = [],
  onSelectPlayer,
  onSimulatePlay,
}) => {
  const [showDevTools, setShowDevTools] = useState(false);

  // Automatically sort competitors descending by SCORE (highest score at top)
  const safeCompetitors = Array.isArray(competitors) ? [...competitors] : [];
  const sortedCompetitors = safeCompetitors.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  const safeMatches = Array.isArray(matches) ? matches : [];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 box-border space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header matching Leaderboard view */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <Activity size={28} className="text-[#38bdf8] shrink-0 sm:w-8 sm:h-8" />
        <h1 className="font-pixel text-xl sm:text-3xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a] text-center">
          LIVE MATCHES & STATS
        </h1>
      </div>

      {/* Unified Retro Double-Border Cardboard Panel with zero edge overflow */}
      <div className="pixel-box-cream p-3 sm:p-6 rounded-xs space-y-4 sm:space-y-6 box-border w-full overflow-hidden">
        
        {/* Header Banner matching Leaderboard */}
        <div className="text-center pb-2.5 sm:pb-3 border-b-2 border-[#d4a86a]">
          <h2 className="font-pixel text-base sm:text-xl text-[#5c3509] tracking-wider uppercase">
            LIVE MATCHES & STATS
          </h2>
          <div className="font-pixel text-[10px] sm:text-xs text-[#12579b] mt-1 tracking-widest">
            WEEK 1 • LIVE ESPN FEED
          </div>
        </div>

        {/* 1. Live Games Section: 3-Letter Team Abbreviations ONLY */}
        <div className="w-full box-border">
          <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-[#b91c1c] rounded-full animate-ping" />
              <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
                ACTIVE GAMES
              </h3>
            </div>
            <span className="font-retro text-[10px] sm:text-[11px] text-[#784610] bg-[#fae9c8] px-2 sm:px-2.5 py-0.5 border border-[#d4a86a] rounded-xs font-semibold">
              ESPN SYNC ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full box-border">
            {safeMatches.map((match) => {
              const homeCode = match.homeTeamCode || getTeamAbbr(match.homeTeam);
              const awayCode = match.awayTeamCode || getTeamAbbr(match.awayTeam);

              return (
                <div
                  key={match.id}
                  className="w-full box-border bg-[#ebd2a4] border-3 border-[#c99a57] p-3 sm:p-4 rounded-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-between"
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between font-retro text-xs text-[#784610] mb-2">
                    <span className="flex items-center gap-1.5 font-pixel text-[10px] text-[#b91c1c] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#b91c1c] inline-block animate-pulse" />
                      {match.status.toUpperCase()}
                    </span>
                    <span className="font-pixel text-[10px] bg-[#fae9c8] px-2 py-0.5 border border-[#d4a86a] text-[#5c3509]">
                      {match.periodLabel}
                    </span>
                  </div>

                  {/* 3-Letter Team Abbreviations with Centered Score Badge ("KC 21 - 17 BUF") */}
                  <div className="flex items-center justify-between gap-2 py-2 px-1 w-full box-border">
                    {/* Home Team 3-letter Abbr */}
                    <div className="w-14 sm:w-16 text-center shrink-0">
                      <span className="font-pixel text-base sm:text-lg text-[#5c3509] tracking-wider font-bold">
                        {homeCode}
                      </span>
                    </div>

                    {/* Centered Score Badge with Ample Padding */}
                    <div className="flex-1 flex justify-center items-center px-1">
                      <div className="px-3 sm:px-4 py-1.5 bg-[#fae9c8] border-2 border-[#12579b] shadow-[0_2px_0_0_#0a2d52] rounded-xs font-pixel text-xs sm:text-sm text-[#12579b] tracking-widest font-bold whitespace-nowrap">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    </div>

                    {/* Away Team 3-letter Abbr */}
                    <div className="w-14 sm:w-16 text-center shrink-0">
                      <span className="font-pixel text-base sm:text-lg text-[#5c3509] tracking-wider font-bold">
                        {awayCode}
                      </span>
                    </div>
                  </div>

                  {/* Live Play Event */}
                  {match.recentEvent && (
                    <div className="mt-2.5 text-xs font-retro text-[#78350f] bg-[#fae9c8] p-2 border border-[#d4a86a] rounded-xs flex items-center gap-2">
                      <Flame size={14} className="text-[#d97706] shrink-0" />
                      <span className="leading-tight text-[11px] sm:text-xs truncate">{match.recentEvent}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Player Standings: Radically Minimal (ONLY 3 COLUMNS, NO SPREADSHEET BLOAT) */}
        <div className="w-full box-border">
          <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-t-2 border-[#d4a86a] pt-3 sm:pt-4">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-[#b45309] sm:w-[18px] sm:h-[18px]" />
              <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
                PLAYER STANDINGS
              </h3>
            </div>
            <span className="font-retro text-[10px] sm:text-[11px] text-[#784610] bg-[#fae9c8] px-2 sm:px-2.5 py-0.5 border border-[#d4a86a] rounded-xs">
              SORTED BY SCORE
            </span>
          </div>

          {/* Clean 2-Column Table: Zero horizontal scrollbar on mobile or desktop */}
          <div className="w-full box-border border-3 border-[#c99a57] rounded-xs overflow-hidden bg-[#ebd2a4]">
            <table className="w-full text-left font-retro text-xs sm:text-sm border-collapse">
              <thead className="bg-[#dfbe89] font-pixel text-[10px] sm:text-xs text-[#5c3509] border-b-2 border-[#c99a57]">
                <tr>
                  <th className="py-2.5 px-2.5 sm:px-3 text-left">PLAYER</th>
                  <th className="py-2.5 px-2.5 sm:px-3 text-right">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4a86a]">
                {sortedCompetitors.map((player, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  const teamAbbr = player.teamCode || getTeamAbbr(player.teamName);

                  return (
                    <tr
                      key={player.id}
                      onClick={() => onSelectPlayer && onSelectPlayer(player)}
                      className={`hover:bg-[#fae9c8] cursor-pointer transition-colors ${
                        player.displayName === 'Jeerice Henry' ? 'bg-[#fae5b8]' : ''
                      }`}
                    >
                      {/* Column 1: PLAYER (Rank badge + 8-bit sprite + Player Name & Team Abbr) */}
                      <td className="py-2 sm:py-2.5 px-2.5 sm:px-3">
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          {/* Rank Badge */}
                          <span
                            className={`shrink-0 font-pixel text-[10px] sm:text-xs px-1.5 py-0.5 rounded-xs border text-center min-w-[26px] ${
                              rank === 1
                                ? 'bg-[#fbbf24] text-[#78350f] border-[#b45309] font-bold shadow-xs'
                                : rank === 2
                                ? 'bg-[#e2e8f0] text-[#334155] border-[#94a3b8] font-bold'
                                : rank === 3
                                ? 'bg-[#fed7aa] text-[#7c2d12] border-[#ea580c] font-bold'
                                : 'text-[#784610] border-transparent font-pixel'
                            }`}
                          >
                            #{rank}
                          </span>

                          {/* Pixel Avatar Sprite */}
                          <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center bg-[#fae9c8] border border-[#c99a57] rounded-xs overflow-hidden">
                            <PixelPlayerSprite
                              avatar={player.avatar}
                              number={player.uniformNumber}
                              size={24}
                            />
                          </div>

                          {/* Player Name + Team Abbreviation directly under/next to the name */}
                          <div className="min-w-0 flex-1">
                            <span className="font-pixel text-[11px] sm:text-xs text-[#5c3509] block leading-tight truncate">
                              {player.displayName}
                            </span>
                            <span className="text-[10px] text-[#784610] font-retro block leading-tight truncate mt-0.5">
                              {teamAbbr} • #{player.uniformNumber} {player.positionGeneric ? `• ${player.positionGeneric}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: SCORE (Bold retro score badge right-aligned, e.g. "16,800 PTS") */}
                      <td className="py-2 sm:py-2.5 px-2.5 sm:px-3 text-right shrink-0">
                        <span
                          className={`inline-block font-pixel text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 border-2 rounded-xs shadow-xs whitespace-nowrap ${
                            isTopThree
                              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] font-bold'
                              : 'bg-[#fae9c8] text-[#12579b] border-[#c99a57] font-bold'
                          }`}
                        >
                          {(player.score ?? 0).toLocaleString()} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 3. Demoted Developer Testing (Collapsed at very bottom) */}
      {onSimulatePlay && (
        <div className="pt-2 w-full box-border">
          <div className="border border-[#334155] rounded-xs bg-[#0f172a]/70 p-3 box-border">
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className="touch-manipulation w-full flex items-center justify-between text-left font-retro text-xs text-[#94a3b8] hover:text-[#fae5b8] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Wrench size={14} />
                <span>Developer Testing & Play Simulator (Optional)</span>
              </span>
              {showDevTools ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDevTools && (
              <div className="mt-3 pt-3 border-t border-[#1e293b] animate-in fade-in duration-100">
                <p className="text-[11px] font-retro text-[#94a3b8] mb-2.5">
                  Simulate live scoring events for testing points sync:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sortedCompetitors.slice(0, 5).map((player) => (
                    <button
                      key={player.id}
                      onClick={() => onSimulatePlay(player, 'Touchdown', 6)}
                      className="touch-manipulation px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#fae5b8] font-pixel text-[10px] border border-[#475569] rounded-xs transition-all active:translate-y-0.5 cursor-pointer"
                    >
                      +6 TD: {player.shortName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

// Export alias for consistency
export const LiveMatchesView = LiveScoresView;
