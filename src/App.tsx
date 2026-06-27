import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Skull, LogOut, ArrowRight, Home, AlertTriangle, X } from "lucide-react";
import GameHub from "./components/GameHub";
import MafiaLobby from "./components/MafiaLobby";
import WaitingRoom from "./components/WaitingRoom";
import NightPhase from "./components/NightPhase";
import DayPhase from "./components/DayPhase";
import GameOver from "./components/GameOver";
import { GameState } from "./types";

export default function App() {
  const [view, setView] = useState<'gamehub' | 'mafia_lobby' | 'mafia_game'>('gamehub');
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [eliminatedNotice, setEliminatedNotice] = useState<string | null>(null);
  const [eliminationCountdown, setEliminationCountdown] = useState<number>(5);
  const [errorNotice, setErrorNotice] = useState<string>('');

  // Local storage playerId retrieval to handle page refreshes or short blips in network smoothly
  const [playerId] = useState<string>(() => {
    let id = localStorage.getItem('mafia_player_id');
    if (!id) {
      id = "p_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('mafia_player_id', id);
    }
    return id;
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Poll state endpoint
  const pollGameState = async (code: string, pId: string) => {
    try {
      const response = await fetch(`/api/game/state?code=${code}&playerId=${pId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setErrorNotice("The room was closed or you were removed from the lobby.");
          handleExitToHub();
        }
        return;
      }
      const data: GameState = await response.json();
      setGameState(data);

      // Save player name for session tracking
      const meInPlayers = data.players.find(p => p.id === pId);
      if (meInPlayers && !playerName) {
        setPlayerName(meInPlayers.name);
      }

      // ELIMINATION MONITOR
      // If player is dead mid-game and hasn't received the notice yet, boot them after a graceful warning
      if (
        data.status !== 'waiting' &&
        data.status !== 'game_over' &&
        data.currentPlayerIsAlive === false &&
        !eliminatedNotice
      ) {
        let reason = "You were eliminated during the round.";
        if (data.eliminatedLastNight.includes(meInPlayers?.name || '')) {
          reason = "You were killed during the night!";
        } else if (data.eliminatedLastDay === meInPlayers?.name) {
          reason = "The village voted to execute you!";
        }
        
        setEliminatedNotice(reason);
        triggerEliminationTimer();
      }
    } catch (e) {
      console.error("Error polling game state:", e);
    }
  };

  // Poll interval setup
  useEffect(() => {
    if (roomCode && playerId && view === 'mafia_game') {
      // Immediate poll
      pollGameState(roomCode, playerId);
      
      // Repeating poll every 1200ms
      pollingRef.current = setInterval(() => {
        pollGameState(roomCode, playerId);
      }, 1200);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [roomCode, playerId, view, eliminatedNotice]);

  // Auto-dismiss error notices after 5 seconds
  useEffect(() => {
    if (errorNotice) {
      const timer = setTimeout(() => {
        setErrorNotice('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorNotice]);

  // Trigger responsive device vibration on screen view or active game phase transitions
  useEffect(() => {
    const currentStatus = (view === 'mafia_game' && gameState) ? gameState.status : '';
    if (view || currentStatus) {
      if (typeof window !== "undefined" && window.navigator && typeof window.navigator.vibrate === "function") {
        try {
          // Double-pulse haptic vibration to grab player's attention during social discussion
          window.navigator.vibrate([250, 120, 250]);
        } catch (e) {
          console.warn("Vibration feedback is either unsupported or requires interaction on this platform:", e);
        }
      }
    }
  }, [view, gameState?.status]);

  const triggerEliminationTimer = () => {
    setEliminationCountdown(5);
    countdownRef.current = setInterval(() => {
      setEliminationCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleInstantRedirectionToHub();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleInstantRedirectionToHub = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    // Safely send leave action to backend
    if (roomCode) {
      try {
        await fetch('/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            playerId,
            actionType: 'leave_game'
          })
        });
      } catch (e) {
        console.error("Error leaving game during elimination boot:", e);
      }
    }

    setEliminatedNotice(null);
    setGameState(null);
    setRoomCode('');
    setView('gamehub');
  };

  const handleExitToHub = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setGameState(null);
    setRoomCode('');
    setEliminatedNotice(null);
    setView('gamehub');
  };

  // Action emitters
  const handleCreateRoom = async (config: {
    playerName: string;
    maxPlayers: number;
    selectedRoles: string[];
    discussionTime: number;
    votingTime: number;
  }) => {
    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, playerId })
      });
      if (!response.ok) {
        const err = await response.json();
        setErrorNotice(err.error || "Failed to create room.");
        return;
      }
      const data = await response.json();
      setRoomCode(data.roomCode);
      setPlayerName(config.playerName);
      setView('mafia_game');
    } catch (e) {
      setErrorNotice("Server unreachable. Please try again later.");
    }
  };

  const handleJoinRoom = async (pName: string, code: string) => {
    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pName, roomCode: code, playerId })
      });
      if (!response.ok) {
        const err = await response.json();
        setErrorNotice(err.error || "Failed to join room.");
        return;
      }
      const data = await response.json();
      setRoomCode(data.roomCode);
      setPlayerName(pName);
      setView('mafia_game');
    } catch (e) {
      setErrorNotice("Server unreachable. Please try again later.");
    }
  };

  const handleGameAction = async (actionType: string, targetId: string | null, data?: any) => {
    if (!roomCode) return;
    try {
      const response = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId,
          actionType,
          targetId,
          data
        })
      });
      if (!response.ok) {
        console.error("Action rejected by server");
        return;
      }
      // Instantly trigger sync for responsive user experience
      pollGameState(roomCode, playerId);
    } catch (e) {
      console.error("Network error executing game action:", e);
    }
  };

  const handleSendChat = (text: string, isMafiaOnly: boolean) => {
    handleGameAction('send_chat', null, { text, isMafiaOnly });
  };

  const handleAddBots = () => {
    handleGameAction('add_bots', null);
  };

  const handleStartGame = () => {
    handleGameAction('start_game', null);
  };

  const handleLeaveGame = () => {
    handleGameAction('leave_game', null);
    handleExitToHub();
  };

  return (
    <div id="gamehub-app-root" className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Dynamic Navigation Header (Only shown on non-Hub pages for accessibility) */}
      {view !== 'gamehub' && (
        <header className="bg-white border-b border-slate-200/80 px-4 py-4 shrink-0 shadow-sm font-sans">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              onClick={handleExitToHub}
              className="flex items-center gap-1.5 font-extrabold text-slate-800 hover:text-slate-950 text-sm focus:outline-none"
              id="header-home-btn"
            >
              <Home className="w-4 h-4 text-slate-500" /> GameHub Home
            </button>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping mr-1"></span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sync Status: Active</span>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="flex-grow relative">
        {/* Global Floating Error/Warning Notification */}
        <AnimatePresence>
          {errorNotice && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
              id="global-error-toast"
            >
              <div className="bg-white border-3 border-[#111111] p-4 shadow-[4px_4px_0px_#111111] flex items-start gap-3 relative">
                <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-xs font-display text-[#111111] uppercase tracking-wider">Alert</h4>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mt-0.5 leading-relaxed pr-6">
                    {errorNotice}
                  </p>
                </div>
                <button
                  onClick={() => setErrorNotice('')}
                  className="absolute top-3 right-3 text-slate-400 hover:text-[#111111] p-0.5 focus:outline-none"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          
          {/* 1. GAMEHUB SELECTION SCREEN */}
          {view === 'gamehub' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameHub onSelectMafia={() => setView('mafia_lobby')} />
            </motion.div>
          )}

          {/* 2. MAFIA LOBBY ENTRANCE SCREEN */}
          {view === 'mafia_lobby' && (
            <motion.div
              key="lobby-setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MafiaLobby
                onBack={() => setView('gamehub')}
                onCreateGame={handleCreateRoom}
                onJoinGame={handleJoinRoom}
              />
            </motion.div>
          )}

          {/* 3. MAFIA ACTIVE GAMEPLAY CONTAINER */}
          {view === 'mafia_game' && gameState && (
            <motion.div
              key="active-game-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* STATUS 1: Waiting Room Lobby */}
              {gameState.status === 'waiting' && (
                <WaitingRoom
                  roomCode={roomCode}
                  currentPlayerId={playerId}
                  players={gameState.players}
                  maxPlayers={gameState.maxPlayers}
                  selectedRoles={gameState.selectedRoles}
                  isHost={gameState.players.find(p => p.id === playerId)?.isHost || false}
                  onStartGame={handleStartGame}
                  onLeaveGame={handleLeaveGame}
                />
              )}

              {/* STATUS 2: Night Phases */}
              {gameState.status.startsWith('night_') && (
                <NightPhase
                  gameState={gameState}
                  currentPlayerId={playerId}
                  onSendChat={handleSendChat}
                  onGameAction={handleGameAction}
                />
              )}

              {/* STATUS 3: Morning Transitions */}
              {gameState.status === 'morning' && (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center"
                    id="morning-transition-card"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-sm animate-spin-slow mb-6">
                      ☀️
                    </div>
                    
                    <span className="text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      Transition Round
                    </span>
                    <h2 className="text-2xl font-black text-slate-950 mt-3 uppercase tracking-tight">Morning arrives</h2>
                    <p className="text-sm text-slate-500 mt-2 font-semibold">
                      The shadows dissolve. Wake up, village...
                    </p>

                    {/* Death News */}
                    <div className="mt-8 bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
                      {gameState.eliminatedLastNight.length > 0 ? (
                        <div>
                          <Skull className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <h4 className="text-xs font-extrabold text-red-950 uppercase tracking-wider">Tragedy Strikes</h4>
                          <p className="text-sm text-slate-700 mt-1 font-semibold leading-relaxed">
                            <span className="font-extrabold text-red-600">{gameState.eliminatedLastNight.join(', ')}</span> was found dead last night.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-2xl mb-1 block">🕊️</span>
                          <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">A Peaceful Dusk</h4>
                          <p className="text-sm text-slate-600 mt-1 font-semibold">
                            No body was found. Everyone survived the night!
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-center items-center gap-1 text-slate-400 text-xs font-bold">
                      <span>Entering debate floor in {gameState.timerValue}s</span>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* STATUS 4: Day Phases (Discussion / Voting) */}
              {(gameState.status === 'discussion' || gameState.status === 'voting') && (
                <DayPhase
                  gameState={gameState}
                  currentPlayerId={playerId}
                  onSendChat={handleSendChat}
                  onGameAction={handleGameAction}
                />
              )}

              {/* STATUS 5: Game Over Victory Scene */}
              {gameState.status === 'game_over' && (
                <GameOver
                  gameState={gameState}
                  onRestart={handleExitToHub}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. ELIMINATED PLAYER INSTANT BOOT OVERLAY */}
      <AnimatePresence>
        {eliminatedNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans"
            id="elimination-boot-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-red-200 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 to-rose-600"></div>

              <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-6">
                <Skull className="w-8 h-8 shrink-0" />
              </div>

              <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight">ELIMINATED</h2>
              <p className="text-red-600 font-extrabold text-sm uppercase tracking-wider mt-1">{eliminatedNotice}</p>
              
              <p className="text-slate-500 text-sm mt-4 leading-relaxed font-semibold">
                In compliance with the village decrees, dead players are removed from the room instantly and return back to the GameHub catalog.
              </p>

              {/* Redirection Indicator */}
              <div className="mt-8 bg-slate-50 border border-slate-100 rounded-2xl py-3.5 px-4 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400">AUTOMATIC BOOT</span>
                <span className="font-black text-slate-800 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                  {eliminationCountdown}s Left
                </span>
              </div>

              <button
                onClick={handleInstantRedirectionToHub}
                className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl text-xs tracking-widest uppercase shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="elimination-manual-boot-btn"
              >
                <span>Exit Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Bottom Credit Note */}
      <footer className="bg-slate-100/50 border-t border-slate-200/50 py-4 px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">
        GameHub
      </footer>
    </div>
  );
}
