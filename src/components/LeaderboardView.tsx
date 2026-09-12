import React, { useState } from 'react';
import { LeaderboardEntry, UserProfile } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmetIcon, PixelShieldIcon } from './PixelBadges';

interface LeaderboardViewProps {
  user: UserProfile;
  friendsList: LeaderboardEntry[];
  globalList: LeaderboardEntry[];
  onOpenPlayerDetail?: (username: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  user,
  friendsList = [],
  globalList = [],
  onOpenPlayerDetail,
}) => {
  const [tab, setTab] = useState<'friends' | 'global'>('friends');

  const safeFriends = Array.isArray(friendsList) ? friendsList : [];
  const safeGlobal = Array.isArray(globalList) ? globalList : [];
  const currentList = tab === 'friends' ? safeFriends : safeGlobal;

  // Mini squad tiles on the left column matching Image 4
  const miniSquad = [
    { label: 'PE', rating: 85 },
    { label: '2P0', rating: 85 },
    { label: '3PR', rating: 85 },
    { label: '3E9', rating: 81 },
    { label: 'RB', rating: 86 },
    { label: 'A7', rating: 88 },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Header matching Image 4 */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <PixelShieldIcon size={32} color="#155e9e" className="sm:w-[38px] sm:h-[38px]" />
        <h1 className="font-pixel text-xl sm:text-3xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a] text-center">
          LEADERBOARD
        </h1>
      </div>

      {/* Tabs: FRIENDS | GLOBAL */}
      <div className="flex justify-center max-w-md mx-auto gap-2 sm:gap-3">
        <button
          onClick={() => setTab('friends')}
          className={`touch-manipulation flex-1 py-2.5 sm:py-3 px-3 sm:px-4 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all ${
            tab === 'friends'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          FRIENDS
        </button>
        <button
          onClick={() => setTab('global')}
          className={`touch-manipulation flex-1 py-2.5 sm:py-3 px-3 sm:px-4 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all ${
            tab === 'global'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          GLOBAL
        </button>
      </div>

      {/* Main Grid matching Image 4 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
        
        {/* Left Mini Column matching Image 4 */}
        <div className="md:col-span-4 pixel-box-cream p-3 rounded-xs flex flex-col gap-3">
          
          {/* Top: Current User Avatar & Name */}
          <div className="bg-[#ebd2a4] border-2 border-[#c99a57] p-3 text-center flex flex-col items-center justify-center">
            <PixelPlayerSprite
              avatar={user?.avatar}
              number={user?.avatar?.number}
              size="sm"
              withShadow={true}
            />
            <span className="font-pixel text-xs text-[#5c3509] mt-2 block tracking-wider">
              {user?.username ?? 'PLAYER 1'}
            </span>
          </div>

          {/* 6 Mini Roster Badges (PE, 2P0, 3PR, 3E9, RB, A7) */}
          <div className="grid grid-cols-2 gap-2">
            {miniSquad.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#ebd2a4] border-2 border-[#c99a57] p-2 flex flex-col items-center justify-center text-center"
              >
                <PixelHelmetIcon size={22} color="#155e9e" />
                <span className="font-pixel text-[10px] text-[#5c3509] mt-1">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom Card: YOU 1,852 */}
          <div className="bg-[#12579b] border-2 border-[#0a2d52] text-[#fae5b8] p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PixelHelmetIcon size={20} color="#38bdf8" />
              <span className="font-pixel text-[10px]">YOU</span>
            </div>
            <span className="font-pixel text-[11px] text-[#fae5b8]">1,852</span>
          </div>

        </div>

        {/* Right Main Container: LEADERBOARD List */}
        <div className="md:col-span-8 pixel-box-cream p-3 sm:p-5 rounded-xs">
          
          {/* Header Banner */}
          <div className="text-center pb-2.5 sm:pb-3 mb-3 sm:mb-4 border-b-2 border-[#d4a86a]">
            <h2 className="font-pixel text-base sm:text-xl text-[#5c3509] tracking-wider uppercase">
              LEADERBORD
            </h2>
            <div className="font-pixel text-[10px] sm:text-xs text-[#12579b] mt-1 tracking-widest">
              {tab === 'friends' ? 'FRIENDS' : 'GLOBAL RANKINGS'}
            </div>
          </div>

          {/* Rows matching Image 4 */}
          <div className="space-y-2.5 sm:space-y-3">
            {currentList.map((entry, idx) => {
              return (
                <div
                  key={entry.username || idx}
                  className={`p-2.5 sm:p-4 border-3 flex items-center justify-between transition-all ${
                    entry.isYou
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
                      : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_3px_0_0_#051a30]'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Rank indicator */}
                    {entry.isYou ? (
                      <span className="font-pixel text-xs sm:text-sm text-[#38bdf8] font-bold shrink-0">
                        128
                      </span>
                    ) : null}

                    {/* Pixel Helmet Icon */}
                    <div className="shrink-0">
                      <PixelHelmetIcon
                        size={24}
                        color={entry.avatar?.helmetColor || '#155e9e'}
                      />
                    </div>

                    {/* Username */}
                    <span className="font-pixel text-xs sm:text-sm tracking-wider truncate">
                      {entry.username}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="font-pixel text-xs sm:text-sm tracking-wider shrink-0 ml-3 whitespace-nowrap">
                    {(entry.score ?? 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
