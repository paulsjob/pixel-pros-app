import React, { useState } from 'react';
import { AvatarConfig } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelCoin, PixelHelmetIcon } from './PixelBadges';
import { X, Check } from 'lucide-react';

interface LockerRoomModalProps {
  currentAvatar: AvatarConfig;
  userCoins: number;
  onSaveAvatar: (newAvatar: AvatarConfig, newCoins: number) => void;
  onClose: () => void;
}

const HELMET_COLORS = [
  { name: 'Royal Blue', color: '#155e9e', cost: 0 },
  { name: 'Victory Red', color: '#dc2626', cost: 500 },
  { name: 'Gridiron Green', color: '#16a34a', cost: 500 },
  { name: 'Golden Champion', color: '#d97706', cost: 1000 },
  { name: 'Midnight Black', color: '#18181b', cost: 750 },
  { name: 'Neon Purple', color: '#9333ea', cost: 1200 },
];

const JERSEY_NUMBERS = [88, 85, 86, 81, 15, 17, 10, 22, 99, 7];

export const LockerRoomModal: React.FC<LockerRoomModalProps> = ({
  currentAvatar,
  userCoins,
  onSaveAvatar,
  onClose,
}) => {
  const [avatar, setAvatar] = useState<AvatarConfig>({ ...currentAvatar });
  const [coins, setCoins] = useState<number>(userCoins);
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

  const handleSelectColor = (item: typeof HELMET_COLORS[0]) => {
    if (avatar.helmetColor === item.color) return;

    if (item.cost > 0 && coins >= item.cost) {
      setCoins(prev => prev - item.cost);
      setPurchaseMsg(`Unlocked ${item.name} for ${item.cost} coins!`);
      setTimeout(() => setPurchaseMsg(null), 3000);
    }
    setAvatar(prev => ({
      ...prev,
      helmetColor: item.color,
      jerseyColor: item.color,
    }));
  };

  const handleSelectNumber = (num: number) => {
    setAvatar(prev => ({ ...prev, number: num }));
  };

  const handleSave = () => {
    onSaveAvatar(avatar, coins);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-md md:max-w-xl bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-4 sm:p-6 rounded-xs text-[#5c3509] my-auto max-h-[90dvh] overflow-y-auto overscroll-contain">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-[#e2ba7d] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <PixelHelmetIcon size={28} color={avatar.helmetColor} />
            <h2 className="font-pixel text-base sm:text-xl text-[#5c3509] tracking-wide">
              LOCKER ROOM
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#fae9c8] border-2 border-[#d4a86a] font-pixel text-xs text-[#b45309]">
              <PixelCoin size={16} />
              <span>{coins.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="touch-manipulation w-8 h-8 bg-[#b91c1c] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5"
            >
              <X size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        {purchaseMsg && (
          <div className="mb-3 p-2 bg-[#15803d] text-[#ffffff] font-retro text-xs text-center border-2 border-[#14532d]">
            {purchaseMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Live 8-bit Sprite Preview */}
          <div className="bg-[#ebd2a4] border-3 border-[#c99a57] rounded-xs flex flex-col items-center justify-center p-4 sm:p-5">
            <span className="font-pixel text-xs text-[#784610] mb-2 uppercase">
              Current Gear
            </span>
            <PixelPlayerSprite
              avatar={avatar}
              number={avatar.number}
              size="lg"
              withShadow={true}
              animate={true}
            />
            <div className="mt-3 text-center">
              <span className="font-pixel text-xs text-[#5c3509]">
                PLAYER #{avatar.number}
              </span>
            </div>
          </div>

          {/* Customization Controls */}
          <div className="flex flex-col gap-3.5 sm:gap-4">
            {/* Choose Helmet & Jersey Color */}
            <div>
              <span className="font-pixel text-[11px] sm:text-xs text-[#5c3509] block mb-2">
                CHOOSE HELMET COLOR:
              </span>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {HELMET_COLORS.map(item => (
                  <button
                    key={item.color}
                    onClick={() => handleSelectColor(item)}
                    className={`touch-manipulation p-1.5 sm:p-2 border-2 text-left cursor-pointer transition-all flex flex-col items-center justify-center relative active:translate-y-0.5 ${
                      avatar.helmetColor === item.color
                        ? 'border-[#0f172a] ring-2 ring-[#0f172a] bg-[#fae9c8]'
                        : 'border-[#c99a57] bg-[#ebd2a4] hover:bg-[#fae9c8]'
                    }`}
                  >
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 border border-black mb-1"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-retro text-[8px] sm:text-[9px] text-[#5c3509] text-center leading-tight">
                      {item.name}
                    </span>
                    {item.cost > 0 && (
                      <span className="text-[8px] font-pixel text-[#b45309]">
                        {item.cost}c
                      </span>
                    )}
                    {avatar.helmetColor === item.color && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#15803d] text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Choose Uniform Number */}
            <div>
              <span className="font-pixel text-[11px] sm:text-xs text-[#5c3509] block mb-2">
                JERSEY NUMBER:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {JERSEY_NUMBERS.map(num => (
                  <button
                    key={num}
                    onClick={() => handleSelectNumber(num)}
                    className={`touch-manipulation w-8 h-8 sm:w-9 sm:h-9 font-pixel text-xs border-2 cursor-pointer flex items-center justify-center transition-all active:translate-y-0.5 ${
                      avatar.number === num
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30]'
                        : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-4 sm:mt-5 pt-3 border-t-2 border-[#e2ba7d] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="touch-manipulation px-3.5 sm:px-4 py-2 bg-[#ebd2a4] border-2 border-[#c99a57] text-[#5c3509] font-pixel text-xs cursor-pointer hover:bg-[#fae9c8]"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="touch-manipulation px-5 sm:px-6 py-2.5 bg-[#12579b] border-2 border-[#0a2d52] text-[#fae5b8] font-pixel text-xs cursor-pointer shadow-[0_4px_0_0_#051a30] hover:bg-[#186abb] active:translate-y-0.5 active:shadow-none"
          >
            EQUIP & SAVE
          </button>
        </div>

      </div>
    </div>
  );
};
