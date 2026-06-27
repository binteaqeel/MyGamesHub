import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface Player {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
  isHost: boolean;
  isBot: boolean;
  hasVoted: boolean;
  voteTarget: string | null;
  hasDoneMiniGame: boolean;
  selfHealUsed: boolean;
}

interface Message {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isMafiaOnly: boolean;
}

interface GameRoom {
  code: string;
  creatorId: string;
  maxPlayers: number;
  discussionTime: number;
  votingTime: number;
  selectedRoles: string[];
  status: 'waiting' | 'night_mafia' | 'night_doctor' | 'night_detective' | 'night_vigilante' | 'night_serial_killer' | 'morning' | 'discussion' | 'voting' | 'game_over';
  players: Player[];
  messages: Message[];
  winner: string | null;
  winnerName?: string;
  nightActionLog: {
    mafiaTarget: string | null;
    doctorTarget: string | null;
    detectiveTarget: string | null;
    vigilanteTarget: string | null;
    serialKillerTarget: string | null;
  };
  eliminatedLastNight: string[];
  eliminatedLastDay: string | null;
  dayCount: number;
  timerValue: number;
  tieOccurred: boolean;
  votingSkipped: boolean;
  mafiaCount?: number;
}

const rooms: Record<string, GameRoom> = {};

// Helper to generate a 6-character room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check game over conditions
function checkGameOverConditions(room: GameRoom): boolean {
  const alivePlayers = room.players.filter(p => p.isAlive);
  const mafias = alivePlayers.filter(p => p.role === 'mafia' || p.role === 'godmother');
  const civilians = alivePlayers.filter(p => p.role !== 'mafia' && p.role !== 'godmother' && p.role !== 'serial_killer');
  const sk = alivePlayers.filter(p => p.role === 'serial_killer');

  // Civilian Team Wins: No Mafias and No Serial Killer left
  if (mafias.length === 0 && sk.length === 0) {
    room.status = 'game_over';
    room.winner = 'civilians';
    return true;
  }

  // Mafia Team Wins: Mafias >= Non-Mafias (including Jester, Civilians, SK, etc.)
  const nonMafiasCount = alivePlayers.length - mafias.length;
  if (mafias.length >= nonMafiasCount) {
    room.status = 'game_over';
    room.winner = 'mafia';
    return true;
  }

  // Serial Killer Wins: SK is the only one alive or is one of the last two players (and the other is not Mafia)
  if (sk.length > 0 && alivePlayers.length <= 2 && mafias.length === 0) {
    room.status = 'game_over';
    room.winner = 'serial_killer';
    room.winnerName = sk[0].name;
    return true;
  }

  return false;
}

// Automate bot responses for current room phase
function triggerBotActionsForPhase(room: GameRoom) {
  const alivePlayers = room.players.filter(p => p.isAlive);
  const bots = alivePlayers.filter(p => p.isBot);

  if (room.status === 'night_mafia') {
    // Mafia bots vote
    const mafiaBots = bots.filter(p => p.role === 'mafia' || p.role === 'godmother');
    const possibleTargets = room.players.filter(p => p.isAlive && p.role !== 'mafia' && p.role !== 'godmother');
    if (possibleTargets.length > 0) {
      mafiaBots.forEach(bot => {
        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        bot.voteTarget = target.id;
        bot.hasVoted = true;
      });
    }
    // Non-mafia bots complete mini-game immediately
    bots.forEach(bot => {
      if (bot.role !== 'mafia' && bot.role !== 'godmother') {
        bot.hasDoneMiniGame = true;
      }
    });
  } else if (room.status === 'night_doctor') {
    const docBots = bots.filter(p => p.role === 'doctor');
    docBots.forEach(docBot => {
      let allowedTargets = room.players.filter(p => p.isAlive);
      if (docBot.selfHealUsed) {
        allowedTargets = allowedTargets.filter(p => p.id !== docBot.id);
      }
      if (allowedTargets.length > 0) {
        const target = allowedTargets[Math.floor(Math.random() * allowedTargets.length)];
        if (target.id === docBot.id) {
          docBot.selfHealUsed = true;
        }
        docBot.voteTarget = target.id;
        room.nightActionLog.doctorTarget = target.id;
        docBot.hasVoted = true;
      } else {
        docBot.hasVoted = true;
      }
    });
    bots.forEach(bot => {
      if (bot.role !== 'doctor') {
        bot.hasDoneMiniGame = true;
      }
    });
  } else if (room.status === 'night_detective') {
    const detBots = bots.filter(p => p.role === 'detective');
    detBots.forEach(detBot => {
      const allowedTargets = room.players.filter(p => p.isAlive && p.id !== detBot.id);
      if (allowedTargets.length > 0) {
        const target = allowedTargets[Math.floor(Math.random() * allowedTargets.length)];
        detBot.voteTarget = target.id;
        room.nightActionLog.detectiveTarget = target.id;
        detBot.hasVoted = true;
      } else {
        detBot.hasVoted = true;
      }
    });
    bots.forEach(bot => {
      if (bot.role !== 'detective') {
        bot.hasDoneMiniGame = true;
      }
    });
  } else if (room.status === 'night_vigilante') {
    const vigBots = bots.filter(p => p.role === 'vigilante');
    vigBots.forEach(vigBot => {
      // 40% chance to shoot a random living player other than themselves
      if (Math.random() < 0.4) {
        const allowedTargets = room.players.filter(p => p.isAlive && p.id !== vigBot.id);
        if (allowedTargets.length > 0) {
          const target = allowedTargets[Math.floor(Math.random() * allowedTargets.length)];
          vigBot.voteTarget = target.id;
          room.nightActionLog.vigilanteTarget = target.id;
        }
      }
      vigBot.hasVoted = true;
    });
    bots.forEach(bot => {
      if (bot.role !== 'vigilante') {
        bot.hasDoneMiniGame = true;
      }
    });
  } else if (room.status === 'night_serial_killer') {
    const skBots = bots.filter(p => p.role === 'serial_killer');
    skBots.forEach(skBot => {
      const allowedTargets = room.players.filter(p => p.isAlive && p.id !== skBot.id);
      if (allowedTargets.length > 0) {
        const target = allowedTargets[Math.floor(Math.random() * allowedTargets.length)];
        skBot.voteTarget = target.id;
        room.nightActionLog.serialKillerTarget = target.id;
        skBot.hasVoted = true;
      } else {
        skBot.hasVoted = true;
      }
    });
    bots.forEach(bot => {
      if (bot.role !== 'serial_killer') {
        bot.hasDoneMiniGame = true;
      }
    });
  } else if (room.status === 'voting') {
    bots.forEach(bot => {
      const skipChance = 0.35;
      if (Math.random() < skipChance) {
        bot.voteTarget = 'skip';
      } else {
        const allowedTargets = room.players.filter(p => p.isAlive && p.id !== bot.id);
        if (allowedTargets.length > 0) {
          const target = allowedTargets[Math.floor(Math.random() * allowedTargets.length)];
          bot.voteTarget = target.id;
        } else {
          bot.voteTarget = 'skip';
        }
      }
      bot.hasVoted = true;
    });
  } else if (room.status === 'discussion') {
    // bots occasionally post chat messages
    bots.forEach(bot => {
      if (Math.random() < 0.6) {
        const delay = Math.floor(Math.random() * 12) + 2; // post after 2 to 14 seconds
        setTimeout(() => {
          if (rooms[room.code] && rooms[room.code].status === 'discussion') {
            const aliveCivilianNames = room.players.filter(p => p.isAlive && p.id !== bot.id).map(p => p.name);
            const banter = [
              `I think the Mafias are targeting the quiet players.`,
              `Who is the Doctor? Please heal me tonight if possible!`,
              `I'm 100% Civilian, please don't vote me!`,
              aliveCivilianNames.length > 0 ? `I'm a bit suspicious of ${aliveCivilianNames[Math.floor(Math.random() * aliveCivilianNames.length)]}, what do you guys think?` : `Any leads, anyone?`,
              `Let's hear from the Detective! Did you find anything?`,
              `Skipping today might be safer if we don't have solid proof.`,
              `That was a rough night. We need to find the Mafia ASAP.`,
            ];
            const text = banter[Math.floor(Math.random() * banter.length)];
            room.messages.push({
              senderId: bot.id,
              senderName: bot.name,
              text,
              timestamp: Date.now(),
              isMafiaOnly: false
            });
          }
        }, delay * 1000);
      }
    });
  }
}

function skipDoctorPhase(room: GameRoom) {
  room.nightActionLog.doctorTarget = null;
  const hasDetective = room.selectedRoles.includes('detective') && room.players.some(p => p.role === 'detective' && p.isAlive);
  if (hasDetective) {
    room.status = 'night_detective';
    triggerBotActionsForPhase(room);
    checkPhaseTransition(room);
  } else {
    skipDetectivePhase(room);
  }
}

function skipDetectivePhase(room: GameRoom) {
  room.nightActionLog.detectiveTarget = null;
  const hasVigilante = room.selectedRoles.includes('vigilante') && room.players.some(p => p.role === 'vigilante' && p.isAlive);
  if (hasVigilante) {
    room.status = 'night_vigilante';
    triggerBotActionsForPhase(room);
    checkPhaseTransition(room);
  } else {
    skipVigilantePhase(room);
  }
}

function skipVigilantePhase(room: GameRoom) {
  room.nightActionLog.vigilanteTarget = null;
  const hasSK = room.selectedRoles.includes('serial_killer') && room.players.some(p => p.role === 'serial_killer' && p.isAlive);
  if (hasSK) {
    room.status = 'night_serial_killer';
    triggerBotActionsForPhase(room);
    checkPhaseTransition(room);
  } else {
    skipSerialKillerPhase(room);
  }
}

function skipSerialKillerPhase(room: GameRoom) {
  room.nightActionLog.serialKillerTarget = null;
  transitionToMorning(room);
}

function transitionToMorning(room: GameRoom) {
  room.status = 'morning';
  room.timerValue = 10; // display morning message for 10 seconds

  const docTarget = room.nightActionLog.doctorTarget;
  const mafiaTarget = room.nightActionLog.mafiaTarget;
  const vigTarget = room.nightActionLog.vigilanteTarget;
  const skTarget = room.nightActionLog.serialKillerTarget;

  const killedThisNight = new Set<string>();

  // Gather all saved players (from any Doctor heal)
  const savedPlayerIds = new Set<string>();
  room.players.forEach(p => {
    if (p.role === 'doctor' && p.isAlive && p.hasVoted && p.voteTarget) {
      savedPlayerIds.add(p.voteTarget);
    }
  });
  if (docTarget) {
    savedPlayerIds.add(docTarget);
  }

  // Gather all Serial Killer targets
  const allSkTargets = new Set<string>();
  room.players.forEach(p => {
    if (p.role === 'serial_killer' && p.isAlive && p.hasVoted && p.voteTarget) {
      allSkTargets.add(p.voteTarget);
    }
  });
  if (skTarget) {
    allSkTargets.add(skTarget);
  }

  // Gather all Vigilante targets
  const allVigTargets = new Set<string>();
  room.players.forEach(p => {
    if (p.role === 'vigilante' && p.isAlive && p.hasVoted && p.voteTarget) {
      allVigTargets.add(p.voteTarget);
    }
  });
  if (vigTarget) {
    allVigTargets.add(vigTarget);
  }

  // 1. Mafia kills target if not saved by any doctor
  if (mafiaTarget && !savedPlayerIds.has(mafiaTarget)) {
    killedThisNight.add(mafiaTarget);
  }

  // 2. Serial Killers kill targets if not saved by any doctor
  allSkTargets.forEach(target => {
    if (target && !savedPlayerIds.has(target)) {
      killedThisNight.add(target);
    }
  });

  // 3. Vigilantes kill targets if not saved by any doctor
  allVigTargets.forEach(target => {
    if (target && !savedPlayerIds.has(target)) {
      killedThisNight.add(target);
    }
  });

  // Apply deaths
  room.eliminatedLastNight = [];
  killedThisNight.forEach(id => {
    const p = room.players.find(player => player.id === id);
    if (p) {
      p.isAlive = false;
      room.eliminatedLastNight.push(p.name);
    }
  });

  // Reset night actions
  room.nightActionLog = {
    mafiaTarget: null,
    doctorTarget: null,
    detectiveTarget: null,
    vigilanteTarget: null,
    serialKillerTarget: null,
  };

  // Check Game Over
  checkGameOverConditions(room);
}

function transitionToDiscussion(room: GameRoom) {
  if (room.status === 'game_over') return;
  room.status = 'discussion';
  room.timerValue = room.discussionTime;
  triggerBotActionsForPhase(room);
}

function transitionToVoting(room: GameRoom) {
  if (room.status === 'game_over') return;
  room.status = 'voting';
  room.timerValue = room.votingTime;
  room.players.forEach(p => {
    p.hasVoted = false;
    p.voteTarget = null;
  });
  triggerBotActionsForPhase(room);
}

function tallyVotes(room: GameRoom) {
  room.tieOccurred = false;
  room.votingSkipped = false;
  room.eliminatedLastDay = null;

  const alivePlayers = room.players.filter(p => p.isAlive);
  const voteCounts: Record<string, number> = {};
  let skipVotes = 0;

  alivePlayers.forEach(p => {
    if (p.voteTarget === 'skip' || !p.voteTarget) {
      skipVotes++;
    } else {
      voteCounts[p.voteTarget] = (voteCounts[p.voteTarget] || 0) + 1;
    }
  });

  let maxVotes = 0;
  let targetId: string | null = null;
  let hasTie = false;

  for (const id in voteCounts) {
    if (voteCounts[id] > maxVotes) {
      maxVotes = voteCounts[id];
      targetId = id;
      hasTie = false;
    } else if (voteCounts[id] === maxVotes) {
      hasTie = true;
    }
  }

  if (skipVotes > maxVotes) {
    room.votingSkipped = true;
  } else if (hasTie) {
    room.tieOccurred = true;
  } else if (targetId) {
    const targetPlayer = room.players.find(p => p.id === targetId);
    if (targetPlayer) {
      targetPlayer.isAlive = false;
      room.eliminatedLastDay = targetPlayer.name;

      // JESTER WIN CONDITION: Voted out during day
      if (targetPlayer.role === 'jester') {
        room.status = 'game_over';
        room.winner = 'jester';
        room.winnerName = targetPlayer.name;
        return;
      }
    }
  } else {
    room.votingSkipped = true;
  }

  // Clear voting states
  room.players.forEach(p => {
    p.hasVoted = false;
    p.voteTarget = null;
  });

  // Check Game Over
  if (checkGameOverConditions(room)) {
    return;
  }

  // Move to next night
  room.dayCount++;
  room.status = 'night_mafia';
  triggerBotActionsForPhase(room);
  checkPhaseTransition(room);
}

function checkPhaseTransition(room: GameRoom) {
  const alivePlayers = room.players.filter(p => p.isAlive);

  if (room.status === 'night_mafia') {
    const aliveMafia = alivePlayers.filter(p => p.role === 'mafia' || p.role === 'godmother');
    const allMafiaVoted = aliveMafia.every(p => p.hasVoted);
    const nonMafiaSleepers = alivePlayers.filter(p => p.role !== 'mafia' && p.role !== 'godmother');
    const allSleepersDone = nonMafiaSleepers.every(p => p.hasDoneMiniGame);

    if (allMafiaVoted && allSleepersDone) {
      const votes: Record<string, number> = {};
      aliveMafia.forEach(m => {
        if (m.voteTarget) {
          votes[m.voteTarget] = (votes[m.voteTarget] || 0) + 1;
        }
      });
      let maxVotes = 0;
      let targetId: string | null = null;
      for (const id in votes) {
        if (votes[id] > maxVotes) {
          maxVotes = votes[id];
          targetId = id;
        } else if (votes[id] === maxVotes && Math.random() < 0.5) {
          targetId = id;
        }
      }
      room.nightActionLog.mafiaTarget = targetId;

      room.players.forEach(p => {
        p.hasVoted = false;
        p.voteTarget = null;
        p.hasDoneMiniGame = false;
      });

      const hasDoctor = room.selectedRoles.includes('doctor') && room.players.some(p => p.role === 'doctor' && p.isAlive);
      if (hasDoctor) {
        room.status = 'night_doctor';
        triggerBotActionsForPhase(room);
        checkPhaseTransition(room);
      } else {
        skipDoctorPhase(room);
      }
    }
  } else if (room.status === 'night_doctor') {
    const docPlayers = alivePlayers.filter(p => p.role === 'doctor');
    const docVoted = docPlayers.every(p => p.hasVoted);
    const nonDocSleepers = alivePlayers.filter(p => p.role !== 'doctor');
    const allSleepersDone = nonDocSleepers.every(p => p.hasDoneMiniGame);

    if (docVoted && allSleepersDone) {
      room.players.forEach(p => {
        p.hasVoted = false;
        p.voteTarget = null;
        p.hasDoneMiniGame = false;
      });

      const hasDetective = room.selectedRoles.includes('detective') && room.players.some(p => p.role === 'detective' && p.isAlive);
      if (hasDetective) {
        room.status = 'night_detective';
        triggerBotActionsForPhase(room);
        checkPhaseTransition(room);
      } else {
        skipDetectivePhase(room);
      }
    }
  } else if (room.status === 'night_detective') {
    const detPlayers = alivePlayers.filter(p => p.role === 'detective');
    const detVoted = detPlayers.every(p => p.hasVoted);
    const nonDetSleepers = alivePlayers.filter(p => p.role !== 'detective');
    const allSleepersDone = nonDetSleepers.every(p => p.hasDoneMiniGame);

    if (detVoted && allSleepersDone) {
      room.players.forEach(p => {
        p.hasVoted = false;
        p.voteTarget = null;
        p.hasDoneMiniGame = false;
      });

      const hasVigilante = room.selectedRoles.includes('vigilante') && room.players.some(p => p.role === 'vigilante' && p.isAlive);
      if (hasVigilante) {
        room.status = 'night_vigilante';
        triggerBotActionsForPhase(room);
        checkPhaseTransition(room);
      } else {
        skipVigilantePhase(room);
      }
    }
  } else if (room.status === 'night_vigilante') {
    const vigPlayers = alivePlayers.filter(p => p.role === 'vigilante');
    const vigVoted = vigPlayers.every(p => p.hasVoted);
    const nonVigSleepers = alivePlayers.filter(p => p.role !== 'vigilante');
    const allSleepersDone = nonVigSleepers.every(p => p.hasDoneMiniGame);

    if (vigVoted && allSleepersDone) {
      room.players.forEach(p => {
        p.hasVoted = false;
        p.voteTarget = null;
        p.hasDoneMiniGame = false;
      });

      const hasSK = room.selectedRoles.includes('serial_killer') && room.players.some(p => p.role === 'serial_killer' && p.isAlive);
      if (hasSK) {
        room.status = 'night_serial_killer';
        triggerBotActionsForPhase(room);
        checkPhaseTransition(room);
      } else {
        skipSerialKillerPhase(room);
      }
    }
  } else if (room.status === 'night_serial_killer') {
    const skPlayers = alivePlayers.filter(p => p.role === 'serial_killer');
    const skVoted = skPlayers.every(p => p.hasVoted);
    const nonSkSleepers = alivePlayers.filter(p => p.role !== 'serial_killer');
    const allSleepersDone = nonSkSleepers.every(p => p.hasDoneMiniGame);

    if (skVoted && allSleepersDone) {
      room.players.forEach(p => {
        p.hasVoted = false;
        p.voteTarget = null;
        p.hasDoneMiniGame = false;
      });

      transitionToMorning(room);
    }
  }
}

// Global ticker for phase timers
setInterval(() => {
  for (const code in rooms) {
    const room = rooms[code];
    if (room.status === 'discussion') {
      if (room.timerValue > 0) {
        room.timerValue--;
        if (room.timerValue <= 0) {
          transitionToVoting(room);
        }
      }
    } else if (room.status === 'morning') {
      if (room.timerValue > 0) {
        room.timerValue--;
        if (room.timerValue <= 0) {
          transitionToDiscussion(room);
        }
      }
    } else if (room.status === 'voting') {
      if (room.timerValue > 0) {
        room.timerValue--;
        if (room.timerValue <= 0) {
          tallyVotes(room);
        }
      }
    }
  }
}, 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Create game
  app.post("/api/game/create", (req, res) => {
    const { playerName, maxPlayers, selectedRoles, discussionTime, votingTime, playerId: clientPlayerId, mafiaCount } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: "Player name is required" });
    }

    const roomCode = generateRoomCode();
    const playerId = clientPlayerId || "p_" + Math.random().toString(36).substring(2, 9);

    const newRoom: GameRoom = {
      code: roomCode,
      creatorId: playerId,
      maxPlayers: parseInt(maxPlayers) || 5,
      discussionTime: parseInt(discussionTime) || 60,
      votingTime: parseInt(votingTime) || 30,
      selectedRoles: selectedRoles || [],
      status: 'waiting',
      players: [
        {
          id: playerId,
          name: playerName,
          role: '',
          isAlive: true,
          isHost: true,
          isBot: false,
          hasVoted: false,
          voteTarget: null,
          hasDoneMiniGame: false,
          selfHealUsed: false
        }
      ],
      messages: [],
      winner: null,
      nightActionLog: {
        mafiaTarget: null,
        doctorTarget: null,
        detectiveTarget: null,
        vigilanteTarget: null,
        serialKillerTarget: null
      },
      eliminatedLastNight: [],
      eliminatedLastDay: null,
      dayCount: 1,
      timerValue: 0,
      tieOccurred: false,
      votingSkipped: false,
      mafiaCount: mafiaCount ? parseInt(mafiaCount) : undefined
    };

    rooms[roomCode] = newRoom;
    res.json({ roomCode, player: newRoom.players[0] });
  });

  // Join game
  app.post("/api/game/join", (req, res) => {
    const { playerName, roomCode, playerId: clientPlayerId } = req.body;
    if (!playerName || !roomCode) {
      return res.status(400).json({ error: "Player name and room code are required" });
    }

    const code = roomCode.toUpperCase();
    const room = rooms[code];

    if (!room) {
      return res.status(404).json({ error: "Game room not found" });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: "Game has already started" });
    }

    // Check if player is already in this room (prevent duplicate additions)
    if (clientPlayerId) {
      const existingPlayer = room.players.find(p => p.id === clientPlayerId);
      if (existingPlayer) {
        return res.json({ roomCode: code, player: existingPlayer });
      }
    }

    if (room.players.length >= room.maxPlayers) {
      return res.status(400).json({ error: "Room is already full" });
    }

    const playerId = clientPlayerId || "p_" + Math.random().toString(36).substring(2, 9);
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: '',
      isAlive: true,
      isHost: false,
      isBot: false,
      hasVoted: false,
      voteTarget: null,
      hasDoneMiniGame: false,
      selfHealUsed: false
    };

    room.players.push(newPlayer);
    res.json({ roomCode: code, player: newPlayer });
  });

  // Fetch tailored game state
  app.get("/api/game/state", (req, res) => {
    const { code, playerId } = req.query;
    if (!code || !playerId) {
      return res.status(400).json({ error: "Room code and player ID are required" });
    }

    const room = rooms[(code as string).toUpperCase()];
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const currentPlayer = room.players.find(p => p.id === playerId);
    if (!currentPlayer) {
      return res.status(404).json({ error: "Player not found in this room" });
    }

    // Prepare client state
    // To preserve secret identities, we mask other players' roles unless the game is over.
    // Exception: Mafias can see each other.
    const isOver = room.status === 'game_over';
    const isCurrentMafia = currentPlayer.role === 'mafia' || currentPlayer.role === 'godmother';

    const cleanPlayers = room.players.map(p => {
      let roleToShow = '';
      if (isOver) {
        roleToShow = p.role;
      } else if (p.id === currentPlayer.id) {
        roleToShow = p.role;
      } else if (isCurrentMafia && (p.role === 'mafia' || p.role === 'godmother')) {
        roleToShow = p.role;
      }

      return {
        id: p.id,
        name: p.name,
        role: roleToShow,
        isAlive: p.isAlive,
        isHost: p.isHost,
        isBot: p.isBot,
        hasVoted: p.hasVoted,
        hasDoneMiniGame: p.hasDoneMiniGame
      };
    });

    // Clean messages
    // Non-mafias should not see private Mafia messages
    const cleanMessages = room.messages.filter(msg => {
      if (msg.isMafiaOnly) {
        return isCurrentMafia;
      }
      return true;
    });

    res.json({
      code: room.code,
      creatorId: room.creatorId,
      maxPlayers: room.maxPlayers,
      discussionTime: room.discussionTime,
      votingTime: room.votingTime,
      selectedRoles: room.selectedRoles,
      status: room.status,
      players: cleanPlayers,
      messages: cleanMessages,
      winner: room.winner,
      winnerName: room.winnerName,
      eliminatedLastNight: room.eliminatedLastNight,
      eliminatedLastDay: room.eliminatedLastDay,
      dayCount: room.dayCount,
      timerValue: room.timerValue,
      tieOccurred: room.tieOccurred,
      votingSkipped: room.votingSkipped,
      currentPlayerRole: currentPlayer.role,
      currentPlayerIsAlive: currentPlayer.isAlive,
      currentPlayerSelfHealUsed: currentPlayer.selfHealUsed
    });
  });

  // Action dispatcher
  app.post("/api/game/action", (req, res) => {
    const { roomCode, playerId, actionType, targetId, data } = req.body;
    if (!roomCode || !playerId) {
      return res.status(400).json({ error: "Room code and player ID are required" });
    }

    const room = rooms[roomCode.toUpperCase()];
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // 1. ADD BOTS
    if (actionType === 'add_bots') {
      if (!player.isHost) {
        return res.status(403).json({ error: "Only the host can add bots" });
      }
      if (room.status !== 'waiting') {
        return res.status(400).json({ error: "Cannot add bots after game starts" });
      }

      const botNames = ["Leo", "Sophia", "Marcus", "Emma", "Julius", "Diana", "Felix", "Clara", "Viktor", "Isabella", "Adrian", "Elena"];
      let addedCount = 0;

      while (room.players.length < room.maxPlayers) {
        const botId = "bot_" + Math.random().toString(36).substring(2, 9);
        const botName = botNames[room.players.length % botNames.length] + " (Bot)";
        room.players.push({
          id: botId,
          name: botName,
          role: '',
          isAlive: true,
          isHost: false,
          isBot: true,
          hasVoted: false,
          voteTarget: null,
          hasDoneMiniGame: false,
          selfHealUsed: false
        });
        addedCount++;
      }

      return res.json({ message: `${addedCount} bots added to room.`, room });
    }

    // 2. START GAME
    if (actionType === 'start_game') {
      if (!player.isHost) {
        return res.status(403).json({ error: "Only the host can start the game" });
      }
      if (room.players.length < room.maxPlayers) {
        return res.status(400).json({ error: "Wait for all players to join before starting" });
      }

      // Assign Roles
      // Mafia count:
      const N = room.maxPlayers;
      let mafiaCount = 1;
      if (room.mafiaCount !== undefined && room.mafiaCount !== null) {
        mafiaCount = room.mafiaCount;
      } else {
        if (N >= 6 && N <= 8) mafiaCount = 2;
        else if (N >= 9 && N <= 11) mafiaCount = 3;
        else if (N >= 12) mafiaCount = 4;
      }

      const rolesPool: string[] = [];
      const selectedSpecials = [...room.selectedRoles];

      // Godmother is part of the Mafia team.
      // Support multiple Godmothers if they are explicitly selected in selectedSpecials
      const godmothersRequested = selectedSpecials.filter(r => r === 'godmother').length;
      const finalGodmotherCount = Math.min(mafiaCount, godmothersRequested);
      const finalRegularMafiaCount = Math.max(0, mafiaCount - finalGodmotherCount);

      for (let i = 0; i < finalGodmotherCount; i++) {
        rolesPool.push('godmother');
      }

      // Fill remaining mafia slots with standard mafia
      for (let i = 0; i < finalRegularMafiaCount; i++) {
        rolesPool.push('mafia');
      }

      // Add other non-mafia special roles
      const civilianSpecials = selectedSpecials.filter(r => r !== 'godmother');
      civilianSpecials.forEach(r => rolesPool.push(r));

      // If rolesPool is too large for total player count N, truncate it safely
      if (rolesPool.length > N) {
        rolesPool.splice(N);
      }

      // Fill the rest of the pool with normal civilians
      const remainingSlots = N - rolesPool.length;
      for (let i = 0; i < remainingSlots; i++) {
        rolesPool.push('civilian');
      }

      // Shuffle pool
      for (let i = rolesPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
      }

      // Assign roles
      room.players.forEach((p, idx) => {
        p.role = rolesPool[idx];
        p.isAlive = true;
        p.hasVoted = false;
        p.voteTarget = null;
        p.hasDoneMiniGame = false;
      });

      room.status = 'night_mafia';
      room.dayCount = 1;
      room.messages.push({
        senderId: 'system',
        senderName: 'System',
        text: 'The game has officially started! Dark night has fallen over the village.',
        timestamp: Date.now(),
        isMafiaOnly: false
      });

      triggerBotActionsForPhase(room);
      checkPhaseTransition(room);
      return res.json({ message: "Game started", room });
    }

    // 3. MAFIA ACTION (VOTE TO KILL)
    if (actionType === 'mafia_kill') {
      if (room.status !== 'night_mafia') {
        return res.status(400).json({ error: "It is not the Mafia phase" });
      }
      if (player.role !== 'mafia' && player.role !== 'godmother') {
        return res.status(403).json({ error: "Only Mafias can kill" });
      }
      if (!player.isAlive) {
        return res.status(403).json({ error: "Eliminated players cannot perform actions" });
      }

      player.voteTarget = targetId;
      player.hasVoted = true;

      // Broadcast vote in mafia chat
      const targetName = room.players.find(p => p.id === targetId)?.name || 'Nobody';
      room.messages.push({
        senderId: player.id,
        senderName: player.name,
        text: `voted to eliminate ${targetName}`,
        timestamp: Date.now(),
        isMafiaOnly: true
      });

      checkPhaseTransition(room);
      return res.json({ message: "Mafia action recorded" });
    }

    // 4. DOCTOR ACTION (HEAL)
    if (actionType === 'doctor_save') {
      if (room.status !== 'night_doctor') {
        return res.status(400).json({ error: "It is not the Doctor phase" });
      }
      if (player.role !== 'doctor') {
        return res.status(403).json({ error: "Only the Doctor can heal" });
      }
      if (!player.isAlive) {
        return res.status(403).json({ error: "Eliminated players cannot perform actions" });
      }

      if (targetId === player.id) {
        if (player.selfHealUsed) {
          return res.status(400).json({ error: "You can only heal yourself once per game" });
        }
        player.selfHealUsed = true;
      }

      player.voteTarget = targetId;
      room.nightActionLog.doctorTarget = targetId;
      player.hasVoted = true;

      checkPhaseTransition(room);
      return res.json({ message: "Heal action recorded" });
    }

    // 5. DETECTIVE ACTION (INVESTIGATE)
    if (actionType === 'detective_inspect') {
      if (room.status !== 'night_detective') {
        return res.status(400).json({ error: "It is not the Detective phase" });
      }
      if (player.role !== 'detective') {
        return res.status(403).json({ error: "Only the Detective can investigate" });
      }
      if (!player.isAlive) {
        return res.status(403).json({ error: "Eliminated players cannot perform actions" });
      }

      const target = room.players.find(p => p.id === targetId);
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }

      // Godmother registers as Clean/Innocent
      const isMafia = (target.role === 'mafia'); // Godmother 'godmother' returns false
      player.voteTarget = targetId;
      room.nightActionLog.detectiveTarget = targetId;
      player.hasVoted = true;

      const detectionResult = isMafia ? "MAFIA" : "INNOCENT";

      // Post dynamic system message visible ONLY to detective
      room.messages.push({
        senderId: 'system_detective',
        senderName: 'Investigation Report',
        text: `${target.name} registers as: ${detectionResult}`,
        timestamp: Date.now(),
        isMafiaOnly: false // Tailored in API state return later
      });

      // Inject report text directly in response for instant feedback
      checkPhaseTransition(room);
      return res.json({ message: "Investigation completed", result: detectionResult });
    }

    // 6. VIGILANTE ACTION (SHOOT)
    if (actionType === 'vigilante_shoot') {
      if (room.status !== 'night_vigilante') {
        return res.status(400).json({ error: "It is not the Vigilante phase" });
      }
      if (player.role !== 'vigilante') {
        return res.status(403).json({ error: "Only the Vigilante can shoot" });
      }
      if (!player.isAlive) {
        return res.status(403).json({ error: "Eliminated players cannot perform actions" });
      }

      player.voteTarget = targetId;
      room.nightActionLog.vigilanteTarget = targetId; // Can be null if skipped
      player.hasVoted = true;

      checkPhaseTransition(room);
      return res.json({ message: "Vigilante choice submitted" });
    }

    // 7. SERIAL KILLER ACTION (KILL)
    if (actionType === 'serial_killer_kill') {
      if (room.status !== 'night_serial_killer') {
        return res.status(400).json({ error: "It is not the Serial Killer phase" });
      }
      if (player.role !== 'serial_killer') {
        return res.status(403).json({ error: "Only the Serial Killer can kill" });
      }
      if (!player.isAlive) {
        return res.status(403).json({ error: "Eliminated players cannot perform actions" });
      }

      player.voteTarget = targetId;
      room.nightActionLog.serialKillerTarget = targetId;
      player.hasVoted = true;

      checkPhaseTransition(room);
      return res.json({ message: "Serial killer choice submitted" });
    }

    // 8. MINI GAME COMPLETE
    if (actionType === 'mini_game_complete') {
      player.hasDoneMiniGame = true;
      checkPhaseTransition(room);
      return res.json({ message: "Mini-game cleared" });
    }

    // 9. CHAT MESSAGE
    if (actionType === 'send_chat') {
      const { text, isMafiaOnly } = data;
      if (!text) {
        return res.status(400).json({ error: "Message text is required" });
      }

      const isCurrentMafia = player.role === 'mafia' || player.role === 'godmother';
      if (isMafiaOnly && !isCurrentMafia) {
        return res.status(403).json({ error: "Only Mafias can send secret messages" });
      }

      // Eliminated players cannot chat anymore
      if (!player.isAlive) {
        return res.status(403).json({ error: "Eliminated players cannot chat" });
      }

      room.messages.push({
        senderId: player.id,
        senderName: player.name,
        text,
        timestamp: Date.now(),
        isMafiaOnly: !!isMafiaOnly
      });

      return res.json({ message: "Message posted" });
    }

    // 10. SKIP DISCUSSION
    if (actionType === 'skip_discussion') {
      if (room.status !== 'discussion') {
        return res.status(400).json({ error: "Not in discussion phase" });
      }
      transitionToVoting(room);
      return res.json({ message: "Discussion skipped", room });
    }

    // 11. VOTE FOR PLAYER
    if (actionType === 'vote_player') {
      if (room.status !== 'voting') {
        return res.status(400).json({ error: "Not in voting phase" });
      }
      if (!player.isAlive) {
        return res.status(403).json({ error: "Eliminated players cannot vote" });
      }

      player.voteTarget = targetId; // Can be a player ID or 'skip'
      player.hasVoted = true;

      // Check if all alive players have voted
      const alivePlayers = room.players.filter(p => p.isAlive);
      if (alivePlayers.every(p => p.hasVoted)) {
        tallyVotes(room);
      }

      return res.json({ message: "Vote cast successfully" });
    }

    // 12. LEAVE GAME (MID-PLAY SAFETY NET)
    if (actionType === 'leave_game') {
      player.isAlive = false; // Mark dead so the game is not disrupted
      // Remove from room if still in waiting state
      if (room.status === 'waiting') {
        room.players = room.players.filter(p => p.id !== playerId);
        if (room.players.length === 0) {
          delete rooms[roomCode];
        } else if (room.creatorId === playerId) {
          room.creatorId = room.players[0].id;
          room.players[0].isHost = true;
        }
      } else {
        // If mid-game, post leaving notice
        room.messages.push({
          senderId: 'system',
          senderName: 'System',
          text: `${player.name} left the game and was eliminated.`,
          timestamp: Date.now(),
          isMafiaOnly: false
        });
        checkGameOverConditions(room);
      }
      return res.json({ message: "You left the game successfully." });
    }

    res.status(400).json({ error: "Invalid action" });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
