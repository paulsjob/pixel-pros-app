import React from 'react';
import { BookOpen, Award, CheckCircle2 } from 'lucide-react';

export const SimpleRulesView: React.FC = () => {
  const scoringCards = [
    {
      title: 'TOUCHDOWN',
      points: '+6',
      unit: 'POINTS',
      desc: 'Player runs or catches the ball into the endzone.',
      badgeColor: 'bg-[#15803d] text-white border-[#14532d]',
      icon: '🏈',
      example: '6 PTS instantly added to your team',
    },
    {
      title: 'FIELD GOAL',
      points: '+3',
      unit: 'POINTS',
      desc: 'Kicking the ball through the yellow goal posts.',
      badgeColor: 'bg-[#1d4ed8] text-white border-[#1e3a8a]',
      icon: '🥅',
      example: '3 PTS added when the kick is good',
    },
    {
      title: 'BIG STOP / DEFENSE',
      points: '+2',
      unit: 'POINTS',
      desc: 'Tackling the offense in the endzone, sack, or turnover.',
      badgeColor: 'bg-[#b45309] text-white border-[#78350f]',
      icon: '🛡️',
      example: '2 PTS for defensive plays',
    },
    {
      title: '50 YARDS PLAY',
      points: '+1',
      unit: 'POINT',
      desc: 'Every 50 total passing, rushing, or receiving yards.',
      badgeColor: 'bg-[#7c3aed] text-white border-[#581c87]',
      icon: '⚡',
      example: '1 PT per 50 yards (Whole numbers only!)',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      
      {/* Title Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <BookOpen size={28} className="text-[#38bdf8]" />
          <h1 className="font-pixel text-xl sm:text-3xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a]">
            HOW SCORING WORKS
          </h1>
        </div>
        <p className="font-retro text-xs sm:text-sm text-[#fae5b8]/80 max-w-lg mx-auto">
          Easy whole-number points. Simple for kids and grandparents to follow during any game!
        </p>
      </div>

      {/* 4 Clean, Bold Retro Cards with High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {scoringCards.map((card) => (
          <div
            key={card.title}
            className="pixel-box-cream p-5 sm:p-6 rounded-xs flex flex-col justify-between shadow-[0_6px_0_0_#0a0f1d] hover:translate-y-[-2px] transition-transform"
          >
            <div>
              {/* Header with Title and Emoji Icon */}
              <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl select-none" role="img" aria-label={card.title}>
                    {card.icon}
                  </span>
                  <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase">
                    {card.title}
                  </h2>
                </div>
              </div>

              {/* Big High-Contrast Points Display */}
              <div className="flex items-baseline gap-2.5 my-3">
                <span
                  className={`font-pixel text-3xl sm:text-4xl font-extrabold px-3.5 py-1.5 border-3 rounded-xs shadow-md tracking-tight ${card.badgeColor}`}
                >
                  {card.points}
                </span>
                <span className="font-pixel text-base sm:text-lg text-[#5c3509] tracking-wider">
                  {card.unit}
                </span>
              </div>

              {/* Explanatory Description */}
              <p className="font-retro text-xs sm:text-sm text-[#5c3509] leading-relaxed mt-2">
                {card.desc}
              </p>
            </div>

            {/* Quick scanning highlight */}
            <div className="mt-4 pt-3 border-t border-[#d4a86a]/60 flex items-center gap-1.5 text-[11px] font-retro text-[#784610]">
              <CheckCircle2 size={13} className="text-[#16a34a] shrink-0" />
              <span>{card.example}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick 2-Second Guide Footer */}
      <div className="pixel-box-cream p-4 sm:p-5 rounded-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs flex items-center justify-center shrink-0">
            <Award size={22} className="text-[#b45309]" />
          </div>
          <div>
            <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509]">
              WHOLE NUMBERS ONLY
            </h3>
            <p className="font-retro text-[11px] sm:text-xs text-[#784610]">
              No confusing decimals like 0.04 pts. Kids can do the math on their fingers!
            </p>
          </div>
        </div>

        <div className="font-pixel text-xs px-3 py-1.5 bg-[#12579b] text-[#fae5b8] border-2 border-[#0a2d52] rounded-xs shadow-xs shrink-0">
          3 PLAYERS PER WEEK
        </div>
      </div>

    </div>
  );
};
