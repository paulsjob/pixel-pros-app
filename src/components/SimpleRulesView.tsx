import React from 'react';
import { BookOpen, Award, CheckCircle2 } from 'lucide-react';

export const SimpleRulesView: React.FC = () => {
  const scoringCards = [
    {
      title: 'TOUCHDOWN',
      points: '+6',
      unit: 'POINTS',
      desc: 'Player passes, rushes, or catches into the endzone.',
      badgeColor: 'bg-[#15803d] text-white border-[#14532d]',
      icon: '🏈',
      example: '+6 pts for every score',
    },
    {
      title: 'FIELD GOAL',
      points: '+3',
      unit: 'POINTS',
      desc: 'Kick through the uprights.',
      badgeColor: 'bg-[#1d4ed8] text-white border-[#1e3a8a]',
      icon: '🥅',
      example: '+3 pts when kick is good',
    },
    {
      title: 'BIG STOP',
      points: '+2',
      unit: 'POINTS',
      desc: 'Sack, turnover, or defensive stop.',
      badgeColor: 'bg-[#b45309] text-white border-[#78350f]',
      icon: '🛡️',
      example: '+2 pts for defensive plays',
    },
    {
      title: '10 YARDS PLAY',
      points: '+1',
      unit: 'POINT',
      desc: 'Every 10 total passing, rushing, or receiving yards.',
      badgeColor: 'bg-[#7c3aed] text-white border-[#581c87]',
      icon: '⚡',
      example: '1 pt added for every first down or big gain!',
      subnote: '+1 pt for every 10 total scrimmage yards.',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      
      {/* Title Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <BookOpen size={22} className="text-[#38bdf8]" />
          <h1 className="font-pixel text-base sm:text-xl text-[#fae5b8] tracking-widest drop-shadow-[0_2px_0_#0f172a]">
            HOW SCORING WORKS
          </h1>
        </div>
        <p className="font-retro text-[11px] sm:text-xs text-[#fae5b8]/80 max-w-md mx-auto">
          Easy whole-number points. Simple for kids and grandparents to follow live!
        </p>
      </div>

      {/* 4 Clean Retro Cards with High Contrast & No Overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {scoringCards.map((card) => (
          <div
            key={card.title}
            className="pixel-box-cream p-3 sm:p-3.5 rounded-xs flex flex-col justify-between shadow-[0_4px_0_0_#0a0f1d] border-2 border-[#c99a57]"
          >
            <div>
              {/* Header with Title and Emoji Icon */}
              <div className="flex items-center justify-between border-b border-[#d4a86a] pb-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg select-none" role="img" aria-label={card.title}>
                    {card.icon}
                  </span>
                  <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
                    {card.title}
                  </h2>
                </div>
              </div>

              {/* High-Contrast Points Display */}
              <div className="flex items-baseline gap-2 my-1.5">
                <span
                  className={`font-pixel text-2xl sm:text-3xl font-extrabold px-2.5 py-0.5 border-2 rounded-xs shadow-xs tracking-tight ${card.badgeColor}`}
                >
                  {card.points}
                </span>
                <span className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider">
                  {card.unit}
                </span>
              </div>

              {/* Explanatory Description (Clean, concise, no clipping) */}
              <p className="font-retro text-xs text-[#5c3509] leading-snug mt-1">
                {card.desc}
              </p>
            </div>

            {/* Scanning highlight */}
            <div className="mt-2.5 pt-2 border-t border-[#d4a86a]/60 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-retro text-[#784610]">
              <CheckCircle2 size={12} className="text-[#16a34a] shrink-0" />
              <span className="truncate">{card.example}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick 2-Second Guide Footer */}
      <div className="pixel-box-cream p-2.5 sm:p-3 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left border-2 border-[#c99a57]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#fae9c8] border border-[#c99a57] rounded-xs flex items-center justify-center shrink-0">
            <Award size={18} className="text-[#b45309]" />
          </div>
          <div>
            <h3 className="font-pixel text-[11px] sm:text-xs text-[#5c3509]">
              WHOLE NUMBERS ONLY
            </h3>
            <p className="font-retro text-[10px] sm:text-[11px] text-[#784610]">
              No confusing decimals. Kids can do all the math on their fingers!
            </p>
          </div>
        </div>

        <div className="font-pixel text-[10px] sm:text-xs px-2.5 py-1 bg-[#12579b] text-[#fae5b8] border border-[#0a2d52] rounded-xs shadow-xs shrink-0 whitespace-nowrap">
          3 PLAYERS PER WEEK
        </div>
      </div>

    </div>
  );
};
