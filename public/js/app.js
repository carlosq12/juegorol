/**
 * Antigravyty - Frontend Application Controller
 * Manejo de Socket.IO, pantallas, personajes, combate y renderizado de la narrativa del GM.
 */

// Estado global del cliente
const state = {
  user: null,
  room: null,
  myCharacter: null,
  characters: [],
  combatState: null,
  selectedClass: 'Mago',
  selectedAction: 'Atacar',
  selectedAbilityId: null,
  turnAbilityRolls: {},
  d20Roll: null,
  hasRolledDiceThisTurn: false,
  isRollingDice: false,
  actionSubmittedThisTurn: false,
  selectedMonsterIndex: 0,
  currentPendingLoot: null,
  activeRoomData: null,
  currentTurnHeroAbilities: {},
  lastPhaseHeroAbilities: {},
  socket: null
};

// Referencias a elementos del DOM
const elements = {
  particlesContainer: document.getElementById('particlesContainer'),
  userBadge: document.getElementById('userBadge'),
  userBadgeName: document.getElementById('userBadgeName'),
  soundToggle: document.getElementById('soundToggle'),

  btnLogout: document.getElementById('btnLogout'),

  // Pantallas
  screenAuth: document.getElementById('screenAuth'),
  screenRoomSelect: document.getElementById('screenRoomSelect'),
  screenLobby: document.getElementById('screenLobby'),
  screenCombat: document.getElementById('screenCombat'),

  // Pestañas y Formularios de Auth
  tabLogin: document.getElementById('tabLogin'),
  tabRegister: document.getElementById('tabRegister'),
  formLogin: document.getElementById('formLogin'),
  formRegister: document.getElementById('formRegister'),
  loginIdentifier: document.getElementById('loginIdentifier'),
  loginPassword: document.getElementById('loginPassword'),
  regUsername: document.getElementById('regUsername'),
  regEmail: document.getElementById('regEmail'),
  regPassword: document.getElementById('regPassword'),
  regPasswordConfirm: document.getElementById('regPasswordConfirm'),
  linkGoToRegister: document.getElementById('linkGoToRegister'),
  linkGoToLogin: document.getElementById('linkGoToLogin'),

  // Selección de Sala
  roomsGrid: document.getElementById('roomsGrid'),
  formJoinCode: document.getElementById('formJoinCode'),
  inputRoomCode: document.getElementById('inputRoomCode'),
  btnOpenCreateModal: document.getElementById('btnOpenCreateModal'),
  modalCreateRoom: document.getElementById('modalCreateRoom'),
  btnCloseCreateModal: document.getElementById('btnCloseCreateModal'),
  formCreateRoom: document.getElementById('formCreateRoom'),
  selectStory: document.getElementById('selectStory'),
  btnCreateRoom: document.getElementById('btnCreateRoom'),
  btnJoinRoom: document.getElementById('btnJoinRoom'),
  btnCopyCode: document.getElementById('btnCopyCode'),
  activeExpeditionBanner: document.getElementById('activeExpeditionBanner'),
  activeBannerRoomCode: document.getElementById('activeBannerRoomCode'),
  activeBannerStoryTitle: document.getElementById('activeBannerStoryTitle'),
  activeBannerDetails: document.getElementById('activeBannerDetails'),
  btnResumeExpedition: document.getElementById('btnResumeExpedition'),
  btnAbandonExpedition: document.getElementById('btnAbandonExpedition'),

  // Lobby
  lobbyRoomBadge: document.getElementById('lobbyRoomBadge'),
  lobbyStoryTitle: document.getElementById('lobbyStoryTitle'),
  charName: document.getElementById('charName'),
  classCards: document.querySelectorAll('.class-card'),
  hostControls: document.getElementById('hostControls'),
  btnSaveCharacter: document.getElementById('btnSaveCharacter'),
  btnClassMago: document.getElementById('btnClassMago'),
  btnClassPaladin: document.getElementById('btnClassPaladin'),
  btnClassPicaro: document.getElementById('btnClassPicaro'),
  btnClassArquero: document.getElementById('btnClassArquero'),
  statMago: document.getElementById('statMago'),
  statPaladin: document.getElementById('statPaladin'),
  statPicaro: document.getElementById('statPicaro'),
  statArquero: document.getElementById('statArquero'),
  btnStartGame: document.getElementById('btnStartGame'),
  lobbyPlayersList: document.getElementById('lobbyPlayersList'),
  lobbyStatusBadge: document.getElementById('lobbyStatusBadge'),
  lobbyActiveNotice: document.getElementById('lobbyActiveNotice'),
  hostRequirementNotice: document.getElementById('hostRequirementNotice'),

  // Combate
  combatTurnTitle: document.getElementById('combatTurnTitle'),
  combatAnomalyText: document.getElementById('combatAnomalyText'),
  combatRoomCodeBadge: document.getElementById('combatRoomCodeBadge'),
  enemiesContainer: document.getElementById('enemiesContainer'),
  narrativeText: document.getElementById('narrativeText'),
  monsterTacticalPanel: document.getElementById('monsterTacticalPanel'),
  combatPlayersGrid: document.getElementById('combatPlayersGrid'),
  abilitiesContainer: document.getElementById('abilitiesContainer'),
  actionButtons: document.querySelectorAll('.action-btn'),
  actionPhaseBadge: document.getElementById('actionPhaseBadge'),
  actionConsolePhaseTitle: document.getElementById('actionConsolePhaseTitle'),
  btnActionAtacar: document.getElementById('btnActionAtacar'),
  btnActionDefender: document.getElementById('btnActionDefender'),
  btnActionEsquivar: document.getElementById('btnActionEsquivar'),
  btnActionInteractuar: document.getElementById('btnActionInteractuar'),
  hintAtacar: document.getElementById('hintAtacar'),
  hintEsquivar: document.getElementById('hintEsquivar'),
  hintDefender: document.getElementById('hintDefender'),
  hintInteractuar: document.getElementById('hintInteractuar'),
  flavorInput: document.getElementById('flavorInput'),
  flavorTip: document.getElementById('flavorTip'),
  btnSubmitAction: document.getElementById('btnSubmitAction'),
  btnForceResolve: document.getElementById('btnForceResolve'),
  btnRerollStats: document.getElementById('btnRerollStats'),
  actionStatusNotice: document.getElementById('actionStatusNotice'),

  // Widget del Dado D20
  diceWidget: document.getElementById('diceWidget'),
  diceContainer: document.getElementById('diceContainer'),
  d20Die: document.getElementById('d20Die'),
  diceRollNumber: document.getElementById('diceRollNumber'),
  diceStatusLabel: document.getElementById('diceStatusLabel'),
  btnRollDice: document.getElementById('btnRollDice'),
  diceResultSummary: document.getElementById('diceResultSummary'),

  // Chat
  chatMessages: document.getElementById('chatMessages'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  chatActiveUserBadge: document.getElementById('chatActiveUserBadge'),

  // Modal de Botín e Inventario
  lootModal: document.getElementById('lootModal'),
  lootModalIcon: document.getElementById('lootModalIcon'),
  lootModalTitle: document.getElementById('lootModalTitle'),
  lootModalSubtitle: document.getElementById('lootModalSubtitle'),
  lootModalStatText: document.getElementById('lootModalStatText'),
  lootModalDesc: document.getElementById('lootModalDesc'),
  lootSlotsGrid: document.getElementById('lootSlotsGrid'),
  btnDismissLoot: document.getElementById('btnDismissLoot'),

  // Historial de Expediciones (Menú Principal)
  expeditionsHistorySection: document.getElementById('expeditionsHistorySection'),
  btnRefreshHistory: document.getElementById('btnRefreshHistory'),
  historyExpeditionsList: document.getElementById('historyExpeditionsList'),

  // Modal Fin de Partida (Victoria / Derrota)
  modalGameOver: document.getElementById('modalGameOver'),
  gameOverHeader: document.getElementById('gameOverHeader'),
  gameOverIcon: document.getElementById('gameOverIcon'),
  gameOverTitle: document.getElementById('gameOverTitle'),
  gameOverSubtitle: document.getElementById('gameOverSubtitle'),
  gameOverMonstersCount: document.getElementById('gameOverMonstersCount'),
  gameOverTurnsCount: document.getElementById('gameOverTurnsCount'),
  gameOverPartyStatus: document.getElementById('gameOverPartyStatus'),
  gameOverMessage: document.getElementById('gameOverMessage'),
  btnGameOverViewDetails: document.getElementById('btnGameOverViewDetails'),
  btnGameOverBackToLobby: document.getElementById('btnGameOverBackToLobby'),

  // Modal de Detalle de Expedición y Crónica
  modalExpeditionDetails: document.getElementById('modalExpeditionDetails'),
  historyModalCodeBadge: document.getElementById('historyModalCodeBadge'),
  historyModalStatusBadge: document.getElementById('historyModalStatusBadge'),
  historyModalStoryTitle: document.getElementById('historyModalStoryTitle'),
  historyModalMeta: document.getElementById('historyModalMeta'),
  historyModalPartyList: document.getElementById('historyModalPartyList'),
  historyModalChronicleContent: document.getElementById('historyModalChronicleContent'),
  btnCloseHistoryModal: document.getElementById('btnCloseHistoryModal'),

  // Sistema Flotante de Notificaciones
  toastContainer: document.getElementById('toastContainer')
};

// Generar partículas gravitatorias flotantes
function initParticles() {
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 8 + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 10}s`;
    p.style.animationDuration = `${Math.random() * 10 + 10}s`;
    elements.particlesContainer.appendChild(p);
  }
}

// Navegación entre pantallas
function showScreen(screenName) {
  elements.screenAuth.classList.add('hidden');
  elements.screenRoomSelect.classList.add('hidden');
  elements.screenLobby.classList.add('hidden');
  elements.screenCombat.classList.add('hidden');

  if (screenName === 'auth') elements.screenAuth.classList.remove('hidden');
  if (screenName === 'roomSelect') elements.screenRoomSelect.classList.remove('hidden');
  if (screenName === 'lobby') elements.screenLobby.classList.remove('hidden');
  if (screenName === 'combat') elements.screenCombat.classList.remove('hidden');
}

// Inicializar Sockets
function initSocket() {
  state.socket = io();

  state.socket.on('connect', () => {
    console.log('Conectado al servidor por WebSockets');
    if (state.room && state.user) {
      state.socket.emit('join_room', {
        roomId: state.room.id,
        userId: state.user.id,
        username: state.user.username
      });
    }
  });

  state.socket.on('room_sync', ({ room, characters, messages, combatState }) => {
    state.room = room;
    state.characters = characters;
    state.combatState = combatState;
    updateMyCharacter();

    // Sincronizar mensajes previos del chat de la sala
    if (elements.chatMessages && Array.isArray(messages)) {
      elements.chatMessages.innerHTML = '';
      messages.forEach(m => appendChatMessage(m, false));
    }

    // Si el jugador ya tiene un personaje creado Y la sala está activa, va a combate.
    // Si aún NO ha creado personaje, SIEMPRE debe ir primero al lobby a configurarlo.
    if (state.myCharacter && room.status === 'active') {
      showScreen('combat');
      renderCombatView();
    } else {
      showScreen('lobby');
      renderLobbyView();
    }
  });

  state.socket.on('players_updated', (characters) => {
    state.characters = characters;
    updateMyCharacter();
    if (state.room && state.room.status === 'active') {
      renderCombatPlayers();
    } else {
      renderLobbyPlayers();
    }
  });

  state.socket.on('player_alert', (alertData) => {
    showToast(alertData);
  });

  state.socket.on('game_started', ({ room, characters, combatState, introMessage }) => {
    state.room = room;
    state.characters = characters;
    state.combatState = combatState;
    state.actionSubmittedThisTurn = false;
    state.selectedAbilityId = null;
    state.turnAbilityRolls = {};
    state.d20Roll = null;
    state.hasRolledDiceThisTurn = false;
    updateMyCharacter();
    showScreen('combat');
    renderCombatView();

    if (introMessage) {
      renderNarrative(introMessage.content);
    }
    window.soundEngine.playTurnBell();
  });

  state.socket.on('game_start_error', ({ message }) => {
    alert(message);
  });

  state.socket.on('action_received', ({ characterId, submittedCount, totalAlive }) => {
    elements.actionStatusNotice.textContent = `Acciones enviadas: ${submittedCount}/${totalAlive} aventureros listos`;
  });

  // Aviso en vivo de habilidades preparadas/seleccionadas por compañeros
  state.socket.on('team_ability_preview', (data) => {
    if (!data || !data.characterId) return;
    state.currentTurnHeroAbilities[data.characterId] = data;

    // Si la acción proviene de un compañero, mostrar aviso interactivo
    const isMe = state.myCharacter && state.myCharacter.id === data.characterId;
    if (!isMe && data.ability) {
      const isGroup = Boolean(data.ability.isGroupBuff);
      const buffText = (isGroup && data.ability.groupEffect && data.ability.groupEffect.label)
        ? `\n🤝 Sinergia para ti: ${data.ability.groupEffect.label}`
        : '';
      const rollText = data.d20Roll ? ` [🎲 D20: ${data.d20Roll}]` : '';
      const statusTitle = data.isSubmitted ? '🔒 ¡Acción Sellada!' : '⚡ Habilidad Seleccionada';

      showToast({
        type: isGroup ? 'legendary' : 'info',
        title: `${statusTitle} (${data.characterName})`,
        message: `${data.ability.icon || '⚔️'} ${data.ability.name}${rollText}${buffText}`
      });

      if (isGroup && window.soundEngine?.playSynergy) {
        window.soundEngine.playSynergy();
      }
    }

    renderCombatPlayers();
  });

  // Sincronización inicial de habilidades preparadas al entrar o reconectarse
  state.socket.on('initial_turn_abilities', ({ abilities }) => {
    if (Array.isArray(abilities)) {
      abilities.forEach(a => {
        if (a && a.characterId) {
          state.currentTurnHeroAbilities[a.characterId] = a;
        }
      });
      renderCombatPlayers();
    }
  });

  state.socket.on('turn_resolved', ({ turnNumber, nextTurn, characters, combatState, gmMessage, resolutionDetails }) => {
    state.characters = characters || [];
    state.combatState = combatState;
    if (state.room) {
      state.room.current_turn = nextTurn;
    }
    updateMyCharacter();

    // Guardar lo ejecutado en la fase que acaba de concluir (Ataque vs Defensa) para persistirlo en la UI
    const phaseEnded = (turnNumber % 2) === 1 ? 'Ataque' : 'Defensa';
    const phaseIcon = (turnNumber % 2) === 1 ? '⚔️' : '🛡️';
    if (Array.isArray(resolutionDetails)) {
      resolutionDetails.forEach(pRes => {
        if (pRes && pRes.player) {
          state.lastPhaseHeroAbilities[pRes.player.id] = {
            phase: phaseEnded,
            phaseIcon,
            abilityName: pRes.abilityName || 'Acción',
            d20Roll: pRes.d20Roll,
            isCrit: Boolean(pRes.isCrit),
            damageDealt: pRes.damageDealt || 0,
            defReduction: pRes.defReduction,
            healed: pRes.healed || 0
          };
        }
      });
    }

    // Resetear formulario de acción y dados para el nuevo turno
    state.currentTurnHeroAbilities = {};
    state.actionSubmittedThisTurn = false;
    state.selectedAbilityId = null;
    state.turnAbilityRolls = {};
    state.d20Roll = null;
    state.hasRolledDiceThisTurn = false;
    state.isRollingDice = false;

    if (elements.flavorInput) elements.flavorInput.value = '';
    if (elements.diceRollNumber) elements.diceRollNumber.textContent = '20';
    if (elements.d20Die) elements.d20Die.classList.remove('rolling', 'crit-20', 'crit-1');
    if (elements.btnSubmitAction) {
      elements.btnSubmitAction.disabled = true;
      elements.btnSubmitAction.textContent = 'Lanza el D20 para Sellar';
    }

    const isHeroPhase = (nextTurn % 2) === 1;
    if (elements.actionStatusNotice) {
      elements.actionStatusNotice.textContent = isHeroPhase
        ? '⚔️ ¡Nuevo Turno! Fase de Ataque: Elige tu habilidad y lanza el D20.'
        : '🛡️ ¡Nuevo Turno! Fase de Defensa: Elige tu guardia o apoyo grupal y lanza el D20.';
    }

    // Reproducir sonidos acordes de forma segura
    try {
      if (Array.isArray(resolutionDetails) && resolutionDetails.length > 0) {
        let hasCrit = resolutionDetails.some(d => d && d.isCrit);
        let hasCollapse = resolutionDetails.some(d => d && d.collapsedThisTurn);
        let hasPotion = resolutionDetails.some(d => d && d.healed > 0);

        if (hasCollapse && window.soundEngine?.playCollapse) {
          window.soundEngine.playCollapse();
        } else if (hasCrit && window.soundEngine?.playCrit) {
          window.soundEngine.playCrit();
        } else if (hasPotion && window.soundEngine?.playPotion) {
          window.soundEngine.playPotion();
        } else if (window.soundEngine?.playAttack) {
          window.soundEngine.playAttack();
        }
      }
    } catch (soundErr) {
      console.warn('Error al reproducir audio del turno:', soundErr);
    }

    // Re-renderizar tablero de combate y resumen de dados sin excepción
    try {
      renderCombatView();
      updateDiceSummary();
      if (gmMessage && gmMessage.content) {
        renderNarrative(gmMessage.content);
      }
      if (window.soundEngine?.playTurnBell) {
        window.soundEngine.playTurnBell();
      }
    } catch (renderErr) {
      console.error('Error al renderizar el nuevo turno:', renderErr);
    }
  });

  state.socket.on('new_message', (msg) => {
    appendChatMessage(msg);
  });

  state.socket.on('loot_dropped', (data) => {
    if (data && data.item) {
      showToast('🎁 ¡BOTÍN OBTENIDO!', `${data.monsterName} dejó caer: ${data.item.name} (${data.item.statText})`, 'warning');
      if (window.soundEngine) window.soundEngine.playVictory();
      showLootModal(data.item);
    }
  });

  state.socket.on('inventory_updated', (data) => {
    if (state.characters && data && data.characterId) {
      const ch = state.characters.find(c => c.id === data.characterId);
      if (ch) {
        ch.items = data.items;
      }
      if (state.myCharacter && state.myCharacter.id === data.characterId) {
        state.myCharacter.items = data.items;
        updateDiceSummary();
        renderAbilitiesSelector();
      }
      renderCombatPlayers();
    }
  });

  state.socket.on('game_ended', (data) => {
    handleGameEnded(data);
  });
}

function updateMyCharacter() {
  if (!state.user || !state.characters) return;
  state.myCharacter = state.characters.find(c => c.user_id === state.user.id) || null;
}

// -------------------------------------------------------------
// EVENTOS Y ENLACES DE PANTALLA
// -------------------------------------------------------------

// Toggle de sonido
elements.soundToggle.addEventListener('click', () => {
  const isEnabled = window.soundEngine.toggleSound();
  elements.soundToggle.textContent = isEnabled ? '🔊 Sonido: ON' : '🔇 Sonido: OFF';
});

// Cambio de pestañas Login / Registro
function switchAuthTab(tab) {
  if (tab === 'login') {
    elements.tabLogin.style.color = 'var(--border-gold)';
    elements.tabLogin.style.borderBottomColor = 'var(--border-gold)';
    elements.tabRegister.style.color = 'var(--text-muted)';
    elements.tabRegister.style.borderBottomColor = 'transparent';
    elements.formLogin.classList.remove('hidden');
    elements.formRegister.classList.add('hidden');
  } else {
    elements.tabRegister.style.color = 'var(--border-gold)';
    elements.tabRegister.style.borderBottomColor = 'var(--border-gold)';
    elements.tabLogin.style.color = 'var(--text-muted)';
    elements.tabLogin.style.borderBottomColor = 'transparent';
    elements.formRegister.classList.remove('hidden');
    elements.formLogin.classList.add('hidden');
  }
}

if (elements.tabLogin) elements.tabLogin.addEventListener('click', () => switchAuthTab('login'));
if (elements.tabRegister) elements.tabRegister.addEventListener('click', () => switchAuthTab('register'));
if (elements.linkGoToRegister) elements.linkGoToRegister.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('register'); });
if (elements.linkGoToLogin) elements.linkGoToLogin.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('login'); });

// Formulario de Inicio de Sesión
elements.formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const identifier = elements.loginIdentifier.value.trim();
  const password = elements.loginPassword.value;
  if (!identifier) return;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

    onUserAuthenticated(data);
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

// Formulario de Registro Sagrado
elements.formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = elements.regUsername.value.trim();
  const email = elements.regEmail.value.trim();
  const password = elements.regPassword.value;
  const confirm = elements.regPasswordConfirm.value;

  if (password !== confirm) {
    return alert('❌ Las contraseñas no coinciden. Por favor verifícalas.');
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');

    alert(`✨ ¡Bienvenido a Antigravyty, ${data.username}! Tu alma ha sido forjada en la base de datos.`);
    onUserAuthenticated(data);
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

function onUserAuthenticated(user) {
  state.user = user;
  localStorage.setItem('antigravyty_user', JSON.stringify(user));

  // Actualizar badge y botón salir
  elements.userBadge.classList.remove('hidden');
  elements.userBadgeName.textContent = user.username;
  if (elements.btnLogout) elements.btnLogout.classList.remove('hidden');
  if (elements.chatActiveUserBadge) {
    elements.chatActiveUserBadge.textContent = `👤 ${user.username}`;
  }

  initSocket();
  showScreen('roomSelect');

  // Comprobar y ofrecer reanudar expedición activa si existe
  checkAndResumeActiveExpedition(user);
  loadExpeditionHistory();
}

// Comprobar expedición activa del usuario en el servidor o localStorage
async function checkAndResumeActiveExpedition(user) {
  if (!user || !user.id) return;
  try {
    const res = await fetch(`/api/users/${user.id}/active-room`);
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.activeRoom) {
      state.activeRoomData = data;
      renderActiveExpeditionBanner(data);

      // Si el usuario tenía guardada la sala en localStorage y la partida está activa o en lobby
      const savedCode = localStorage.getItem('antigravyty_room_code');
      if (savedCode && savedCode.toUpperCase() === data.activeRoom.room_code.toUpperCase()) {
        resumeExpedition(data);
      }
    } else {
      state.activeRoomData = null;
      if (elements.activeExpeditionBanner) {
        elements.activeExpeditionBanner.classList.add('hidden');
      }
      localStorage.removeItem('antigravyty_room_code');
    }
  } catch (err) {
    console.error('Error al comprobar expedición activa:', err);
  }
}

// Renderizar tarjeta de expedición activa en la pantalla principal
function renderActiveExpeditionBanner(data) {
  if (!elements.activeExpeditionBanner) return;
  const room = data.activeRoom;
  state.activeRoomData = data;

  const stories = {
    '1': 'Ciudadela Flotante de Aethelgard',
    '2': 'El Abismo de Masa Negativa',
    '3': 'El Vórtice de la Aguja Celestial'
  };
  const storyName = stories[room.story_selected] || 'Expedición a lo Desconocido';
  const myChar = (data.characters || []).find(c => String(c.user_id).toUpperCase() === String(state.user?.id).toUpperCase());
  const charInfo = myChar ? `${myChar.name} (${myChar.class})` : (room.character_name ? `${room.character_name} (${room.character_class})` : 'Sin héroe asignado');
  const phaseInfo = (room.current_turn % 2) === 1 ? '⚔️ Ataque' : '🛡️ Defensa';
  const statusInfo = room.status === 'active' ? `En Combate Activo • Turno ${room.current_turn} (${phaseInfo})` : 'En Preparativos (Lobby)';

  if (elements.activeBannerRoomCode) elements.activeBannerRoomCode.textContent = `SALA: ${room.room_code}`;
  if (elements.activeBannerStoryTitle) elements.activeBannerStoryTitle.textContent = storyName;
  if (elements.activeBannerDetails) {
    elements.activeBannerDetails.innerHTML = `Estado: <strong>${statusInfo}</strong> • Tu Héroe: <strong>${escapeHtml(charInfo)}</strong>`;
  }
  elements.activeExpeditionBanner.classList.remove('hidden');
}

// Reanudar la expedición activa
function resumeExpedition(data) {
  if (!data || !data.activeRoom) return;
  state.room = data.activeRoom;
  state.characters = data.characters || [];
  state.combatState = data.combatState;
  localStorage.setItem('antigravyty_room_code', state.room.room_code);
  updateMyCharacter();

  if (state.socket) {
    state.socket.emit('join_room', {
      roomId: state.room.id,
      userId: state.user.id,
      username: state.user.username
    });
  }

  if (state.myCharacter && state.room.status === 'active') {
    showScreen('combat');
    renderCombatView();
    showToast({
      type: 'success',
      title: 'Expedición Reanudada',
      message: `Reincorporado a la sala ${state.room.room_code} (Turno ${state.room.current_turn}).`
    });
  } else {
    showScreen('lobby');
    renderLobbyView();
  }
}

// Botones del Banner de Expedición Activa
if (elements.btnResumeExpedition) {
  elements.btnResumeExpedition.addEventListener('click', () => {
    if (state.activeRoomData) {
      resumeExpedition(state.activeRoomData);
    }
  });
}

if (elements.btnAbandonExpedition) {
  elements.btnAbandonExpedition.addEventListener('click', () => {
    if (confirm('¿Deseas desvincularte de esta expedición en tu menú principal? (Podrás volver a ingresar con el código de 6 letras mientras siga activa).')) {
      localStorage.removeItem('antigravyty_room_code');
      state.activeRoomData = null;
      if (elements.activeExpeditionBanner) {
        elements.activeExpeditionBanner.classList.add('hidden');
      }
      showToast({
        type: 'info',
        title: 'Expedición Desvinculada',
        message: 'Puedes forjar una nueva sala o unirte con otro código.'
      });
    }
  });
}

// -------------------------------------------------------------
// GESTIÓN DEL HISTORIAL DE EXPEDICIONES Y CRÓNICAS DEL GM
// -------------------------------------------------------------
async function loadExpeditionHistory() {
  if (!state.user || !state.user.id || !elements.historyExpeditionsList) return;
  try {
    const res = await fetch(`/api/users/${state.user.id}/expeditions`);
    if (!res.ok) return;
    const data = await res.json();
    renderExpeditionHistory(data.expeditions || []);
  } catch (err) {
    console.error('Error al cargar historial de expediciones:', err);
  }
}

function renderExpeditionHistory(expeditions) {
  if (!elements.historyExpeditionsList) return;
  elements.historyExpeditionsList.innerHTML = '';

  if (!expeditions || expeditions.length === 0) {
    elements.historyExpeditionsList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 1.5rem; font-size: 0.9rem;">
        No hay expediciones previas registradas. ¡Forja tu primera sala o únete a una para iniciar tu leyenda!
      </div>
    `;
    return;
  }

  const stories = {
    '1': 'Ciudadela Flotante de Aethelgard',
    '2': 'El Abismo de Masa Negativa',
    '3': 'El Vórtice de la Aguja Celestial'
  };

  expeditions.forEach(exp => {
    const card = document.createElement('div');
    card.className = 'history-card';

    let statusClass = 'status-waiting';
    let statusLabel = '⏳ En Preparación';
    if (exp.status === 'completed') {
      statusClass = 'status-victory';
      statusLabel = '🏆 Victoria (10/10)';
    } else if (exp.status === 'defeated') {
      statusClass = 'status-defeated';
      statusLabel = '💀 Derrota';
    } else if (exp.status === 'active') {
      statusClass = 'status-active';
      statusLabel = '⚡ En Combate';
    }

    const storyTitle = stories[exp.story_selected] || 'Expedición Gravitacional';
    const dateStr = exp.created_at ? new Date(exp.created_at).toLocaleDateString() : '';

    let partySummary = 'Sin personajes';
    if (Array.isArray(exp.characters) && exp.characters.length > 0) {
      partySummary = exp.characters.map(c => `${c.name} (${c.class})`).join(', ');
    }

    card.innerHTML = `
      <div class="history-card-top">
        <span class="history-card-code">SALA: ${escapeHtml(exp.room_code)}</span>
        <span class="history-status-badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="history-card-story">${escapeHtml(storyTitle)}</div>
      <div class="history-card-meta">
        <span>🔄 ${exp.current_turn} Turnos</span>
        ${dateStr ? `<span>📅 ${dateStr}</span>` : ''}
      </div>
      <div class="history-card-party-preview">
        👥 <strong>Grupo:</strong> ${escapeHtml(partySummary)}
      </div>
      <button type="button" class="btn-view-chronicle" data-room-id="${exp.id}">
        📜 Ver Crónica y Detalle Completo
      </button>
    `;

    const btnView = card.querySelector('.btn-view-chronicle');
    if (btnView) {
      btnView.addEventListener('click', () => {
        showExpeditionChronicleModal(exp.id);
      });
    }

    elements.historyExpeditionsList.appendChild(card);
  });
}

// Botón de refrescar historial
if (elements.btnRefreshHistory) {
  elements.btnRefreshHistory.addEventListener('click', () => {
    loadExpeditionHistory();
    showToast({
      type: 'info',
      title: 'Historial Actualizado',
      message: 'Consultando las últimas expediciones registradas...'
    });
  });
}

// Mostrar modal interactivo con crónica del GM y equipo
async function showExpeditionChronicleModal(roomId) {
  if (!roomId || !elements.modalExpeditionDetails) return;
  try {
    const res = await fetch(`/api/rooms/${roomId}/summary`);
    if (!res.ok) throw new Error('No se pudo cargar el detalle de la expedición');
    const data = await res.json();
    const room = data.room;
    const characters = data.characters || [];
    const narrativeMessages = data.narrativeMessages || [];

    const stories = {
      '1': 'Ciudadela Flotante de Aethelgard',
      '2': 'El Abismo de Masa Negativa',
      '3': 'El Vórtice de la Aguja Celestial'
    };

    if (elements.historyModalCodeBadge) elements.historyModalCodeBadge.textContent = `SALA: ${room.room_code}`;
    if (elements.historyModalStoryTitle) elements.historyModalStoryTitle.textContent = stories[room.story_selected] || 'Expedición Gravitacional';
    
    let statusBadgeClass = 'status-waiting';
    let statusText = '⏳ En Preparación';
    if (room.status === 'completed') {
      statusBadgeClass = 'status-victory';
      statusText = '🏆 Victoria Cósmica';
    } else if (room.status === 'defeated') {
      statusBadgeClass = 'status-defeated';
      statusText = '💀 Derrota';
    } else if (room.status === 'active') {
      statusBadgeClass = 'status-active';
      statusText = '⚡ En Combate';
    }
    if (elements.historyModalStatusBadge) {
      elements.historyModalStatusBadge.className = `history-status-badge ${statusBadgeClass}`;
      elements.historyModalStatusBadge.textContent = statusText;
    }

    const dateStr = room.created_at ? new Date(room.created_at).toLocaleString() : '';
    if (elements.historyModalMeta) {
      elements.historyModalMeta.textContent = `Turnos de Batalla: ${room.current_turn} • Creada: ${dateStr}`;
    }

    // Renderizar héroes con sus ítems equipados
    if (elements.historyModalPartyList) {
      elements.historyModalPartyList.innerHTML = '';
      if (characters.length === 0) {
        elements.historyModalPartyList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem;">Sin personajes registrados en esta expedición.</div>';
      } else {
        characters.forEach(c => {
          const charCard = document.createElement('div');
          charCard.className = 'history-party-hero-card';
          const items = getCharacterItemsArray(c);
          let itemsHtml = '';
          if (items.length > 0) {
            itemsHtml = items.map(it => `<span class="history-item-badge">${it.icon || '⚔️'} ${escapeHtml(it.name)} (${escapeHtml(it.statText)})</span>`).join(' ');
          } else {
            itemsHtml = '<span style="color: var(--text-muted); font-size: 0.75rem;">Sin ítems equipados</span>';
          }

          charCard.innerHTML = `
            <div class="history-hero-header">
              <span class="history-hero-name">${escapeHtml(c.name)}</span>
              <span class="player-class-pill">${escapeHtml(c.class)}</span>
            </div>
            <div class="history-hero-stats">
              Salud: <strong>${c.hp}/10 PS</strong> • Vidas: <strong>${'❤️'.repeat(c.lives)}${'🖤'.repeat(Math.max(0, 3 - c.lives))}</strong>
            </div>
            <div class="history-hero-items">
              ${itemsHtml}
            </div>
          `;
          elements.historyModalPartyList.appendChild(charCard);
        });
      }
    }

    // Renderizar crónica narrativa completa
    if (elements.historyModalChronicleContent) {
      elements.historyModalChronicleContent.innerHTML = '';
      if (narrativeMessages.length === 0) {
        elements.historyModalChronicleContent.innerHTML = '<div style="color: var(--text-muted); font-style: italic;">No hay registros narrativos para esta expedición.</div>';
      } else {
        narrativeMessages.forEach((msg) => {
          const entry = document.createElement('div');
          entry.className = 'history-turn-entry';
          const formatted = escapeHtml(msg.content)
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)(<br>|$)/g, '<h4 style="color: var(--border-gold); margin: 0.4rem 0;">$1</h4>');

          entry.innerHTML = formatted;
          elements.historyModalChronicleContent.appendChild(entry);
        });
      }
    }

    elements.modalExpeditionDetails.classList.remove('hidden');
  } catch (err) {
    alert(err.message || 'Error al cargar crónica');
  }
}

if (elements.btnCloseHistoryModal) {
  elements.btnCloseHistoryModal.addEventListener('click', () => {
    if (elements.modalExpeditionDetails) {
      elements.modalExpeditionDetails.classList.add('hidden');
    }
  });
}

// -------------------------------------------------------------
// CONTROLADOR DE FIN DE PARTIDA (MODAL VICTORIA / DERROTA)
// -------------------------------------------------------------
function handleGameEnded(data) {
  if (!data || !elements.modalGameOver) return;
  state.lastEndedGame = data;

  const isVictory = data.type === 'victory';

  if (isVictory) {
    if (elements.gameOverIcon) elements.gameOverIcon.textContent = '🏆';
    if (elements.gameOverTitle) elements.gameOverTitle.textContent = data.title || '¡VICTORIA CÓSMICA TOTAL!';
    if (elements.gameOverSubtitle) elements.gameOverSubtitle.textContent = 'Habéis erradicado a las 10 criaturas del abismo';
    if (elements.modalGameOver.querySelector('.modal-card')) {
      elements.modalGameOver.querySelector('.modal-card').classList.remove('defeat');
    }
    if (window.soundEngine?.playVictory) window.soundEngine.playVictory();
  } else {
    if (elements.gameOverIcon) elements.gameOverIcon.textContent = '💀';
    if (elements.gameOverTitle) elements.gameOverTitle.textContent = data.title || 'DERROTA ABSOLUTA';
    if (elements.gameOverSubtitle) elements.gameOverSubtitle.textContent = 'Todas las almas han sucumbido al abismo gravitacional';
    if (elements.modalGameOver.querySelector('.modal-card')) {
      elements.modalGameOver.querySelector('.modal-card').classList.add('defeat');
    }
    if (window.soundEngine?.playCollapse) window.soundEngine.playCollapse();
  }

  if (elements.gameOverMonstersCount) {
    elements.gameOverMonstersCount.textContent = `${data.monstersDefeated || (isVictory ? 10 : 0)} / 10`;
  }
  if (elements.gameOverTurnsCount) {
    elements.gameOverTurnsCount.textContent = `Turno ${data.turns || (state.room && state.room.current_turn) || 1}`;
  }
  if (elements.gameOverPartyStatus) {
    const aliveCount = (data.characters || []).filter(c => c.is_alive && c.lives > 0).length;
    elements.gameOverPartyStatus.textContent = isVictory ? `${aliveCount} Héroe(s) Victorioso(s)` : '0 Almas Restantes';
  }
  if (elements.gameOverMessage) {
    elements.gameOverMessage.textContent = data.message || '';
  }

  // Configurar botones del modal de Game Over
  if (elements.btnGameOverViewDetails) {
    elements.btnGameOverViewDetails.onclick = () => {
      elements.modalGameOver.classList.add('hidden');
      showExpeditionChronicleModal(data.roomId || state.room?.id);
    };
  }

  if (elements.btnGameOverBackToLobby) {
    elements.btnGameOverBackToLobby.onclick = () => {
      elements.modalGameOver.classList.add('hidden');
      localStorage.removeItem('antigravyty_room_code');
      state.room = null;
      state.myCharacter = null;
      state.activeRoomData = null;
      showScreen('roomSelect');
      loadExpeditionHistory();
      if (state.user) checkAndResumeActiveExpedition(state.user);
    };
  }

  elements.modalGameOver.classList.remove('hidden');

  showToast({
    type: isVictory ? 'success' : 'danger',
    title: isVictory ? '🏆 ¡EXPEDICIÓN VICTORIOSA!' : '💀 ¡EXPEDICIÓN FALLIDA!',
    message: data.message || '',
    duration: 8000
  });
}

// Cerrar sesión
if (elements.btnLogout) {
  elements.btnLogout.addEventListener('click', () => {
    if (confirm('¿Deseas cerrar tu sesión actual?')) {
      localStorage.removeItem('antigravyty_user');
      localStorage.removeItem('antigravyty_room_code');
      state.user = null;
      state.room = null;
      state.myCharacter = null;
      state.activeRoomData = null;
      elements.userBadge.classList.add('hidden');
      elements.btnLogout.classList.add('hidden');
      showScreen('auth');
    }
  });
}

// Crear Sala
if (elements.btnCreateRoom) {
  elements.btnCreateRoom.addEventListener('click', async () => {
    if (!state.user) {
      alert('Debes iniciar sesión primero para crear una sala');
      showScreen('auth');
      return;
    }
    const storySelected = elements.selectStory ? elements.selectStory.value : '1';
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: state.user.id, storySelected })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'No se pudo crear la sala');
      }
      state.room = await res.json();
      localStorage.setItem('antigravyty_room_code', state.room.room_code);
      state.socket.emit('join_room', {
        roomId: state.room.id,
        userId: state.user.id,
        username: state.user.username
      });
      showScreen('lobby');
      renderLobbyView();
      showToast({
        type: 'success',
        title: 'Sala Creada',
        message: `¡Expedición ${state.room.room_code} lista! Comparte el código.`
      });
    } catch (err) {
      alert(err.message);
    }
  });
}

// Copiar código de sala al portapapeles
if (elements.btnCopyCode) {
  elements.btnCopyCode.addEventListener('click', async () => {
    if (!state.room || !state.room.room_code) return;
    try {
      await navigator.clipboard.writeText(state.room.room_code);
      const originalText = elements.btnCopyCode.textContent;
      elements.btnCopyCode.textContent = '✓ ¡Copiado!';
      showToast({
        type: 'info',
        title: 'Código Copiado',
        message: `El código ${state.room.room_code} está en tu portapapeles.`
      });
      setTimeout(() => {
        elements.btnCopyCode.textContent = originalText;
      }, 2000);
    } catch (err) {
      prompt('Copia este código de sala para tus amigos:', state.room.room_code);
    }
  });
}

// Unirse con código
if (elements.btnJoinRoom) {
  elements.btnJoinRoom.addEventListener('click', async () => {
    if (!state.user) {
      alert('Debes iniciar sesión primero para unirte a una sala');
      showScreen('auth');
      return;
    }
    const code = elements.inputRoomCode ? elements.inputRoomCode.value.trim().toUpperCase() : '';
    if (!code) return alert('Por favor introduce un código de 6 caracteres');

    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) throw new Error('Código de sala inválido o no encontrado');
      const data = await res.json();
      state.room = data.room;
      state.characters = data.characters;
      state.combatState = data.combatState;
      localStorage.setItem('antigravyty_room_code', state.room.room_code);
      updateMyCharacter();

      state.socket.emit('join_room', {
        roomId: state.room.id,
        userId: state.user.id,
        username: state.user.username
      });

      // Si aún NO ha registrado personaje en esta sala, va SIEMPRE al lobby primero a crearlo
      if (state.myCharacter && state.room.status === 'active') {
        showScreen('combat');
        renderCombatView();
      } else {
        showScreen('lobby');
        renderLobbyView();
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// Selección de Clase
if (elements.classCards && elements.classCards.length > 0) {
  elements.classCards.forEach(card => {
    card.addEventListener('click', () => {
      elements.classCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedClass = card.getAttribute('data-class');
    });
  });
}

// Guardar Personaje
if (elements.btnSaveCharacter) {
  elements.btnSaveCharacter.addEventListener('click', async () => {
    const name = elements.charName.value.trim();
    if (!name) return alert('Debes elegir un nombre para tu personaje');

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.user.id,
          roomId: state.room.id,
          name,
          className: state.selectedClass
        })
      });
      if (!res.ok) throw new Error('Error al guardar personaje');
      state.myCharacter = await res.json();

      // Si la sala ya está en combate activo, ingresar directamente a la batalla
      if (state.room && state.room.status === 'active') {
        showScreen('combat');
        renderCombatView();
      } else {
        alert(`¡Personaje "${state.myCharacter.name}" registrado como ${state.myCharacter.class}! Esperando a que el anfitrión inicie la expedición.`);
        renderLobbyView();
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

// Iniciar Aventura (Host)
if (elements.btnStartGame) {
  elements.btnStartGame.addEventListener('click', () => {
    if (!state.room) return;
    if (state.room.status === 'active') {
      showScreen('combat');
      renderCombatView();
      return;
    }
    state.socket.emit('start_game', { roomId: state.room.id });
  });
}

// -------------------------------------------------------------
// VISTA DEL LOBBY
// -------------------------------------------------------------
function renderLobbyView() {
  if (!state.room) return;
  elements.lobbyRoomBadge.textContent = `SALA: ${state.room.room_code}`;

  const stories = {
    '1': 'Ciudadela Flotante de Aethelgard',
    '2': 'El Abismo de Masa Negativa',
    '3': 'El Vórtice de la Aguja Celestial'
  };
  elements.lobbyStoryTitle.textContent = stories[state.room.story_selected] || 'Expedición a lo Desconocido';

  const storyKey = String(state.room.story_selected || '1');
  const recommendedCount = storyKey === '1' ? 2 : (storyKey === '2' ? 4 : 6);
  const currentCount = (state.characters || []).length;
  const isReady = currentCount >= 1;

  // Autocompletar nombre por defecto si no lo ha escrito
  if (elements.charName) {
    if (state.myCharacter) {
      elements.charName.value = state.myCharacter.name;
    } else if (!elements.charName.value && state.user) {
      elements.charName.value = state.user.username;
    }
  }

  // Si la sala ya está activa, avisar al jugador que se une en marcha
  if (state.room.status === 'active') {
    if (elements.lobbyActiveNotice) elements.lobbyActiveNotice.classList.remove('hidden');
    elements.btnSaveCharacter.textContent = state.myCharacter ? '⚔️ Entrar a la Batalla' : '⚔️ Guardar y Entrar a la Batalla';
    if (elements.btnStartGame) {
      elements.btnStartGame.textContent = '⚔️ Regresar al Combate';
      elements.btnStartGame.disabled = false;
      elements.btnStartGame.style.opacity = '1';
    }
    if (elements.hostRequirementNotice) {
      elements.hostRequirementNotice.innerHTML = `<span style="color:#10b981;">Partida en curso</span>`;
    }
  } else {
    if (elements.lobbyActiveNotice) elements.lobbyActiveNotice.classList.add('hidden');
    elements.btnSaveCharacter.textContent = state.myCharacter ? 'Actualizar Personaje' : 'Guardar Personaje en la Sala';
    
    if (elements.btnStartGame) {
      if (isReady) {
        elements.btnStartGame.disabled = false;
        elements.btnStartGame.style.opacity = '1';
        elements.btnStartGame.textContent = `⚔️ Iniciar Aventura (${currentCount} Aventurero${currentCount > 1 ? 's' : ''} Listo${currentCount > 1 ? 's' : ''})`;
        if (elements.hostRequirementNotice) {
          elements.hostRequirementNotice.innerHTML = `<span style="color:#10b981; font-weight: 600;">✓ ¡Listo para la expedición! (${currentCount}/${recommendedCount} aventureros)</span>`;
        }
      } else {
        elements.btnStartGame.disabled = true;
        elements.btnStartGame.style.opacity = '0.55';
        elements.btnStartGame.textContent = `⏳ Esperando a que crees tu personaje`;
        if (elements.hostRequirementNotice) {
          elements.hostRequirementNotice.innerHTML = `<span style="color:#fbbf24;">Debes crear y guardar tu personaje para poder iniciar.</span>`;
        }
      }
    }
  }

  // Mostrar botón de inicio si es el host
  if (state.user && state.room.host_id === state.user.id) {
    elements.hostControls.classList.remove('hidden');
  } else {
    elements.hostControls.classList.add('hidden');
  }

  renderLobbyPlayers();
}

function renderLobbyPlayers() {
  elements.lobbyPlayersList.innerHTML = '';
  if (!state.characters || state.characters.length === 0) {
    elements.lobbyPlayersList.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Esperando a que los jugadores configuren sus personajes...</p>';
    return;
  }

  state.characters.forEach(char => {
    const card = document.createElement('div');
    card.className = 'party-player-card';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-weight: 700; color: #fff;">${escapeHtml(char.name)}</span>
        <span class="player-class-pill">${escapeHtml(char.class)}</span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        Jugador: ${escapeHtml(char.username || 'Aventurero')}
      </div>
      <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #10b981;">
        10/10 PS • 3/3 Almas ❤️❤️❤️
      </div>
    `;
    elements.lobbyPlayersList.appendChild(card);
  });
}

// -------------------------------------------------------------
// VISTA DE COMBATE Y ACCIONES
// -------------------------------------------------------------
function renderCombatView() {
  if (!state.room) return;

  const currentTurn = state.room.current_turn || 1;
  const isHeroPhase = (currentTurn % 2) === 1;

  if (isHeroPhase) {
    elements.combatTurnTitle.textContent = `⚔️ TURNO ${currentTurn} • FASE DE ATAQUE DE LOS HÉROES`;
    if (elements.actionPhaseBadge) {
      elements.actionPhaseBadge.className = 'phase-badge phase-attack';
      elements.actionPhaseBadge.textContent = '⚔️ Fase de Ataque';
    }
    if (elements.actionConsolePhaseTitle) {
      elements.actionConsolePhaseTitle.textContent = 'Elige tu Habilidad de Ataque';
    }
  } else {
    elements.combatTurnTitle.textContent = `🛡️ TURNO ${currentTurn} • FASE DE DEFENSA (¡LOS MONSTRUOS ATACAN!)`;
    if (elements.actionPhaseBadge) {
      elements.actionPhaseBadge.className = 'phase-badge phase-defense';
      elements.actionPhaseBadge.textContent = '🛡️ Fase de Defensa';
    }
    if (elements.actionConsolePhaseTitle) {
      elements.actionConsolePhaseTitle.textContent = 'Elige tu Habilidad de Defensa';
    }
  }

  // Renderizar las habilidades específicas de la clase del jugador para esta fase
  renderAbilitiesSelector();

  elements.combatRoomCodeBadge.textContent = `CÓDIGO: ${state.room.room_code}`;

  if (state.combatState) {
    elements.combatAnomalyText.textContent = state.combatState.anomaly;
    renderEnemies(state.combatState.enemies);
  }

  renderMonsterTacticalPanel();
  renderCombatPlayers();

  // Si el usuario no tiene personaje registrado todavía en esta sala
  if (!state.myCharacter) {
    elements.actionStatusNotice.innerHTML = `<span style="color:#f87171;">⚠️ No tienes un personaje registrado en esta expedición.</span> <button id="btnQuickCreateHero" class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.8rem; margin-left: 0.5rem; cursor: pointer; color:#fbbf24; border-color:#fbbf24;">⚡ Crear Mi Personaje</button>`;
    const quickBtn = document.getElementById('btnQuickCreateHero');
    if (quickBtn) {
      quickBtn.onclick = () => {
        showScreen('lobby');
        renderLobbyView();
      };
    }
  }

  // Hacer el badge de código de sala interactivo para copiarlo con un clic
  if (elements.combatRoomCodeBadge) {
    elements.combatRoomCodeBadge.style.cursor = 'pointer';
    elements.combatRoomCodeBadge.title = 'Haz clic para copiar el código de sala';
    elements.combatRoomCodeBadge.onclick = async () => {
      if (state.room) {
        try {
          await navigator.clipboard.writeText(state.room.room_code);
          showToast({
            type: 'info',
            title: 'Código Copiado',
            message: `Código de sala ${state.room.room_code} copiado al portapapeles.`
          });
        } catch (e) {
          prompt('Código de sala:', state.room.room_code);
        }
      }
    };
  }

  // Si el usuario es el host, mostrar botón de forzar turno
  if (state.user && state.room.host_id === state.user.id) {
    elements.btnForceResolve.classList.remove('hidden');
  }

  // Asegurar que el resumen del dado refleje el estado del turno actual
  updateDiceSummary();
}

function renderEnemies(enemies) {
  elements.enemiesContainer.innerHTML = '';
  if (!enemies) return;

  enemies.forEach(e => {
    const card = document.createElement('div');
    card.className = 'enemy-card';
    const hpPct = Math.max(0, Math.min(100, (e.hp / e.maxHp) * 100));
    
    card.innerHTML = `
      <div class="enemy-header">
        <span class="enemy-name">${escapeHtml(e.name)}</span>
        <span style="font-size: 0.85rem; color: var(--accent-crimson); font-weight: 700;">
          ${e.isAlive ? `${e.hp}/${e.maxHp} PS` : 'DERROTADO'}
        </span>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(e.title)}</div>
      <div class="enemy-hp-bar">
        <div class="enemy-hp-fill" style="width: ${hpPct}%"></div>
      </div>
    `;
    elements.enemiesContainer.appendChild(card);
  });
}

function renderMonsterTacticalPanel() {
  if (!elements.monsterTacticalPanel) return;

  const currentTurn = (state.room && state.room.current_turn) || 1;
  const isHeroAttackPhase = (currentTurn % 2) === 1;

  const combat = state.combatState || {};
  const enemies = combat.enemies || [];
  const monstersDefeated = combat.monstersDefeated || 0;

  if (combat.isVictory || monstersDefeated >= 10) {
    elements.monsterTacticalPanel.innerHTML = `
      <div class="monster-combat-card" style="border-color: #10b981; text-align: center; padding: 1.5rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏆</div>
        <h3 style="font-family: var(--font-serif); color: #34d399; font-size: 1.4rem; margin-bottom: 0.3rem;">
          ¡VICTORIA CÓSMICA! LAS 10 CRIATURAS HAN SIDO DERROTADAS
        </h3>
        <p style="color: #cbd5e1; font-size: 0.9rem; margin: 0;">
          El equilibrio gravitacional ha sido restablecido en los confines del cosmos.
        </p>
      </div>
    `;
    elements.monsterTacticalPanel.style.display = 'block';
    return;
  }

  const activeEnemies = enemies.filter(e => e.isAlive && (Number.isFinite(e.hp) ? e.hp > 0 : true));
  if (activeEnemies.length === 0) {
    if (combat.isDefeat) {
      elements.monsterTacticalPanel.innerHTML = `
        <div class="monster-combat-card" style="border-color: #ef4444; text-align: center; padding: 1.5rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💀</div>
          <h3 style="font-family: var(--font-serif); color: #f87171; font-size: 1.4rem; margin-bottom: 0.3rem;">
            EXPEDICIÓN DERROTADA
          </h3>
          <p style="color: #cbd5e1; font-size: 0.9rem; margin: 0;">
            El vacío cósmico consumió todas las almas del grupo.
          </p>
        </div>
      `;
      elements.monsterTacticalPanel.style.display = 'block';
      return;
    }
    elements.monsterTacticalPanel.style.display = 'none';
    return;
  }

  elements.monsterTacticalPanel.style.display = 'block';
  const currentMonster = activeEnemies[0];
  const monsterNum = currentMonster.monsterNumber || (typeof combat.currentMonsterIndex === 'number' ? combat.currentMonsterIndex + 1 : 1);

  // Resolver habilidad de ataque activa
  function getActiveAttack(m, turn) {
    if (Array.isArray(m.attacks) && m.attacks.length > 0) {
      const cycle = Math.max(0, Math.floor(turn / 2) - 1);
      return m.attacks[cycle % m.attacks.length];
    }
    return {
      name: m.attackName || '🌌 Onda Expansiva Gravitatoria',
      type: 'single',
      typeLabel: '🎯 Objetivo Individual',
      damageText: m.attackDamage || '3 - 5 PS',
      effects: m.attackEffects || 'Ataque concentrado letal sobre un único aventurero.'
    };
  }

  // Resolver habilidad de defensa activa
  function getActiveDefense(m, turn) {
    if (Array.isArray(m.defenses) && m.defenses.length > 0) {
      const cycle = Math.max(0, Math.floor((turn - 1) / 2));
      return m.defenses[cycle % m.defenses.length];
    }
    return {
      name: m.defenseName || '🛡️ Caparazón de Vacío',
      type: 'all',
      typeLabel: '🌐 Cobertura Global',
      reductionText: m.defenseReduction || '-35% Daño a Todos',
      effects: m.defenseEffects || 'Amortigua y disipa los ataques recibidos en la ronda.'
    };
  }

  const activeAtkTurn = isHeroAttackPhase ? currentTurn + 1 : currentTurn;
  const currentAtk = getActiveAttack(currentMonster, activeAtkTurn);
  const activeDefTurn = isHeroAttackPhase ? currentTurn : currentTurn + 1;
  const currentDef = getActiveDefense(currentMonster, activeDefTurn);

  // Bono activo de este turno
  const turnBonus = currentMonster.turnBonus || (window.getMonsterTurnBonus ? window.getMonsterTurnBonus(currentMonster, currentTurn) : {
    icon: isHeroAttackPhase ? '🛡️' : '⚡',
    title: isHeroAttackPhase ? 'Coraza Cuántica' : 'Sobrecarga de Masa',
    effect: isHeroAttackPhase ? '+10% de mitigación general este turno.' : '+1 PS de daño adicional en sus ataques.'
  });

  const safeHp = Number.isFinite(currentMonster.hp) ? currentMonster.hp : currentMonster.maxHp;
  const hpPct = Math.max(0, Math.min(100, (safeHp / (currentMonster.maxHp || 24)) * 100));

  // Generar orbes del gauntlet de 10 monstruos
  let skullsHtml = '';
  for (let i = 1; i <= 10; i++) {
    if (i <= monstersDefeated) {
      skullsHtml += `<span class="gauntlet-skull-node defeated" title="Monstruo ${i} Derrotado">💀</span>`;
    } else if (i === monsterNum) {
      skullsHtml += `<span class="gauntlet-skull-node current" title="Monstruo ${i} Activo (${escapeHtml(currentMonster.name)})">${currentMonster.avatar || '👾'}</span>`;
    } else {
      skullsHtml += `<span class="gauntlet-skull-node" title="Monstruo ${i} Inminente">⚪</span>`;
    }
  }

  elements.monsterTacticalPanel.innerHTML = `
    <div class="monster-combat-card">
      <!-- Fila de Identidad del Monstruo (Igual a la tarjeta de héroe/aliado) -->
      <div class="monster-info-row">
        <div class="monster-title-block">
          <span class="monster-avatar-icon">${currentMonster.avatar || '👾'}</span>
          <div>
            <div class="monster-name-text">${escapeHtml(currentMonster.name)}</div>
            <div class="monster-sub-title">${escapeHtml(currentMonster.title || '')}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <span class="monster-tier-badge">👹 Monstruo ${monsterNum} de 10</span>
          <span class="monster-phase-tag ${isHeroAttackPhase ? 'phase-tag-def' : 'phase-tag-atk'}">
            ${isHeroAttackPhase ? '🛡️ En Guardia' : '🩸 Al Asalto'}
          </span>
        </div>
      </div>

      <!-- Barra de Vitalidad del Monstruo -->
      <div class="monster-hp-section">
        <div class="monster-hp-meta">
          <span>Vitalidad de la Criatura</span>
          <span style="font-weight: 800; color: #fff;">${safeHp} / ${currentMonster.maxHp} PS</span>
        </div>
        <div class="monster-hp-bar-outer">
          <div class="monster-hp-bar-fill" style="width: ${hpPct}%;"></div>
        </div>
      </div>

      <!-- 3 Ranuras Tácticas: Ataque, Defensa y Bono de Turno -->
      <div class="monster-tactical-slots-row">
        <div class="monster-slots-header">
          <span>⚔️ Ranuras Tácticas Activas de Combate</span>
          <span style="opacity: 0.8; font-size: 0.75rem;">Turno ${currentTurn}</span>
        </div>

        <div class="monster-slots-grid">
          <!-- Ranura 1: Ataque Activo -->
          <div class="monster-slot-card slot-attack ${!isHeroAttackPhase ? 'active-phase' : ''}">
            <div class="monster-slot-top">
              <span class="monster-slot-label">⚔️ Ataque Activo</span>
              <span class="monster-slot-pill pill-atk-stat">${escapeHtml(currentAtk.damageText)}</span>
            </div>
            <div class="monster-slot-name">${escapeHtml(currentAtk.name)}</div>
            <div style="font-size: 0.72rem; color: #fca5a5; font-weight: 600;">${escapeHtml(currentAtk.typeLabel)}</div>
            <div class="monster-slot-desc">${escapeHtml(currentAtk.effects)}</div>
          </div>

          <!-- Ranura 2: Defensa Activa -->
          <div class="monster-slot-card slot-defense ${isHeroAttackPhase ? 'active-phase' : ''}">
            <div class="monster-slot-top">
              <span class="monster-slot-label">🛡️ Defensa Activa</span>
              <span class="monster-slot-pill pill-def-stat">${escapeHtml(currentDef.reductionText)}</span>
            </div>
            <div class="monster-slot-name">${escapeHtml(currentDef.name)}</div>
            <div style="font-size: 0.72rem; color: #7dd3fc; font-weight: 600;">${escapeHtml(currentDef.typeLabel)}</div>
            <div class="monster-slot-desc">${escapeHtml(currentDef.effects)}</div>
          </div>

          <!-- Ranura 3: Bono de este Turno -->
          <div class="monster-slot-card slot-bonus">
            <div class="monster-slot-top">
              <span class="monster-slot-label">✨ Bono de Turno</span>
              <span class="monster-slot-pill pill-bonus-stat">⭐ Turno ${currentTurn}</span>
            </div>
            <div class="monster-slot-name">${escapeHtml(turnBonus.title || 'Sinergia Gravitatoria')}</div>
            <div style="font-size: 0.72rem; color: #fde68a; font-weight: 600;">Bonificación Temporal</div>
            <div class="monster-slot-desc">${escapeHtml(turnBonus.effect || '')}</div>
          </div>
        </div>
      </div>

      <!-- Rastreador del Gauntlet de 10 Monstruos -->
      <div class="gauntlet-progress-row">
        <div>
          <strong>Progreso de Expedición:</strong> ${monstersDefeated}/10 Criaturas Vencidas
        </div>
        <div class="gauntlet-skulls-list">
          ${skullsHtml}
        </div>
      </div>
    </div>
  `;
}

function getCharacterItemsArray(char) {
  if (!char || !char.items) return [];
  if (Array.isArray(char.items)) return char.items;
  if (typeof char.items === 'string') {
    try {
      return JSON.parse(char.items) || [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function renderPlayerItemSlotsHtml(char) {
  const items = getCharacterItemsArray(char);
  let slotsHtml = '';
  for (let i = 0; i < 3; i++) {
    const item = items[i];
    if (item) {
      slotsHtml += `
        <div class="item-slot-card filled" title="${escapeHtml(item.name)}: ${escapeHtml(item.desc || item.statText)}">
          <div class="item-slot-icon">${item.icon || '⚔️'}</div>
          <div class="item-slot-name">${escapeHtml(item.name)}</div>
          <div class="item-slot-stat">${escapeHtml(item.statText)}</div>
        </div>
      `;
    } else {
      slotsHtml += `
        <div class="item-slot-card empty" title="Ranura disponible (Slot ${i + 1}/3)">
          <div class="item-slot-empty-icon">➕</div>
          <div class="item-slot-empty-label">Slot ${i + 1}</div>
        </div>
      `;
    }
  }
  return `
    <div class="player-inventory-row">
      <div class="player-inventory-title">
        <span>🎒 Equipamiento (3 Ranuras)</span>
        <span style="font-weight: normal; opacity: 0.8;">${items.length}/3</span>
      </div>
      <div class="player-items-slots">
        ${slotsHtml}
      </div>
    </div>
  `;
}

function renderHeroTurnPowerBannerHtml(char, isHeroPhase, currentTurn, isMe) {
  if (!char || !char.is_alive) return '';

  // 1. Obtener los ítems del personaje y calcular bonificadores acumulados
  const items = getCharacterItemsArray(char);
  let bonusDmg = 0;
  let bonusMitigation = 0;
  let flatDamageReduction = 0;
  let dodgeDcBonus = 0;
  let bonusCounter = 0;
  let bonusHeal = 0;
  let penetration = 0;
  let critThresholdBonus = 0;

  for (const it of items) {
    if (!it) continue;
    if (it.bonusDmg) bonusDmg += it.bonusDmg;
    if (it.penetration) penetration += it.penetration;
    if (it.bonusMitigation) bonusMitigation += it.bonusMitigation;
    if (it.flatDamageReduction) flatDamageReduction += it.flatDamageReduction;
    if (it.dodgeDcBonus) dodgeDcBonus += it.dodgeDcBonus;
    if (it.bonusCounter) bonusCounter += it.bonusCounter;
    if (it.bonusHeal) bonusHeal += it.bonusHeal;
    if (it.critThresholdBonus) critThresholdBonus += it.critThresholdBonus;
  }

  // 2. Sinergias y beneficios de aliados activos este turno
  let allyShieldBonus = 0;
  let allyD20Bonus = 0;
  let allyDmgBonus = 0;
  const allyPerks = [];

  if (state.currentTurnHeroAbilities && state.characters) {
    state.characters.forEach(other => {
      if (other.id === char.id) return;
      const otherPrep = state.currentTurnHeroAbilities[other.id];
      if (otherPrep && otherPrep.ability && otherPrep.ability.isGroupBuff && otherPrep.ability.groupEffect) {
        const eff = otherPrep.ability.groupEffect;
        if (eff.type === 'shield_ally') {
          allyShieldBonus += (eff.amount || 2);
          allyPerks.push(`+${eff.amount || 2} PS Escudo de ${escapeHtml(other.name)}`);
        } else if (eff.type === 'd20_bonus_ally') {
          allyD20Bonus += (eff.amount || 2);
          allyPerks.push(`+${eff.amount || 2} D20 de ${escapeHtml(other.name)}`);
        } else if (eff.type === 'dmg_bonus_ally') {
          allyDmgBonus += (eff.amount || 1);
          allyPerks.push(`+${eff.amount || 1} Daño de ${escapeHtml(other.name)}`);
        }
      }
    });
  }

  // 3. Determinar habilidad activa y tirada de dado
  const prepared = state.currentTurnHeroAbilities ? state.currentTurnHeroAbilities[char.id] : null;
  let ability = prepared ? prepared.ability : null;
  let d20Roll = prepared ? prepared.d20Roll : null;

  if (isMe && !ability && state.selectedAbilityId) {
    const heroClass = char.class || 'Mago';
    ability = window.findAbilityById ? window.findAbilityById(heroClass, state.selectedAbilityId) : null;
  }
  if (isMe && !d20Roll && state.d20Roll) {
    d20Roll = state.d20Roll;
  }

  // Si no hay habilidad elegida aún, tomar la primera de su clase por defecto
  if (!ability) {
    const heroClass = char.class || 'Mago';
    const classData = window.getAbilitiesForClass ? window.getAbilitiesForClass(heroClass) : null;
    if (isHeroPhase) {
      ability = classData?.attacks?.[0] || { minDmg: 3, maxDmg: 5, critMinDmg: 6, critMaxDmg: 7, name: 'Ataque Básico', icon: '⚔️' };
    } else {
      ability = classData?.defenses?.[0] || { type: 'defense', reduction: 0.35, name: 'Defensa Básica', icon: '🛡️' };
    }
  }

  // Evaluar tirada si está disponible
  let evalRes = null;
  if (d20Roll && window.evaluateD20Ability) {
    evalRes = window.evaluateD20Ability(ability, d20Roll + allyD20Bonus, false, items);
  }

  // 4. Renderizado según Fase de Ataque o Fase de Defensa
  if (isHeroPhase) {
    // === FASE DE ATAQUE ===
    const totalBonusDmg = bonusDmg + allyDmgBonus;
    let mainStatHtml = '';
    const bonusBreakdown = [];

    if (evalRes && evalRes.damage !== undefined) {
      const finalDmg = evalRes.damage + allyDmgBonus;
      const critTag = evalRes.isCrit ? '<span class="power-tag-crit">🔥 ¡CRÍTICO!</span>' : '';
      mainStatHtml = `
        <div class="hero-power-total-row">
          <div class="power-total-badge attack">
            <span class="power-total-label">💥 Daño Total del Turno:</span>
            <span class="power-total-value">${finalDmg} PS</span>
            ${critTag}
          </div>
        </div>
      `;
      bonusBreakdown.push(`Habilidad: <strong>${escapeHtml(ability.name)}</strong> (${evalRes.tierName})`);
      bonusBreakdown.push(`🎲 D20 [${d20Roll}${allyD20Bonus ? ` + ${allyD20Bonus} guía` : ''}]`);
    } else {
      const minD = (ability.minDmg || 3) + totalBonusDmg;
      const maxD = (ability.maxDmg || 5) + totalBonusDmg;
      const critMin = (ability.critMinDmg || (maxD + 1)) + totalBonusDmg;
      const critMax = (ability.critMaxDmg || (maxD + 2)) + totalBonusDmg;

      mainStatHtml = `
        <div class="hero-power-total-row">
          <div class="power-total-badge attack">
            <span class="power-total-label">⚔️ Daño Total Estimado:</span>
            <span class="power-total-value">${minD} - ${maxD} PS</span>
            <span class="power-total-sub">(Crítico: ${critMin}-${critMax} PS)</span>
          </div>
        </div>
      `;
      bonusBreakdown.push(`Base: ${ability.minDmg || 3}-${ability.maxDmg || 5} PS (${escapeHtml(ability.name)})`);
    }

    if (bonusDmg > 0) bonusBreakdown.push(`🎁 +${bonusDmg} Daño por Ítems`);
    if (penetration > 0) bonusBreakdown.push(`🗡️ Penetra ${Math.round(penetration * 100)}% Armadura`);
    if (allyDmgBonus > 0) bonusBreakdown.push(`🤝 +${allyDmgBonus} Daño (Sinergia Aliada)`);
    if (critThresholdBonus > 0) bonusBreakdown.push(`🎯 Críticos en 18+`);

    if (bonusBreakdown.length === 0) bonusBreakdown.push('Daño base de clase');

    return `
      <div class="hero-turn-power-box attack-phase">
        <div class="hero-power-header">
          <span class="power-phase-indicator">⚔️ Fase de Ataque • Turno ${currentTurn}</span>
          <span class="power-ability-name">${ability.icon || '⚔️'} ${escapeHtml(ability.name)}</span>
        </div>
        ${mainStatHtml}
        <div class="hero-power-breakdown">
          <span class="breakdown-title">Beneficios Sumados:</span>
          ${bonusBreakdown.map(b => `<span class="breakdown-pill">${b}</span>`).join('')}
        </div>
      </div>
    `;
  } else {
    // === FASE DE DEFENSA ===
    let mainStatHtml = '';
    const bonusBreakdown = [];

    if (ability.type === 'dodge') {
      const baseDc = ability.dodgeDc || 10;
      const finalDc = Math.max(7, baseDc - dodgeDcBonus - Math.floor(allyD20Bonus / 2));
      const successChance = Math.round(((21 - finalDc) / 20) * 100);

      if (evalRes) {
        mainStatHtml = `
          <div class="hero-power-total-row">
            <div class="power-total-badge defense ${evalRes.dodgeSuccess ? 'success' : 'fail'}">
              <span class="power-total-label">💨 Evasión del Turno:</span>
              <span class="power-total-value">${evalRes.dodgeSuccess ? '¡0 DAÑO RECIBIDO! (Eludido)' : '❌ Fallo de Evasión'}</span>
            </div>
          </div>
        `;
        bonusBreakdown.push(`🎲 D20 [${d20Roll}] vs DC ${finalDc}`);
      } else {
        mainStatHtml = `
          <div class="hero-power-total-row">
            <div class="power-total-badge defense">
              <span class="power-total-label">💨 Evasión Total:</span>
              <span class="power-total-value">D20 >= ${finalDc} (${successChance}% Éxito)</span>
            </div>
          </div>
        `;
        bonusBreakdown.push(`Base DC ${baseDc}`);
      }
      if (dodgeDcBonus > 0) bonusBreakdown.push(`🎁 +${dodgeDcBonus} Evasión por Ítems`);
    } else if (ability.type === 'counter') {
      const baseCounter = ability.counterDamage || 1;
      const totalCounter = baseCounter + bonusCounter;
      const totalRedPct = Math.round(((ability.reduction || 0.35) + bonusMitigation) * 100);

      mainStatHtml = `
        <div class="hero-power-total-row">
          <div class="power-total-badge defense">
            <span class="power-total-label">✨ Mitigación + Contragolpe:</span>
            <span class="power-total-value">-${totalRedPct}% Daño | Refleja ${totalCounter} PS</span>
          </div>
        </div>
      `;
      bonusBreakdown.push(`Base: -${Math.round((ability.reduction || 0.35) * 100)}% / Refleja ${baseCounter} PS`);
      if (bonusMitigation > 0) bonusBreakdown.push(`🎁 +${Math.round(bonusMitigation * 100)}% Mitigación`);
      if (bonusCounter > 0) bonusBreakdown.push(`⚡ +${bonusCounter} Contradaño`);
    } else if (ability.type === 'heal' || ability.id?.includes('pocion')) {
      const baseH = ability.healAmount || 5;
      const totalH = baseH + bonusHeal;

      mainStatHtml = `
        <div class="hero-power-total-row">
          <div class="power-total-badge heal">
            <span class="power-total-label">🧪 Curación Total:</span>
            <span class="power-total-value">+${totalH} PS</span>
          </div>
        </div>
      `;
      bonusBreakdown.push(`Base: +${baseH} PS`);
      if (bonusHeal > 0) bonusBreakdown.push(`🎁 +${bonusHeal} PS de Ítems`);
    } else {
      // Bloqueo / Defensa estándar
      const baseRed = (ability.reduction || 0.35);
      const totalRed = Math.min(0.90, baseRed + bonusMitigation);
      const totalRedPct = Math.round(totalRed * 100);

      if (evalRes && evalRes.reduction !== undefined) {
        const finalRedPct = Math.round(evalRes.reduction * 100);
        mainStatHtml = `
          <div class="hero-power-total-row">
            <div class="power-total-badge defense">
              <span class="power-total-label">🛡️ Mitigación Total del Turno:</span>
              <span class="power-total-value">-${finalRedPct}% Daño${flatDamageReduction > 0 ? ` (-${flatDamageReduction} plano)` : ''}</span>
            </div>
          </div>
        `;
        bonusBreakdown.push(`🎲 D20 [${d20Roll}] ➔ ${evalRes.tierName}`);
      } else {
        mainStatHtml = `
          <div class="hero-power-total-row">
            <div class="power-total-badge defense">
              <span class="power-total-label">🛡️ Mitigación Total:</span>
              <span class="power-total-value">-${totalRedPct}% Daño${flatDamageReduction > 0 ? ` (-${flatDamageReduction} plano)` : ''}</span>
            </div>
          </div>
        `;
        bonusBreakdown.push(`Base: -${Math.round(baseRed * 100)}%`);
      }

      if (bonusMitigation > 0) bonusBreakdown.push(`🎁 +${Math.round(bonusMitigation * 100)}% Mitigación por Ítems`);
      if (flatDamageReduction > 0) bonusBreakdown.push(`🧱 -${flatDamageReduction} Daño Plano`);
    }

    if (allyShieldBonus > 0) bonusBreakdown.push(`🤝 +${allyShieldBonus} PS Escudo Aliado`);
    if (allyPerks.length > 0) {
      allyPerks.forEach(p => {
        if (!bonusBreakdown.includes(p)) bonusBreakdown.push(`🤝 ${p}`);
      });
    }

    if (bonusBreakdown.length === 0) bonusBreakdown.push('Defensa base estándar');

    return `
      <div class="hero-turn-power-box defense-phase">
        <div class="hero-power-header">
          <span class="power-phase-indicator">🛡️ Fase de Defensa • Turno ${currentTurn}</span>
          <span class="power-ability-name">${ability.icon || '🛡️'} ${escapeHtml(ability.name)}</span>
        </div>
        ${mainStatHtml}
        <div class="hero-power-breakdown">
          <span class="breakdown-title">Beneficios Sumados:</span>
          ${bonusBreakdown.map(b => `<span class="breakdown-pill">${b}</span>`).join('')}
        </div>
      </div>
    `;
  }
}

function renderCombatPlayers() {
  elements.combatPlayersGrid.innerHTML = '';
  if (!state.characters) return;

  const currentTurn = (state.room && state.room.current_turn) || 1;
  const isHeroPhase = (currentTurn % 2) === 1;

  state.characters.forEach(char => {
    const card = document.createElement('div');
    const isMe = state.myCharacter && state.myCharacter.id === char.id;
    card.className = `player-combat-card ${isMe ? 'active-turn' : ''} ${!char.is_alive ? 'dead' : ''}`;

    const hpPct = Math.max(0, Math.min(100, (char.hp / 10) * 100));
    const hpColorClass = char.hp <= 3 ? 'danger' : char.hp <= 6 ? 'warning' : '';

    let soulOrbsHtml = '';
    for (let i = 0; i < 3; i++) {
      if (i < char.lives) {
        soulOrbsHtml += `<span class="soul-orb active" title="Alma Activa">❤️</span>`;
      } else {
        soulOrbsHtml += `<span class="soul-orb" title="Alma Devorada">🖤</span>`;
      }
    }

    // 1. Habilidad en preparación o ya tirada en este turno exacto
    const prepared = state.currentTurnHeroAbilities ? state.currentTurnHeroAbilities[char.id] : null;
    let preparedHtml = '';
    if (char.is_alive) {
      if (prepared && prepared.ability) {
        const ab = prepared.ability;
        const isGroup = Boolean(ab.isGroupBuff);
        const groupLabel = (isGroup && ab.groupEffect && ab.groupEffect.label) ? ab.groupEffect.label : '';
        const d20Html = prepared.d20Roll ? `<span class="turn-d20-pill ${prepared.d20Roll === 20 ? 'crit-max' : prepared.d20Roll === 1 ? 'crit-fail' : ''}">🎲 D20 [${prepared.d20Roll}]</span>` : '';
        const statusBadge = prepared.isSubmitted
          ? `<span class="prepared-status locked">🔒 Lista</span>`
          : `<span class="prepared-status preparing">⏳ Eligiendo</span>`;

        preparedHtml = `
          <div class="hero-live-ability-box ${isGroup ? 'is-group-synergy' : ''}">
            <div class="live-ability-header">
              <span class="live-ability-title">${isHeroPhase ? '⚔️ Ataque en Curso' : '🛡️ Guardia en Curso'}</span>
              ${statusBadge}
            </div>
            <div class="live-ability-body">
              <div class="live-ability-main">
                <span class="live-ability-icon">${ab.icon || '⚔️'}</span>
                <div class="live-ability-details">
                  <div class="live-ability-name">${escapeHtml(ab.name)}</div>
                  ${ab.badge ? `<div class="live-ability-badge">${escapeHtml(ab.badge)}</div>` : ''}
                </div>
              </div>
              ${d20Html}
            </div>
            ${isGroup && groupLabel ? `
              <div class="live-ability-synergy-banner">
                <span>🤝 Sinergia Aliada:</span> <strong>${escapeHtml(groupLabel)}</strong>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        preparedHtml = `
          <div class="hero-live-ability-box awaiting">
            <span class="awaiting-icon">⏳</span>
            <span class="awaiting-text">${isMe ? 'Elige tu habilidad y lanza el D20...' : 'Aventurero coordinando su acción...'}</span>
          </div>
        `;
      }
    }

    // 2. Historial persistente de lo ejecutado en la fase anterior (Ataque ⇄ Defensa)
    const lastAction = state.lastPhaseHeroAbilities ? state.lastPhaseHeroAbilities[char.id] : null;
    let lastActionHtml = '';
    if (lastAction) {
      const critTag = lastAction.isCrit ? ' <strong style="color: #f59e0b;">(🔥 ¡Crítico!)</strong>' : '';
      const rollTag = lastAction.d20Roll ? ` [🎲 ${lastAction.d20Roll}]` : '';
      lastActionHtml = `
        <div class="hero-last-phase-row">
          <span class="last-phase-label">${lastAction.phaseIcon} ${lastAction.phase} anterior:</span>
          <span class="last-phase-content"><strong>${escapeHtml(lastAction.abilityName)}</strong>${rollTag}${critTag}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="player-info-row">
        <div>
          <span class="player-name">${escapeHtml(char.name)}</span>
          ${isMe ? '<span style="font-size: 0.75rem; color: var(--border-gold); margin-left: 0.3rem;">(Tú)</span>' : ''}
        </div>
        <span class="player-class-pill">${escapeHtml(char.class)}</span>
      </div>

      <div class="hp-section">
        <div class="hp-meta">
          <span>Salud (PS)</span>
          <span style="font-weight: 700;">${char.hp} / 10 PS</span>
        </div>
        <div class="hp-bar-outer">
          <div class="hp-bar-fill ${hpColorClass}" style="width: ${hpPct}%"></div>
        </div>
      </div>

      <div class="souls-row">
        <span class="soul-label">Almas:</span>
        <div class="soul-orbs">${soulOrbsHtml}</div>
        <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">
          ${char.is_alive ? `${char.lives}/3 Vidas` : 'COLAPSADO DEFINITIVAMENTE'}
        </span>
      </div>

      ${renderHeroTurnPowerBannerHtml(char, isHeroPhase, currentTurn, isMe)}

      ${preparedHtml}
      ${lastActionHtml}
      ${renderPlayerItemSlotsHtml(char)}
    `;
    elements.combatPlayersGrid.appendChild(card);
  });
}

// -------------------------------------------------------------
// SELECTOR DINÁMICO DE HABILIDADES POR CLASE Y FASE
// -------------------------------------------------------------
// CONTROL DEL DADO VISIBLE D20 (UN SOLO LANZAMIENTO POR TURNO)
// -------------------------------------------------------------
function rollD20(animate = true) {
  if (state.hasRolledDiceThisTurn || state.isRollingDice || state.actionSubmittedThisTurn) {
    return;
  }
  if (!state.selectedAbilityId) {
    alert('Primero selecciona la habilidad que deseas usar este turno.');
    return;
  }
  if (window.soundEngine) window.soundEngine.playDice();

  const targetRoll = Math.floor(Math.random() * 20) + 1;

  if (!animate) {
    applyD20Result(targetRoll);
    return;
  }

  state.isRollingDice = true;
  if (elements.d20Die) {
    elements.d20Die.classList.add('rolling');
    elements.d20Die.classList.remove('crit-20', 'crit-1');
  }

  let counter = 0;
  const interval = setInterval(() => {
    counter++;
    const randomFace = Math.floor(Math.random() * 20) + 1;
    if (elements.diceRollNumber) {
      elements.diceRollNumber.textContent = randomFace;
    }
    if (counter >= 9) {
      clearInterval(interval);
    }
  }, 60);

  setTimeout(() => {
    applyD20Result(targetRoll);
  }, 620);
}

function applyD20Result(roll) {
  state.d20Roll = roll;
  state.hasRolledDiceThisTurn = true;
  state.isRollingDice = false;

  if (elements.d20Die) {
    elements.d20Die.classList.remove('rolling', 'crit-20', 'crit-1');
    if (roll === 20) {
      elements.d20Die.classList.add('crit-20');
      if (window.soundEngine) window.soundEngine.playCrit();
    } else if (roll === 1) {
      elements.d20Die.classList.add('crit-1');
      if (window.soundEngine) window.soundEngine.playCollapse();
    }
  }

  if (elements.diceRollNumber) {
    elements.diceRollNumber.textContent = roll;
  }

  const heroClass = (state.myCharacter && state.myCharacter.class) || 'Mago';
  const selectedAbility = window.findAbilityById ? window.findAbilityById(heroClass, state.selectedAbilityId) : null;
  if (state.socket && state.room && state.myCharacter && selectedAbility) {
    state.socket.emit('select_ability_preview', {
      roomId: state.room.id,
      characterId: state.myCharacter.id,
      ability: {
        id: selectedAbility.id,
        name: selectedAbility.name,
        icon: selectedAbility.icon || '⚔️',
        badge: selectedAbility.badge || '',
        desc: selectedAbility.desc || '',
        type: selectedAbility.type || '',
        isGroupBuff: Boolean(selectedAbility.isGroupBuff),
        groupEffect: selectedAbility.groupEffect || null
      },
      d20Roll: roll
    });
  }

  if (state.myCharacter && selectedAbility) {
    state.currentTurnHeroAbilities[state.myCharacter.id] = {
      characterId: state.myCharacter.id,
      characterName: state.myCharacter.name,
      characterClass: state.myCharacter.class,
      ability: selectedAbility,
      d20Roll: roll,
      isSubmitted: false
    };
  }

  renderCombatPlayers();
  renderAbilitiesSelector();
  updateDiceSummary();
}

function updateDiceSummary() {
  if (!elements.diceResultSummary) return;
  const currentTurn = (state.room && state.room.current_turn) || 1;
  const isHeroPhase = (currentTurn % 2) === 1;
  const heroClass = (state.myCharacter && state.myCharacter.class) || 'Mago';
  const selectedAbility = window.findAbilityById ? window.findAbilityById(heroClass, state.selectedAbilityId) : null;

  if (elements.diceStatusLabel) {
    elements.diceStatusLabel.textContent = isHeroPhase ? 'Tirada de Ataque (D20):' : 'Tirada de Defensa (D20):';
  }

  if (!state.hasRolledDiceThisTurn) {
    if (selectedAbility) {
      elements.diceResultSummary.innerHTML = `Habilidad elegida: <strong style="color:var(--border-gold);">${selectedAbility.icon} ${selectedAbility.name}</strong>. Haz clic en <strong>Lanzar D20</strong> para sellar tu acción.`;
    } else {
      elements.diceResultSummary.innerHTML = `Selecciona tu habilidad y haz clic en <strong>Lanzar D20</strong> para sellar tu acción.`;
    }
    return;
  }

  const roll = state.d20Roll || 10;
  if (!selectedAbility) {
    elements.diceResultSummary.innerHTML = `Tirada sellada: <strong>🎲 D20 [${roll}]</strong>.`;
    return;
  }

  const myItems = getCharacterItemsArray(state.myCharacter);
  const evalRes = window.evaluateD20Ability ? window.evaluateD20Ability(selectedAbility, roll, false, myItems) : null;
  if (!evalRes) return;

  elements.diceResultSummary.innerHTML = `🔒 Acción sellada: <strong>🎲 D20 [${roll}]</strong> ➔ <strong style="color:var(--border-gold);">${selectedAbility.icon} ${selectedAbility.name}:</strong> ${evalRes.tierName} (${evalRes.summary.split('➔ ')[1] || ''})`;
}

// -------------------------------------------------------------
// SELECTOR DINÁMICO DE HABILIDADES POR CLASE Y FASE
// -------------------------------------------------------------
function renderAbilitiesSelector() {
  if (!elements.abilitiesContainer) return;
  elements.abilitiesContainer.innerHTML = '';

  const currentTurn = (state.room && state.room.current_turn) || 1;
  const isHeroPhase = (currentTurn % 2) === 1;
  const heroClass = (state.myCharacter && state.myCharacter.class) || 'Mago';
  const classData = window.getAbilitiesForClass ? window.getAbilitiesForClass(heroClass) : null;
  const potion = window.UNIVERSAL_ACTIONS ? window.UNIVERSAL_ACTIONS.potion : null;
  const groupPotion = window.UNIVERSAL_ACTIONS ? window.UNIVERSAL_ACTIONS.groupPotion : null;
  const myItems = getCharacterItemsArray(state.myCharacter);
  const isLocked = state.hasRolledDiceThisTurn || state.actionSubmittedThisTurn;

  // Actualizar estado del Widget de Dados
  if (elements.btnRollDice) {
    if (isLocked) {
      elements.btnRollDice.disabled = true;
      elements.btnRollDice.innerHTML = '🔒 Tirada Sellada';
      elements.btnRollDice.style.opacity = '0.6';
      elements.btnRollDice.style.cursor = 'not-allowed';
    } else {
      elements.btnRollDice.disabled = false;
      elements.btnRollDice.innerHTML = '<span>🎲</span><span>Lanzar D20</span>';
      elements.btnRollDice.style.opacity = '1';
      elements.btnRollDice.style.cursor = 'pointer';
    }
  }

  if (elements.diceContainer) {
    elements.diceContainer.style.cursor = isLocked ? 'default' : 'pointer';
    elements.diceContainer.style.pointerEvents = isLocked ? 'none' : 'auto';
  }

  if (elements.diceRollNumber) {
    elements.diceRollNumber.textContent = state.d20Roll !== null ? state.d20Roll : '20';
  }

  if (elements.d20Die) {
    elements.d20Die.classList.remove('crit-20', 'crit-1');
    if (state.d20Roll === 20) elements.d20Die.classList.add('crit-20');
    if (state.d20Roll === 1) elements.d20Die.classList.add('crit-1');
  }

  // Estado del botón Pasar de Turno
  if (elements.btnSubmitAction) {
    if (state.actionSubmittedThisTurn) {
      elements.btnSubmitAction.disabled = true;
      elements.btnSubmitAction.textContent = '✓ Turno Pasado';
    } else if (!state.hasRolledDiceThisTurn) {
      elements.btnSubmitAction.disabled = true;
      elements.btnSubmitAction.textContent = 'Lanza el D20 para Sellar';
    } else {
      elements.btnSubmitAction.disabled = false;
      elements.btnSubmitAction.textContent = 'Pasar de Turno';
    }
  }

  let abilities = [];
  const draftedAbilities = window.getTurnPlayerAbilities 
    ? window.getTurnPlayerAbilities(heroClass, isHeroPhase, currentTurn, state.myCharacter?.id)
    : (isHeroPhase ? (classData?.attacks || []).slice(0, 3) : (classData?.defenses || []).slice(0, 3));

  if (isHeroPhase) {
    abilities = draftedAbilities.map((a, idx) => ({
      ...a,
      draftIndex: idx + 1,
      baseAction: 'Atacar',
      badgeClass: a.isGroupBuff ? 'group' : 'dmg'
    }));
    if (potion) {
      abilities.push({
        ...potion,
        type: 'heal',
        baseAction: 'Interactuar',
        badgeClass: 'heal'
      });
    }
    if (groupPotion) {
      abilities.push({
        ...groupPotion,
        type: 'heal',
        baseAction: 'Interactuar',
        badgeClass: 'group'
      });
    }
  } else {
    abilities = draftedAbilities.map((d, idx) => ({
      ...d,
      draftIndex: idx + 1,
      baseAction: d.type === 'dodge' ? 'Esquivar' : 'Defender',
      badgeClass: d.isGroupBuff ? 'group' : 'def'
    }));
    if (potion) {
      abilities.push({
        ...potion,
        type: 'heal',
        baseAction: 'Interactuar',
        badgeClass: 'heal',
        desc: 'Bebes una poción (+4 a +6 PS) exponiéndote al golpe enemigo sin guardia.'
      });
    }
    if (groupPotion) {
      abilities.push({
        ...groupPotion,
        type: 'heal',
        baseAction: 'Interactuar',
        badgeClass: 'group',
        desc: 'Poción grupal: +4 PS para ti y +2 PS al compañero en peligro.'
      });
    }
  }

  // Si no hay habilidad seleccionada o no pertenece a la fase actual, auto-seleccionar la primera
  if (!state.selectedAbilityId || !abilities.some(a => a.id === state.selectedAbilityId)) {
    if (abilities.length > 0) {
      state.selectedAbilityId = abilities[0].id;
      state.selectedAction = abilities[0].baseAction;
    }
  }

  abilities.forEach(ability => {
    const card = document.createElement('div');
    const isSelected = state.selectedAbilityId === ability.id;
    const isGroup = !!ability.isGroupBuff;
    card.className = `ability-card ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'locked-out' : ''} ${isLocked && isSelected ? 'locked-selected' : ''} ${isGroup ? 'is-group' : ''}`;
    card.setAttribute('data-ability-id', ability.id);

    let lockBadge = '';
    if (isLocked && isSelected) {
      lockBadge = `<span class="ability-lock-tag">🔒 Habilidad Comprometida</span>`;
    } else if (isSelected) {
      lockBadge = `<span class="ability-selected-tag">✓ Seleccionada</span>`;
    }

    let draftTag = '';
    if (ability.draftIndex) {
      draftTag = `<span class="ability-draft-tag">🎲 Opción ${ability.draftIndex}/3</span>`;
    }

    let groupPill = '';
    if (isGroup) {
      groupPill = `<span class="ability-group-pill">🤝 Apoyo al Aliado</span>`;
    }

    const evalRes = (state.hasRolledDiceThisTurn && state.d20Roll && window.evaluateD20Ability)
      ? window.evaluateD20Ability(ability, state.d20Roll, false, myItems)
      : null;

    let badgeHtml = '';
    let statRowHtml = '';

    if (evalRes) {
      if (ability.minDmg && ability.maxDmg) {
        const badgeClass = evalRes.isCrit ? 'crit' : (evalRes.tier === 'solid' ? 'solid' : (evalRes.tier === 'glance' ? 'glance' : 'normal'));
        badgeHtml = `<span class="ability-badge dmg dice-pulse">🎲 D20 [${state.d20Roll}] ➔ ${evalRes.damage} PS</span>`;
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-d20-badge ${badgeClass}">${evalRes.tierName}</span>
            <span class="ability-range-tag">Base: ${ability.minDmg}-${ability.maxDmg} PS</span>
            <span class="ability-crit-tag">Crítico: ${ability.critMinDmg}-${ability.critMaxDmg} PS</span>
          </div>
        `;
      } else if (ability.type === 'dodge') {
        const badgeClass = evalRes.dodgeSuccess ? 'success' : 'fail';
        badgeHtml = `<span class="ability-badge ${evalRes.dodgeSuccess ? 'heal' : 'dmg'} dice-pulse">${evalRes.dodgeSuccess ? '⚡ ¡Elude (0 PS)!' : '❌ ¡Fallo de Evasión!'}</span>`;
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-d20-badge ${badgeClass}">🎲 D20 [${state.d20Roll} vs DC ${evalRes.dc}]</span>
            <span class="ability-range-tag">${evalRes.tierName}</span>
          </div>
        `;
      } else if (ability.type === 'defense') {
        const badgeClass = evalRes.tier === 'block_perfect' ? 'crit' : (evalRes.tier === 'block_master' ? 'solid' : 'normal');
        badgeHtml = `<span class="ability-badge def dice-pulse">🛡️ -${Math.round(evalRes.reduction * 100)}% Daño</span>`;
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-d20-badge ${badgeClass}">${evalRes.tierName}</span>
            <span class="ability-range-tag">🎲 D20 [${state.d20Roll}]</span>
          </div>
        `;
      } else if (ability.type === 'counter') {
        const badgeClass = evalRes.tier === 'counter_empowered' ? 'crit' : 'normal';
        badgeHtml = `<span class="ability-badge def dice-pulse">✨ -${Math.round(evalRes.reduction * 100)}% / Refleja ${evalRes.counterDamage} PS</span>`;
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-d20-badge ${badgeClass}">${evalRes.tierName}</span>
            <span class="ability-range-tag">🎲 D20 [${state.d20Roll}]</span>
          </div>
        `;
      } else if (ability.healAmount || ability.id === 'universal_pocion' || ability.id === 'universal_pocion_grupo') {
        const badgeClass = evalRes.tier === 'heal_crit' ? 'crit' : 'normal';
        badgeHtml = `<span class="ability-badge heal dice-pulse">🧪 +${evalRes.healAmount} PS</span>`;
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-d20-badge ${badgeClass}">${evalRes.tierName}</span>
            <span class="ability-range-tag">🎲 D20 [${state.d20Roll}]</span>
          </div>
        `;
      }
    } else {
      badgeHtml = `<span class="ability-badge ${ability.badgeClass}">${ability.badge}</span>`;
      if (ability.minDmg && ability.maxDmg) {
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-range-tag">📊 Rango: ${ability.minDmg}-${ability.maxDmg} PS</span>
            <span class="ability-crit-tag">🔥 Crítico: ${ability.critMinDmg}-${ability.critMaxDmg} PS</span>
          </div>
        `;
      } else if (ability.type === 'dodge') {
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-range-tag">💨 Requiere D20 >= ${ability.dodgeDc || 10}</span>
            <span class="ability-range-tag">Fallo con 1-${(ability.dodgeDc || 10) - 1}</span>
          </div>
        `;
      } else if (ability.type === 'defense') {
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-range-tag">🛡️ Mitigación base ${Math.round((ability.reduction || 0.35) * 100)}%</span>
            <span class="ability-range-tag">Escala con D20 (-25% a -75%)</span>
          </div>
        `;
      } else if (ability.type === 'counter') {
        statRowHtml = `
          <div class="ability-stat-row">
            <span class="ability-range-tag">✨ -30% + 1 PS Contradaño</span>
            <span class="ability-range-tag">Con D20 >= 10: -40% + 2 PS</span>
          </div>
        `;
      }
    }

    card.innerHTML = `
      <div class="ability-card-top">
        <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
          <span class="ability-card-icon">${ability.icon}</span>
          <span class="ability-card-title">${escapeHtml(ability.name)}</span>
          ${draftTag}
          ${groupPill}
        </div>
        ${lockBadge}
      </div>
      <div>
        ${badgeHtml}
      </div>
      ${statRowHtml}
      <div class="ability-desc">${escapeHtml(ability.desc)}</div>
    `;

    card.addEventListener('click', () => {
      if (isLocked) return;
      selectAbility(ability, isHeroPhase);
    });

    elements.abilitiesContainer.appendChild(card);
  });

  updateFlavorTipForAbility(state.selectedAbilityId, heroClass, isHeroPhase);
  updateDiceSummary();
}

function selectAbility(ability, isHeroPhase) {
  if (state.hasRolledDiceThisTurn || state.actionSubmittedThisTurn) {
    return; // Ya no se puede cambiar de habilidad
  }
  state.selectedAbilityId = ability.id;
  state.selectedAction = ability.baseAction || (isHeroPhase ? 'Atacar' : 'Defender');

  if (elements.abilitiesContainer) {
    const allCards = elements.abilitiesContainer.querySelectorAll('.ability-card');
    allCards.forEach(c => {
      if (c.getAttribute('data-ability-id') === ability.id) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });
  }

  // Notificar al servidor y a los compañeros de grupo en tiempo real
  if (state.socket && state.room && state.myCharacter) {
    state.socket.emit('select_ability_preview', {
      roomId: state.room.id,
      characterId: state.myCharacter.id,
      ability: {
        id: ability.id,
        name: ability.name,
        icon: ability.icon || '⚔️',
        badge: ability.badge || '',
        desc: ability.desc || '',
        type: ability.type || '',
        isGroupBuff: Boolean(ability.isGroupBuff),
        groupEffect: ability.groupEffect || null
      },
      d20Roll: state.d20Roll
    });
  }

  // Guardar en estado local para reflejo inmediato en la tarjeta propia
  if (state.myCharacter) {
    state.currentTurnHeroAbilities[state.myCharacter.id] = {
      characterId: state.myCharacter.id,
      characterName: state.myCharacter.name,
      characterClass: state.myCharacter.class,
      ability,
      d20Roll: state.d20Roll,
      isSubmitted: false
    };
    renderCombatPlayers();
  }

  const heroClass = (state.myCharacter && state.myCharacter.class) || 'Mago';
  updateFlavorTipForAbility(ability.id, heroClass, isHeroPhase);
  updateDiceSummary();
}

function updateFlavorTipForAbility(abilityId, heroClass, isHeroPhase) {
  const ability = window.findAbilityById ? window.findAbilityById(heroClass, abilityId) : null;
  if (!ability || !elements.flavorTip) return;

  let tip = '';
  if (ability.isGroupBuff) {
    tip = `🤝 <strong>${ability.name} (Sinergia de Equipo):</strong> ${ability.desc}`;
  } else if (isHeroPhase) {
    if (ability.id === 'universal_pocion') {
      tip = '🧪 <strong>Poción Alquímica:</strong> Beberla restaurará inmediatamente 5 PS (máximo 10 PS).';
    } else {
      tip = `⚔️ <strong>${ability.name}:</strong> Daño base: <strong>${ability.badge}</strong>. Si describes una táctica creativa (gravedad, impulso, entorno), ¡el GM te otorgará un <strong>Golpe Crítico</strong> (${ability.critMinDmg || 6}-${ability.critMaxDmg || 8} PS)!`;
    }
  } else {
    if (ability.id === 'universal_pocion') {
      tip = '⚠️ <strong>Poción en Turno Defensivo:</strong> Curas 5 PS, pero <strong>no tendrás guardia</strong> y recibirás el 100% del daño del monstruo.';
    } else if (ability.type === 'dodge') {
      const chancePct = Math.round((ability.dodgeChance || 0.55) * 100);
      const failPct = 100 - chancePct;
      tip = `💨 <strong>${ability.name}:</strong> Tienes un <strong>${chancePct}% de eludir todo el daño (0 PS)</strong>, pero hay un <strong>${failPct}% de probabilidad de FALLAR</strong> y recibir el daño directo del enemigo.`;
    } else if (ability.type === 'counter') {
      tip = `✨ <strong>${ability.name}:</strong> Amortiguas el ${Math.round((ability.reduction || 0.30) * 100)}% del daño y <strong>reflejas 1 PS de contradaño sagrado</strong> al atacante.`;
    } else {
      tip = `🛡️ <strong>${ability.name}:</strong> Defensa estable sin riesgo de fallo: reduce el daño entrante en un <strong>${Math.round((ability.reduction || 0.35) * 100)}%</strong>.`;
    }
  }
  elements.flavorTip.innerHTML = tip;
}

// Enviar Acción del Turno
elements.btnSubmitAction.addEventListener('click', () => {
  if (!state.myCharacter) {
    if (confirm('Aún no has registrado a tu personaje en esta expedición. ¿Deseas configurarlo ahora en el lobby?')) {
      showScreen('lobby');
      renderLobbyView();
    }
    return;
  }
  if (!state.myCharacter.is_alive) {
    return alert('Tu alma ha sido devorada por el vacío. Ya no puedes realizar acciones en esta expedición.');
  }

  // Comprobación estricta de lanzamiento único antes de pasar turno
  if (!state.hasRolledDiceThisTurn || state.d20Roll === null) {
    return alert('¡Debes lanzar el dado D20 para determinar la potencia de tu habilidad antes de pasar de turno!');
  }
  if (state.actionSubmittedThisTurn) {
    return;
  }

  const flavor = elements.flavorInput.value.trim();
  const heroClass = (state.myCharacter && state.myCharacter.class) || 'Mago';
  const selectedAbility = window.findAbilityById ? window.findAbilityById(heroClass, state.selectedAbilityId) : null;
  const evalRes = selectedAbility && state.d20Roll ? window.evaluateD20Ability(selectedAbility, state.d20Roll) : null;
  const rolledDmg = evalRes && evalRes.damage ? evalRes.damage : null;

  const abilityPayload = selectedAbility ? {
    id: selectedAbility.id,
    name: selectedAbility.name,
    icon: selectedAbility.icon || '⚔️',
    badge: selectedAbility.badge || '',
    desc: selectedAbility.desc || '',
    type: selectedAbility.type || '',
    isGroupBuff: Boolean(selectedAbility.isGroupBuff),
    groupEffect: selectedAbility.groupEffect || null
  } : null;

  state.socket.emit('submit_action', {
    roomId: state.room.id,
    characterId: state.myCharacter.id,
    actionSelected: state.selectedAction,
    abilityId: state.selectedAbilityId,
    d20Roll: state.d20Roll,
    rolledDmg,
    flavorText: flavor,
    abilityData: abilityPayload
  });

  state.actionSubmittedThisTurn = true;
  if (state.myCharacter && state.currentTurnHeroAbilities[state.myCharacter.id]) {
    state.currentTurnHeroAbilities[state.myCharacter.id].isSubmitted = true;
    renderCombatPlayers();
  }

  elements.btnSubmitAction.disabled = true;
  elements.btnSubmitAction.textContent = '✓ Turno Pasado';
  elements.actionStatusNotice.textContent = 'Turno pasado al GM. Esperando al resto del grupo...';

  // Notificación de confirmación
  showToast({
    type: 'action',
    title: 'Turno Pasado',
    message: 'Has completado tu turno. El Game Master resolverá las acciones del grupo.'
  });

  // Sellar interfaz visualmente
  renderAbilitiesSelector();

  // Efecto auditivo al registrar
  if (state.selectedAction === 'Atacar') window.soundEngine.playAttack();
  if (state.selectedAction === 'Defender') window.soundEngine.playDefend();
  if (state.selectedAction === 'Esquivar') window.soundEngine.playDodge();
  if (state.selectedAction === 'Interactuar' || state.selectedAbilityId === 'universal_pocion') window.soundEngine.playPotion();
});

// Eventos para Lanzar el Dado D20 Visible
if (elements.btnRollDice) {
  elements.btnRollDice.addEventListener('click', () => {
    if (state.hasRolledDiceThisTurn || state.actionSubmittedThisTurn || state.isRollingDice) return;
    rollD20(true);
  });
}
if (elements.diceContainer) {
  elements.diceContainer.addEventListener('click', () => {
    if (state.hasRolledDiceThisTurn || state.actionSubmittedThisTurn || state.isRollingDice) return;
    rollD20(true);
  });
}

// Forzar resolución (Host)
elements.btnForceResolve.addEventListener('click', () => {
  if (confirm('¿Deseas forzar la resolución de la ronda ahora mismo?')) {
    state.socket.emit('force_resolve_turn', { roomId: state.room.id });
  }
});

// Renderizado de Narrativa del GM
function renderNarrative(content) {
  if (!content) return;

  // Convertir markdown a HTML estético y estructurado
  let formatted = escapeHtml(content)
    .replace(/^### (.*$)/gim, '<h3 class="narrative-h3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: var(--accent-cyan);">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^---$/gim, '<hr class="narrative-divider">')
    .replace(/^\* 🩸 (.*$)/gim, '<div class="combat-log-monster-hit">🩸 $1</div>')
    .replace(/^  - (.*$)/gim, '<div class="combat-log-subitem">↳ $1</div>')
    .replace(/^\* (.*$)/gim, '<div class="combat-log-bullet">• $1</div>')
    .replace(/^- (.*$)/gim, '<div class="combat-log-bullet">• $1</div>')
    .replace(/\n\n/g, '<div class="narrative-gap"></div>')
    .replace(/\n/g, '<br>');

  elements.narrativeText.innerHTML = formatted;
}

// -------------------------------------------------------------
// SISTEMA DE NOTIFICACIONES Y ALERTAS (TOASTS)
// -------------------------------------------------------------
function showToast({ type = 'info', title = 'Notificación', message = '', duration = 4500, icon = null, playSound = true }) {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const defaultIcons = {
    info: '👤',
    success: '✨',
    warning: '⚠️',
    danger: '💀',
    action: '🎲',
    epic: '⚔️',
    crit: '🔥',
    attack: '⚔️',
    defense: '🛡️'
  };

  const chosenIcon = icon || defaultIcons[type] || '🔔';

  toast.innerHTML = `
    <div class="toast-icon">${chosenIcon}</div>
    <div class="toast-body-wrap">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-desc">${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" type="button" title="Cerrar">&times;</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;

  // Reproducir efectos de sonido inmersivos
  if (playSound && window.soundEngine) {
    if (type === 'crit') {
      window.soundEngine.playCrit();
    } else if (type === 'danger') {
      window.soundEngine.playWarning();
    } else if (type === 'epic' || type === 'attack') {
      window.soundEngine.playAlertChime();
    } else if (type === 'defense') {
      window.soundEngine.playDefend();
    } else if (type === 'action') {
      window.soundEngine.playDice();
    } else {
      window.soundEngine.playNotification();
    }
  }

  const dismiss = () => {
    if (toast.classList.contains('toast-hiding')) return;
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  };

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);

  setTimeout(dismiss, duration);
  elements.toastContainer.appendChild(toast);
}

// Chat de la sala
if (elements.chatForm) {
  elements.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!elements.chatInput) return;
    const text = elements.chatInput.value.trim();
    if (!text || !state.room || !state.user) return;

    state.socket.emit('send_chat', {
      roomId: state.room.id,
      senderId: state.user.id,
      username: state.user.username,
      characterName: state.myCharacter ? state.myCharacter.name : null,
      characterClass: state.myCharacter ? state.myCharacter.class : null,
      content: text
    });

    elements.chatInput.value = '';
  });
}

function appendChatMessage(msg, playSound = true) {
  if (!elements.chatMessages) return;

  const item = document.createElement('div');
  const isMe = state.user && (msg.sender_id === state.user.id || msg.senderId === state.user.id);
  
  // Nombre de usuario siempre visible y claro
  const username = msg.username || (isMe ? state.user.username : (msg.action_type === 'narrative' ? 'Game Master' : 'Aventurero'));
  const charName = msg.character_name || msg.characterName || (isMe && state.myCharacter ? state.myCharacter.name : null);
  const charClass = msg.character_class || msg.characterClass || (isMe && state.myCharacter ? state.myCharacter.class : null);

  const isNarrative = msg.action_type === 'narrative';
  const isSystem = msg.action_type === 'system';

  let msgClass = 'chat-msg';
  if (isMe) msgClass += ' chat-msg-me';
  else msgClass += ' chat-msg-other';
  if (isNarrative) msgClass += ' chat-msg-gm';
  if (isSystem) msgClass += ' chat-msg-system';

  item.className = msgClass;

  // Formato de hora HH:MM
  const date = msg.created_at ? new Date(msg.created_at) : new Date();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  item.innerHTML = `
    <div class="chat-msg-header">
      <span class="chat-username">${escapeHtml(username)}</span>
      ${charName ? `<span class="chat-char-tag">${escapeHtml(charName)}${charClass ? ` [${escapeHtml(charClass)}]` : ''}</span>` : ''}
      ${isMe ? `<span class="chat-me-tag">TÚ</span>` : ''}
      <span class="chat-timestamp">${timeStr}</span>
    </div>
    <div class="chat-msg-text">${escapeHtml(msg.content)}</div>
  `;

  elements.chatMessages.appendChild(item);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

  // Reproducir campanilla si el mensaje proviene de otro jugador
  if (!isMe && playSound && window.soundEngine) {
    window.soundEngine.playNotification();
  }
}

// -------------------------------------------------------------
// SISTEMA DE BOTÍN Y RANURAS DE INVENTARIO (3 SLOTS)
// -------------------------------------------------------------
function showLootModal(item) {
  if (!item || !elements.lootModal) return;
  state.currentPendingLoot = item;

  if (elements.lootModalIcon) elements.lootModalIcon.textContent = item.icon || '🎁';
  if (elements.lootModalTitle) elements.lootModalTitle.textContent = `¡Nuevo Botín: ${item.name}!`;
  if (elements.lootModalSubtitle) elements.lootModalSubtitle.textContent = `Tipo: ${(item.type || 'arma').toUpperCase()} | Rareza: Especial`;
  if (elements.lootModalStatText) elements.lootModalStatText.textContent = item.statText || '';
  if (elements.lootModalDesc) elements.lootModalDesc.textContent = item.desc || '';

  renderLootSlotsUI();
  elements.lootModal.classList.remove('hidden');
}

function closeLootModal() {
  if (elements.lootModal) {
    elements.lootModal.classList.add('hidden');
  }
  state.currentPendingLoot = null;
}

function renderLootSlotsUI() {
  if (!elements.lootSlotsGrid) return;
  elements.lootSlotsGrid.innerHTML = '';

  const myItems = getCharacterItemsArray(state.myCharacter);

  for (let i = 0; i < 3; i++) {
    const existingItem = myItems[i];
    const row = document.createElement('div');
    row.className = 'loot-slot-row';

    if (existingItem) {
      row.innerHTML = `
        <div class="loot-slot-info">
          <div class="loot-slot-number">Ranura ${i + 1} (Ocupada)</div>
          <div class="loot-slot-item-name">${existingItem.icon || '⚔️'} ${escapeHtml(existingItem.name)}</div>
          <div class="loot-slot-item-stat">${escapeHtml(existingItem.statText || '')}</div>
        </div>
        <button type="button" class="loot-slot-btn replace" data-slot="${i}">
          🔄 Reemplazar
        </button>
      `;
    } else {
      row.innerHTML = `
        <div class="loot-slot-info">
          <div class="loot-slot-number">Ranura ${i + 1} (Libre)</div>
          <div class="loot-slot-item-name" style="color: var(--text-muted);">[ Espacio Disponible ]</div>
          <div class="loot-slot-item-stat" style="color: var(--border-gold);">Listo para equipar</div>
        </div>
        <button type="button" class="loot-slot-btn equip" data-slot="${i}">
          ➕ Equipar Aquí
        </button>
      `;
    }

    const btn = row.querySelector('.loot-slot-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        equipLootToSlot(i);
      });
    }

    elements.lootSlotsGrid.appendChild(row);
  }
}

function equipLootToSlot(slotIndex) {
  if (!state.currentPendingLoot || !state.myCharacter) return;

  const itemToEquip = state.currentPendingLoot;
  state.socket.emit('equip_item', {
    characterId: state.myCharacter.id,
    item: itemToEquip,
    slotIndex: slotIndex
  });

  showToast('🎒 ÍTEM EQUIPADO', `Has equipado "${itemToEquip.name}" en la Ranura ${slotIndex + 1}.`, 'success');
  if (window.soundEngine) window.soundEngine.playItemEquip();
  closeLootModal();
}

if (elements.btnDismissLoot) {
  elements.btnDismissLoot.addEventListener('click', () => {
    closeLootModal();
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initParticles();

  // Intentar restaurar sesión previa si existe
  const savedUser = localStorage.getItem('antigravyty_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.id && user.username) {
        onUserAuthenticated(user);
        return;
      }
    } catch (e) {
      localStorage.removeItem('antigravyty_user');
    }
  }

  showScreen('auth');
});
