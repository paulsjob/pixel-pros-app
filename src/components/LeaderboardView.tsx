import React, { useState } from 'react';
import { Competitor, UserProfile, UserRoster } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmetIcon, PixelShieldIcon } from './PixelBadges';
import { RoomSetupBar } from './RoomSetupBar';
import { Users, Sparkles } from 'lucide-react';
import { formatPlayerInitialLastName, formatTeamPosSubtitle } from '../utils/formatters';

interface LeaderboardViewProps {
  user: UserProfile;
  nflCompetitors?: Competitor[];
  roomRosters?: UserRoster[];
  roomCode: string;
  userName: string;
  onRoomCodeChange: (code: string) => void;
  onUserNameChange: (name: string) => void;
  onOpenPlayerDetail?: (player: Competitor) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  user,
  nflCompetitors = [],
  roomRosters = [],
  roomCode,
  userName,
  onRoomCodeChange,
  onUserNameChange,
  onOpenPlayerDetail,
}) => {
  // Two bold retro toggle buttons: [ FAMILY ] (default) and [ TOP SCORES ]
  const [activeTier, setActiveTier] = useState<'family' | 'top_scores'>('family');

  const safeNflPlayers = Array.isArray(nflCompetitors) ? nflCompetitors : [];
  const safeRoomRosters = Array.isArray(roomRosters) ? roomRosters : [];

  // Top 20 NFL Competitors ordered by score DESC
  const top20Players = safeNflPlayers
    .slice()
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 20);

  // Fallback couch players if room has only the current player
  const defaultCouchLineups: UserRoster[] = [
    {
      room_code: roomCode.toUpperCase(),
      user_name: 'DAD',
      star_1_id: safeNflPlayers[1]?.id || 'mahomes',
      star_2_id: safeNflPlayers[4]?.id || 'henry',
      star_3_id: safeNflPlayers[7]?.id || 'brown',
      updated_at: new Date().toISOString(),
    },
    {
      room_code: roomCode.toUpperCase(),
      user_name: 'MOM',
      star_1_id: safeNflPlayers[0]?.id || 'allen',
      star_2_id: safeNflPlayers[3]?.id || 'lamb',
      star_3_id: safeNflPlayers[8]?.id || 'jefferson',
      updated_at: new Date().toISOString(),
    },
    {
      room_code: roomCode.toUpperCase(),
      user_name: 'LEO',
      star_1_id: safeNflPlayers[2]?.id || 'jackson',
      star_2_id: safeNflPlayers[5]?.id || 'barkley',
      star_3_id: safeNflPlayers[6]?.id || 'stbrown',
      updated_at: new Date().toISOString(),
    },
  ];

  // Current user roster entry
  const currentUserRoster: UserRoster = {
    room_code: roomCode.toUpperCase(),
    user_name: userName.trim().toUpperCase() || 'YOU',
    star_1_id: user.selectedPlayerIds?.[0] || '',
    star_2_id: user.selectedPlayerIds?.[1] || '',
    star_3_id: user.selectedPlayerIds?.[2] || '',
    updated_at: new Date().toISOString(),
  };

  // Merge live user_rosters from Supabase / localStorage with current user and couch companions
  const rosterMap = new Map<string, UserRoster>();
  
  // First add default companions if room is standard COUCH
  if (roomCode.toUpperCase() === 'COUCH') {
    defaultCouchLineups.forEach((r) => rosterMap.set(r.user_name.toUpperCase(), r));
  }

  // Then add synced room rosters from Supabase
  safeRoomRosters.forEach((r) => {
    rosterMap.set(r.user_name.toUpperCase(), r);
  });

  // Always enforce current user's latest picks
  rosterMap.set(currentUserRoster.user_name.toUpperCase(), currentUserRoster);

  const familyListWithDynamicTotals = Array.from(rosterMap.values()).map((entry) => {
    const isUser = entry.user_name.toUpperCase() === currentUserRoster.user_name.toUpperCase() ||
      entry.user_name.toUpperCase() === 'YOU' ||
      entry.user_name.toUpperCase() === userName.toUpperCase();

    const star1 = safeNflPlayers.find((p) => p.id === entry.star_1_id);
    const star2 = safeNflPlayers.find((p) => p.id === entry.star_2_id);
    const star3 = safeNflPlayers.find((p) => p.id === entry.star_3_id);
    const starPlayers = [star1, star2, star3].filter(Boolean) as Competitor[];

    // Calculate each family member's total score dynamically: Total = (Star 1 pts) + (Star 2 pts) + (Star 3 pts)
    const sumPoints = starPlayers.reduce((sum, p) => sum + (p.score || 0), 0);

    return {
      userName: entry.user_name,
      isYou: isUser,
      starPlayers,
      totalScore: sumPoints,
      stars: [star1, star2, star3],
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  // Helper for rank medal styling
  const getRankBadge = (rankNumber: number) => {
    if (rankNumber === 1) {
      return 'bg-[#f59e0b] text-[#78350f] border-[#b45309]';
    }
    if (rankNumber === 2) {
      return 'bg-[#94a3b8] text-[#0f172a] border-[#64748b]';
    }
    if (rankNumber === 3) {
      return 'bg-[#b45309] text-[#fae5b8] border-[#78350f]';
    }
    return 'bg-[#1e293b] text-[#94a3b8] border-[#334155]';
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-5 box-border px-0 overflow-hidden">
      
      {/* Shared Room Bar */}
      <RoomSetupBar
        userName={userName}
        roomCode={roomCode}
        onUserNameChange={onUserNameChange}
        onRoomCodeChange={onRoomCodeChange}
        memberCount={familyListWithDynamicTotals.length}
      />

      {/* Top Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
          <PixelShieldIcon size={30} color="#155e9e" />
          <h1 className="font-pixel text-lg sm:text-2xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a]">
            LEADERBOARD
          </h1>
        </div>
        <p className="font-retro text-xs sm:text-sm text-[#93c5fd]">
          ROOM &quot;{roomCode.toUpperCase()}&quot; &amp; NFL STANDINGS
        </p>
      </div>

      {/* 2-Tier Retro Toggle Buttons: [ FAMILY ] and [ TOP SCORES ] */}
      <div className="flex justify-center w-full max-w-md mx-auto gap-3 sm:gap-4 px-2">
        <button
          onClick={() => setActiveTier('family')}
          className={`touch-manipulation flex-1 py-2.5 sm:py-3 px-3 sm:px-5 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2 ${
            activeTier === 'family'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          <Users size={16} />
          <span>FAMILY</span>
        </button>

        <button
          onClick={() => setActiveTier('top_scores')}
          className={`touch-manipulation flex-1 py-2.5 sm:py-3 px-3 sm:px-5 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2 ${
            activeTier === 'top_scores'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          <Sparkles size={16} />
          <span>TOP SCORES</span>
        </button>
      </div>

      {/* Main Container: Strict 2 Columns with Zero Horizontal Scrolling */}
      <div className="pixel-box-cream p-3 sm:p-5 rounded-xs w-full max-w-full overflow-hidden box-border">
        
        {/* Tier Subheader Banner */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-3 border-b-2 border-[#d4a86a]">
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
              {activeTier === 'family' ? `ROOM "${roomCode.toUpperCase()}" 3-STAR STANDINGS` : 'TOP NFL ATHLETES (LIMIT 20)'}
            </h2>
            <span className="font-retro text-[10px] sm:text-[11px] text-[#784610]">
              {activeTier === 'family'
                ? 'Dynamic sum: (Star 1 pts) + (Star 2 pts) + (Star 3 pts)'
                : 'Top 20 active NFL athletes ordered by score DESC'}
            </span>
          </div>

          <span className="font-pixel text-[10px] sm:text-[11px] text-[#12579b] bg-[#fae9c8] px-2 py-0.5 border border-[#d4a86a] rounded-xs shrink-0 whitespace-nowrap">
            {activeTier === 'family' ? `${familyListWithDynamicTotals.length} TEAMS` : `${top20Players.length} STARS`}
          </span>
        </div>

        {/* 2-Column Table Column Headers */}
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 mb-2 bg-[#d4a86a]/30 border border-[#d4a86a] rounded-xs font-pixel text-[10px] text-[#784610]">
          <span className="tracking-wider">RANK &amp; {activeTier === 'family' ? 'HOUSEHOLD MEMBER' : 'PLAYER'}</span>
          <span className="tracking-wider text-right">TOTAL POINTS</span>
        </div>

        {/* List Content */}
        <div className="space-y-2 w-full">
          {activeTier === 'family' ? (
            /* TIER 1: FAMILY RANKING (Dynamic sum of chosen 3 Stars) */
            familyListWithDynamicTotals.map((entry, index) => {
              const displayRank = index + 1;
              const isUser = entry.isYou;

              return (
                <div
                  key={entry.userName || index}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 border-2 rounded-xs transition-all box-border ${
                    isUser
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_3px_0_0_#051a30]'
                      : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
                  }`}
                >
                  {/* Column 1: Rank Badge + Helmet Icon + Name + 3 Mini Star Badges */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                    {/* Rank Badge */}
                    <span
                      className={`font-pixel text-[10px] sm:text-xs px-2 py-0.5 border rounded-xs shrink-0 font-bold ${getRankBadge(
                        displayRank
                      )}`}
                    >
                      #{displayRank}
                    </span>

                    {/* Pixel Helmet Icon */}
                    <div className="shrink-0">
                      <PixelHelmetIcon
                        size={22}
                        color={isUser ? '#38bdf8' : '#155e9e'}
                      />
                    </div>

                    {/* Name + 3 Mini Star Badges */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-pixel text-xs sm:text-sm tracking-wide truncate font-bold">
                          {entry.userName}
                        </span>
                        {isUser && (
                          <span className="font-pixel text-[9px] px-1.5 py-0.2 bg-[#fde047] text-[#78350f] border border-[#b45309] rounded-2xs shrink-0 font-bold">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* 3 Mini Star Badges */}
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {[0, 1, 2].map((sIdx) => {
                          const star = entry.stars[sIdx];
                          if (!star) {
                            return (
                              <span
                                key={sIdx}
                                className={`font-pixel text-[8px] px-1.5 py-0.5 rounded-2xs border ${
                                  isUser
                                    ? 'bg-[#0f3d6b] text-[#93c5fd] border-[#38bdf8]/30'
                                    : 'bg-[#fae5b8] text-[#784610] border-[#d4a86a]'
                                }`}
                              >
                                ★ EMPTY
                              </span>
                            );
                          }

                          return (
                            <span
                              key={sIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenPlayerDetail && onOpenPlayerDetail(star);
                              }}
                              className={`font-pixel text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-2xs border cursor-pointer hover:underline transition-all whitespace-nowrap ${
                                isUser
                                  ? 'bg-[#0a2d52] text-[#fae5b8] border-[#38bdf8]/50 hover:bg-[#0c3764]'
                                  : 'bg-[#fae5b8] text-[#5c3509] border-[#c99a57] hover:bg-[#fff7ed]'
                              }`}
                              title={`${star.displayName} (${star.teamCode})`}
                            >
                              ★ {formatPlayerInitialLastName(star.displayName)} ({star.score ? `${star.score}p` : '0p'})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Total Points Right-Aligned (shrink-0 and whitespace-nowrap) */}
                  <div className="shrink-0 whitespace-nowrap ml-2">
                    <div
                      className={`px-2.5 py-1 font-pixel text-xs sm:text-sm font-bold border rounded-xs shadow-xs text-right whitespace-nowrap ${
                        isUser
                          ? 'bg-[#38bdf8] text-[#080d1a] border-[#0284c7]'
                          : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                      }`}
                    >
                      {entry.totalScore ? `${entry.totalScore.toLocaleString()} PTS` : '0 PTS'}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            /* TIER 2: TOP SCORES (Top 20 Real NFL Athletes from competitors table) */
            top20Players.map((player, index) => {
              const displayRank = index + 1;
              const formattedName = formatPlayerInitialLastName(player.displayName);
              const teamPosSubtitle = formatTeamPosSubtitle(player.teamCode, player.position || player.positionGeneric);

              return (
                <div
                  key={player.id || index}
                  onClick={() => onOpenPlayerDetail && onOpenPlayerDetail(player)}
                  className="w-full flex items-center justify-between p-2 sm:p-2.5 bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-2 border-[#c99a57] rounded-xs cursor-pointer transition-all active:translate-y-0.5 box-border"
                >
                  {/* Column 1: Rank Badge + Sprite + P. Mahomes + [TEAM] · [POS] */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                    {/* Rank Badge */}
                    <span
                      className={`font-pixel text-[10px] sm:text-xs px-2 py-0.5 border rounded-xs shrink-0 font-bold ${getRankBadge(
                        displayRank
                      )}`}
                    >
                      #{displayRank}
                    </span>

                    {/* Mini Player Sprite */}
                    <div className="shrink-0">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="sm"
                        withShadow={false}
                      />
                    </div>

                    {/* Player Name formatted as "First Initial. Last Name" (e.g. "P. Mahomes") */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-pixel text-xs sm:text-sm tracking-wide truncate">
                          {formattedName}
                        </span>
                        {/* 3-Letter Team Abbreviation Badge */}
                        <span className="px-1.5 py-0.5 bg-[#fae5b8] text-[#12579b] border border-[#c99a57] font-pixel text-[9px] font-bold rounded-2xs shrink-0">
                          {player.teamCode}
                        </span>
                      </div>
                      {/* Subtitle: "[TEAM] · [POS]" */}
                      <div className="font-retro text-[10px] text-[#784610] mt-0.5">
                        {teamPosSubtitle} • #{player.uniformNumber}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Total Points Right-Aligned (shrink-0 and whitespace-nowrap) */}
                  <div className="shrink-0 whitespace-nowrap ml-2">
                    <div className="px-2.5 py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm font-bold border border-[#0a2d52] rounded-xs shadow-xs text-right whitespace-nowrap">
                      {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2.5 border-t border-[#d4a86a] text-center text-[10px] font-retro text-[#784610]">
          {activeTier === 'family' ? (
            <span>⚡ Room scores update in real-time as your 3 stars make plays on the field</span>
          ) : (
            <span>⚡ Real NFL players hydrated from Supabase competitors table</span>
          )}
        </div>

      </div>
    </div>
  );
};
