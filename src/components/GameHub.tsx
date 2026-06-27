import { motion } from "motion/react";
import { Users, Swords } from "lucide-react";

interface GameHubProps {
  onSelectMafia: () => void;
}

export default function GameHub({ onSelectMafia }: GameHubProps) {
  const games = [
    {
      id: "mafia",
      title: "Mafia: Social Deduction",
      tagline: "Uncover the conspiracy before it's too late",
      description: "A classic game of secrets, lies, and betrayal. Complete with special roles like Doctor, Detective, Serial Killer, and Godmother. Connect instantly and play with your friends!",
      players: "3 - 20 Players",
      active: true,
      icon: Swords,
      color: "bg-[#fffdf2] hover:bg-[#fffbe5]",
      badge: "LIVE & PLAYABLE",
      badgeColor: "bg-[#FF5A1F] text-white"
    }
  ];

  return (
    <div id="gamehub-container" className="min-h-screen bg-[#FAFAF8] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#111111] text-white border-2 border-[#111111] px-4 py-2 font-display text-sm tracking-wide mb-6 shadow-[3px_3px_0px_#111111] uppercase"
          >
            THE ULTIMATE FUN PLATFORM
          </motion.div>
          
          <div className="inline-block border-4 border-[#111111] bg-[#FF5A1F] p-6 sm:p-8 transform -rotate-1 shadow-[8px_8px_0px_#111111] mb-6">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-7xl font-display tracking-tight text-white uppercase leading-none"
            >
              GAMEHUB.EXE
            </motion.h1>
          </div>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-base text-[#111111] font-bold uppercase tracking-wide bg-[#1FDEFF]/10 border-2 border-dashed border-[#111111] p-4 rounded-none"
          >
            Gather your friends and Connect across screens instantly with custom codes. High stakes, pure strategy.
          </motion.p>
        </div>

        {/* Game Catalog Grid */}
        <div className="max-w-md mx-auto mt-12">
          {games.map((game, index) => {
            const IconComponent = game.icon;
            return (
              <motion.div
                key={game.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                whileHover={game.active ? { transform: "translate(-4px, -4px)", boxShadow: "8px 8px 0px #111111" } : {}}
                className={`flex flex-col h-full border-3 border-[#111111] p-6 transition-all shadow-[4px_4px_0px_#111111] relative overflow-hidden ${
                  game.active ? 'cursor-pointer' : 'cursor-not-allowed'
                } ${game.color}`}
                onClick={game.active ? onSelectMafia : undefined}
                id={`game-card-${game.id}`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[10px] font-display uppercase tracking-wider px-3 py-1 border-2 border-[#111111] shadow-[2px_2px_0px_#111111] ${game.badgeColor}`}>
                    {game.badge}
                  </span>
                </div>

                {/* Game Icon */}
                <div className={`w-14 h-14 border-3 border-[#111111] flex items-center justify-center mb-6 shadow-[3px_3px_0px_#111111] ${
                  game.active ? 'bg-[#1FDEFF] text-[#111111]' : 'bg-slate-100 text-slate-400'
                }`}>
                  <IconComponent className="w-8 h-8" />
                </div>

                {/* Game Details */}
                <h2 className="text-2xl font-display tracking-tight text-[#111111] uppercase mb-1">
                  {game.title}
                </h2>
                <p className={`text-xs font-black uppercase mb-4 tracking-wider ${game.active ? 'text-[#FF5A1F]' : 'text-slate-400'}`}>
                  {game.tagline}
                </p>
                
                <p className="text-[#111111] font-medium text-sm leading-relaxed mb-6 flex-grow">
                  {game.description}
                </p>

                {/* Footer Info */}
                <div className="border-t-2 border-[#111111] pt-4 mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#111111] text-sm font-bold uppercase tracking-wider">
                    <Users className="w-4 h-4" />
                    <span>{game.players}</span>
                  </div>
                  {game.active ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#1FDEFF] hover:bg-[#00D0FF] text-[#111111] border-2 border-[#111111] px-5 py-2 font-display text-sm uppercase tracking-wider shadow-[3px_3px_0px_#111111]"
                      id="play-button-mafia"
                    >
                      Enter Room
                    </motion.button>
                  ) : (
                    <span className="text-slate-400 font-display text-xs tracking-wider border-2 border-slate-300 px-3 py-1 bg-slate-100">LOCKED</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
