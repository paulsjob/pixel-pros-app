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

export const LiveScoresView: React.FC<LiveScoresViewProps> = ({
  matches,
  competitors,
  onSelectPlayer,
  onSimulatePlay,
}) => {
  const [showDevTools, setShowDevTools] = useState(false);

  // Automatically sort competitors descending by SCORE (highest score at top)
  const sortedCompetitors = [...competitors].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      
      {/* Page Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Activity size={28} className="text-[#38bdf8]" />
          <h1 className="font-pixel text-xl sm:text-3xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a]">
            LIVE SCORES & STATS
          </h1>
        </div>
        <p className="font-retro text-xs sm:text-sm text-[#fae5b8]/80 max-w-md mx-auto">
          Real-time ESPN match feeds and live player point standings
        </p>
      </div>

      {/* 1. Live Games Section (Wide, generous spacing, no truncated team names) */}
      <section className="pixel-box-cream p-4 sm:p-6 rounded-xs">
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#b91c1c] rounded-full animate-ping" />
            <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase">
              LIVE ESPN GAME FEED
            </h2>
          </div>
          <span className="font-retro text-[11px] text-[#784610] bg-[#fae9c8] px-2.5 py-1 border border-[#d4a86a] rounded-xs font-semibold">
            SYNCED LIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-[#ebd2a4] border-3 border-[#c99a57] p-4 rounded-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] flex flex-col justify-between"
            >
              {/* Status Header */}
              <div className="flex items-center justify-between font-retro text-xs text-[#784610] mb-2.5">
                <span className="flex items-center gap-1.5 font-pixel text-[10px] text-[#b91c1c] font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#b91c1c] inline-block animate-pulse" />
                  {match.status.toUpperCase()}
                </span>
                <span className="font-pixel text-[10px] bg-[#fae9c8] px-2 py-0.5 border border-[#d4a86a] text-[#5c3509]">
                  {match.periodLabel}
                </span>
              </div>

              {/* Full Team Names & Score Row (Never truncated) */}
              <div className="flex items-center justify-between gap-3 py-2 px-1">
                {/* Home Team */}
                <div className="flex-1 text-left">
                  <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wide block leading-snug">
                    {match.homeTeam}
                  </span>
                </div>

                {/* Score Pill in Center */}
                <div className="shrink-0 px-3.5 py-1.5 bg-[#fae9c8] border-2 border-[#12579b] shadow-[0_2px_0_0_#0a2d52] rounded-xs font-pixel text-sm sm:text-base text-[#12579b] tracking-wider font-bold">
                  {match.homeScore} - {match.awayScore}
                </div>

                {/* Away Team */}
                <div className="flex-1 text-right">
                  <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wide block leading-snug">
                    {match.awayTeam}
                  </span>
                </div>
              </div>

              {/* Live Play Event */}
              {match.recentEvent && (
                <div className="mt-3 text-xs font-retro text-[#78350f] bg-[#fae9c8] p-2 border border-[#d4a86a] rounded-xs flex items-center gap-2">
                  <Flame size={14} className="text-[#d97706] shrink-0" />
                  <span className="leading-tight">{match.recentEvent}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 2. Player Stats Leaderboard Table (Sorted Descending by SCORE) */}
      <section className="pixel-box-cream p-4 sm:p-6 rounded-xs">
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#b45309]" />
            <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase">
              TOP PLAYERS (SORTED BY SCORE)
            </h2>
          </div>
          <span className="font-retro text-[11px] text-[#784610] bg-[#fae9c8] px-2.5 py-1 border border-[#d4a86a] rounded-xs">
            HIGHEST FIRST
          </span>
        </div>

        {/* Responsive Table Container */}
        <div className="border-3 border-[#c99a57] rounded-xs overflow-hidden bg-[#ebd2a4]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-retro text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-[#dfbe89] font-pixel text-[10px] sm:text-xs text-[#5c3509] border-b-2 border-[#c99a57]">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">RANK</th>
                  <th className="py-2.5 px-3">PLAYER</th>
                  <th className="py-2.5 px-3 text-center">SPORT / TEAM</th>
                  <th className="py-2.5 px-3 text-center">PASS YDS</th>
                  <th className="py-2.5 px-3 text-center">RUSH YDS</th>
                  <th className="py-2.5 px-3 text-center">TDs / GOALS</th>
                  <th className="py-2.5 px-4 text-right">TOTAL SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4a86a]">
                {sortedCompetitors.map((player, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;

                  return (
                    <tr
                      key={player.id}
                      onClick={() => onSelectPlayer && onSelectPlayer(player)}
                      className={`hover:bg-[#fae9c8] cursor-pointer transition-colors ${
                        player.displayName === 'Jeerice Henry' ? 'bg-[#fae5b8]' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-pixel text-xs px-2 py-0.5 rounded-xs border ${
                            rank === 1
                              ? 'bg-[#fbbf24] text-[#78350f] border-[#b45309] font-bold shadow-xs'
                              : rank === 2
                              ? 'bg-[#e2e8f0] text-[#334155] border-[#94a3b8] font-bold'
                              : rank === 3
                              ? 'bg-[#fed7aa] text-[#7c2d12] border-[#ea580c] font-bold'
                              : 'text-[#784610] border-transparent'
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>

                      {/* Player Info with Sprite */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#fae9c8] border border-[#c99a57] rounded-xs overflow-hidden">
                            <PixelPlayerSprite
                              avatar={player.avatar}
                              number={player.uniformNumber}
                              size={28}
                            />
                          </div>
                          <div>
                            <span className="font-pixel text-xs text-[#5c3509] block">
                              {player.displayName}
                            </span>
                            <span className="text-[10px] text-[#784610] font-retro">
                              #{player.uniformNumber} • {player.positionGeneric}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sport & Team */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs font-pixel text-[9px] text-[#784610]">
                          {player.teamName} ({player.teamCode})
                        </span>
                      </td>

                      {/* Pass Yards */}
                      <td className="py-3 px-3 text-center font-pixel text-xs text-[#5c3509]">
                        {player.stats.passingYards > 0
                          ? player.stats.passingYards.toLocaleString()
                          : '—'}
                      </td>

                      {/* Rush Yards */}
                      <td className="py-3 px-3 text-center font-pixel text-xs text-[#5c3509]">
                        {player.stats.rushingYards > 0
                          ? player.stats.rushingYards.toLocaleString()
                          : '—'}
                      </td>

                      {/* Touchdowns or Primary Metric */}
                      <td className="py-3 px-3 text-center font-pixel text-xs text-[#b45309] font-bold">
                        {player.stats.touchdowns > 0
                          ? `${player.stats.touchdowns} TD`
                          : `${player.stats.primaryMetricValue} ${player.stats.primaryMetricLabel}`}
                      </td>

                      {/* Total Score Badge */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block font-pixel text-xs sm:text-sm px-2.5 py-1 border-2 rounded-xs shadow-xs ${
                            isTopThree
                              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                              : 'bg-[#fae9c8] text-[#5c3509] border-[#c99a57]'
                          }`}
                        >
                          {player.score.toLocaleString()} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Demoted Developer Testing (Collapsed at very bottom so it doesn't distract family users) */}
      {onSimulatePlay && (
        <section className="pt-2">
          <div className="border border-[#334155] rounded-xs bg-[#0f172a]/70 p-3">
            <button
              onClick={() => setShowDevTools(!showDevTools)}
              className="touch-manipulation w-full flex items-center justify-between text-left font-retro text-xs text-[#94a3b8] hover:text-[#fae5b8] transition-colors"
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
        </section>
      )}

    </div>
  );
};
