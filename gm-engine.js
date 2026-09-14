/**
 * Motor del Director de Juego (Game Master) - Antigravyty RPG
 * Aplica estrictamente las reglas del juego:
 * - 10 PS Máximo, 3 Vidas (Almas) Máximo.
 * - Mecánica de colapso a 0 PS: -1 Vida, resucita a 10 PS para el siguiente turno. 0 vidas = muerte definitiva.
 * - 4 Acciones: Atacar (crítico con flavor text creativo), Esquivar (alta evasión), Defender (daño a la mitad redondeado abajo), Interactuar (Poción cura 5 PS máx 10 / runas de gravedad).
 * - Daño enemigo: 2 a 4 PS.
 * - Salida estricta en dos partes:
 *   1. La Narrativa (Máximo 2 párrafos cinematográficos)
 *   2. Estado del Campo y Registro
 */

const {
  findAbilityById,
  evaluateD20Ability,
  getAbilitiesForClass,
  LOOT_ITEMS,
  MONSTER_ATTACKS_POOL,
  MONSTER_DEFENSES_POOL
} = require('./skills-data');

// Memoria de estado táctico por sala (enemigos y anomalías)
const roomCombatStates = new Map();

// Bestiario Progresivo de 10 Criaturas de Dificultad Creciente (Gauntlet Cósmico)
const PROGRESSIVE_BESTIARY = [
  {
    tier: 1,
    name: 'Vástago Gravitón Menor',
    title: 'Fragmento errante de energía cinética pura',
    maxHp: 24,
    hp: 24,
    baseAtkBonus: 0,
    baseDefBonus: 0,
    avatar: '👾'
  },
  {
    tier: 2,
    name: 'Acechador de la Singularidad',
    title: 'Insectoide de quitina estelar y alas de vacío',
    maxHp: 32,
    hp: 32,
    baseAtkBonus: 0,
    baseDefBonus: 0.05,
    avatar: '🦗'
  },
  {
    tier: 3,
    name: 'Espectro de Masa Negativa',
    title: 'Aparición espectral que distorsiona la luz y el peso',
    maxHp: 40,
    hp: 40,
    baseAtkBonus: 1,
    baseDefBonus: 0.05,
    avatar: '👻'
  },
  {
    tier: 4,
    name: 'Gólem de Basalto Levitante',
    title: 'Titán de roca volcánica suspendida en fragmentos flotantes',
    maxHp: 50,
    hp: 50,
    baseAtkBonus: 1,
    baseDefBonus: 0.10,
    avatar: '🗿'
  },
  {
    tier: 5,
    name: 'Mantarraya del Éter Cósmico',
    title: 'Leviatán volador que surca corrientes de gravedad cero',
    maxHp: 62,
    hp: 62,
    baseAtkBonus: 1,
    baseDefBonus: 0.10,
    avatar: '🪁'
  },
  {
    tier: 6,
    name: 'Caminante del Horizonte de Sucesos',
    title: 'Coloso etéreo forjado en el borde de un agujero negro',
    maxHp: 75,
    hp: 75,
    baseAtkBonus: 2,
    baseDefBonus: 0.12,
    avatar: '🌌'
  },
  {
    tier: 7,
    name: 'Hidra Gravitacional Cuántica',
    title: 'Monstruosidad policéfala de filamentos espaciales',
    maxHp: 88,
    hp: 88,
    baseAtkBonus: 2,
    baseDefBonus: 0.15,
    avatar: '🐉'
  },
  {
    tier: 8,
    name: 'Draco del Vacío Hiperdenso',
    title: 'Dragón estelar cuyas escamas curvan los fotones',
    maxHp: 102,
    hp: 102,
    baseAtkBonus: 2,
    baseDefBonus: 0.15,
    avatar: '🐲'
  },
  {
    tier: 9,
    name: 'Avatar del Caos Primordial',
    title: 'Encarnación de las anomalías gravitacionales desatadas',
    maxHp: 118,
    hp: 118,
    baseAtkBonus: 3,
    baseDefBonus: 0.18,
    avatar: '⚡'
  },
  {
    tier: 10,
    name: 'Titán de la Singularidad Eterna',
    title: 'Jefe Supremo: El devorador absoluto del tejido del cosmos',
    maxHp: 135,
    hp: 135,
    baseAtkBonus: 3,
    baseDefBonus: 0.20,
    avatar: '👑'
  }
];

const ENEMY_ROSTER = PROGRESSIVE_BESTIARY;

const GRAVITY_ANOMALIES = [
  'Inversión Gravitacional de Techo: Los escombros caen hacia las nubes y los pasos deben aferrarse al basalto.',
  'Fluctuación de Masa Cero: Cualquier salto te eleva decenas de metros flotando en el vacío.',
  'Vórtice de Marea Gravitatoria: Vientos de éter que desvían flechas y dificultan el equilibrio.',
  'Compresión de Masa Hiperdensa: El peso de las armaduras y armas se triplica por momentos.',
  'Grietas de Salto Espacial: Pequeñas singularidades que parpadean entre las islas flotantes.'
];

// Bonificaciones tácticas de turno activas para el monstruo
const MONSTER_TURN_BONUSES = [
  // Turnos impares (1, 3, 5...) => Fase de Ataque de los Héroes (Monstruo defiende)
  {
    phase: 'defense',
    icon: '🛡️',
    title: 'Campo Cuántico Fortificado',
    effect: '+15% de reducción defensiva adicional frente a los ataques de este turno.',
    bonusReduction: 0.15,
    bonusDmg: 0,
    reflectDamage: 0
  },
  {
    phase: 'defense',
    icon: '🪨',
    title: 'Corteza de Basalto Condensado',
    effect: 'Absorbe 2 PS de daño plano recibido en impactos directos.',
    flatReduction: 2,
    bonusReduction: 0,
    bonusDmg: 0,
    reflectDamage: 0
  },
  {
    phase: 'defense',
    icon: '⚡',
    title: 'Púas de Resonancia Gravitatoria',
    effect: 'La masa inestable devuelve 2 PS de contradaño a los aventureros que lo golpeen.',
    reflectDamage: 2,
    bonusReduction: 0,
    bonusDmg: 0
  },
  {
    phase: 'defense',
    icon: '🌌',
    title: 'Distorsión Temporal de Masa Cero',
    effect: '+10% de mitigación general y desvía trayectorias críticas.',
    bonusReduction: 0.10,
    bonusDmg: 0,
    reflectDamage: 0
  },
  {
    phase: 'defense',
    icon: '🔮',
    title: 'Burbuja de Éter Repelente',
    effect: 'Disipa +20% en barreras focalizadas contra el ataque más fuerte del grupo.',
    bonusReduction: 0.20,
    bonusDmg: 0,
    reflectDamage: 0
  },

  // Turnos pares (2, 4, 6...) => Fase de Ataque de los Monstruos
  {
    phase: 'attack',
    icon: '🔥',
    title: 'Sobrecarga Cinética Desatada',
    effect: '+2 PS de daño letal adicional a todos sus ataques de este asalto.',
    bonusDmg: 2,
    bonusReduction: 0,
    reflectDamage: 0
  },
  {
    phase: 'attack',
    icon: '🌪️',
    title: 'Vórtice de Marea Hiperdensa',
    effect: '+1 PS de daño a todos y penetra armaduras planas de los aventureros.',
    bonusDmg: 1,
    ignoreFlatRed: true,
    bonusReduction: 0,
    reflectDamage: 0
  },
  {
    phase: 'attack',
    icon: '🎯',
    title: 'Foco de Singularidad Letal',
    effect: 'Concentra +3 PS de daño fulminante sobre el aventurero más vulnerable.',
    bonusDmg: 3,
    targetLowestHp: true,
    bonusReduction: 0,
    reflectDamage: 0
  },
  {
    phase: 'attack',
    icon: '🩸',
    title: 'Drenaje Bio-Cinético',
    effect: 'Restaura +2 PS a la criatura por cada aventurero que no logre eludir el golpe.',
    healOnHit: 2,
    bonusDmg: 0,
    bonusReduction: 0,
    reflectDamage: 0
  },
  {
    phase: 'attack',
    icon: '💫',
    title: 'Pulso Electrostático de Vacío',
    effect: '+1 PS de daño adicional en ataques grupales de área.',
    bonusDmg: 1,
    bonusReduction: 0,
    reflectDamage: 0
  }
];

function getMonsterTurnBonus(monster, turnNumber) {
  const isMonsterDefending = (turnNumber % 2) === 1;
  const filtered = MONSTER_TURN_BONUSES.filter(b => isMonsterDefending ? b.phase === 'defense' : b.phase === 'attack');
  const monsterTier = (monster && monster.tier) ? monster.tier : 1;
  const idx = Math.abs((turnNumber + monsterTier)) % filtered.length;
  return filtered[idx];
}

/**
 * Obtiene la habilidad de ataque activa del monstruo según el turno (Rotación: Unitarget vs AoE)
 */
function getMonsterActiveAttack(enemy, turnNumber) {
  if (Array.isArray(enemy.attacks) && enemy.attacks.length > 0) {
    const cycle = Math.max(0, Math.floor(turnNumber / 2) - 1);
    return enemy.attacks[cycle % enemy.attacks.length];
  }
  const isAoe = (Math.floor(turnNumber / 2) % 2) === 0;
  return {
    id: isAoe ? 'atk_aoe' : 'atk_single',
    name: enemy.attackName || (isAoe ? '🌌 Onda Expansiva Gravitatoria' : '⚡ Zarpazo de Gravedad'),
    type: isAoe ? 'aoe' : 'single',
    typeLabel: isAoe ? '💥 Daño a Todos los Jugadores (Área)' : '🎯 Objetivo Individual (1 Aventurero)',
    minDmg: isAoe ? 2 : 3,
    maxDmg: isAoe ? 3 : 5,
    damageText: isAoe ? '2 - 3 PS a cada uno' : '3 - 5 PS',
    effects: isAoe
      ? 'Onda expansiva que daña a cada integrante del grupo.'
      : 'Ataque concentrado letal sobre un único aventurero.'
  };
}

/**
 * Obtiene la habilidad de defensa activa del monstruo según el turno (Rotación: Global vs 1 Ataque)
 */
function getMonsterActiveDefense(enemy, turnNumber) {
  if (Array.isArray(enemy.defenses) && enemy.defenses.length > 0) {
    const cycle = Math.max(0, Math.floor((turnNumber - 1) / 2));
    return enemy.defenses[cycle % enemy.defenses.length];
  }
  const isFocus = (Math.floor((turnNumber - 1) / 2) % 2) === 1;
  return {
    id: isFocus ? 'def_single' : 'def_all',
    name: enemy.defenseName || (isFocus ? '🧱 Bloqueo de Densidad Focal' : '🛡️ Caparazón de Vacío'),
    type: isFocus ? 'single' : 'all',
    typeLabel: isFocus ? '🎯 Barrera Focalizada (1 Solo Ataque)' : '🌐 Cobertura Global (Todos los Ataques)',
    reduction: isFocus ? 0.65 : 0.35,
    reductionText: isFocus ? '-65% al Golpe Más Fuerte' : '-35% Daño a Todos',
    effects: isFocus
      ? 'Concentra su campo para mitigar fuertemente el ataque más letal del grupo (-65%).'
      : 'Amortigua y disipa el 35% de todos los ataques recibidos en la ronda.'
  };
}

/**
 * Crea una instancia de monstruo según el índice (0 a 9) con escalado de daño y mitigación
 */
function createMonsterInstance(index = 0, anomaly = '') {
  const safeIdx = Math.max(0, Math.min(index, PROGRESSIVE_BESTIARY.length - 1));
  const base = PROGRESSIVE_BESTIARY[safeIdx];
  const monsterNumber = safeIdx + 1;

  const attacks = MONSTER_ATTACKS_POOL.map(atk => {
    const minD = atk.minDmg + base.baseAtkBonus;
    const maxD = atk.maxDmg + base.baseAtkBonus;
    const isAoe = atk.type === 'aoe' || atk.type === 'all';
    const isDrain = atk.type === 'drain';
    let dmgText = `${minD} - ${maxD} PS`;
    if (isAoe) dmgText += ' a cada uno';
    if (isDrain) dmgText += ` (Cura ${atk.healMonster || 3} PS)`;

    return {
      ...atk,
      minDmg: minD,
      maxDmg: maxD,
      damageText: dmgText
    };
  });

  const defenses = MONSTER_DEFENSES_POOL.map(def => {
    const effectiveRed = Math.min(0.85, def.reduction + base.baseDefBonus);
    let redText = def.type === 'single'
      ? `-${Math.round(effectiveRed * 100)}% al Golpe Más Fuerte`
      : `-${Math.round(effectiveRed * 100)}% Daño a Todos`;
    if (def.counterDamage) {
      redText += ` + Refleja ${def.counterDamage} PS`;
    }

    return {
      ...def,
      reduction: effectiveRed,
      reductionText: redText
    };
  });

  return {
    id: `enemy-tier-${monsterNumber}`,
    tier: base.tier,
    monsterNumber,
    name: base.name,
    title: base.title,
    avatar: base.avatar,
    hp: base.hp,
    maxHp: base.maxHp,
    attacks,
    defenses,
    isAlive: true
  };
}

/**
 * Actualiza los datos tácticos del turno del monstruo para exposición en la UI
 */
function updateMonsterTurnStats(enemy, turnNumber) {
  if (!enemy) return;
  const actAtk = getMonsterActiveAttack(enemy, turnNumber);
  const actDef = getMonsterActiveDefense(enemy, turnNumber);
  const turnBonus = getMonsterTurnBonus(enemy, turnNumber);

  enemy.attackName = actAtk.name;
  enemy.attackDamage = actAtk.damageText;
  enemy.attackEffects = actAtk.effects;
  enemy.attackType = actAtk.type;
  enemy.attackTypeLabel = actAtk.typeLabel;

  enemy.defenseName = actDef.name;
  enemy.defenseReduction = actDef.reductionText;
  enemy.defenseEffects = actDef.effects;
  enemy.defenseType = actDef.type;
  enemy.defenseTypeLabel = actDef.typeLabel;

  enemy.turnBonus = turnBonus;
  enemy.turnBonusTitle = `${turnBonus.icon} ${turnBonus.title}`;
  enemy.turnBonusEffect = turnBonus.effect;
}

function getOrCreateCombatState(roomId, storySelected = '1') {
  if (roomCombatStates.has(roomId)) {
    const existing = roomCombatStates.get(roomId);
    if (existing) {
      if (typeof existing.currentMonsterIndex !== 'number') existing.currentMonsterIndex = 0;
      if (typeof existing.monstersDefeated !== 'number') existing.monstersDefeated = 0;
      existing.totalMonsters = 10;

      if (!Array.isArray(existing.enemies) || existing.enemies.length === 0) {
        existing.enemies = [createMonsterInstance(existing.currentMonsterIndex, existing.anomaly)];
      }

      existing.enemies.forEach(e => {
        if (!Number.isFinite(e.hp) || e.hp === null || isNaN(e.hp)) {
          e.hp = e.maxHp || 24;
        }
        if (!Array.isArray(e.attacks) || e.attacks.length === 0) {
          e.attacks = [...MONSTER_ATTACKS_POOL];
        }
        if (!Array.isArray(e.defenses) || e.defenses.length === 0) {
          e.defenses = [...MONSTER_DEFENSES_POOL];
        }
        updateMonsterTurnStats(e, existing.round || 1);
      });
    }
    return existing;
  }

  const initialAnomaly = GRAVITY_ANOMALIES[0];
  const initialMonster = createMonsterInstance(0, initialAnomaly);
  updateMonsterTurnStats(initialMonster, 1);

  const state = {
    roomId,
    round: 1,
    currentMonsterIndex: 0,
    monstersDefeated: 0,
    totalMonsters: 10,
    anomaly: initialAnomaly,
    enemies: [initialMonster],
    lastNarrative: ''
  };

  roomCombatStates.set(roomId, state);
  return state;
}

/**
 * Evalúa si el texto descriptivo del jugador merece un golpe crítico por creatividad o táctica.
 */
function evaluateFlavorTextForCritical(flavorText, actionSelected) {
  if (!flavorText || typeof flavorText !== 'string') return false;
  const text = flavorText.trim().toLowerCase();
  if (text.length < 15) return false;

  const creativeKeywords = [
    'gravedad', 'inversión', 'levit', 'vórtice', 'éter', 'singularidad', 'órbita',
    'salto', 'impulso', 'flota', 'caída', 'arco', 'precis', 'canaliz', 'sagrad',
    'runa', 'fuego', 'hielo', 'rayo', 'relámpago', 'peso', 'vacío', 'espalda', 'flanco'
  ];

  const matchedKeywords = creativeKeywords.filter(k => text.includes(k));
  return matchedKeywords.length >= 2 || (text.length > 50 && matchedKeywords.length >= 1);
}

/**
 * Resuelve el turno de combate para todos los personajes de la sala
 * @param {Object} room - Datos de la sala
 * @param {Array} characters - Personajes en la sala
 * @param {Array} actions - Acciones enviadas por los jugadores en este turno
 * @returns {Object} Resultado con personajes actualizados, enemigos, narrativa y estado
 */
async function resolveCombatTurn(room, characters, actions) {
  const combatState = getOrCreateCombatState(room.id, room.story_selected);
  combatState.round = room.current_turn;
  combatState.anomaly = GRAVITY_ANOMALIES[(room.current_turn - 1) % GRAVITY_ANOMALIES.length];

  const alivePlayers = characters.filter(c => c.is_alive);
  const playerResults = [];
  const narrativePlayerEvents = [];
  const narrativeEnemyEvents = [];

  // Mapear acciones por character_id
  const actionMap = new Map();
  actions.forEach(a => actionMap.set(a.character_id, a));

  // Determinación de Fase: Turnos impares (1, 3, 5...) = Ataque Héroes | Turnos pares (2, 4, 6...) = Ataque Monstruos
  const isHeroAttackPhase = (room.current_turn % 2) === 1;

  let isVictory = false;
  let isDefeat = false;

  // 1. RESOLUCIÓN SEGÚN LA FASE ACTUAL
  if (isHeroAttackPhase) {
    // =========================================================================
    // FASE DE ATAQUE DE LOS HÉROES (Los jugadores atacan; se muestra defensa y daño total)
    // =========================================================================
    if (!combatState.enemies || combatState.enemies.length === 0) {
      combatState.enemies = [createMonsterInstance(combatState.currentMonsterIndex || 0, combatState.anomaly)];
    }

    let targetMonster = combatState.enemies[0];
    if (!targetMonster || !targetMonster.isAlive) {
      if ((combatState.monstersDefeated || 0) < 10) {
        combatState.currentMonsterIndex = Math.min(9, (combatState.currentMonsterIndex || 0));
        targetMonster = createMonsterInstance(combatState.currentMonsterIndex, combatState.anomaly);
        combatState.enemies = [targetMonster];
      }
    }

    // Sanear salud del monstruo objetivo para evitar NaN
    if (!Number.isFinite(targetMonster.hp) || targetMonster.hp === null || isNaN(targetMonster.hp)) {
      targetMonster.hp = targetMonster.maxHp || 24;
    }

    // Actualizar y obtener la postura defensiva y el bono activo del monstruo este turno
    updateMonsterTurnStats(targetMonster, room.current_turn);
    const activeDef = getMonsterActiveDefense(targetMonster, room.current_turn);
    const turnBonus = getMonsterTurnBonus(targetMonster, room.current_turn);

    let totalDamageToMonster = 0;
    const heroAttackLogs = [];
    const heroPotionLogs = [];

    // Pre-análisis: detectar si algún héroe activó sinergias o bufos para el grupo
    let groupDamageBonus = 0;
    let groupExposeCrit = false;
    let groupD20Bonus = 0;
    let groupShieldAlly = 0;
    const groupBuffAnnouncements = [];

    for (const player of alivePlayers) {
      const act = actionMap.get(player.id);
      if (!act) continue;
      let rawFlavor = (act.flavor_text || '').trim();
      let abilityId = act.ability_id;
      const tagMatch = rawFlavor.match(/^\[ability:([^\]]+)\]\s*([\s\S]*)/);
      if (tagMatch) abilityId = tagMatch[1].split('|')[0];
      const ability = findAbilityById(player.class, abilityId) || findAbilityById(player.class, act.action_selected);
      if (ability && ability.isGroupBuff && ability.groupEffect) {
        const eff = ability.groupEffect;
        if (eff.type === 'damage_buff_ally') {
          groupDamageBonus += eff.amount || 2;
          groupBuffAnnouncements.push(`📢 **${player.name}** (${player.class}) activó **${ability.name}**: ¡Otorga **+${eff.amount} de Daño** al ataque de su compañero!`);
        } else if (eff.type === 'vulnerability_ally') {
          groupExposeCrit = true;
          groupBuffAnnouncements.push(`🎯 **${player.name}** (${player.class}) activó **${ability.name}**: ¡Expuso el punto ciego del monstruo (**Críticos en 17+** para el grupo)!`);
        } else if (eff.type === 'd20_bonus_ally') {
          groupD20Bonus += eff.amount || 2;
          groupBuffAnnouncements.push(`🏹 **${player.name}** (${player.class}) activó **${ability.name}**: ¡Marcó a la criatura (**+${eff.amount} en tiradas D20** para el grupo)!`);
        } else if (eff.type === 'shield_ally') {
          groupShieldAlly += eff.amount || 2;
          groupBuffAnnouncements.push(`🌀 **${player.name}** (${player.class}) activó **${ability.name}**: ¡Envolvió a su compañero en un Velo de **+${eff.amount} PS de escudo**!`);
        }
      }
    }

    // Primer paso: recopilar las acciones de todos los héroes
    const heroActionsData = [];

    for (const player of alivePlayers) {
      const act = actionMap.get(player.id) || {
        action_selected: 'Atacar',
        flavor_text: 'Aprovecha la distorsión gravitatoria para arremeter.'
      };

      let hp = player.hp;
      let lives = player.lives;
      let isAlive = player.is_alive;
      let rawDamage = 0;
      let isCrit = false;
      let healed = 0;
      const actionType = act.action_selected;

      let abilityId = act.ability_id;
      let clientRoll = null;
      let d20Roll = null;
      let rawFlavor = (act.flavor_text || '').trim();
      const tagMatch = rawFlavor.match(/^\[ability:([^\]]+)\]\s*([\s\S]*)/);
      if (tagMatch) {
        const metaContent = tagMatch[1];
        rawFlavor = tagMatch[2].trim();
        const parts = metaContent.split('|');
        abilityId = parts[0];
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (p.startsWith('d20:')) d20Roll = parseInt(p.replace('d20:', ''), 10);
          else if (p.startsWith('roll:')) clientRoll = parseInt(p.replace('roll:', ''), 10);
        }
      }
      if (!d20Roll) d20Roll = Math.floor(Math.random() * 20) + 1;
      const flavor = rawFlavor;

      let ability = findAbilityById(player.class, abilityId) || findAbilityById(player.class, actionType);
      if (!ability) {
        const cData = getAbilitiesForClass(player.class);
        ability = (cData && cData.attacks && cData.attacks[0]) || { minDmg: 3, maxDmg: 5, name: 'Ataque Rápido', icon: '⚔️' };
      }

      // Parsear los ítems equipados por este personaje (hasta 3 slots)
      let playerItems = [];
      if (typeof player.items === 'string') {
        try { playerItems = JSON.parse(player.items); } catch { playerItems = []; }
      } else if (Array.isArray(player.items)) {
        playerItems = player.items;
      }

      const isTacticalAdvantage = evaluateFlavorTextForCritical(flavor, ability ? ability.name : '') || groupExposeCrit;
      const effectiveD20 = d20Roll + (ability.isGroupBuff ? 0 : groupD20Bonus);
      const evalRes = evaluateD20Ability(ability, effectiveD20, isTacticalAdvantage, playerItems);

      if (actionType === 'Atacar' || (ability && ability.minDmg)) {
        isCrit = evalRes.isCrit;
        const baseDmg = Number.isFinite(evalRes.damage) && evalRes.damage > 0 ? evalRes.damage : 4;
        const buffDmg = (!ability.isGroupBuff && groupDamageBonus > 0) ? groupDamageBonus : 0;
        rawDamage = baseDmg + buffDmg;
      } else if (actionType === 'Interactuar' || (ability && ability.healAmount)) {
        const prevHp = hp;
        const healAmt = evalRes ? evalRes.healAmount : 5;
        hp = Math.min(10, hp + healAmt);
        healed = hp - prevHp;
        const allyHealNote = (evalRes && evalRes.allyHealAmount > 0) ? ` *(🤝 +${evalRes.allyHealAmount} PS salpicados al compañero)*` : '';
        heroPotionLogs.push(`• 🧪 **${player.name}** (${player.class}) bebió **${ability.name}** (🎲 D20 [${d20Roll}] ➔ ${evalRes.tierName}) ➔ curó **+${healed} PS**${allyHealNote} (Salud actual: ${hp}/10 PS).`);
      } else {
        rawDamage = 2;
      }

      // Comprobar si el arma del héroe posee penetración de armadura
      let penetration = 0;
      for (const it of playerItems) {
        if (it && it.penetration) penetration = Math.max(penetration, it.penetration);
      }

      heroActionsData.push({
        player,
        actionType,
        ability,
        abilityId,
        d20Roll: effectiveD20,
        flavor,
        evalRes,
        rawDamage,
        isCrit,
        healed,
        penetration,
        playerItems,
        hp,
        lives,
        isAlive
      });
    }

    // Segundo paso: Aplicar la defensa del monstruo (Focalizada a 1 golpe vs Cobertura Total)
    // Se suma la bonificación de defensa del turno (si aplica)
    const bonusDefRed = turnBonus && turnBonus.bonusReduction ? turnBonus.bonusReduction : 0;
    const bonusFlatRed = turnBonus && turnBonus.flatReduction ? turnBonus.flatReduction : 0;
    const reflectDmg = turnBonus && turnBonus.reflectDamage ? turnBonus.reflectDamage : 0;

    if (activeDef.type === 'single') {
      let maxAtkIdx = -1;
      let maxAtkDmg = -1;
      heroActionsData.forEach((h, idx) => {
        if (h.rawDamage > maxAtkDmg) {
          maxAtkDmg = h.rawDamage;
          maxAtkIdx = idx;
        }
      });

      heroActionsData.forEach((h, idx) => {
        let finalDamage = 0;
        if (h.rawDamage > 0) {
          const critTag = h.isCrit ? ' 🔥 **¡GOLPE CRÍTICO!**' : '';
          const flavorStr = h.flavor ? ` *("${h.flavor}")*` : '';
          const itemTag = (h.evalRes && h.evalRes.itemBonusesText) ? ` [🎁 ${h.evalRes.itemBonusesText}]` : '';

          if (idx === maxAtkIdx && maxAtkDmg > 0) {
            const baseMitigation = (activeDef.reduction || 0.65) + bonusDefRed;
            const effectiveRed = Math.max(0.15, Math.min(0.90, baseMitigation - (h.penetration || 0)));
            finalDamage = Math.max(1, Math.round(h.rawDamage * (1 - effectiveRed)) - bonusFlatRed);
            totalDamageToMonster += finalDamage;

            // Reflejo de daño pasivo de turno si la criatura tiene púas
            if (reflectDmg > 0) {
              h.hp = Math.max(1, h.hp - reflectDmg);
            }

            const penNote = h.penetration > 0 ? ` *(🗡️ Penetración: Ignoró ${Math.round(h.penetration * 100)}% de barrera)*` : '';
            const reflNote = reflectDmg > 0 ? ` [⚡ Púas de masa: -${reflectDmg} PS al héroe]` : '';
            heroAttackLogs.push(`• ⚔️ **${h.player.name}** (${h.player.class}) atacó con **${h.ability.icon} ${h.ability.name}** (🎲 D20 [${h.d20Roll}]) ➔ asestó ${h.rawDamage} PS ➔ 🎯 **¡BARRERA FOCALIZADA!** *(Mitigado ${Math.round(effectiveRed * 100)}%)* ➔ **${finalDamage} PS netos**${critTag}${penNote}${itemTag}${reflNote}.${flavorStr}`);
          } else {
            finalDamage = Math.max(1, h.rawDamage - bonusFlatRed);
            totalDamageToMonster += finalDamage;

            if (reflectDmg > 0) {
              h.hp = Math.max(1, h.hp - reflectDmg);
            }
            const reflNote = reflectDmg > 0 ? ` [⚡ Púas de masa: -${reflectDmg} PS al héroe]` : '';
            heroAttackLogs.push(`• ⚔️ **${h.player.name}** (${h.player.class}) atacó con **${h.ability.icon} ${h.ability.name}** (🎲 D20 [${h.d20Roll}]) ➔ ⚡ **¡IMPACTO DIRECTO (Sin Cobertura)!** ➔ **${finalDamage} PS netos**${critTag}${itemTag}${reflNote}.${flavorStr}`);
          }
        }

        playerResults.push({
          player: h.player,
          actionType: h.actionType,
          abilityId: h.abilityId,
          flavor: h.flavor,
          actionSummary: heroAttackLogs[heroAttackLogs.length - 1] || heroPotionLogs[heroPotionLogs.length - 1] || '',
          isDefending: false,
          isDodging: false,
          dodgeSuccess: false,
          damageDealt: finalDamage,
          isCrit: h.isCrit,
          healed: h.healed,
          currentHp: h.hp,
          currentLives: h.lives,
          isAlive: h.isAlive,
          damageReceivedThisTurn: 0,
          collapsedThisTurn: false
        });
      });
    } else {
      // Cobertura Total: mitiga todos los ataques recibidos en la ronda
      heroActionsData.forEach(h => {
        let finalDamage = 0;
        if (h.rawDamage > 0) {
          const baseMitigation = (activeDef.reduction || 0.35) + bonusDefRed;
          const effectiveRed = Math.max(0.10, Math.min(0.85, baseMitigation - (h.penetration || 0)));
          finalDamage = Math.max(1, Math.round(h.rawDamage * (1 - effectiveRed)) - bonusFlatRed);
          totalDamageToMonster += finalDamage;

          if (reflectDmg > 0) {
            h.hp = Math.max(1, h.hp - reflectDmg);
          }

          const critTag = h.isCrit ? ' 🔥 **¡GOLPE CRÍTICO!**' : '';
          const flavorStr = h.flavor ? ` *("${h.flavor}")*` : '';
          const penNote = h.penetration > 0 ? ` *(🗡️ Penetración: Ignoró ${Math.round(h.penetration * 100)}%)*` : '';
          const itemTag = (h.evalRes && h.evalRes.itemBonusesText) ? ` [🎁 ${h.evalRes.itemBonusesText}]` : '';
          const reflNote = reflectDmg > 0 ? ` [⚡ Púas de masa: -${reflectDmg} PS al héroe]` : '';
          heroAttackLogs.push(`• ⚔️ **${h.player.name}** (${h.player.class}) atacó con **${h.ability.icon} ${h.ability.name}** (🎲 D20 [${h.d20Roll}] ➔ ${h.evalRes.tierName}) ➔ asestó ${h.rawDamage} PS ➔ 🌐 *(Mitigado ${Math.round(effectiveRed * 100)}%)* ➔ **${finalDamage} PS netos**${critTag}${penNote}${itemTag}${reflNote}.${flavorStr}`);
        }

        playerResults.push({
          player: h.player,
          actionType: h.actionType,
          abilityId: h.abilityId,
          flavor: h.flavor,
          actionSummary: heroAttackLogs[heroAttackLogs.length - 1] || heroPotionLogs[heroPotionLogs.length - 1] || '',
          isDefending: false,
          isDodging: false,
          dodgeSuccess: false,
          damageDealt: finalDamage,
          isCrit: h.isCrit,
          healed: h.healed,
          currentHp: h.hp,
          currentLives: h.lives,
          isAlive: h.isAlive,
          damageReceivedThisTurn: 0,
          collapsedThisTurn: false
        });
      });
    }

    // Aplicar daño total al monstruo objetivo
    const wasAliveBefore = targetMonster.isAlive && targetMonster.hp > 0;
    targetMonster.hp = Math.max(0, targetMonster.hp - totalDamageToMonster);
    let lootDropped = null;
    let monsterKilledNotice = '';

    if (targetMonster.hp <= 0 && wasAliveBefore) {
      targetMonster.isAlive = false;
      targetMonster.hp = 0;
      combatState.monstersDefeated = (combatState.monstersDefeated || 0) + 1;

      // Generar drop de botín aleatorio entre los ítems del catálogo
      const lootIdx = Math.floor(Math.random() * LOOT_ITEMS.length);
      lootDropped = {
        ...LOOT_ITEMS[lootIdx],
        droppedByMonster: targetMonster.name
      };

      if (combatState.monstersDefeated >= 10) {
        isVictory = true;
        combatState.isVictory = true;
        monsterKilledNotice = `\n\n🏆 **¡VICTORIA CÓSMICA TOTAL!**\n¡Habéis derrotado al décimo y último monstruo: **${targetMonster.name}**! Las anomalías gravitacionales se estabilizan.`;
      } else {
        combatState.currentMonsterIndex = (combatState.currentMonsterIndex || 0) + 1;
        const nextMonster = createMonsterInstance(combatState.currentMonsterIndex, combatState.anomaly);
        updateMonsterTurnStats(nextMonster, room.current_turn + 1);
        combatState.enemies = [nextMonster];
        monsterKilledNotice = `\n\n💀 **¡${targetMonster.name} HA SIDO DERROTADO!** (Progreso: ${combatState.monstersDefeated}/10 Criaturas).\n` +
          `Del vórtice de anomalías emerge la siguiente criatura: **${nextMonster.name}** (Monstruo ${nextMonster.monsterNumber} de 10) con **${nextMonster.maxHp} PS** y coraza reforzada.`;
      }
    }

    // Narrativa directa de defensa del monstruo y daño total recibido
    const bonusNotice = turnBonus ? ` [✨ Bono de Turno: ${turnBonus.icon} ${turnBonus.title} (${turnBonus.effect})]` : '';
    const monsterDefenseHeader = `• 🛡️ **${targetMonster.name}** activó **${activeDef.name}** (${activeDef.typeLabel}): ${activeDef.effects}${bonusNotice}`;
    const groupBuffBlock = groupBuffAnnouncements.length > 0
      ? `**Sinergias Grupales Activadas:**\n${groupBuffAnnouncements.join('\n')}\n\n`
      : '';

    const allHeroActions = [...heroAttackLogs, ...heroPotionLogs].join('\n');
    const monsterStatusLine = targetMonster.isAlive
      ? `📊 **Vida restante de la criatura:** **${targetMonster.hp}/${targetMonster.maxHp} PS** (Monstruo ${targetMonster.monsterNumber || 1} de 10).`
      : `💀 **¡${targetMonster.name} HA SIDO DERROTADO!** (0/${targetMonster.maxHp} PS).`;

    let lootBanner = '';
    if (lootDropped) {
      lootBanner = `\n\n🎁 **¡BOTÍN DE GUERRA DESPRENDIDO!**\n` +
        `Al disolverse en el abismo, **${targetMonster.name}** dejó caer un artefacto legendario:\n` +
        `➔ **${lootDropped.icon} ${lootDropped.name}** (*${lootDropped.statText}*)\n` +
        `> 💡 *Aventureros: Podéis equiparlo en una de vuestras 3 ranuras de inventario o intercambiarlo si están llenas.*`;
    }

    const enemiesQuick = combatState.enemies.map(e => {
      const safeHp = Number.isFinite(e.hp) ? e.hp : e.maxHp;
      return `**${e.name}** (#${e.monsterNumber || 1}/10): ${e.isAlive && safeHp > 0 ? `${safeHp}/${e.maxHp} PS` : '💀 Derrotado'}`;
    }).join(' | ');

    const playersQuick = playerResults.map(p => 
      `**${p.player.name}** (${p.player.class}): ${p.currentHp}/10 PS (${'❤️'.repeat(p.currentLives)}${'🖤'.repeat(3 - p.currentLives)})`
    ).join(' | ');

    const nextPhaseCall = isVictory
      ? `> 🏆 **¡LA EXPEDICIÓN HA CONCLUIDO CON ÉXITO ROTUNDO!**`
      : `> 🛡️ **¡Atención Aventureros!** En el **Turno ${room.current_turn + 1}**, los monstruos contraatacarán. ¡Elegid vuestra **Habilidad Defensiva** para amortiguar sus golpes!`;

    const fullGmMessage = `### ⚔️ Turno ${room.current_turn}: ¡Fase de Ataque de los Héroes!\n\n` +
      `**Defensa del Enemigo:**\n${monsterDefenseHeader}\n\n` +
      groupBuffBlock +
      `**Ataques del Grupo:**\n${allHeroActions}\n\n` +
      `**💥 Daño Total al Monstruo:**\n` +
      `💥 ¡El grupo asestó un total de **${totalDamageToMonster} PS de daño** a **${targetMonster.name}**!\n` +
      `${monsterStatusLine}${lootBanner}${monsterKilledNotice}\n\n` +
      `---\n\n` +
      `### 📊 Estado Rápido (Progreso: ${combatState.monstersDefeated || 0}/10 Monstruos)\n\n` +
      `* **Monstruo Activo:** ${enemiesQuick}\n` +
      `* **Grupo:** ${playersQuick}\n` +
      `* **Anomalía:** ${combatState.anomaly.split(':')[0]}\n\n` +
      nextPhaseCall;

    return {
      combatState,
      playerResults,
      fullGmMessage,
      lootDrop: lootDropped,
      narrativeText: `${monsterDefenseHeader}\n\n${allHeroActions}\n\n💥 Daño Total: ${totalDamageToMonster} PS ➔ ${monsterStatusLine}${monsterKilledNotice}`,
      stateText: `### Estado Rápido (Progreso: ${combatState.monstersDefeated || 0}/10 Monstruos)\n\n* **Monstruo:** ${enemiesQuick}\n* **Grupo:** ${playersQuick}`,
      isVictory,
      isDefeat: false,
      monstersDefeated: combatState.monstersDefeated || 0,
      totalMonsters: 10,
      currentMonsterNumber: (combatState.currentMonsterIndex || 0) + 1
    };

  } else {
    // =========================================================================
    // FASE DE ATAQUE DE LOS MONSTRUOS (Turnos Pares: 2, 4, 6...)
    // =========================================================================
    // Pre-análisis: detectar defensas grupales y apoyos al aliado activados por los héroes
    let groupDefenseReduction = 0;
    const allyShieldPool = new Map();
    const allyHealPool = new Map();
    const allyEvasionPool = new Map();
    const groupDefAnnouncements = [];

    for (const player of alivePlayers) {
      const act = actionMap.get(player.id);
      if (!act) continue;
      let rawFlavor = (act.flavor_text || '').trim();
      let abilityId = act.ability_id;
      const tagMatch = rawFlavor.match(/^\[ability:([^\]]+)\]\s*([\s\S]*)/);
      if (tagMatch) abilityId = tagMatch[1].split('|')[0];
      const ability = findAbilityById(player.class, abilityId) || findAbilityById(player.class, act.action_selected);
      if (ability && ability.isGroupBuff && ability.groupEffect) {
        const eff = ability.groupEffect;
        const otherPlayer = alivePlayers.find(p => p.id !== player.id);

        if (eff.type === 'shared_defense') {
          groupDefenseReduction = Math.max(groupDefenseReduction, eff.reduction || 0.30);
          groupDefAnnouncements.push(`🛡️ **${player.name}** (${player.class}) desplegó **${ability.name}** (${eff.label}) protegiendo a ambos aventureros.`);
        } else if (eff.type === 'shield_ally' && otherPlayer) {
          const prevS = allyShieldPool.get(otherPlayer.id) || 0;
          allyShieldPool.set(otherPlayer.id, prevS + (eff.amount || 2));
          groupDefAnnouncements.push(`🛡️ **${player.name}** (${player.class}) activó **${ability.name}**: ¡Otorga **+${eff.amount} PS de Escudo** a **${otherPlayer.name}**!`);
        } else if (eff.type === 'heal_ally' && otherPlayer) {
          const prevH = allyHealPool.get(otherPlayer.id) || 0;
          allyHealPool.set(otherPlayer.id, prevH + (eff.amount || 2));
          groupDefAnnouncements.push(`💖 **${player.name}** (${player.class}) activó **${ability.name}**: ¡Sana **+${eff.amount} PS** a **${otherPlayer.name}**!`);
        } else if (eff.type === 'evasion_aura_ally' && otherPlayer) {
          const prevE = allyEvasionPool.get(otherPlayer.id) || 0;
          allyEvasionPool.set(otherPlayer.id, prevE + (eff.amount || 2));
          groupDefAnnouncements.push(`💨 **${player.name}** (${player.class}) desplegó **${ability.name}**: ¡Facilita la evasión de **${otherPlayer.name}** (+${eff.amount} Bono)!`);
        }
      }
    }

    for (const player of alivePlayers) {
      const act = actionMap.get(player.id) || {
        action_selected: 'Defender',
        flavor_text: 'Levanta su guardia ante la embestida enemiga.'
      };

      let hp = player.hp;
      let lives = player.lives;
      let isAlive = player.is_alive;
      let isDefending = false;
      let isDodging = false;
      let dodgeSuccess = false;
      let damageDealt = 0;
      let healed = 0;
      const actionType = act.action_selected;

      // Aplicar curación de apoyo recibida de su aliado si la hubo
      const allyHealRcv = allyHealPool.get(player.id) || 0;
      if (allyHealRcv > 0) {
        const prevHp = hp;
        hp = Math.min(10, hp + allyHealRcv);
        healed += (hp - prevHp);
      }

      let abilityId = act.ability_id;
      let d20Roll = null;
      let rawFlavor = (act.flavor_text || '').trim();
      const tagMatch = rawFlavor.match(/^\[ability:([^\]]+)\]\s*([\s\S]*)/);
      if (tagMatch) {
        const metaContent = tagMatch[1];
        rawFlavor = tagMatch[2].trim();
        const parts = metaContent.split('|');
        abilityId = parts[0];
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (p.startsWith('d20:')) d20Roll = parseInt(p.replace('d20:', ''), 10);
        }
      }
      if (!d20Roll) d20Roll = Math.floor(Math.random() * 20) + 1;
      const flavor = rawFlavor;

      let ability = findAbilityById(player.class, abilityId) || findAbilityById(player.class, actionType);
      if (!ability) {
        const cData = getAbilitiesForClass(player.class);
        ability = (cData && cData.defenses && cData.defenses[0]) || { type: 'defense', reduction: 0.35, name: 'Guardia Básica', icon: '🛡️' };
      }

      // Parsear ítems del personaje
      let playerItems = [];
      if (typeof player.items === 'string') {
        try { playerItems = JSON.parse(player.items); } catch { playerItems = []; }
      } else if (Array.isArray(player.items)) {
        playerItems = player.items;
      }

      const evalRes = evaluateD20Ability(ability, d20Roll, false, playerItems);
      let defReduction = 0.35;
      let counterDmg = 0;
      let isCritFail = false;
      let dc = 10;
      let flatRed = 0;

      for (const it of playerItems) {
        if (it && it.flatDamageReduction) flatRed += it.flatDamageReduction;
      }

      // Bono de evasión aliado
      const evasionBonus = allyEvasionPool.get(player.id) || 0;

      if (ability && ability.type === 'defense') {
        isDefending = true;
        defReduction = Number.isFinite(evalRes.reduction) ? evalRes.reduction : 0.35;
        if (groupDefenseReduction > 0) defReduction = Math.max(defReduction, groupDefenseReduction);
      } else if (ability && ability.type === 'counter') {
        isDefending = true;
        defReduction = Number.isFinite(evalRes.reduction) ? evalRes.reduction : 0.30;
        if (groupDefenseReduction > 0) defReduction = Math.max(defReduction, groupDefenseReduction);
        counterDmg = Number.isFinite(evalRes.counterDamage) ? evalRes.counterDamage : 1;
      } else if (ability && ability.type === 'dodge') {
        isDodging = true;
        dc = Math.max(6, (evalRes.dc || 10) - evasionBonus);
        dodgeSuccess = d20Roll >= dc;
        isCritFail = d20Roll === 1;
        if (d20Roll === 20) {
          hp = Math.min(10, hp + 1);
        }
      } else if (actionType === 'Interactuar' || (ability && ability.healAmount)) {
        const prev = hp;
        const healAmt = evalRes ? evalRes.healAmount : 5;
        hp = Math.min(10, hp + healAmt);
        healed += (hp - prev);
      } else {
        isDefending = true;
        defReduction = Math.max(0.35, groupDefenseReduction);
      }

      playerResults.push({
        player,
        actionType,
        abilityId,
        abilityName: ability ? `${ability.icon || '🛡️'} ${ability.name}` : 'Guardia',
        d20Roll,
        flavor,
        isDefending,
        defReduction,
        counterDmg,
        flatDamageReduction: flatRed,
        allyShield: allyShieldPool.get(player.id) || 0,
        isDodging,
        dodgeSuccess,
        isCritFail,
        dc,
        damageDealt: 0,
        isCrit: false,
        healed,
        currentHp: hp,
        currentLives: lives,
        isAlive,
        damageReceivedThisTurn: 0,
        collapsedThisTurn: false
      });
    }

    // Los monstruos atacan directamente a los héroes
    const monsterAttackLogs = [];
    let activeEnemies = combatState.enemies.filter(e => e.isAlive && (Number.isFinite(e.hp) ? e.hp > 0 : true));
    if (activeEnemies.length === 0) {
      activeEnemies.push(combatState.enemies[0]);
    }

    let lootDroppedFromCounter = null;

    for (const enemy of activeEnemies) {
      const targetCandidates = playerResults.filter(p => p.isAlive && p.currentLives > 0);
      if (targetCandidates.length === 0) break;

      updateMonsterTurnStats(enemy, room.current_turn);
      const activeAtk = getMonsterActiveAttack(enemy, room.current_turn);
      const turnBonus = getMonsterTurnBonus(enemy, room.current_turn);
      const isAoE = activeAtk.type === 'aoe' || activeAtk.type === 'all';

      // Si el bono indica concentrar en el de menor vida y no es AoE
      let targets = [];
      if (isAoE) {
        targets = targetCandidates;
      } else if (turnBonus && turnBonus.targetLowestHp) {
        const sortedByHp = [...targetCandidates].sort((a, b) => a.currentHp - b.currentHp);
        targets = [sortedByHp[0]];
      } else {
        targets = [targetCandidates[Math.floor(Math.random() * targetCandidates.length)]];
      }

      const bonusDmg = (turnBonus && turnBonus.bonusDmg) ? turnBonus.bonusDmg : 0;
      const ignoreFlat = Boolean(turnBonus && turnBonus.ignoreFlatRed);
      const bonusTag = turnBonus ? ` [✨ Bono: ${turnBonus.icon} ${turnBonus.title}]` : '';

      const atkHeader = isAoE
        ? `• 🩸 **${enemy.name}** desató **${activeAtk.name}** (${activeAtk.typeLabel})${bonusTag}!`
        : `• 🩸 **${enemy.name}** concentró **${activeAtk.name}** (${activeAtk.typeLabel})${bonusTag} sobre **${targets[0].player.name}** (${targets[0].player.class})!`;

      const reactionDetails = [];

      for (const targetObj of targets) {
        const minD = activeAtk.minDmg || 2;
        const maxD = activeAtk.maxDmg || 4;
        const enemyBaseDamage = Math.floor(Math.random() * (maxD - minD + 1)) + minD + bonusDmg;
        let actualDamage = 0;

        const isDodged = targetObj.isDodging && targetObj.dodgeSuccess;
        const failedDodge = targetObj.isDodging && !targetObj.dodgeSuccess;
        const isDefended = targetObj.isDefending;
        let counterReflected = 0;

        if (isDodged) {
          actualDamage = 0;
        } else if (isDefended) {
          actualDamage = Math.max(1, Math.floor(enemyBaseDamage * (1 - (targetObj.defReduction || 0.35))));
          if (!ignoreFlat && targetObj.flatDamageReduction > 0) {
            actualDamage = Math.max(1, actualDamage - targetObj.flatDamageReduction);
          }
          if (targetObj.counterDmg > 0) {
            counterReflected = targetObj.counterDmg;
            enemy.hp = Math.max(0, (Number.isFinite(enemy.hp) ? enemy.hp : enemy.maxHp) - counterReflected);
            if (enemy.hp <= 0 && enemy.isAlive) {
              enemy.isAlive = false;
              combatState.monstersDefeated = (combatState.monstersDefeated || 0) + 1;
              const lootIdx = Math.floor(Math.random() * LOOT_ITEMS.length);
              lootDroppedFromCounter = {
                ...LOOT_ITEMS[lootIdx],
                droppedByMonster: enemy.name
              };
              if (combatState.monstersDefeated >= 10) {
                isVictory = true;
                combatState.isVictory = true;
              }
            }
          }
        } else {
          actualDamage = enemyBaseDamage + (targetObj.isCritFail ? 1 : 0);
          if (!ignoreFlat && targetObj.flatDamageReduction > 0) {
            actualDamage = Math.max(1, actualDamage - targetObj.flatDamageReduction);
          }
        }

        // Absorber daño con escudo de apoyo aliado si existe
        if (targetObj.allyShield > 0 && actualDamage > 0) {
          const absorbed = Math.min(targetObj.allyShield, actualDamage);
          actualDamage -= absorbed;
          targetObj.allyShield -= absorbed;
        }

        targetObj.currentHp -= actualDamage;
        targetObj.damageReceivedThisTurn += actualDamage;

        // Si el ataque es de tipo drenaje o bono cura al monstruo
        if ((activeAtk.type === 'drain' || (turnBonus && turnBonus.healOnHit)) && actualDamage > 0) {
          const healAmount = (activeAtk.healMonster || 0) + ((turnBonus && turnBonus.healOnHit) || 0);
          if (healAmount > 0) {
            const prevEnemyHp = enemy.hp;
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmount);
            reactionDetails.push(`  ↳ 🧬 **${enemy.name}** drenó vitalidad y regeneró **+${enemy.hp - prevEnemyHp} PS** (Salud: ${enemy.hp}/${enemy.maxHp} PS).`);
          }
        }

        let rDetail = '';
        if (isDodged) {
          rDetail = `  ↳ 💨 **${targetObj.player.name}** usó **${targetObj.abilityName}** (🎲 D20 [${targetObj.d20Roll} vs DC ${targetObj.dc}]) ➔ ⚡ **¡ESQUIVADO (0 PS)!** Eludió limpiamente el impacto. Salud: **${Math.max(0, targetObj.currentHp)}/10 PS**.`;
        } else if (failedDodge) {
          rDetail = `  ↳ 💨 **${targetObj.player.name}** intentó esquivar con **${targetObj.abilityName}** (🎲 D20 [${targetObj.d20Roll} vs DC ${targetObj.dc}]) ➔ ❌ **¡FALLÓ LA EVASIÓN!** Recibe **${actualDamage} PS de daño directo**. Salud: **${Math.max(0, targetObj.currentHp)}/10 PS**.`;
        } else if (isDefended) {
          const counterNote = counterReflected ? ` *(✨ ¡Reflejó **${counterReflected} PS** de contradaño al atacante!)*` : '';
          const flatNote = (!ignoreFlat && targetObj.flatDamageReduction > 0) ? ` [🧱 -${targetObj.flatDamageReduction} PS plano]` : '';
          rDetail = `  ↳ 🛡️ **${targetObj.player.name}** se protegió con **${targetObj.abilityName}** (🎲 D20 [${targetObj.d20Roll}]) amortiguando el ${Math.round((targetObj.defReduction || 0.35) * 100)}%${flatNote} ➔ Recibe **${actualDamage} PS de daño**. Salud: **${Math.max(0, targetObj.currentHp)}/10 PS**${counterNote}.`;
        } else if (targetObj.healed > 0) {
          rDetail = `  ↳ 🧪 **${targetObj.player.name}** bebió una poción sin cobertura defensiva ➔ Recibe **${actualDamage} PS de daño directo**. Salud: **${Math.max(0, targetObj.currentHp)}/10 PS**.`;
        } else {
          rDetail = `  ↳ 💥 **${targetObj.player.name}** no tenía guardia ➔ Recibe **${actualDamage} PS de daño directo**. Salud: **${Math.max(0, targetObj.currentHp)}/10 PS**.`;
        }

        reactionDetails.push(rDetail);
      }

      monsterAttackLogs.push(`${atkHeader}\n${reactionDetails.join('\n')}`);
    }

    // Aplicar colapso mágico si algún jugador cayó a 0 PS
    for (const pRes of playerResults) {
      if (pRes.currentHp <= 0) {
        pRes.collapsedThisTurn = true;
        pRes.currentLives -= 1;
        if (pRes.currentLives <= 0) {
          pRes.currentLives = 0;
          pRes.currentHp = 0;
          pRes.isAlive = false;
          monsterAttackLogs.push(`  ↳ 💀 **¡COLAPSO DEFINITIVO!** El alma de **${pRes.player.name}** fue devorada por el vacío cósmico.`);
        } else {
          pRes.currentHp = 10;
          monsterAttackLogs.push(`  ↳ ⚠️ **¡COLAPSO VITAL!** **${pRes.player.name}** cayó a 0 PS y perdió 1 alma (❤️ Vidas restantes: ${pRes.currentLives}/3). ¡Resucita con 10/10 PS para la próxima ronda!`);
        }
      }
    }

    // Comprobar si todos los jugadores en la sala han muerto (0 vidas restantes) -> DERROTA
    const anyHeroAlive = characters.some(c => {
      const pRes = playerResults.find(p => p.player.id === c.id);
      if (pRes) {
        return pRes.isAlive && pRes.currentLives > 0;
      }
      return c.is_alive && (c.lives || 0) > 0;
    });

    if (!anyHeroAlive) {
      isDefeat = true;
      combatState.isDefeat = true;
      monsterAttackLogs.push(`\n\n💀 **¡DERROTA ABSOLUTA DE LA EXPEDICIÓN!**\nTodos los héroes han caído y sus almas han sido consumidas por el vacío infinito.`);
    }

    let lootBannerCounter = '';
    if (lootDroppedFromCounter) {
      lootBannerCounter = `\n\n🎁 **¡BOTÍN DESPRENDIDO POR CONTRAGOLPE!**\n` +
        `¡El contragolpe fulminó a la criatura y liberó: **${lootDroppedFromCounter.icon} ${lootDroppedFromCounter.name}** (*${lootDroppedFromCounter.statText}*)!`;
    }

    const enemiesQuick = combatState.enemies.map(e => {
      const safeHp = Number.isFinite(e.hp) ? e.hp : e.maxHp;
      return `**${e.name}** (#${e.monsterNumber || 1}/10): ${e.isAlive && safeHp > 0 ? `${safeHp}/${e.maxHp} PS` : '💀 Derrotado'}`;
    }).join(' | ');

    const playersQuick = playerResults.map(p => 
      `**${p.player.name}** (${p.player.class}): ${p.currentHp}/10 PS (${'❤️'.repeat(p.currentLives)}${'🖤'.repeat(3 - p.currentLives)})`
    ).join(' | ');

    const groupDefBlock = groupDefAnnouncements.length > 0
      ? `**Sinergias Defensivas Grupales:**\n${groupDefAnnouncements.join('\n')}\n\n`
      : '';

    const attacksSummary = monsterAttackLogs.join('\n\n') || '• Los monstruos no pudieron asestar golpes.';

    const nextHeroCall = isDefeat
      ? `> 💀 **LA EXPEDICIÓN HA FRACASADO.** Las almas han colapsado.`
      : `> ⚔️ **¡El asalto cesó!** En el **Turno ${room.current_turn + 1}**, ¡es vuestro turno de **Atacar**! Elegid vuestra habilidad de ataque más potente.`;

    const fullGmMessage = `### 🛡️ Turno ${room.current_turn}: ¡Asalto de los Monstruos!\n\n` +
      groupDefBlock +
      `**Ataques de las Criaturas:**\n${attacksSummary}${lootBannerCounter}\n\n` +
      `---\n\n` +
      `### 📊 Estado Rápido (Progreso: ${combatState.monstersDefeated || 0}/10 Monstruos)\n\n` +
      `* **Monstruo Activo:** ${enemiesQuick}\n` +
      `* **Grupo:** ${playersQuick}\n` +
      `* **Anomalía:** ${combatState.anomaly.split(':')[0]}\n\n` +
      nextHeroCall;

    return {
      combatState,
      playerResults,
      fullGmMessage,
      lootDrop: lootDroppedFromCounter,
      narrativeText: attacksSummary,
      stateText: `### Estado Rápido (Progreso: ${combatState.monstersDefeated || 0}/10 Monstruos)\n\n* **Monstruo:** ${enemiesQuick}\n* **Grupo:** ${playersQuick}`,
      isVictory: Boolean(combatState.isVictory || isVictory),
      isDefeat: Boolean(combatState.isDefeat || isDefeat),
      monstersDefeated: combatState.monstersDefeated || 0,
      totalMonsters: 10,
      currentMonsterNumber: (combatState.currentMonsterIndex || 0) + 1
    };
  }
}

module.exports = {
  getOrCreateCombatState,
  resolveCombatTurn,
  getMonsterActiveAttack,
  getMonsterActiveDefense,
  getMonsterTurnBonus,
  createMonsterInstance,
  updateMonsterTurnStats,
  PROGRESSIVE_BESTIARY,
  ENEMY_ROSTER,
  GRAVITY_ANOMALIES
};
