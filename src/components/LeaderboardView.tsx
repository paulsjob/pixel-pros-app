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
  friendsList,
  globalList,
  onOpenPlayerDetail,
}) => {
  const [tab, setTab] = useState<'friends' | 'global'>('friends');

  const currentList = tab === 'friends' ? friendsList : globalList;

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
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header matching Image 4 */}
      <div className="flex items-center justify-center gap-3">
        <PixelShieldIcon size={38} color="#155e9e" />
        <h1 className="font-pixel text-2xl sm:text-3xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a]">
          LEADERBOARD
        </h1>
      </div>

      {/* Tabs: FRIENDS | GLOBAL */}
      <div className="flex justify-center max-w-md mx-auto gap-3">
        <button
          onClick={() => setTab('friends')}
          className={`flex-1 py-3 px-4 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all ${
            tab === 'friends'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          FRIENDS
        </button>
        <button
          onClick={() => setTab('global')}
          className={`flex-1 py-3 px-4 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all ${
            tab === 'global'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          GLOBAL
        </button>
      </div>

      {/* Main Grid matching Image 4 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Mini Column matching Image 4 */}
        <div className="md:col-span-4 pixel-box-cream p-3 rounded-xs flex flex-col gap-3">
          
          {/* Top: Current User Avatar & Name */}
          <div className="bg-[#ebd2a4] border-2 border-[#c99a57] p-3 text-center flex flex-col items-center justify-center">
            <PixelPlayerSprite
              avatar={user.avatar}
              number={user.avatar.number}
              size="sm"
              withShadow={true}
            />
            <span className="font-pixel text-xs text-[#5c3509] mt-2 block tracking-wider">
              {user.username}
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
        <div className="md:col-span-8 pixel-box-cream p-4 sm:p-5 rounded-xs">
          
          {/* Header Banner */}
          <div className="text-center pb-3 mb-4 border-b-2 border-[#d4a86a]">
            <h2 className="font-pixel text-lg sm:text-xl text-[#5c3509] tracking-wider uppercase">
              LEADERBORD
            </h2>
            <div className="font-pixel text-xs text-[#12579b] mt-1 tracking-widest">
              {tab === 'friends' ? 'FRIENDS' : 'GLOBAL RANKINGS'}
            </div>
          </div>

          {/* Rows matching Image 4 */}
          <div className="space-y-3">
            {currentList.map((entry) => {
              return (
                <div
                  key={entry.username}
                  className={`p-3 sm:p-4 border-3 flex items-center justify-between transition-all ${
                    entry.isYou
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
                      : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_3px_0_0_#051a30]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indicator */}
                    {entry.isYou ? (
                      <span className="font-pixel text-xs sm:text-sm text-[#38bdf8] font-bold">
                        128
                      </span>
                    ) : null}

                    {/* Pixel Helmet Icon */}
                    <PixelHelmetIcon
                      size={28}
                      color={entry.avatar?.helmetColor || '#155e9e'}
                    />

                    {/* Username */}
                    <span className="font-pixel text-xs sm:text-sm tracking-wider">
                      {entry.username}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="font-pixel text-xs sm:text-sm tracking-wider">
                    {entry.score.toLocaleString()}
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
