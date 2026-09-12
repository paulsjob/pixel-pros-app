import React, { useState } from 'react';
import {
  INITIAL_COMPETITORS,
  INITIAL_USER,
  INITIAL_LEADERBOARD_FRIENDS,
  INITIAL_LEADERBOARD_GLOBAL,
  INITIAL_SPORTS,
} from './data/mockData';
import { Competitor, UserProfile, AvatarConfig, SportId } from './types';
import { MyTeamView } from './components/MyTeamView';
import { LeaderboardView } from './components/LeaderboardView';
import { PlayerCardModal } from './components/PlayerCardModal';
import { LockerRoomModal } from './components/LockerRoomModal';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { RulesScoringTester } from './components/RulesScoringTester';
import { StatsMatchesModal } from './components/StatsMatchesModal';
import { PixelCoin, PixelHelmetIcon } from './components/PixelBadges';
import { Users, Trophy, Database, BookOpen, Shirt } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'team' | 'leaderboard' | 'database' | 'rules'>('team');
  const [activeSport, setActiveSport] = useState<SportId>('nfl');
  
  // App state
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [roster, setRoster] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [friendsList, setFriendsList] = useState(INITIAL_LEADERBOARD_FRIENDS);
  const [globalList] = useState(INITIAL_LEADERBOARD_GLOBAL);

  // Modals state
  const [detailedPlayer, setDetailedPlayer] = useState<Competitor | null>(null);
  const [isLockerRoomOpen, setIsLockerRoomOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // 3 selected players for the active lineup
  const selectedPlayers = user.selectedPlayerIds
    .map(id => roster.find(p => p.id === id))
    .filter(Boolean) as Competitor[];

  // Toggle player into 3-player lineup
  const handleTogglePlayer = (player: Competitor) => {
    const isSelected = user.selectedPlayerIds.includes(player.id);
    if (isSelected) {
      setUser(prev => ({
        ...prev,
        selectedPlayerIds: prev.selectedPlayerIds.filter(id => id !== player.id),
      }));
      showToast(`Removed ${player.shortName} from your 3-player lineup.`);
    } else {
      if (user.selectedPlayerIds.length >= 3) {
        showToast(`Lineup is full! Max 3 players allowed for this week.`);
        return;
      }
      setUser(prev => ({
        ...prev,
        selectedPlayerIds: [...prev.selectedPlayerIds, player.id],
      }));
      showToast(`Added ${player.shortName} to your 3-player lineup! ⭐`);
    }
  };

  // Open detail for slot selection
  const handleSelectSlot = (index: number) => {
    // Find first available player not in team
    const available = roster.find(p => !user.selectedPlayerIds.includes(p.id));
    if (available) {
      handleTogglePlayer(available);
    }
  };

  // Locker room avatar save
  const handleSaveAvatar = (newAvatar: AvatarConfig, newCoins: number) => {
    setUser(prev => ({
      ...prev,
      avatar: newAvatar,
      coins: newCoins,
    }));
    // Also update Jeerice Henry (mock player #88) if user customized him
    setRoster(prev =>
      prev.map(p => {
        if (p.displayName === 'Jeerice Henry') {
          return {
            ...p,
            avatar: newAvatar,
            uniformNumber: newAvatar.number,
          };
        }
        return p;
      })
    );
    showToast('New gear equipped in Locker Room!');
  };

  // Scoring whole-number points from live plays or rule tester
  const handleScorePoints = (points: number, eventName: string) => {
    setUser(prev => ({
      ...prev,
      totalScore: prev.totalScore + points,
      coins: prev.coins + points * 10,
    }));

    // Update friend rank score for "YOU"
    setFriendsList(prev =>
      prev.map(item =>
        item.isYou ? { ...item, score: item.score + points } : item
      )
    );

    showToast(`+${points} WHOLE POINTS! (${eventName}) 🎉`);
  };

  const handleSimulatePlay = (player: Competitor, eventName: string, points: number) => {
    // Increment player stats
    setRoster(prev =>
      prev.map(p => {
        if (p.id === player.id) {
          return {
            ...p,
            stats: {
              ...p.stats,
              touchdowns: p.stats.touchdowns + 1,
              passingYards: p.stats.passingYards + 40,
            },
            score: p.score + points * 50,
          };
        }
        return p;
      })
    );
    handleScorePoints(points, `${player.shortName} ${eventName}`);
  };

  return (
    <div className="min-h-screen bg-[#0b1021] text-[#fae5b8] flex flex-col selection:bg-[#12579b] selection:text-white">
      
      {/* Universal 8-bit Top Bar */}
      <header className="sticky top-0 z-40 bg-[#080d1a] border-b-3 border-[#1a264a] px-3 sm:px-6 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('team')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <PixelHelmetIcon size={30} color={user.avatar.helmetColor} />
            <span className="font-pixel text-base sm:text-lg text-[#fae5b8] tracking-widest group-hover:text-[#ffffff] transition-colors">
              PIXEL PROS
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {[
              { id: 'team', label: 'MY TEAM', icon: Users },
              { id: 'leaderboard', label: 'LEADERBOARD', icon: Trophy },
              { id: 'rules', label: 'RULES', icon: BookOpen },
              { id: 'database', label: 'SUPABASE / SQL', icon: Database },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 font-pixel text-[10px] sm:text-xs border-2 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30]'
                      : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552] hover:bg-[#232e4b] hover:text-[#fae5b8]'
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden xs:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Status Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-[#1a2238] border border-[#273552] rounded-xs font-pixel text-[10px] text-[#fae5b8]">
              <span className="text-[#38bdf8]">SCORE:</span> {user.totalScore.toLocaleString()}
            </div>
            
            <button
              onClick={() => setIsLockerRoomOpen(true)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-[#d97706] hover:bg-[#b45309] text-white border-2 border-[#78350f] font-pixel text-[10px] cursor-pointer shadow-[0_2px_0_0_#451a03] active:translate-y-0.5 active:shadow-none"
              title="Open Locker Room"
            >
              <Shirt size={13} />
              <span className="hidden sm:inline">GEAR</span>
            </button>
          </div>

        </div>
      </header>

      {/* Retro Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-200">
          <div className="bg-[#15803d] text-white px-4 py-2 border-3 border-[#052e16] font-retro text-xs sm:text-sm shadow-[0_4px_0_0_#022c11] flex items-center gap-2">
            <span>⚡</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container with Retro Football Field Texture */}
      <main className="flex-1 football-field py-8 px-4 sm:px-6 relative">
        
        {/* Yard Lines Overlay on Football Field (Image 2 & 3 atmosphere) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-between items-center opacity-20 px-8 text-white font-pixel text-4xl select-none">
          <span>10</span>
          <span>20</span>
          <span>30</span>
          <span>40</span>
          <span>50</span>
          <span>40</span>
          <span>30</span>
          <span>20</span>
          <span>10</span>
        </div>

        {/* Content Views */}
        <div className="relative z-10">
          {activeTab === 'team' && (
            <MyTeamView
              roster={roster}
              user={user}
              selectedPlayers={selectedPlayers}
              onSelectSlot={handleSelectSlot}
              onOpenPlayerDetail={(player) => setDetailedPlayer(player)}
              onOpenLockerRoom={() => setIsLockerRoomOpen(true)}
              onOpenStatsModal={() => setIsStatsOpen(true)}
              onTogglePlayer={handleTogglePlayer}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              user={user}
              friendsList={friendsList}
              globalList={globalList}
              onOpenPlayerDetail={(name) => {
                const p = roster.find(r => r.displayName === name || r.shortName === name);
                if (p) setDetailedPlayer(p);
              }}
            />
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <RulesScoringTester onScorePoints={handleScorePoints} />
            </div>
          )}

          {activeTab === 'database' && (
            <DatabaseSchemaView />
          )}
        </div>

      </main>

      {/* Footer Info */}
      <footer className="bg-[#080d1a] border-t-3 border-[#1a264a] py-4 px-6 text-center text-xs font-retro text-[#fae5b8]/70">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>PIXEL PROS</strong> • Family-Friendly 8-Bit Fantasy Sports • Universal Data Layer
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Supabase: sqntjgjqtwbcqpxcqzbg</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('database')}
              className="hover:underline text-[#38bdf8] cursor-pointer"
            >
              View PostgreSQL Schema
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {detailedPlayer && (
        <PlayerCardModal
          player={detailedPlayer}
          onClose={() => setDetailedPlayer(null)}
          onSelectForTeam={handleTogglePlayer}
          isSelectedForTeam={user.selectedPlayerIds.includes(detailedPlayer.id)}
        />
      )}

      {isLockerRoomOpen && (
        <LockerRoomModal
          currentAvatar={user.avatar}
          userCoins={user.coins}
          onSaveAvatar={handleSaveAvatar}
          onClose={() => setIsLockerRoomOpen(false)}
        />
      )}

      {isStatsOpen && (
        <StatsMatchesModal
          roster={roster}
          onClose={() => setIsStatsOpen(false)}
          onSimulatePlay={handleSimulatePlay}
        />
      )}

    </div>
  );
}
