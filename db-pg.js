/**
 * Adaptador de Base de Datos PostgreSQL para Render / Cloud (Supabase, Neon, Railway)
 * Soporta conexión por DATABASE_URL y auto-inicialización de esquema de tablas.
 */
const { Pool } = require('pg');
const crypto = require('crypto');

let pgPool = null;

function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

async function getPool() {
  if (!pgPool) {
    const connectionString = process.env.DATABASE_URL;
    const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    pgPool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    try {
      await initPgSchema(pgPool);
      console.log(' Conectado exitosamente a PostgreSQL (Render/Cloud)');
    } catch (err) {
      console.error(' Error al inicializar esquema PostgreSQL:', err);
      throw err;
    }
  }
  return pgPool;
}

async function initPgSchema(pool) {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255),
      games_played INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id UUID PRIMARY KEY,
      room_code VARCHAR(10) UNIQUE NOT NULL,
      host_id UUID,
      story_selected VARCHAR(20) DEFAULT '1',
      status VARCHAR(20) DEFAULT 'waiting',
      current_turn INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS characters (
      id UUID PRIMARY KEY,
      room_id UUID,
      user_id UUID,
      name VARCHAR(50) NOT NULL,
      class VARCHAR(20) NOT NULL,
      hp INT DEFAULT 10,
      lives INT DEFAULT 3,
      is_alive BOOLEAN DEFAULT TRUE,
      items TEXT DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS turn_actions (
      id UUID PRIMARY KEY,
      room_id UUID,
      character_id UUID,
      turn_number INT NOT NULL,
      action_selected VARCHAR(20) NOT NULL,
      flavor_text TEXT,
      is_resolved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY,
      room_id UUID,
      sender_id UUID,
      content TEXT NOT NULL,
      action_type VARCHAR(20) DEFAULT 'chat',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(schemaSql);
}

// -------------------------------------------------------------
// AUTENTICACIÓN Y USUARIOS
// -------------------------------------------------------------
async function registerUser(username, email, password) {
  const p = await getPool();
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  const checkUser = await p.query('SELECT id FROM users WHERE username = $1', [cleanUsername]);
  if (checkUser.rows.length > 0) {
    throw new Error('El nombre de aventurero ya está en uso. Elige otro.');
  }

  const checkEmail = await p.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
  if (checkEmail.rows.length > 0) {
    throw new Error('El correo electrónico ya está registrado. Inicia sesión.');
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  await p.query(
    'INSERT INTO users (id, username, email, password, games_played) VALUES ($1, $2, $3, $4, 0)',
    [id, cleanUsername, cleanEmail, passwordHash]
  );

  return { id, username: cleanUsername, email: cleanEmail, games_played: 0 };
}

async function loginUser(identifier, password) {
  const p = await getPool();
  const cleanId = (identifier || '').trim();

  const res = await p.query('SELECT * FROM users WHERE username = $1 OR email = $1', [cleanId]);
  if (res.rows.length === 0) {
    throw new Error('Usuario o correo no encontrado. Verifica los datos o regístrate.');
  }

  const user = res.rows[0];

  if (user.password) {
    const inputHash = hashPassword(password);
    if (inputHash !== user.password) {
      throw new Error('Contraseña incorrecta.');
    }
  } else if (password) {
    const newHash = hashPassword(password);
    await p.query('UPDATE users SET password = $1 WHERE id = $2', [newHash, user.id]);
  }

  const { password: _, ...userSafe } = user;
  return userSafe;
}

async function findOrCreateUser(username, email) {
  const p = await getPool();
  const check = await p.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
  if (check.rows.length > 0) {
    const { password: _, ...userSafe } = check.rows[0];
    return userSafe;
  }

  const id = crypto.randomUUID();
  await p.query(
    'INSERT INTO users (id, username, email, games_played) VALUES ($1, $2, $3, 0)',
    [id, username, email]
  );

  return { id, username, email, games_played: 0 };
}

async function incrementUserGames(userId) {
  const p = await getPool();
  await p.query('UPDATE users SET games_played = COALESCE(games_played, 0) + 1 WHERE id = $1', [userId]);
}

// -------------------------------------------------------------
// SALAS (ROOMS)
// -------------------------------------------------------------
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createRoom(hostId, storySelected = '1') {
  const p = await getPool();
  const id = crypto.randomUUID();
  let code = generateRoomCode();

  for (let attempts = 0; attempts < 5; attempts++) {
    const check = await p.query('SELECT id FROM rooms WHERE room_code = $1', [code]);
    if (check.rows.length === 0) break;
    code = generateRoomCode();
  }

  await p.query(
    'INSERT INTO rooms (id, room_code, host_id, story_selected, status, current_turn) VALUES ($1, $2, $3, $4, $5, 1)',
    [id, code, hostId, storySelected, 'waiting']
  );

  return {
    id,
    room_code: code,
    host_id: hostId,
    story_selected: storySelected,
    status: 'waiting',
    current_turn: 1
  };
}

async function getRoomByCode(roomCode) {
  const p = await getPool();
  const cleanCode = (roomCode || '').trim().toUpperCase();
  const res = await p.query('SELECT * FROM rooms WHERE room_code = $1', [cleanCode]);
  return res.rows[0] || null;
}

async function getRoomById(roomId) {
  const p = await getPool();
  const res = await p.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
  return res.rows[0] || null;
}

async function getActiveRoomForUser(userId) {
  const p = await getPool();
  const res = await p.query(`
    SELECT 
      r.*,
      c.id AS character_id,
      c.name AS character_name,
      c.class AS character_class,
      c.hp AS character_hp,
      c.lives AS character_lives
    FROM rooms r
    LEFT JOIN characters c ON c.room_id = r.id AND c.user_id = $1
    WHERE (r.host_id = $1 OR c.user_id = $1)
      AND r.status IN ('waiting', 'active')
    ORDER BY r.created_at DESC
    LIMIT 1
  `, [userId]);

  return res.rows[0] || null;
}

async function updateRoomStatus(roomId, status) {
  const p = await getPool();
  await p.query('UPDATE rooms SET status = $1 WHERE id = $2', [status, roomId]);
}

async function advanceRoomTurn(roomId, nextTurnNumber) {
  const p = await getPool();
  await p.query('UPDATE rooms SET current_turn = $1 WHERE id = $2', [nextTurnNumber, roomId]);
}

// -------------------------------------------------------------
// PERSONAJES (CHARACTERS)
// -------------------------------------------------------------
function parseCharacterItems(rawItems) {
  if (!rawItems) return [];
  if (Array.isArray(rawItems)) return rawItems;
  try {
    const parsed = JSON.parse(rawItems);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function createCharacter(roomId, userId, name, characterClass) {
  const p = await getPool();
  const id = crypto.randomUUID();

  await p.query(
    `INSERT INTO characters (id, room_id, user_id, name, class, hp, lives, is_alive, items)
     VALUES ($1, $2, $3, $4, $5, 10, 3, TRUE, '[]')`,
    [id, roomId, userId, name, characterClass]
  );

  return {
    id,
    room_id: roomId,
    user_id: userId,
    name,
    class: characterClass,
    hp: 10,
    lives: 3,
    is_alive: true,
    items: []
  };
}

async function getCharacterById(characterId) {
  const p = await getPool();
  const res = await p.query('SELECT * FROM characters WHERE id = $1', [characterId]);
  const char = res.rows[0];
  if (char) {
    char.items = parseCharacterItems(char.items);
  }
  return char || null;
}

async function getCharactersByRoom(roomId) {
  const p = await getPool();
  const res = await p.query('SELECT * FROM characters WHERE room_id = $1 ORDER BY created_at ASC', [roomId]);
  return res.rows.map(c => ({
    ...c,
    items: parseCharacterItems(c.items)
  }));
}

async function updateCharacterStatus(characterId, { hp, lives, is_alive }) {
  const p = await getPool();
  await p.query(
    'UPDATE characters SET hp = $1, lives = $2, is_alive = $3 WHERE id = $4',
    [hp, lives, is_alive, characterId]
  );
}

async function updateCharacterItems(characterId, items) {
  const p = await getPool();
  const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);
  await p.query('UPDATE characters SET items = $1 WHERE id = $2', [itemsJson, characterId]);
}

// -------------------------------------------------------------
// ACCIONES DE TURNO (TURN_ACTIONS)
// -------------------------------------------------------------
async function saveTurnAction(roomId, characterId, turnNumber, actionSelected, flavorText) {
  const p = await getPool();
  const id = crypto.randomUUID();

  await p.query(
    `INSERT INTO turn_actions (id, room_id, character_id, turn_number, action_selected, flavor_text, is_resolved)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
    [id, roomId, characterId, turnNumber, actionSelected, flavorText]
  );

  return { id, room_id: roomId, character_id: characterId, turn_number: turnNumber, action_selected: actionSelected, flavor_text: flavorText, is_resolved: false };
}

async function getActionsForTurn(roomId, turnNumber) {
  const p = await getPool();
  const res = await p.query(
    'SELECT * FROM turn_actions WHERE room_id = $1 AND turn_number = $2 AND is_resolved = FALSE',
    [roomId, turnNumber]
  );
  return res.rows;
}

async function markActionsResolved(roomId, turnNumber) {
  const p = await getPool();
  await p.query(
    'UPDATE turn_actions SET is_resolved = TRUE WHERE room_id = $1 AND turn_number = $2',
    [roomId, turnNumber]
  );
}

// -------------------------------------------------------------
// MENSAJES Y CHAT (MESSAGES)
// -------------------------------------------------------------
async function saveMessage(roomId, senderId, content, actionType = 'chat') {
  const p = await getPool();
  const id = crypto.randomUUID();

  await p.query(
    'INSERT INTO messages (id, room_id, sender_id, content, action_type) VALUES ($1, $2, $3, $4, $5)',
    [id, roomId, senderId, content, actionType]
  );

  let username = null;
  let characterName = null;
  let characterClass = null;

  if (senderId) {
    try {
      const userRes = await p.query(`
        SELECT u.username, c.name AS character_name, c.class AS character_class
        FROM users u
        LEFT JOIN characters c ON c.user_id = u.id AND c.room_id = $1
        WHERE u.id = $2
      `, [roomId, senderId]);

      if (userRes.rows.length > 0) {
        username = userRes.rows[0].username;
        characterName = userRes.rows[0].character_name;
        characterClass = userRes.rows[0].character_class;
      }
    } catch (e) {
      console.error('Error al obtener usuario para mensaje:', e);
    }
  }

  return {
    id,
    roomId,
    sender_id: senderId,
    senderId,
    username,
    character_name: characterName,
    characterName,
    character_class: characterClass,
    characterClass,
    content,
    action_type: actionType,
    actionType,
    created_at: new Date()
  };
}

async function getRoomMessages(roomId, limit = 50) {
  const p = await getPool();
  const res = await p.query(`
    SELECT m.*, u.username, c.name AS character_name, c.class AS character_class
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    LEFT JOIN characters c ON c.user_id = u.id AND c.room_id = m.room_id
    WHERE m.room_id = $1
    ORDER BY m.created_at ASC
    LIMIT $2
  `, [roomId, limit]);
  return res.rows;
}

// -------------------------------------------------------------
// HISTORIAL DE EXPEDICIONES
// -------------------------------------------------------------
async function getUserExpeditionHistory(userId) {
  const p = await getPool();
  const res = await p.query(`
    SELECT 
      r.id,
      r.room_code,
      r.story_selected,
      r.host_id,
      r.status,
      r.current_turn,
      r.created_at,
      c.id AS my_character_id,
      c.name AS my_character_name,
      c.class AS my_character_class,
      c.items AS my_character_items,
      c.is_alive AS my_character_alive,
      c.lives AS my_character_lives
    FROM rooms r
    LEFT JOIN characters c ON c.room_id = r.id AND c.user_id = $1
    WHERE (r.host_id = $1 OR c.user_id = $1)
    ORDER BY r.created_at DESC
  `, [userId]);
  return res.rows;
}

async function getExpeditionDetails(roomId) {
  const p = await getPool();
  const roomRes = await p.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
  const room = roomRes.rows[0];
  if (!room) return null;

  const charactersRes = await p.query('SELECT * FROM characters WHERE room_id = $1', [roomId]);
  const messagesRes = await p.query("SELECT * FROM messages WHERE room_id = $1 AND action_type = 'narrative' ORDER BY created_at ASC", [roomId]);

  return {
    room,
    characters: charactersRes.rows.map(c => ({
      ...c,
      items: parseCharacterItems(c.items)
    })),
    narrativeMessages: messagesRes.rows
  };
}

module.exports = {
  getPool,
  registerUser,
  loginUser,
  findOrCreateUser,
  incrementUserGames,
  createRoom,
  getRoomByCode,
  getRoomById,
  getActiveRoomForUser,
  updateRoomStatus,
  advanceRoomTurn,
  createCharacter,
  getCharacterById,
  getCharactersByRoom,
  updateCharacterStatus,
  updateCharacterItems,
  parseCharacterItems,
  saveTurnAction,
  getActionsForTurn,
  markActionsResolved,
  saveMessage,
  getRoomMessages,
  getUserExpeditionHistory,
  getExpeditionDetails
};
