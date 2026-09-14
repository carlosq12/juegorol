require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const db = require('./db');
const gmEngine = require('./gm-engine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Memoria de habilidades tácticas preparadas por sala (visibilidad en tiempo real entre integrantes)
const roomPreparedAbilities = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// RUTAS REST
// -------------------------------------------------------------

// Registro de nuevo usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Nombre de usuario, correo y contraseña son obligatorios.' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
    }

    const user = await db.registerUser(username, email, password);
    res.json(user);
  } catch (err) {
    console.error('Error en /api/auth/register:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Debes ingresar tu nombre de usuario o correo.' });
    }
    const user = await db.loginUser(identifier, password);
    res.json(user);
  } catch (err) {
    console.error('Error en /api/auth/login:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Compatibilidad previa
app.post('/api/login', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Username y Email son requeridos' });
    }
    const user = await db.findOrCreateUser(username.trim(), email.trim().toLowerCase());
    res.json(user);
  } catch (err) {
    console.error('Error en /api/login:', err);
    res.status(500).json({ error: 'Error al iniciar sesión en el servidor' });
  }
});

// Crear una nueva sala
app.post('/api/rooms', async (req, res) => {
  try {
    const { hostId, storySelected } = req.body;
    if (!hostId) {
      return res.status(400).json({ error: 'hostId es requerido' });
    }
    const room = await db.createRoom(hostId, storySelected || '1');
    res.json(room);
  } catch (err) {
    console.error('Error en /api/rooms:', err);
    res.status(500).json({ error: 'Error al crear la sala' });
  }
});

// Obtener datos de sala por código
app.get('/api/rooms/:code', async (req, res) => {
  try {
    const room = await db.getRoomByCode(req.params.code);
    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }
    const characters = await db.getCharactersByRoom(room.id);
    const messages = await db.getRoomMessages(room.id);
    const combatState = gmEngine.getOrCreateCombatState(room.id, room.story_selected);
    res.json({ room, characters, messages, combatState });
  } catch (err) {
    console.error('Error en /api/rooms/:code:', err);
    res.status(500).json({ error: 'Error al obtener la sala' });
  }
});

// Obtener la expedición activa del usuario (para reanudar al refrescar o en menú principal)
app.get('/api/users/:userId/active-room', async (req, res) => {
  try {
    const activeRoom = await db.getActiveRoomForUser(req.params.userId);
    if (!activeRoom) {
      return res.json({ activeRoom: null });
    }
    const characters = await db.getCharactersByRoom(activeRoom.id);
    const messages = await db.getRoomMessages(activeRoom.id);
    const combatState = gmEngine.getOrCreateCombatState(activeRoom.id, activeRoom.story_selected);
    res.json({ activeRoom, characters, messages, combatState });
  } catch (err) {
    console.error('Error en /api/users/:userId/active-room:', err);
    res.status(500).json({ error: 'Error al consultar expedición activa' });
  }
});

// Obtener el historial de expediciones del usuario (con personajes, ítems y resultados)
app.get('/api/users/:userId/expeditions', async (req, res) => {
  try {
    const history = await db.getUserExpeditionHistory(req.params.userId);
    res.json({ expeditions: history || [] });
  } catch (err) {
    console.error('Error en /api/users/:userId/expeditions:', err);
    res.status(500).json({ error: 'Error al consultar historial de expediciones' });
  }
});

// Obtener detalle completo de una expedición (sala, personajes con ítems y crónica completa del GM)
app.get('/api/rooms/:roomId/summary', async (req, res) => {
  try {
    const details = await db.getExpeditionDetails(req.params.roomId);
    if (!details || !details.room) {
      return res.status(404).json({ error: 'Expedición no encontrada' });
    }
    res.json(details);
  } catch (err) {
    console.error('Error en /api/rooms/:roomId/summary:', err);
    res.status(500).json({ error: 'Error al consultar resumen de la expedición' });
  }
});

// Crear o actualizar personaje en una sala
app.post('/api/characters', async (req, res) => {
  try {
    const { userId, roomId, name, className } = req.body;
    if (!userId || !roomId || !name || !className) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const character = await db.createCharacter(userId, roomId, name, className);
    // Notificar por sockets a la sala
    const characters = await db.getCharactersByRoom(roomId);
    io.to(roomId).emit('players_updated', characters);
    io.to(roomId).emit('player_alert', {
      type: 'success',
      title: 'Héroe Forjado',
      message: `✨ ${character.name} (${className}) se ha alistado en la expedición.`
    });
    res.json(character);
  } catch (err) {
    console.error('Error en /api/characters:', err);
    res.status(500).json({ error: 'Error al crear personaje' });
  }
});

// -------------------------------------------------------------
// WEBSOCKETS (SOCKET.IO)
// -------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);

  // Unirse a la sala de sockets
  socket.on('join_room', async ({ roomId, userId, username }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;
    socket.username = username;

    try {
      const room = await db.getRoomById(roomId);
      if (room) {
        const characters = await db.getCharactersByRoom(roomId);
        const messages = await db.getRoomMessages(roomId);
        const combatState = gmEngine.getOrCreateCombatState(roomId, room.story_selected);
        socket.emit('room_sync', { room, characters, messages, combatState });

        if (roomPreparedAbilities.has(roomId)) {
          const list = Array.from(roomPreparedAbilities.get(roomId).values());
          socket.emit('initial_turn_abilities', { abilities: list });
        }

        if (username) {
          socket.to(roomId).emit('player_alert', {
            type: 'info',
            title: 'Aventurero Conectado',
            message: `👤 ${username} se ha unido a la expedición.`
          });
        }
      }
    } catch (err) {
      console.error('Error en join_room:', err);
    }
  });

  // Iniciar la partida (Host)
  socket.on('start_game', async ({ roomId }) => {
    try {
      const room = await db.getRoomById(roomId);
      if (!room) return;

      const characters = await db.getCharactersByRoom(roomId);
      const storyKey = String(room.story_selected || '1');
      const minRequired = storyKey === '1' ? 2 : (storyKey === '2' ? 4 : 6);

      if (characters.length < minRequired) {
        socket.emit('game_start_error', {
          message: `Se requieren al menos ${minRequired} integrantes con personaje creado para iniciar esta historia. Actualmente hay ${characters.length}.`
        });
        return;
      }

      await db.updateRoomStatus(roomId, 'active');
      const combatState = gmEngine.getOrCreateCombatState(roomId, room.story_selected);

      // Narrativa de apertura según la historia seleccionada
      let introParagraph1 = '';
      if (storyKey === '1') {
        introParagraph1 = `Bajo un firmamento de éter palpitante, las ruinas de Aethelgard flotan en gravedad quebrada. Torres colosales y monolitos de basalto giran lentamente sobre el abismo, desafiando las leyes físicas. Vuestro dúo de aventureros siente el tirón de las corrientes ingrávidas mientras los Acechadores de la Singularidad emergen batiendo alas de vacío sobre la plataforma.`;
      } else if (storyKey === '2') {
        introParagraph1 = `En las profundidades del Abismo de Masa Negativa, las rocas caen hacia el techo en una inversión gravitacional constante. Vuestro escuadrón de aventureros avanza con paso firme sobre el basalto cuando las cavernas retumban: un titánico Gólem de Basalto Levitante despierta rodeado de vástagos cinéticos.`;
      } else {
        introParagraph1 = `En la cúspide de la Aguja Celestial, un vórtice cósmico rasga la realidad en corrientes de gravedad cero. Vuestra gran expedición de aventureros se posiciona en formaciones etéreas mientras una colosal Mantarraya del Éter Cósmico y espectros de masa negativa descienden desde las grietas dimensionales.`;
      }

      const introMsg = `### ⚔️ ¡Comienza el Combate! - Turno 1 (Fase de Ataque de los Héroes)\n\n` +
        `**Enemigos en el Campo:** ${combatState.enemies.map(e => `**${e.name}** (${e.hp}/${e.maxHp} PS)`).join(' | ')}\n\n` +
        `* **Anomalía:** ${combatState.anomaly.split(':')[0]}\n\n` +
        `> ⚔️ **¡Tenéis la iniciativa!** En este turno impar vosotros atacáis (**Atacar** o **Interactuar**). Los monstruos resistirán y contraatacarán en el Turno 2.`;

      const savedMsg = await db.saveMessage(roomId, null, introMsg, 'narrative');

      io.to(roomId).emit('game_started', {
        room: { ...room, status: 'active' },
        characters,
        combatState,
        introMessage: savedMsg
      });

      io.to(roomId).emit('player_alert', {
        type: 'epic',
        title: '¡Aventura Iniciada!',
        message: '⚔️ El combate ha comenzado. ¡Turno 1: Fase de Ataque de los Héroes!'
      });
    } catch (err) {
      console.error('Error en start_game:', err);
    }
  });

  // Previsualización y aviso táctico de habilidad en tiempo real entre integrantes
  socket.on('select_ability_preview', async ({ roomId, characterId, ability, d20Roll }) => {
    try {
      if (!roomId || !characterId || !ability) return;
      let roomAbilities = roomPreparedAbilities.get(roomId);
      if (!roomAbilities) {
        roomAbilities = new Map();
        roomPreparedAbilities.set(roomId, roomAbilities);
      }
      const char = await db.getCharacterById(characterId);
      const entry = {
        characterId,
        characterName: char ? char.name : 'Un aventurero',
        characterClass: char ? char.class : 'Mago',
        ability,
        d20Roll: d20Roll || null,
        isSubmitted: false
      };
      roomAbilities.set(characterId, entry);

      // Notificar a todos en la sala qué habilidad seleccionó o qué dado sacó el aventurero
      io.to(roomId).emit('team_ability_preview', entry);
    } catch (err) {
      console.error('Error en select_ability_preview:', err);
    }
  });

  // Enviar acción de turno
  socket.on('submit_action', async ({ roomId, characterId, actionSelected, flavorText, abilityId, rolledDmg, d20Roll, abilityData }) => {
    try {
      const room = await db.getRoomById(roomId);
      if (!room || room.status !== 'active') return;

      const d20Part = d20Roll ? `|d20:${d20Roll}` : '';
      const rollPart = rolledDmg ? `|roll:${rolledDmg}` : '';
      const meta = abilityId ? `[ability:${abilityId}${d20Part}${rollPart}] ` : '';
      const savedFlavor = meta ? `${meta}${flavorText || ''}` : flavorText;
      await db.saveTurnAction(roomId, characterId, room.current_turn, actionSelected, savedFlavor);

      // Notificar a la sala que este personaje ya envió su acción
      const submittedActions = await db.getActionsForTurn(roomId, room.current_turn);
      const characters = await db.getCharactersByRoom(roomId);
      const currentChar = characters.find(c => c.id === characterId);
      const aliveCharacters = characters.filter(c => c.is_alive);

      // Actualizar estado en memoria de la habilidad a 'isSubmitted: true' y retransmitir
      let roomAbilities = roomPreparedAbilities.get(roomId);
      if (!roomAbilities) {
        roomAbilities = new Map();
        roomPreparedAbilities.set(roomId, roomAbilities);
      }
      const existing = roomAbilities.get(characterId) || {};
      const updatedEntry = {
        characterId,
        characterName: currentChar ? currentChar.name : 'Un aventurero',
        characterClass: currentChar ? currentChar.class : 'Mago',
        ability: abilityData || existing.ability || { id: abilityId, name: actionSelected, icon: '⚔️' },
        d20Roll: d20Roll || existing.d20Roll || null,
        isSubmitted: true
      };
      roomAbilities.set(characterId, updatedEntry);
      io.to(roomId).emit('team_ability_preview', updatedEntry);

      // Identificar sockets conectados actualmente en la sala
      const socketRoom = io.sockets.adapter.rooms.get(roomId);
      const connectedUserIds = new Set();
      if (socketRoom) {
        for (const sId of socketRoom) {
          const clientSock = io.sockets.sockets.get(sId);
          if (clientSock && clientSock.userId) {
            connectedUserIds.add(String(clientSock.userId).toUpperCase());
          }
        }
      }

      const connectedAliveChars = aliveCharacters.filter(c => connectedUserIds.has(String(c.user_id).toUpperCase()));
      const targetCount = connectedAliveChars.length > 0 ? connectedAliveChars.length : aliveCharacters.length;

      io.to(roomId).emit('action_received', {
        characterId,
        characterName: currentChar ? currentChar.name : 'Un aventurero',
        submittedCount: submittedActions.length,
        totalAlive: targetCount
      });

      const abilityLabel = (abilityData && abilityData.name) || (existing.ability && existing.ability.name) || actionSelected;
      io.to(roomId).emit('player_alert', {
        type: 'action',
        title: 'Turno Pasado',
        message: `🎲 ${currentChar ? currentChar.name : 'Un héroe'} selló [${abilityLabel}] con D20 [${d20Roll || 10}] (${submittedActions.length}/${targetCount} listos).`
      });

      // Si todos los personajes vivos conectados enviaron su acción, resolver automáticamente
      if (submittedActions.length >= targetCount) {
        await resolveTurnInternal(roomId);
      }
    } catch (err) {
      console.error('Error en submit_action:', err);
    }
  });

  // Forzar resolución de turno (por ejemplo, por el host si alguien tarda)
  socket.on('force_resolve_turn', async ({ roomId }) => {
    try {
      await resolveTurnInternal(roomId);
    } catch (err) {
      console.error('Error en force_resolve_turn:', err);
    }
  });

  // Chat general de la sala
  socket.on('send_chat', async ({ roomId, senderId, username, content }) => {
    try {
      if (!content || !content.trim()) return;
      const msg = await db.saveMessage(roomId, senderId, content.trim(), 'chat');
      // Asegurar que si el mensaje no trajo username de la BD, use el proporcionado
      if (!msg.username && username) {
        msg.username = username;
      }
      io.to(roomId).emit('new_message', msg);
    } catch (err) {
      console.error('Error en send_chat:', err);
    }
  });

  // Equipar o reemplazar ítem de botín (máximo 3 slots)
  socket.on('equip_item', async ({ roomId, characterId, item, replaceIndex }) => {
    try {
      if (!characterId || !item) return;
      const char = await db.getCharacterById(characterId);
      if (!char) return;

      let items = Array.isArray(char.items) ? [...char.items] : [];
      if (typeof replaceIndex === 'number' && replaceIndex >= 0 && replaceIndex < 3) {
        items[replaceIndex] = item;
      } else if (items.length < 3) {
        items.push(item);
      } else {
        items[2] = item;
      }

      items = items.slice(0, 3);
      await db.updateCharacterItems(characterId, items);

      const updatedCharacters = await db.getCharactersByRoom(roomId);
      io.to(roomId).emit('inventory_updated', {
        characterId,
        characterName: char.name,
        items,
        characters: updatedCharacters
      });

      io.to(roomId).emit('player_alert', {
        type: 'loot',
        title: '🎁 Ítem Equipado',
        message: `${char.name} equipó ${item.icon} ${item.name} (${item.statText}).`
      });
    } catch (err) {
      console.error('Error en equip_item:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

/**
 * Función central de resolución de turno
 */
async function resolveTurnInternal(roomId) {
  const room = await db.getRoomById(roomId);
  if (!room) return;

  const currentTurn = room.current_turn;
  const characters = await db.getCharactersByRoom(roomId);
  const actions = await db.getActionsForTurn(roomId, currentTurn);

  // Ejecutar el motor del Game Master
  const resolution = await gmEngine.resolveCombatTurn(room, characters, actions);

  // Actualizar estados de los personajes en la BD
  for (const pRes of resolution.playerResults) {
    await db.updateCharacterStatus(pRes.player.id, {
      hp: pRes.currentHp,
      lives: pRes.currentLives,
      is_alive: pRes.isAlive
    });
  }

  // Marcar acciones como resueltas
  await db.markActionsResolved(roomId, currentTurn);

  // Guardar mensaje del Director de Juego en la BD
  const gmMessage = await db.saveMessage(roomId, null, resolution.fullGmMessage, 'narrative');

  // Limpiar memoria de habilidades preparadas para la nueva ronda
  roomPreparedAbilities.delete(roomId);

  // Avanzar número de turno o finalizar partida
  const isVictory = Boolean(resolution.isVictory);
  const isDefeat = Boolean(resolution.isDefeat);
  const isGameOver = isVictory || isDefeat;

  let nextTurn = currentTurn;
  if (!isGameOver) {
    nextTurn = currentTurn + 1;
    await db.advanceRoomTurn(roomId, nextTurn);
  } else if (isVictory) {
    await db.updateRoomStatus(roomId, 'completed');
  } else if (isDefeat) {
    await db.updateRoomStatus(roomId, 'defeated');
  }

  // Obtener personajes actualizados
  const updatedCharacters = await db.getCharactersByRoom(roomId);

  // Emitir evento de turno resuelto a todos los jugadores
  io.to(roomId).emit('turn_resolved', {
    turnNumber: currentTurn,
    nextTurn,
    isGameOver,
    isVictory,
    isDefeat,
    characters: updatedCharacters,
    combatState: resolution.combatState,
    gmMessage,
    lootDrop: resolution.lootDrop,
    resolutionDetails: resolution.playerResults || []
  });

  // Si hubo botín desprendido de una criatura, emitir evento específico
  if (resolution.lootDrop) {
    io.to(roomId).emit('loot_dropped', {
      item: resolution.lootDrop,
      turnNumber: currentTurn
    });
    io.to(roomId).emit('player_alert', {
      type: 'loot',
      title: '🎁 ¡BOTÍN DE GUERRA!',
      message: `¡Ha caído ${resolution.lootDrop.icon} ${resolution.lootDrop.name} (${resolution.lootDrop.statText})!`
    });
  }

  // Si la partida terminó (Victoria o Derrota), emitir game_ended
  if (isGameOver) {
    io.to(roomId).emit('game_ended', {
      type: isVictory ? 'victory' : 'defeat',
      title: isVictory ? '🏆 ¡VICTORIA CÓSMICA TOTAL!' : '💀 DERROTA ABSOLUTA',
      message: isVictory
        ? '¡Habéis erradicado a las 10 criaturas del abismo y restablecido el equilibrio cósmico de la gravedad!'
        : 'Todas las almas del grupo han sucumbido al vacío insondable. La expedición ha terminado.',
      monstersDefeated: resolution.monstersDefeated || (isVictory ? 10 : 0),
      totalMonsters: 10,
      turns: currentTurn,
      characters: updatedCharacters,
      combatState: resolution.combatState,
      roomId
    });
  } else {
    // Notificación de nueva fase para el siguiente turno
    const isNextHeroPhase = (nextTurn % 2) === 1;
    io.to(roomId).emit('player_alert', {
      type: isNextHeroPhase ? 'attack' : 'defense',
      title: isNextHeroPhase ? `⚔️ Turno ${nextTurn} • Fase de Ataque` : `🛡️ Turno ${nextTurn} • Fase de Defensa`,
      message: isNextHeroPhase
        ? `¡Vuestro turno de atacar a los monstruos!`
        : `⚠️ ¡Los monstruos pasan a la ofensiva! Selecciona tu defensa.`
    });
  }

  // Alertas específicas si hubo críticos o colapsos
  resolution.playerResults.forEach(pRes => {
    if (pRes.isCrit) {
      io.to(roomId).emit('player_alert', {
        type: 'crit',
        title: '🔥 ¡GOLPE CRÍTICO!',
        message: `¡${pRes.player.name} conectó un impacto crítico gravitacional!`
      });
    }
    if (pRes.collapsedThisTurn) {
      io.to(roomId).emit('player_alert', {
        type: 'danger',
        title: '💀 ¡COLAPSO VITAL!',
        message: `¡${pRes.player.name} perdió un alma! Vidas restantes: ${pRes.currentLives}.`
      });
    }
  });

  console.log(`Turno ${currentTurn} resuelto para la sala ${room.room_code}${isGameOver ? ` [FIN: ${isVictory ? 'VICTORIA' : 'DERROTA'}]` : ''}`);
}

// Iniciar servidor
server.listen(PORT, () => {
  console.log(` Servidor Antigravyty corriendo en http://localhost:${PORT}`);
});
