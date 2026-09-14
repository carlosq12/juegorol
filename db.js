if (process.env.DATABASE_URL) {
  module.exports = require('./db-pg');
} else {
let sql;
try {
  sql = require('mssql/msnodesqlv8.js');
} catch {
  try {
    sql = require('mssql/msnodesqlv8');
  } catch {
    sql = require('mssql');
  }
}
const crypto = require('crypto');

const dbConfig = {
  server: process.env.DB_SERVER || 'LAPTOP-ERNRELH3\\SQLEXPRESS01',
  database: process.env.DB_DATABASE || 'DB_ROL',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    enableArithAbort: true
  }
};

let pool = null;

async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect(dbConfig);
      console.log(' Conectado exitosamente a SQL Server: DB_ROL');
    } catch (err) {
      console.error(' Error al conectar a SQL Server:', err.message);
      throw err;
    }
  }
  return pool;
}

// -------------------------------------------------------------
function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

async function registerUser(username, email, password) {
  const p = await getPool();
  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Verificar si username ya existe
  const checkUser = await p.request()
    .input('username', sql.VarChar(50), cleanUsername)
    .query('SELECT id FROM users WHERE username = @username');

  if (checkUser.recordset.length > 0) {
    throw new Error('El nombre de aventurero ya está en uso. Elige otro.');
  }

  // Verificar si email ya existe
  const checkEmail = await p.request()
    .input('email', sql.VarChar(100), cleanEmail)
    .query('SELECT id FROM users WHERE email = @email');

  if (checkEmail.recordset.length > 0) {
    throw new Error('El correo electrónico ya está registrado. Inicia sesión.');
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('username', sql.VarChar(50), cleanUsername)
    .input('email', sql.VarChar(100), cleanEmail)
    .input('password', sql.VarChar(255), passwordHash)
    .query(`
      INSERT INTO users (id, username, email, password, games_played)
      VALUES (@id, @username, @email, @password, 0);
    `);

  return { id, username: cleanUsername, email: cleanEmail, games_played: 0 };
}

async function loginUser(identifier, password) {
  const p = await getPool();
  const cleanId = (identifier || '').trim();

  const res = await p.request()
    .input('ident', sql.VarChar(100), cleanId)
    .query('SELECT * FROM users WHERE username = @ident OR email = @ident');

  if (res.recordset.length === 0) {
    throw new Error('Usuario o correo no encontrado. Verifica los datos o regístrate.');
  }

  const user = res.recordset[0];

  // Si el usuario ya tiene contraseña configurada, validarla
  if (user.password) {
    const inputHash = hashPassword(password);
    if (inputHash !== user.password) {
      throw new Error('Contraseña incorrecta.');
    }
  } else if (password) {
    // Si era un usuario previo sin contraseña y ahora ingresó una, guardársela
    const newHash = hashPassword(password);
    await p.request()
      .input('id', sql.UniqueIdentifier, user.id)
      .input('pwd', sql.VarChar(255), newHash)
      .query('UPDATE users SET password = @pwd WHERE id = @id');
  }

  // Devolver usuario sin la contraseña
  const { password: _, ...userSafe } = user;
  return userSafe;
}

// USUARIOS (Compatibilidad previa)
// -------------------------------------------------------------
async function findOrCreateUser(username, email) {
  const p = await getPool();
  // Buscar usuario existente
  const check = await p.request()
    .input('username', sql.VarChar(50), username)
    .input('email', sql.VarChar(100), email)
    .query('SELECT * FROM users WHERE username = @username OR email = @email');

  if (check.recordset.length > 0) {
    const { password: _, ...userSafe } = check.recordset[0];
    return userSafe;
  }

  // Crear nuevo usuario
  const id = crypto.randomUUID();
  await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('username', sql.VarChar(50), username)
    .input('email', sql.VarChar(100), email)
    .query(`
      INSERT INTO users (id, username, email, games_played)
      VALUES (@id, @username, @email, 0);
    `);

  return { id, username, email, games_played: 0 };
}

async function incrementUserGames(userId) {
  const p = await getPool();
  await p.request()
    .input('id', sql.UniqueIdentifier, userId)
    .query('UPDATE users SET games_played = games_played + 1 WHERE id = @id');
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
  let code = generateRoomCode();
  let unique = false;

  // Garantizar código único
  while (!unique) {
    const check = await p.request()
      .input('code', sql.VarChar(6), code)
      .query('SELECT id FROM rooms WHERE room_code = @code');
    if (check.recordset.length === 0) {
      unique = true;
    } else {
      code = generateRoomCode();
    }
  }

  const roomId = crypto.randomUUID();
  await p.request()
    .input('id', sql.UniqueIdentifier, roomId)
    .input('room_code', sql.VarChar(6), code)
    .input('story_selected', sql.VarChar(1), storySelected.toString())
    .input('host_id', sql.UniqueIdentifier, hostId)
    .input('status', sql.VarChar(20), 'waiting')
    .input('current_turn', sql.Int, 1)
    .query(`
      INSERT INTO rooms (id, room_code, story_selected, host_id, status, current_turn)
      VALUES (@id, @room_code, @story_selected, @host_id, @status, @current_turn);
    `);

  return getRoomById(roomId);
}

async function getRoomByCode(roomCode) {
  const p = await getPool();
  const res = await p.request()
    .input('code', sql.VarChar(6), roomCode.toUpperCase())
    .query('SELECT * FROM rooms WHERE room_code = @code');
  return res.recordset[0] || null;
}

async function getRoomById(roomId) {
  const p = await getPool();
  const res = await p.request()
    .input('id', sql.UniqueIdentifier, roomId)
    .query('SELECT * FROM rooms WHERE id = @id');
  return res.recordset[0] || null;
}

async function getActiveRoomForUser(userId) {
  const p = await getPool();
  const res = await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .query(`
      SELECT TOP 1 r.*, c.id AS character_id, c.name AS character_name, c.class AS character_class
      FROM rooms r
      LEFT JOIN characters c ON c.room_id = r.id AND c.user_id = @userId
      WHERE (r.host_id = @userId OR c.user_id = @userId)
        AND r.status IN ('waiting', 'active')
      ORDER BY r.created_at DESC
    `);
  return res.recordset[0] || null;
}

async function updateRoomStatus(roomId, status) {
  const p = await getPool();
  await p.request()
    .input('id', sql.UniqueIdentifier, roomId)
    .input('status', sql.VarChar(20), status)
    .query('UPDATE rooms SET status = @status WHERE id = @id');
}

async function advanceRoomTurn(roomId, nextTurn) {
  const p = await getPool();
  await p.request()
    .input('id', sql.UniqueIdentifier, roomId)
    .input('turn', sql.Int, nextTurn)
    .query('UPDATE rooms SET current_turn = @turn WHERE id = @id');
}

// -------------------------------------------------------------
// PERSONAJES (CHARACTERS)
// -------------------------------------------------------------
async function createCharacter(userId, roomId, name, className) {
  const p = await getPool();

  // Verificar si el usuario ya tiene personaje en la sala
  const check = await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .input('roomId', sql.UniqueIdentifier, roomId)
    .query('SELECT * FROM characters WHERE user_id = @userId AND room_id = @roomId');

  if (check.recordset.length > 0) {
    // Actualizar nombre y clase si la sala aún está en waiting
    const existing = check.recordset[0];
    await p.request()
      .input('id', sql.UniqueIdentifier, existing.id)
      .input('name', sql.VarChar(50), name)
      .input('className', sql.VarChar(30), className)
      .query('UPDATE characters SET name = @name, class = @className WHERE id = @id');
    return getCharacterById(existing.id);
  }

  const id = crypto.randomUUID();
  await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('userId', sql.UniqueIdentifier, userId)
    .input('roomId', sql.UniqueIdentifier, roomId)
    .input('name', sql.VarChar(50), name)
    .input('className', sql.VarChar(30), className)
    .input('hp', sql.Int, 10)
    .input('lives', sql.Int, 3)
    .input('is_alive', sql.Bit, 1)
    .query(`
      INSERT INTO characters (id, user_id, room_id, name, class, hp, lives, is_alive)
      VALUES (@id, @userId, @roomId, @name, @className, @hp, @lives, @is_alive);
    `);

  return getCharacterById(id);
}

function parseCharacterItems(char) {
  if (!char) return char;
  if (typeof char.items === 'string') {
    try {
      char.items = JSON.parse(char.items);
    } catch {
      char.items = [];
    }
  }
  if (!Array.isArray(char.items)) {
    char.items = [];
  }
  return char;
}

async function getCharacterById(id) {
  const p = await getPool();
  const res = await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .query('SELECT * FROM characters WHERE id = @id');
  return parseCharacterItems(res.recordset[0] || null);
}

async function getCharactersByRoom(roomId) {
  const p = await getPool();
  const res = await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .query(`
      SELECT c.*, u.username 
      FROM characters c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.room_id = @roomId
      ORDER BY c.created_at ASC
    `);
  return res.recordset.map(parseCharacterItems);
}

async function updateCharacterStatus(id, { hp, lives, is_alive }) {
  const p = await getPool();
  await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('hp', sql.Int, hp)
    .input('lives', sql.Int, lives)
    .input('is_alive', sql.Bit, is_alive ? 1 : 0)
    .query(`
      UPDATE characters 
      SET hp = @hp, lives = @lives, is_alive = @is_alive 
      WHERE id = @id
    `);
}

async function updateCharacterItems(id, items) {
  const p = await getPool();
  const safeItems = Array.isArray(items) ? items.slice(0, 3) : [];
  const itemsJson = JSON.stringify(safeItems);
  await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('items', sql.NVarChar(sql.MAX), itemsJson)
    .query(`
      UPDATE characters 
      SET items = @items 
      WHERE id = @id
    `);
  return safeItems;
}

// -------------------------------------------------------------
// ACCIONES DE TURNO (TURN_ACTIONS)
// -------------------------------------------------------------
async function saveTurnAction(roomId, characterId, turnNumber, actionSelected, flavorText) {
  const p = await getPool();

  // Si ya existía una acción para este personaje en este turno, reemplazarla
  const existing = await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .input('characterId', sql.UniqueIdentifier, characterId)
    .input('turnNumber', sql.Int, turnNumber)
    .query('SELECT id FROM turn_actions WHERE room_id = @roomId AND character_id = @characterId AND turn_number = @turnNumber');

  if (existing.recordset.length > 0) {
    const id = existing.recordset[0].id;
    await p.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('actionSelected', sql.VarChar(20), actionSelected)
      .input('flavorText', sql.VarChar(sql.MAX), flavorText || '')
      .query('UPDATE turn_actions SET action_selected = @actionSelected, flavor_text = @flavorText WHERE id = @id');
    return id;
  }

  const id = crypto.randomUUID();
  await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('roomId', sql.UniqueIdentifier, roomId)
    .input('characterId', sql.UniqueIdentifier, characterId)
    .input('turnNumber', sql.Int, turnNumber)
    .input('actionSelected', sql.VarChar(20), actionSelected)
    .input('flavorText', sql.VarChar(sql.MAX), flavorText || '')
    .input('is_resolved', sql.Bit, 0)
    .query(`
      INSERT INTO turn_actions (id, room_id, character_id, turn_number, action_selected, flavor_text, is_resolved)
      VALUES (@id, @roomId, @characterId, @turnNumber, @actionSelected, @flavorText, @is_resolved);
    `);
  return id;
}

async function getActionsForTurn(roomId, turnNumber) {
  const p = await getPool();
  const res = await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .input('turnNumber', sql.Int, turnNumber)
    .query(`
      SELECT ta.*, c.name AS character_name, c.class AS character_class, c.hp, c.lives, c.is_alive, c.user_id
      FROM turn_actions ta
      INNER JOIN characters c ON ta.character_id = c.id
      WHERE ta.room_id = @roomId AND ta.turn_number = @turnNumber
    `);
  return res.recordset;
}

async function markActionsResolved(roomId, turnNumber) {
  const p = await getPool();
  await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .input('turnNumber', sql.Int, turnNumber)
    .query('UPDATE turn_actions SET is_resolved = 1 WHERE room_id = @roomId AND turn_number = @turnNumber');
}

// -------------------------------------------------------------
// MENSAJES (MESSAGES)
// -------------------------------------------------------------
async function saveMessage(roomId, senderId, content, actionType = 'chat') {
  const p = await getPool();
  const id = crypto.randomUUID();
  await p.request()
    .input('id', sql.UniqueIdentifier, id)
    .input('roomId', sql.UniqueIdentifier, roomId)
    .input('senderId', senderId ? sql.UniqueIdentifier : sql.UniqueIdentifier, senderId || null)
    .input('content', sql.VarChar(sql.MAX), content)
    .input('actionType', sql.VarChar(20), actionType)
    .query(`
      INSERT INTO messages (id, room_id, sender_id, content, action_type)
      VALUES (@id, @roomId, @senderId, @content, @actionType);
    `);

  let username = null;
  let characterName = null;
  let characterClass = null;

  if (senderId) {
    try {
      const userRes = await p.request()
        .input('senderId', sql.UniqueIdentifier, senderId)
        .input('roomId', sql.UniqueIdentifier, roomId)
        .query(`
          SELECT u.username, c.name AS character_name, c.class AS character_class
          FROM users u
          LEFT JOIN characters c ON c.user_id = u.id AND c.room_id = @roomId
          WHERE u.id = @senderId
        `);
      if (userRes.recordset.length > 0) {
        username = userRes.recordset[0].username;
        characterName = userRes.recordset[0].character_name;
        characterClass = userRes.recordset[0].character_class;
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
  const res = await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) m.*, u.username, c.name AS character_name, c.class AS character_class
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN characters c ON c.user_id = u.id AND c.room_id = m.room_id
      WHERE m.room_id = @roomId
      ORDER BY m.created_at ASC
    `);
  return res.recordset;
}

// -------------------------------------------------------------
// HISTORIAL DE EXPEDICIONES
// -------------------------------------------------------------
async function getUserExpeditionHistory(userId) {
  const p = await getPool();
  const res = await p.request()
    .input('userId', sql.UniqueIdentifier, userId)
    .query(`
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
      LEFT JOIN characters c ON c.room_id = r.id AND c.user_id = @userId
      WHERE (r.host_id = @userId OR c.user_id = @userId)
      ORDER BY r.created_at DESC
    `);
  return res.recordset;
}

async function getExpeditionDetails(roomId) {
  const p = await getPool();
  const roomRes = await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .query('SELECT * FROM rooms WHERE id = @roomId');
  const room = roomRes.recordset[0];
  if (!room) return null;

  const charactersRes = await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .query('SELECT * FROM characters WHERE room_id = @roomId');

  const messagesRes = await p.request()
    .input('roomId', sql.UniqueIdentifier, roomId)
    .query("SELECT * FROM messages WHERE room_id = @roomId AND action_type = 'narrative' ORDER BY created_at ASC");

  return {
    room,
    characters: charactersRes.recordset,
    narrativeMessages: messagesRes.recordset
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
}
