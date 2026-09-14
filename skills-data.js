/**
 * Catálogo central de habilidades de combate por Clase / Raza para Antigravyty
 * Incluye pools de 10 habilidades de ataque y 10 habilidades de defensa por clase,
 * con rotación determinista de 3 habilidades por turno y soporte cooperativo de aliados.
 */

const CLASS_ABILITIES = {
  "Mago": {
    "attacks": [
      {
        "id": "mago_rayo_vacio",
        "name": "Descarga de Rayos de Vacío",
        "icon": "⚡",
        "minDmg": 3,
        "maxDmg": 4,
        "critMinDmg": 5,
        "critMaxDmg": 6,
        "badge": "3-4 PS",
        "desc": "Proyectiles rápidos de éter puro dirigidos a los núcleos de masa."
      },
      {
        "id": "mago_singularidad",
        "name": "Micro-Singularidad Gravitatoria",
        "icon": "🌌",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 8,
        "critMaxDmg": 10,
        "badge": "5-7 PS (Alto)",
        "desc": "Colapsa un punto gravitacional provocando una implosión masiva."
      },
      {
        "id": "mago_resonancia_eter",
        "name": "Resonancia Éter de Dúo",
        "icon": "🌀",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 Escudo Compañero",
        "desc": "Ataque mágico que genera un Velo de 2 PS de absorción para tu compañero de aventuras.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shield_ally",
          "amount": 2,
          "label": "🛡️ Velo de Éter (+2 PS escudo al aliado)"
        }
      },
      {
        "id": "mago_cometa_antimateria",
        "name": "Cometa de Antimateria",
        "icon": "☄️",
        "minDmg": 4,
        "maxDmg": 6,
        "critMinDmg": 7,
        "critMaxDmg": 8,
        "badge": "4-6 PS (Ignora Armadura)",
        "penetration": 0.25,
        "desc": "Cometa condensado que penetra un 25% de la armadura o barrera enemiga."
      },
      {
        "id": "mago_vortice_arcano",
        "name": "Vórtice de Polvo Estelar",
        "icon": "✨",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 5,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 D20 Aliado",
        "desc": "Arremolina polvo estelar que ilumina al monstruo, otorgando +2 en la tirada D20 del aliado.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "d20_bonus_ally",
          "amount": 2,
          "label": "✨ Guía Astral (+2 D20 al aliado)"
        }
      },
      {
        "id": "mago_implosion_gravitonica",
        "name": "Implosión Gravitónica",
        "icon": "💥",
        "minDmg": 6,
        "maxDmg": 8,
        "critMinDmg": 9,
        "critMaxDmg": 11,
        "badge": "6-8 PS (Devastador)",
        "desc": "Fuerza extrema de compresión molecular que estalla liberando esquirlas de éter."
      },
      {
        "id": "mago_chispa_dimension",
        "name": "Chispa de Falla Espacial",
        "icon": "🔮",
        "minDmg": 4,
        "maxDmg": 5,
        "critMinDmg": 7,
        "critMaxDmg": 8,
        "badge": "4-5 PS (Crítico 18+)",
        "critThresholdBonus": 1,
        "desc": "Desgarra una micro-falla en la dimensión espacial con alta probabilidad de impacto crítico."
      },
      {
        "id": "mago_pulso_sobrecarga",
        "name": "Sobrecarga de Éter Coordinada",
        "icon": "⚡",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 Daño Aliado",
        "desc": "Canaliza corrientes de éter energizantes que otorgan +2 PS de daño al próximo ataque del compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "damage_buff_ally",
          "amount": 2,
          "label": "⚡ Sobrecarga (+2 Daño al aliado)"
        }
      },
      {
        "id": "mago_lluvia_meteoritos",
        "name": "Lluvia de Masa Negativa",
        "icon": "🌧️",
        "minDmg": 4,
        "maxDmg": 6,
        "critMinDmg": 7,
        "critMaxDmg": 8,
        "badge": "4-6 PS",
        "desc": "Bombardea al adversario con fragmentos flotantes que aceleran al caer."
      },
      {
        "id": "mago_haz_desintegrador",
        "name": "Haz Desintegrador de Horizonte",
        "icon": "🔆",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 8,
        "critMaxDmg": 10,
        "badge": "5-7 PS (Perforación)",
        "penetration": 0.3,
        "desc": "Rayo continuo de pura luz gravitatoria que atraviesa corazas hiperdensas."
      }
    ],
    "defenses": [
      {
        "id": "mago_velo_eter",
        "name": "Velo de Éter Ingrávido",
        "type": "defense",
        "icon": "🛡️",
        "reduction": 0.35,
        "badge": "-35% Daño (Seguro)",
        "desc": "Erige una cúpula mágica estable que disipa parte del impacto sin riesgo de fallo."
      },
      {
        "id": "mago_distorsion",
        "name": "Distorsión Espacio-Temporal",
        "type": "dodge",
        "icon": "🌀",
        "dodgeChance": 0.5,
        "dodgeDc": 11,
        "badge": "DC 11+ (50% Evadir)",
        "desc": "Curva el espacio inmediato. Requiere D20 >= 11 para eludir todo (0 PS)."
      },
      {
        "id": "mago_cupula_compartida",
        "name": "Cúpula de Éter Compartida",
        "type": "defense",
        "icon": "🌐",
        "reduction": 0.3,
        "badge": "🌐 -30% Daño al Grupo",
        "desc": "Expande una membrana de energía que envuelve a todo el grupo amortiguando el 30% del asalto entrante.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.3,
          "label": "🌐 Cúpula Compartida (-30% daño al grupo)"
        }
      },
      {
        "id": "mago_escudo_burbuja_aliada",
        "name": "Burbuja de Éter Protectora",
        "type": "defense",
        "icon": "🫧",
        "reduction": 0.25,
        "badge": "🤝 -25% + Escudo +3 PS Aliado",
        "desc": "Te proteges (-25% daño) y proyectas una esfera de energía pura que otorga +3 PS de escudo al compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shield_ally",
          "amount": 3,
          "label": "🫧 Burbuja Protectora (+3 PS escudo al aliado)"
        }
      },
      {
        "id": "mago_intercambio_cinetico",
        "name": "Barrera de Resonancia Dúo",
        "type": "defense",
        "icon": "💠",
        "reduction": 0.35,
        "badge": "🤝 -35% Cobertura Grupal",
        "desc": "Sincroniza los campos gravitatorios de ambos aventureros amortiguando el 35% del daño del asalto.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.35,
          "label": "💠 Resonancia Dúo (-35% daño al grupo)"
        }
      },
      {
        "id": "mago_salto_fase",
        "name": "Salto de Fase Cuántica",
        "type": "dodge",
        "icon": "💫",
        "dodgeChance": 0.6,
        "dodgeDc": 9,
        "badge": "DC 9+ (60% Evadir)",
        "desc": "Desaparece momentáneamente en otra dimensión de masa cero eludiendo por completo el daño."
      },
      {
        "id": "mago_espejo_vacio",
        "name": "Prisma de Reflexión Astral",
        "type": "counter",
        "icon": "🪞",
        "reduction": 0.3,
        "counterDamage": 1,
        "badge": "-30% Daño + 1 Contradaño",
        "desc": "Refracta el impacto disipando el 30% y disparando un rayo que devuelve 1 PS de daño."
      },
      {
        "id": "mago_baluarte_mana_aliado",
        "name": "Infusión de Maná Curativo",
        "type": "defense",
        "icon": "💚",
        "reduction": 0.25,
        "badge": "🤝 -25% + Cura +2 PS Aliado",
        "desc": "Amortigua tu impacto (-25%) y transfiere un pulso reparador de +2 PS directos a tu compañero herido.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "heal_ally",
          "amount": 2,
          "label": "💚 Infusión Curativa (+2 PS al compañero)"
        }
      },
      {
        "id": "mago_niebla_ingravida",
        "name": "Vaho Defractor Aliado",
        "type": "defense",
        "icon": "🌫️",
        "reduction": 0.25,
        "badge": "🤝 -25% + Evasión Fácil Aliado",
        "desc": "Crea distorsión visual alrededor de tu aliado, facilitando su evasión (+2 bono D20 en esquiva).",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "evasion_aura_ally",
          "amount": 2,
          "label": "🌫️ Vaho Protector (+2 a la evasión del aliado)"
        }
      },
      {
        "id": "mago_barrera_absoluta",
        "name": "Muro Gravitatorio de Horizonte",
        "type": "defense",
        "icon": "🧱",
        "reduction": 0.5,
        "badge": "-50% Daño (Escudo Máximo)",
        "desc": "Concentra todo tu éter en un escudo macizo que anula la mitad de cualquier golpe enemigo."
      }
    ]
  },
  "Paladín": {
    "attacks": [
      {
        "id": "paladin_golpe_sagrado",
        "name": "Golpe Sagrado de Masa Pesada",
        "icon": "🔨",
        "minDmg": 4,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "4-5 PS",
        "desc": "Impacto demoledor potenciado por gravedad y luz radiante."
      },
      {
        "id": "paladin_juicio_celestial",
        "name": "Juicio Celestial Gravitón",
        "icon": "⚔️",
        "minDmg": 6,
        "maxDmg": 8,
        "critMinDmg": 8,
        "critMaxDmg": 10,
        "badge": "6-8 PS (Brutal)",
        "desc": "Convoca una columna de energía divina hiperdensa que aplasta al enemigo."
      },
      {
        "id": "paladin_grito_inspirador",
        "name": "Grito de Inspiración Radiante",
        "icon": "📢",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 Daño Compañero",
        "desc": "Golpea al enemigo y alza un cántico de batalla que potencia en +2 PS el próximo ataque de tu compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "damage_buff_ally",
          "amount": 2,
          "label": "🔥 Inspiración (+2 Daño al siguiente ataque del aliado)"
        }
      },
      {
        "id": "paladin_martillo_cometa",
        "name": "Martillo del Cometa Sagrado",
        "icon": "☄️",
        "minDmg": 4,
        "maxDmg": 6,
        "critMinDmg": 7,
        "critMaxDmg": 8,
        "badge": "4-6 PS (Penetra 20%)",
        "penetration": 0.2,
        "desc": "Maza descendente cargada de energía solar que fractura corazas defensivas."
      },
      {
        "id": "paladin_embate_luz",
        "name": "Embate de Égida Protectora",
        "icon": "🛡️",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 PS Escudo Aliado",
        "desc": "Embestida con el escudo que transfiere un halo sagrado de +2 PS de absorción al compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shield_ally",
          "amount": 2,
          "label": "🛡️ Halo Sagrado (+2 PS escudo al aliado)"
        }
      },
      {
        "id": "paladin_furia_divina",
        "name": "Furia de Masa Concentrada",
        "icon": "🔥",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 8,
        "critMaxDmg": 10,
        "badge": "5-7 PS (Crítico Elevado)",
        "desc": "Aumenta el peso de su espada al instante de impacto generando una sacudida sísmica."
      },
      {
        "id": "paladin_espada_sol",
        "name": "Filo del Sol Cenital",
        "icon": "☀️",
        "minDmg": 4,
        "maxDmg": 5,
        "critMinDmg": 7,
        "critMaxDmg": 8,
        "badge": "4-5 PS (Crítico 18+)",
        "critThresholdBonus": 1,
        "desc": "Espadazo radiante que ciega los sensores ópticos de la criatura."
      },
      {
        "id": "paladin_bendicion_cruzada",
        "name": "Veredicto de Cruzada Dúo",
        "icon": "✝️",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 D20 Aliado",
        "desc": "Marca al monstruo con el sello de la justicia guiando con +2 D20 el golpe de tu aliado.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "d20_bonus_ally",
          "amount": 2,
          "label": "✝️ Veredicto Justo (+2 D20 al aliado)"
        }
      },
      {
        "id": "paladin_demolicion_pesada",
        "name": "Demolición de Basalto",
        "icon": "🪨",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 7,
        "critMaxDmg": 9,
        "badge": "5-7 PS",
        "desc": "Golpe directo vertical que fractura piedras y quitina por igual."
      },
      {
        "id": "paladin_sentencia_astral",
        "name": "Sentencia de Luz Ineludible",
        "icon": "⚡",
        "minDmg": 6,
        "maxDmg": 8,
        "critMinDmg": 9,
        "critMaxDmg": 11,
        "badge": "6-8 PS (Supremo)",
        "desc": "Canaliza todo el peso moral y físico en un único tajo terminal."
      }
    ],
    "defenses": [
      {
        "id": "paladin_baluarte",
        "name": "Baluarte de Fe Inquebrantable",
        "type": "defense",
        "icon": "🛡️",
        "reduction": 0.45,
        "badge": "-45% Daño (Escudo Pesado)",
        "desc": "Escudo bendito supremo. Amortigua casi la mitad del daño entrante de forma segura."
      },
      {
        "id": "paladin_retribucion",
        "name": "Retribución del Guardián",
        "type": "counter",
        "icon": "✨",
        "reduction": 0.3,
        "counterDamage": 1,
        "badge": "-30% Daño + 1 Contradaño",
        "desc": "Bloquea parte del daño y refleja 1 PS de fuego sagrado directo al monstruo atacante."
      },
      {
        "id": "paladin_intercepcion",
        "name": "Intercepción de Baluarte",
        "type": "defense",
        "icon": "🤝",
        "reduction": 0.4,
        "badge": "🤝 -40% Cobertura Grupal",
        "desc": "Se interpone en la línea de trayectoria interceptando el golpe hacia el compañero (-40% para ambos).",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.4,
          "label": "🤝 Intercepción Protectora (-40% daño a ambos)"
        }
      },
      {
        "id": "paladin_escudo_martir",
        "name": "Sacrificio del Protector",
        "type": "defense",
        "icon": "🛡️",
        "reduction": 0.35,
        "badge": "🤝 Absorbe Daño del Aliado",
        "desc": "Te interpones en el golpe que va hacia tu compañero, absorbiendo su daño y reduciéndolo en un 35%.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.45,
          "label": "🛡️ Sacrificio Guardián (-45% daño al grupo)"
        }
      },
      {
        "id": "paladin_aura_santidad",
        "name": "Aura de Santidad Fortificante",
        "type": "defense",
        "icon": "🌟",
        "reduction": 0.3,
        "badge": "🤝 -30% + Escudo +3 PS Aliado",
        "desc": "Emana luz protectora que cubre a ambos aventureros y entrega +3 PS de escudo al compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shield_ally",
          "amount": 3,
          "label": "🌟 Aura Fortificante (+3 PS escudo al aliado)"
        }
      },
      {
        "id": "paladin_plegaria_sanadora",
        "name": "Rezo de Amparo y Curación",
        "type": "defense",
        "icon": "💖",
        "reduction": 0.3,
        "badge": "🤝 -30% + Cura +2 PS Aliado",
        "desc": "Eleva su escudo y pronuncia un rezo que sana inmediatamente +2 PS a su compañero herido.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "heal_ally",
          "amount": 2,
          "label": "💖 Rezo Sanador (+2 PS al compañero)"
        }
      },
      {
        "id": "paladin_muro_hierro",
        "name": "Muro Inamovible de Fe",
        "type": "defense",
        "icon": "🧱",
        "reduction": 0.55,
        "badge": "-55% Daño (Defensa Férrea)",
        "desc": "Planta ambos pies en la roca flotante haciéndose inamovible frente al golpe más demoledor."
      },
      {
        "id": "paladin_escudo_reflejo",
        "name": "Égida de Retorno Divino",
        "type": "counter",
        "icon": "🪞",
        "reduction": 0.35,
        "counterDamage": 2,
        "badge": "-35% Daño + 2 Contradaño",
        "desc": "Devuelve la onda expansiva del impacto con fuerza sagrada, devolviendo 2 PS al monstruo."
      },
      {
        "id": "paladin_esquiva_pesada",
        "name": "Paso Lateral Estratégico",
        "type": "dodge",
        "icon": "🔄",
        "dodgeChance": 0.45,
        "dodgeDc": 12,
        "badge": "DC 12+ (45% Evadir)",
        "desc": "Pivota sobre su armadura para que el golpe enemigo resbale en el aire."
      },
      {
        "id": "paladin_cobertura_cuerpo",
        "name": "Cúpula de Escudos Hermanados",
        "type": "defense",
        "icon": "🏰",
        "reduction": 0.4,
        "badge": "🤝 -40% Cobertura Total",
        "desc": "Crea una trinchera sagrada que reduce en 40% el daño de área para todo el grupo.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.4,
          "label": "🏰 Trinchera Sagrada (-40% daño grupal)"
        }
      }
    ]
  },
  "Pícaro": {
    "attacks": [
      {
        "id": "picaro_estocada",
        "name": "Estocada al Tendón Invertido",
        "icon": "🗡️",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS",
        "desc": "Ataque rápido y preciso dirigido a un ángulo ciego del enemigo."
      },
      {
        "id": "picaro_filos_cero",
        "name": "Filos de Gravedad Cero",
        "icon": "🌪️",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 7,
        "critMaxDmg": 9,
        "badge": "5-7 PS (Crítico Fácil)",
        "desc": "Giro en gravedad cero con dagas gemelas; gran potencial de golpe crítico."
      },
      {
        "id": "picaro_exponer_vulnerabilidad",
        "name": "Exponer Punto Ciego",
        "icon": "🎯",
        "minDmg": 3,
        "maxDmg": 4,
        "critMinDmg": 5,
        "critMaxDmg": 6,
        "badge": "3-4 PS + 🤝 Crítico Aliado",
        "desc": "Rasga una juntura del exoesqueleto del monstruo, dejando un blanco vulnerable para que el compañero acierte un Crítico (17+).",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "vulnerability_ally",
          "critThreshold": 17,
          "label": "🎯 Punto Ciego Expuesto (Crítico en 17+ para el aliado)"
        }
      },
      {
        "id": "picaro_daga_sombras",
        "name": "Daga de Vacío Sombrío",
        "icon": "🖤",
        "minDmg": 4,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 8,
        "badge": "4-5 PS (Ignora 25%)",
        "penetration": 0.25,
        "desc": "Filo sutil que atraviesa corazas hiperdensas sin emitir ruido."
      },
      {
        "id": "picaro_emboscada_aerea",
        "name": "Emboscada desde la Grieta",
        "icon": "🕳️",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 8,
        "critMaxDmg": 10,
        "badge": "5-7 PS (Crítico Brutal)",
        "desc": "Cae desde el techo ingrávido asestando dos puñaladas sincronizadas."
      },
      {
        "id": "picaro_danza_cuchillas",
        "name": "Danza de Hojas Fantasmales",
        "icon": "⚔️",
        "minDmg": 4,
        "maxDmg": 6,
        "critMinDmg": 6,
        "critMaxDmg": 8,
        "badge": "4-6 PS",
        "desc": "Múltiples cortes veloces que no dejan tiempo de reacción a la bestia."
      },
      {
        "id": "picaro_marca_asesina",
        "name": "Marca de Degüello Táctico",
        "icon": "🩸",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 Daño Aliado",
        "desc": "Hiere profundamente al enemigo abriendo una brecha que otorga +2 Daño al compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "damage_buff_ally",
          "amount": 2,
          "label": "🩸 Brecha Abierta (+2 Daño al aliado)"
        }
      },
      {
        "id": "picaro_veneno_eter",
        "name": "Veneno de Éter Negativo",
        "icon": "🧪",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS (Corrosivo)",
        "desc": "Toxina astral que corroe la superficie del monstruo debilitando su masa."
      },
      {
        "id": "picaro_corte_orbital",
        "name": "Corte Orbital Giratorio",
        "icon": "💫",
        "minDmg": 4,
        "maxDmg": 5,
        "critMinDmg": 7,
        "critMaxDmg": 8,
        "badge": "4-5 PS (Crítico 18+)",
        "critThresholdBonus": 1,
        "desc": "Usa la inercia centrífuga de la sala para lanzar un zarpazo letal."
      },
      {
        "id": "picaro_ejecucion_vacio",
        "name": "Ejecución en el Vacío Absoluto",
        "icon": "☠️",
        "minDmg": 6,
        "maxDmg": 8,
        "critMinDmg": 9,
        "critMaxDmg": 11,
        "badge": "6-8 PS (Letal)",
        "desc": "Ataque definitivo apuntado directo al núcleo de gravedad de la criatura."
      }
    ],
    "defenses": [
      {
        "id": "picaro_desvanecimiento",
        "name": "Desvanecimiento en las Sombras",
        "type": "dodge",
        "icon": "💨",
        "dodgeChance": 0.6,
        "dodgeDc": 9,
        "badge": "DC 9+ (60% Evadir)",
        "desc": "Se desliza en las sombras ingrávidas. Requiere D20 >= 9 para eludir todo (0 PS)."
      },
      {
        "id": "picaro_parada_dagas",
        "name": "Parada con Dagas de Flujo",
        "type": "defense",
        "icon": "⚔️",
        "reduction": 0.3,
        "badge": "-30% Daño (Seguro)",
        "desc": "Cruza sus dagas para desviar parcialmente la trayectoria del golpe enemigo."
      },
      {
        "id": "picaro_cortina_humo",
        "name": "Cortina de Humo Ingrávida",
        "type": "defense",
        "icon": "🌫️",
        "reduction": 0.3,
        "badge": "🌫️ -30% Niebla Grupal",
        "desc": "Lanza esferas de niebla densa que desorientan al monstruo, reduciendo el daño a ambos aventureros en un 30%.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.3,
          "label": "🌫️ Cortina de Humo (-30% daño al grupo)"
        }
      },
      {
        "id": "picaro_pantalla_distraccion",
        "name": "Señuelo de Sombras Aliado",
        "type": "defense",
        "icon": "👤",
        "reduction": 0.25,
        "badge": "🤝 Desvía Ataque del Aliado",
        "desc": "Genera un señuelo ilusorio que desvía el golpe principal del enemigo lejos de tu compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "evasion_aura_ally",
          "amount": 3,
          "label": "👤 Señuelo Protector (+3 Evasión al aliado)"
        }
      },
      {
        "id": "picaro_bomba_cegadora",
        "name": "Bomba Cegadora de Fósforo",
        "type": "defense",
        "icon": "💣",
        "reduction": 0.35,
        "badge": "🤝 -35% Daño Grupal",
        "desc": "Estallido lumínico que ciega temporalmente a la criatura, amortiguando un 35% del daño a todo el grupo.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.35,
          "label": "💣 Ceguera Táctica (-35% daño al grupo)"
        }
      },
      {
        "id": "picaro_acrobacia_inversa",
        "name": "Salto Inverso en el Vacío",
        "type": "dodge",
        "icon": "🤸",
        "dodgeChance": 0.65,
        "dodgeDc": 8,
        "badge": "DC 8+ (65% Evadir)",
        "desc": "Acrobacia aérea limpia impulsándose en una anomalía flotante."
      },
      {
        "id": "picaro_contraataque_sombra",
        "name": "Tajo de Respuesta Súbito",
        "type": "counter",
        "icon": "⚡",
        "reduction": 0.25,
        "counterDamage": 2,
        "badge": "-25% Daño + 2 Contradaño",
        "desc": "Recibe de refilón el impacto y clava una daga refleja devolviendo 2 PS al monstruo."
      },
      {
        "id": "picaro_desvio_cinetico",
        "name": "Desvío Acrobático de Inercia",
        "type": "defense",
        "icon": "🛡️",
        "reduction": 0.35,
        "badge": "-35% Daño (Estable)",
        "desc": "Acompaña el movimiento del ataque disipando la energía cinética del golpe."
      },
      {
        "id": "picaro_red_seguridad",
        "name": "Red de Alambre Protectora",
        "type": "defense",
        "icon": "🕸️",
        "reduction": 0.25,
        "badge": "🤝 -25% + Escudo +2 PS Aliado",
        "desc": "Despliega alambres invisibles que frenan las garras enemigas protegiendo al compañero con +2 PS de escudo.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shield_ally",
          "amount": 2,
          "label": "🕸️ Red Protectora (+2 PS escudo al aliado)"
        }
      },
      {
        "id": "picaro_evasion_maestra",
        "name": "Evasión de Sombra Absoluta",
        "type": "dodge",
        "icon": "💨",
        "dodgeChance": 0.7,
        "dodgeDc": 7,
        "badge": "DC 7+ (70% Evadir)",
        "desc": "Desaparición milimétrica en el instante previo al contacto letal."
      }
    ]
  },
  "Arquero": {
    "attacks": [
      {
        "id": "arquero_flecha_fragmentacion",
        "name": "Flecha de Fragmentación Cinética",
        "icon": "🏹",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 5,
        "critMaxDmg": 7,
        "badge": "3-5 PS",
        "desc": "Proyectil que se divide en metralla de éter al acercarse al blanco."
      },
      {
        "id": "arquero_disparo_orbital",
        "name": "Disparo Orbital Perforante",
        "icon": "🎯",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 7,
        "critMaxDmg": 9,
        "badge": "5-7 PS (Perforante)",
        "penetration": 0.2,
        "desc": "Flecha disparada por una curva gravitatoria a velocidad supersónica."
      },
      {
        "id": "arquero_disparo_sincronizado",
        "name": "Flecha Marcadora Táctica",
        "icon": "🎯",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 5,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 D20 Compañero",
        "desc": "Impacta una flecha brillante que ilumina los puntos débiles, otorgando +2 en la tirada D20 del compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "d20_bonus_ally",
          "amount": 2,
          "label": "🎯 Marca Táctica (+2 D20 a la tirada del aliado)"
        }
      },
      {
        "id": "arquero_lluvia_flechas",
        "name": "Lluvia de Saetas de Masa Cero",
        "icon": "🌧️",
        "minDmg": 4,
        "maxDmg": 6,
        "critMinDmg": 6,
        "critMaxDmg": 8,
        "badge": "4-6 PS",
        "desc": "Dispara una andanada hacia el cielo que cae en picada sobre la criatura."
      },
      {
        "id": "arquero_tiro_preciso",
        "name": "Tiro al Núcleo de Masa",
        "icon": "👁️",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 8,
        "critMaxDmg": 10,
        "badge": "5-7 PS (Crítico 17+)",
        "critThresholdBonus": 2,
        "desc": "Alinea la mira con la singularidad del monstruo para un tiro crítico de gran alcance."
      },
      {
        "id": "arquero_flecha_sonica",
        "name": "Saeta Sónica Desestabilizadora",
        "icon": "🔊",
        "minDmg": 3,
        "maxDmg": 4,
        "critMinDmg": 5,
        "critMaxDmg": 6,
        "badge": "3-4 PS + 🤝 Crítico Aliado",
        "desc": "Fisura la armadura con resonancia sónica, permitiendo críticos en 17+ a tu compañero.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "vulnerability_ally",
          "critThreshold": 17,
          "label": "🔊 Resonancia Sónica (Crítico en 17+ para el aliado)"
        }
      },
      {
        "id": "arquero_flecha_plasma",
        "name": "Flecha de Plasma Condensado",
        "icon": "🔥",
        "minDmg": 4,
        "maxDmg": 5,
        "critMinDmg": 7,
        "critMaxDmg": 8,
        "badge": "4-5 PS (Crítico 18+)",
        "critThresholdBonus": 1,
        "desc": "Punta incandescente de plasma solar que chamusca la piel alienígena."
      },
      {
        "id": "arquero_tiro_gemelo",
        "name": "Disparo Coordinado de Apoyo",
        "icon": "🤝",
        "minDmg": 3,
        "maxDmg": 5,
        "critMinDmg": 6,
        "critMaxDmg": 7,
        "badge": "3-5 PS + 🤝 +2 Daño Aliado",
        "desc": "Sincroniza su tiro con el embate del compañero potenciando su daño en +2 PS.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "damage_buff_ally",
          "amount": 2,
          "label": "🤝 Apoyo de Fuego (+2 Daño al aliado)"
        }
      },
      {
        "id": "arquero_impacto_pesado",
        "name": "Saeta de Gravedad Hiperdensa",
        "icon": "🪨",
        "minDmg": 5,
        "maxDmg": 7,
        "critMinDmg": 7,
        "critMaxDmg": 9,
        "badge": "5-7 PS (Impacto)",
        "desc": "Proyectil con masa aumentada que empuja y aturde al monstruo."
      },
      {
        "id": "arquero_flecha_cataclismo",
        "name": "Flecha de Cataclismo Cósmico",
        "icon": "🌟",
        "minDmg": 6,
        "maxDmg": 8,
        "critMinDmg": 9,
        "critMaxDmg": 11,
        "badge": "6-8 PS (Tiro Supremo)",
        "desc": "Disparo supremo que canaliza las corrientes de éter de toda la sala de combate."
      }
    ],
    "defenses": [
      {
        "id": "arquero_voltereta",
        "name": "Voltereta Ingrávida",
        "type": "dodge",
        "icon": "🤸",
        "dodgeChance": 0.55,
        "dodgeDc": 10,
        "badge": "DC 10+ (55% Evadir)",
        "desc": "Acrobacia aérea en baja gravedad. Requiere D20 >= 10 para eludir el ataque (0 PS)."
      },
      {
        "id": "arquero_cobertura",
        "name": "Cobertura Táctica",
        "type": "defense",
        "icon": "🧱",
        "reduction": 0.35,
        "badge": "-35% Daño (Seguro)",
        "desc": "Se resguarda tras un monolito o roca flotante reduciendo parte del golpe de forma fiable."
      },
      {
        "id": "arquero_fuego_cobertura",
        "name": "Fuego de Supresión Defensivo",
        "type": "defense",
        "icon": "🛡️",
        "reduction": 0.3,
        "badge": "🛡️ -30% Fuego Cobertura",
        "desc": "Dispara una ráfaga continua de metralla disuasoria que interrumpe la embestida del enemigo (-30% daño a ambos).",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.3,
          "label": "🛡️ Fuego de Supresión (-30% daño grupal)"
        }
      },
      {
        "id": "arquero_flecha_barrera",
        "name": "Disparo de Barrera Escudo",
        "type": "defense",
        "icon": "🏹",
        "reduction": 0.25,
        "badge": "🤝 -25% + Escudo +3 PS Aliado",
        "desc": "Planta una flecha de pulso gravitatorio frente a su compañero, absorbiendo 3 PS de daño entrante.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shield_ally",
          "amount": 3,
          "label": "🏹 Barrera de Saetas (+3 PS escudo al aliado)"
        }
      },
      {
        "id": "arquero_niebla_flechas",
        "name": "Cortina de Saetas Disuasorias",
        "type": "defense",
        "icon": "🌫️",
        "reduction": 0.35,
        "badge": "🤝 -35% Daño Grupal",
        "desc": "Lanza una cortina de flechas que frena el avance del monstruo protegiendo a ambos aventureros en un 35%.",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "shared_defense",
          "reduction": 0.35,
          "label": "🌫️ Cortina de Saetas (-35% daño al grupo)"
        }
      },
      {
        "id": "arquero_paso_viento",
        "name": "Paso del Viento Gravitacional",
        "type": "dodge",
        "icon": "🍃",
        "dodgeChance": 0.6,
        "dodgeDc": 9,
        "badge": "DC 9+ (60% Evadir)",
        "desc": "Usa una corriente de aire ascendente para saltar por encima del zarpazo enemigo."
      },
      {
        "id": "arquero_tiro_intercepcion",
        "name": "Flecha de Intercepción Cinética",
        "type": "counter",
        "icon": "🎯",
        "reduction": 0.3,
        "counterDamage": 1,
        "badge": "-30% Daño + 1 Contradaño",
        "desc": "Frena el zarpazo con una saeta directa a la articulación y devuelve 1 PS de daño."
      },
      {
        "id": "arquero_camuflaje_optico",
        "name": "Camuflaje de Luz Curvada",
        "type": "dodge",
        "icon": "🕶️",
        "dodgeChance": 0.65,
        "dodgeDc": 8,
        "badge": "DC 8+ (65% Evadir)",
        "desc": "Curva la luz a su alrededor volviéndose invisible durante el ataque."
      },
      {
        "id": "arquero_resguardo_rocoso",
        "name": "Trinchera de Rocas Levitantes",
        "type": "defense",
        "icon": "🪨",
        "reduction": 0.45,
        "badge": "-45% Daño (Trinchera)",
        "desc": "Arrastra dos fragmentos de basalto para formar un escudo improvisado sólido."
      },
      {
        "id": "arquero_aura_caza",
        "name": "Viento Favorable para el Aliado",
        "type": "defense",
        "icon": "💨",
        "reduction": 0.25,
        "badge": "🤝 -25% + Evasión Aliada",
        "desc": "Altera el flujo de gravedad circundante para impulsar a su compañero fuera de la zona de impacto (+2 Evasión).",
        "isGroupBuff": true,
        "groupEffect": {
          "type": "evasion_aura_ally",
          "amount": 2,
          "label": "💨 Viento Favorable (+2 Evasión al aliado)"
        }
      }
    ]
  }
};

/**
 * Función que selecciona 3 habilidades rotativas del catálogo de 10 habilidades de la clase.
 * En fase de defensa, garantiza que al menos una de las 3 opciones sea de apoyo/sinergia con el aliado.
 * La selección es determinista según (turnNumber + characterId) para que se mantenga idéntica durante todo el turno.
 */
function getTurnPlayerAbilities(className, isHeroPhase, turnNumber, characterId) {
  const classData = CLASS_ABILITIES[className] || CLASS_ABILITIES['Mago'];
  const pool = isHeroPhase ? classData.attacks : classData.defenses;
  if (!pool || pool.length <= 3) return pool || [];

  // Semilla pseudo-aleatoria consistente por turno y personaje
  const charStr = String(characterId || 'anon');
  let charSum = 0;
  for (let i = 0; i < charStr.length; i++) {
    charSum += charStr.charCodeAt(i) * (i + 1);
  }
  let seed = Math.abs((Number(turnNumber || 1) * 7919) + (isHeroPhase ? 104729 : 50311) + charSum);

  function pseudoRand(max) {
    seed = (seed * 9301 + 49297) % 233280;
    return Math.floor((seed / 233280) * max);
  }

  const selected = [];
  const poolCopy = [...pool];

  // Si es fase de defensa, forzar que al menos una de las opciones sea de apoyo al aliado
  if (!isHeroPhase) {
    const allySupports = poolCopy.filter(a => a.isGroupBuff);
    if (allySupports.length > 0) {
      const suppIdx = pseudoRand(allySupports.length);
      const chosenSupport = allySupports[suppIdx];
      selected.push(chosenSupport);
      const idxInCopy = poolCopy.findIndex(x => x.id === chosenSupport.id);
      if (idxInCopy !== -1) poolCopy.splice(idxInCopy, 1);
    }
  }

  while (selected.length < 3 && poolCopy.length > 0) {
    const randIdx = pseudoRand(poolCopy.length);
    selected.push(poolCopy[randIdx]);
    poolCopy.splice(randIdx, 1);
  }

  return selected;
}

const UNIVERSAL_ACTIONS = {
  potion: {
    id: 'universal_pocion',
    name: 'Poción Gravitacional',
    icon: '🧪',
    healAmount: 5,
    badge: '+5 PS Individual',
    desc: 'Bebe un brebaje alquímico que repara tu matriz vital hasta 10 PS máx.'
  },
  groupPotion: {
    id: 'universal_pocion_grupo',
    name: 'Brebaje de Éter Compartido',
    icon: '🧪',
    healAmount: 4,
    allyHealAmount: 2,
    badge: '+4 PS Ti / +2 PS Compañero',
    desc: 'Bebes una infusión reparadora (+4 PS) y rocías vapores sanadores sobre tu compañero (+2 PS).',
    isGroupBuff: true,
    groupEffect: { type: 'heal_ally', amount: 2, label: '🧪 Salpicadura Sanadora (+2 PS al compañero)' }
  },
  runes: {
    id: 'universal_runas',
    name: 'Canalizar Runas de Gravedad',
    icon: '🔮',
    badge: 'Efecto Táctico',
    desc: 'Manipula las anomalías del entorno para alterar la gravedad de la sala.'
  }
};

/**
 * Catálogo de Ítems / Armas de Botín (Loot Drops)
 * Cada aventurero puede portar hasta 3 ítems en sus ranuras de equipo.
 */
const LOOT_ITEMS = [
  {
    id: 'item_arco_singularidad',
    name: 'Arco de Singularidad Cinética',
    icon: '🏹',
    type: 'weapon',
    bonusDmg: 2,
    statText: '+2 Daño a Distancia',
    desc: 'Dispara proyectiles energéticos que aceleran a través de la gravedad quebrada sin perder potencia.'
  },
  {
    id: 'item_daga_vacio',
    name: 'Daga de Vacío Sombrío',
    icon: '🗡️',
    type: 'weapon',
    bonusDmg: 1,
    penetration: 0.20,
    statText: '+1 Daño / Ignora 20% Mitigación',
    desc: 'Filo forjado en masa negativa pura que atraviesa corazas hiperdensas sin resistencia.'
  },
  {
    id: 'item_baston_nuclear',
    name: 'Bastón del Núcleo Estelar',
    icon: '🪄',
    type: 'magic',
    bonusDmg: 2,
    bonusHeal: 1,
    statText: '+2 Poder Mágico / +1 a Pociones',
    desc: 'Canaliza ondas de plasma radiante incrementando el poder de hechizos y restauraciones.'
  },
  {
    id: 'item_aegis_basalto',
    name: 'Aegis de Basalto Hiperdenso',
    icon: '🛡️',
    type: 'shield',
    bonusMitigation: 0.15,
    statText: '+15% Mitigación Defensiva',
    desc: 'Escudo de monolito tallado que amortigua un 15% adicional de daño en cualquier postura de guardia.'
  },
  {
    id: 'item_hacha_masa',
    name: 'Hacha de Masa Hiperdensa',
    icon: '🪓',
    type: 'weapon',
    bonusDmg: 3,
    statText: '+3 Daño Físico Demoletodo',
    desc: 'Arma pesada que multiplica su peso al golpear para triturar corazas alienígenas.'
  },
  {
    id: 'item_anillo_cohesion',
    name: 'Anillo de Resonancia Grupal',
    icon: '💍',
    type: 'accessory',
    bonusGroupSynergy: 2,
    statText: '+2 PS Curación/Escudo Grupal',
    desc: 'Gema que vibra en armonía con el alma del compañero, aumentando los beneficios grupales en +2 PS.'
  },
  {
    id: 'item_botas_impulso',
    name: 'Botas de Impulso Ingrávido',
    icon: '👢',
    type: 'armor',
    dodgeDcBonus: 2,
    statText: '+2 Tirada de Evasión (DC reducida)',
    desc: 'Propulsores de micro-gravedad en los talones que facilitan eludir ataques letales.'
  },
  {
    id: 'item_frasco_infinito',
    name: 'Frasco Infinito de Éter',
    icon: '🧪',
    type: 'consumable_upgrade',
    bonusHeal: 2,
    statText: '+2 PS Extra a Pociones',
    desc: 'Contenedor alquímico recargable que intensifica la regeneración celular.'
  },
  {
    id: 'item_guanteletes_pulso',
    name: 'Guanteletes de Pulso Gravitatorio',
    icon: '⚡',
    type: 'armor',
    bonusCounter: 1,
    statText: '+1 Contradaño Directo al Defender',
    desc: 'Nudillos cargados de energía cinética que devuelven 1 PS de daño a cualquier agresor.'
  },
  {
    id: 'item_orbe_distorsion',
    name: 'Orbe de Distorsión Gravitacional',
    icon: '🔮',
    type: 'accessory',
    d20Advantage: true,
    statText: 'Ventaja Táctica en Tiradas D20',
    desc: 'Altera el destino y las probabilidades en el campo de batalla, otorgando ventaja de crítico.'
  },
  {
    id: 'item_ballesta_estelar',
    name: 'Ballesta de Precisión Estelar',
    icon: '🎯',
    type: 'weapon',
    bonusDmg: 1,
    critThresholdBonus: 1,
    statText: '+1 Daño / Críticos en 18, 19 y 20',
    desc: 'Mecanismo giroscópico que fija puntos vulnerables ampliando el margen de golpes críticos.'
  },
  {
    id: 'item_hombreras_granito',
    name: 'Hombreras de Granito Levitante',
    icon: '🧱',
    type: 'armor',
    flatDamageReduction: 1,
    statText: '-1 Daño Plano Recibido',
    desc: 'Placas flotantes de granito que frenan la inercia reduciendo en 1 PS cualquier ataque entrante.'
  }
];

/**
 * Catálogo de 10 Habilidades Ofensivas para Criaturas (Rotación rica en combates largos)
 */
const MONSTER_ATTACKS_POOL = [
  {
    id: 'matk_1',
    name: '⚡ Zarpazo Hiperdenso Focal',
    type: 'single',
    typeLabel: '🎯 Objetivo Individual (1 Aventurero)',
    minDmg: 4,
    maxDmg: 6,
    damageText: '4 - 6 PS',
    effects: 'Descarga un zarpazo de gravedad pura concentrado sobre un único aventurero.'
  },
  {
    id: 'matk_2',
    name: '🌌 Vórtice de Alas de Vacío',
    type: 'aoe',
    typeLabel: '💥 Daño a Todos los Jugadores (Área)',
    minDmg: 2,
    maxDmg: 4,
    damageText: '2 - 4 PS a cada uno',
    effects: 'Bate sus alas de éter liberando una onda sísmica gravitacional sobre todo el grupo.'
  },
  {
    id: 'matk_3',
    name: '🪨 Proyección de Monolito Volcánico',
    type: 'single',
    typeLabel: '🎯 Objetivo Individual (1 Aventurero)',
    minDmg: 5,
    maxDmg: 7,
    damageText: '5 - 7 PS (Brutal)',
    effects: 'Arranca un monolito de basalto y lo arroja a velocidad hipersónica hacia un blanco.'
  },
  {
    id: 'matk_4',
    name: '☄️ Lluvia de Meteoros Invertidos',
    type: 'aoe',
    typeLabel: '💥 Daño a Todos los Jugadores (Área)',
    minDmg: 3,
    maxDmg: 4,
    damageText: '3 - 4 PS a cada uno',
    effects: 'Hace ascender fragmentos rocosos hacia el techo que caen como lluvia sobre la compañía.'
  },
  {
    id: 'matk_5',
    name: '🧬 Succión de Masa Vital',
    type: 'drain',
    typeLabel: '🩸 Drenaje Vital (1 Jugador + Cura)',
    minDmg: 3,
    maxDmg: 5,
    healMonster: 3,
    damageText: '3 - 5 PS (Cura 3 PS al monstruo)',
    effects: 'Drena la bio-energía del aventurero restaurando 3 PS a la matriz de la criatura.'
  },
  {
    id: 'matk_6',
    name: '🌪️ Tifón de Plasma Antigravitatorio',
    type: 'aoe',
    typeLabel: '💥 Daño a Todos los Jugadores (Área)',
    minDmg: 2,
    maxDmg: 3,
    damageText: '2 - 3 PS a cada uno',
    effects: 'Remolino de fuego estelar que levita y azota a todos los combatientes sin excepción.'
  },
  {
    id: 'matk_7',
    name: '🖤 Implosión de Singularidad Menor',
    type: 'single',
    typeLabel: '🎯 Objetivo Individual (1 Aventurero)',
    minDmg: 5,
    maxDmg: 8,
    damageText: '5 - 8 PS (Letal)',
    effects: 'Colapsa un punto de masa en el pecho del objetivo. Letal si falla la evasión o guardia.'
  },
  {
    id: 'matk_8',
    name: '💫 Descarga de Pulsos Electrostáticos',
    type: 'aoe',
    typeLabel: '💥 Daño a Todos los Jugadores (Área)',
    minDmg: 2,
    maxDmg: 4,
    damageText: '2 - 4 PS a cada uno',
    effects: 'Ondas ionizadas que electrocutan el ambiente dañando los sistemas vitales del grupo.'
  },
  {
    id: 'matk_9',
    name: '⛓️ Presa Cinética Desgarradora',
    type: 'single',
    typeLabel: '🎯 Objetivo Individual (1 Aventurero)',
    minDmg: 4,
    maxDmg: 6,
    damageText: '4 - 6 PS',
    effects: 'Inmoviliza al aventurero con campos gravitatorios opuestos que desgarran su armadura.'
  },
  {
    id: 'matk_10',
    name: '💥 Cataclismo de Marea Espacial',
    type: 'aoe',
    typeLabel: '💥 Daño a Todos los Jugadores (Área Masiva)',
    minDmg: 3,
    maxDmg: 5,
    damageText: '3 - 5 PS a cada uno',
    effects: 'Liberación cataclísmica de energía que colapsa la plataforma flotante hiriendo a todos.'
  }
];

/**
 * Catálogo de 10 Habilidades Defensivas para Criaturas
 */
const MONSTER_DEFENSES_POOL = [
  {
    id: 'mdef_1',
    name: '🛡️ Caparazón de Quitina Hiperdensa',
    type: 'all',
    typeLabel: '🌐 Cobertura Global (Todos los Ataques)',
    reduction: 0.35,
    reductionText: '-35% Daño a Todos',
    effects: 'Endurece su exoesqueleto estelar amortiguando el 35% de todos los ataques recibidos en la ronda.'
  },
  {
    id: 'mdef_2',
    name: '🧱 Bloqueo de Densidad Focal',
    type: 'single',
    typeLabel: '🎯 Barrera Focalizada (1 Solo Ataque)',
    reduction: 0.65,
    reductionText: '-65% al Golpe Más Fuerte',
    effects: 'Concentra su masa molecular en un punto focal para frenar y mitigar en un 65% el impacto más letal.'
  },
  {
    id: 'mdef_3',
    name: '✨ Manto de Fluctuación de Vacío',
    type: 'all',
    typeLabel: '🌐 Cobertura Global (Todos los Ataques)',
    reduction: 0.40,
    reductionText: '-40% Daño a Todos',
    effects: 'Curva el espacio circundante disipando el 40% de la energía de cada golpe recibido.'
  },
  {
    id: 'mdef_4',
    name: '🪞 Espejo Cinético Reflectante',
    type: 'all',
    typeLabel: '🌐 Cobertura Global + Contradaño',
    reduction: 0.30,
    counterDamage: 2,
    reductionText: '-30% Daño + Refleja 2 PS',
    effects: 'Rebota parte de las ondas cinéticas amortiguando el 30% y devolviendo 2 PS de daño al atacante principal.'
  },
  {
    id: 'mdef_5',
    name: '🌐 Cúpula de Masa Cero Infranqueable',
    type: 'single',
    typeLabel: '🎯 Barrera Focalizada (1 Solo Ataque)',
    reduction: 0.75,
    reductionText: '-75% al Golpe Más Fuerte',
    effects: 'Genera un escudo de gravedad cero que anula el 75% del impacto más destructor del grupo.'
  },
  {
    id: 'mdef_6',
    name: '🔮 Distorsión Espacial de Desvío',
    type: 'all',
    typeLabel: '🌐 Cobertura Global (Todos los Ataques)',
    reduction: 0.35,
    reductionText: '-35% Daño a Todos',
    effects: 'Flecta las trayectorias de flechas y hechizos reduciendo su fuerza de penetración.'
  },
  {
    id: 'mdef_7',
    name: '🛡️ Bastión de Granito Inquebrantable',
    type: 'all',
    typeLabel: '🌐 Cobertura Global (Todos los Ataques)',
    reduction: 0.45,
    reductionText: '-45% Daño a Todos',
    effects: 'Bloques flotantes de piedra volcánica se cierran herméticamente absorbiendo casi la mitad del daño.'
  },
  {
    id: 'mdef_8',
    name: '🌀 Vórtice de Absorción de Energía',
    type: 'single',
    typeLabel: '🎯 Barrera Focalizada (1 Solo Ataque)',
    reduction: 0.60,
    reductionText: '-60% al Golpe Más Fuerte',
    effects: 'Engulle y absorbe el impacto más poderoso disipando el 60% de su fuerza destructiva.'
  },
  {
    id: 'mdef_9',
    name: '⚡ Campo de Pulsos Electrostáticos',
    type: 'all',
    typeLabel: '🌐 Cobertura Global + Descarga',
    reduction: 0.30,
    counterDamage: 1,
    reductionText: '-30% Daño + Refleja 1 PS',
    effects: 'Crea una barrera electrificada que amortigua un 30% y emite un chispazo de 1 PS de contragolpe.'
  },
  {
    id: 'mdef_10',
    name: '🧱 Caparazón de Diamante Cósmico',
    type: 'single',
    typeLabel: '🎯 Barrera Focalizada (1 Solo Ataque)',
    reduction: 0.70,
    reductionText: '-70% al Golpe Más Fuerte',
    effects: 'Solidifica su coraza en una lámina diamantina que frena en seco el ataque más devastador (-70%).'
  }
];

/**
 * Retorna las habilidades de una clase dada
 */
function getAbilitiesForClass(className) {
  return CLASS_ABILITIES[className] || CLASS_ABILITIES['Mago'];
}

function findAbilityById(className, abilityId) {
  if (!abilityId) return null;
  if (abilityId === 'universal_pocion') return UNIVERSAL_ACTIONS.potion;
  if (abilityId === 'universal_pocion_grupo') return UNIVERSAL_ACTIONS.groupPotion;
  if (abilityId === 'universal_runas') return UNIVERSAL_ACTIONS.runes;

  const classData = getAbilitiesForClass(className);
  if (classData) {
    const foundAttack = classData.attacks && classData.attacks.find(a => a.id === abilityId);
    if (foundAttack) return foundAttack;
    const foundDefense = classData.defenses && classData.defenses.find(d => d.id === abilityId);
    if (foundDefense) return foundDefense;
  }

  // Buscar en todas las clases como respaldo
  for (const c of Object.values(CLASS_ABILITIES)) {
    const a = c.attacks && c.attacks.find(x => x.id === abilityId);
    if (a) return a;
    const d = c.defenses && c.defenses.find(x => x.id === abilityId);
    if (d) return d;
  }

  return null;
}

/**
 * Evalúa el efecto de una habilidad según el resultado de una tirada de dado D20 (1-20),
 * incorporando los beneficios de los 3 slots de ítems equipados.
 * @param {Object} ability - Datos de la habilidad
 * @param {number} roll - Tirada del D20 (1 a 20)
 * @param {boolean} isTacticalAdvantage - Si el flavor text táctico otorga ventaja para crítico
 * @param {Array} equippedItems - Lista de hasta 3 ítems portados por el aventurero
 * @returns {Object} { d20, tier, tierName, damage, isCrit, reduction, counterDamage, dodgeSuccess, healAmount, summary, itemBonusesText }
 */
function evaluateD20Ability(ability, roll, isTacticalAdvantage = false, equippedItems = []) {
  const d20 = Math.max(1, Math.min(20, Math.floor(roll || 10)));
  const items = Array.isArray(equippedItems) ? equippedItems : [];

  // Acumuladores de bonus de los ítems de equipo
  let bonusDmg = 0;
  let bonusMitigation = 0;
  let dodgeDcBonus = 0;
  let bonusCritMargin = 0;
  let bonusCounter = 0;
  let bonusHeal = 0;
  let flatDamageReduction = 0;
  let penetration = 0;
  let itemBonusTags = [];

  for (const it of items) {
    if (!it) continue;
    if (it.bonusDmg) { bonusDmg += it.bonusDmg; itemBonusTags.push(`+${it.bonusDmg} Daño (${it.icon})`); }
    if (it.penetration) { penetration += it.penetration; itemBonusTags.push(`Penetra ${Math.round(it.penetration * 100)}% Armadura (${it.icon})`); }
    if (it.bonusMitigation) { bonusMitigation += it.bonusMitigation; itemBonusTags.push(`+${Math.round(it.bonusMitigation * 100)}% Mitigación (${it.icon})`); }
    if (it.dodgeDcBonus) { dodgeDcBonus += it.dodgeDcBonus; itemBonusTags.push(`+${it.dodgeDcBonus} Evasión (${it.icon})`); }
    if (it.critThresholdBonus) { bonusCritMargin += it.critThresholdBonus; itemBonusTags.push(`Crítico Fácil (${it.icon})`); }
    if (it.bonusCounter) { bonusCounter += it.bonusCounter; itemBonusTags.push(`+${it.bonusCounter} Contradaño (${it.icon})`); }
    if (it.bonusHeal) { bonusHeal += it.bonusHeal; itemBonusTags.push(`+${it.bonusHeal} Curación (${it.icon})`); }
    if (it.flatDamageReduction) { flatDamageReduction += it.flatDamageReduction; itemBonusTags.push(`-1 Daño Recibido (${it.icon})`); }
    if (it.d20Advantage) isTacticalAdvantage = true;
  }

  if (!ability) {
    return {
      d20,
      tier: 'normal',
      tierName: 'Acción Libre',
      damage: 4 + bonusDmg,
      penetration,
      reduction: 0.35 + bonusMitigation,
      counterDamage: bonusCounter,
      dodgeSuccess: d20 >= Math.max(7, 10 - dodgeDcBonus),
      healAmount: 5 + bonusHeal,
      isCrit: d20 >= Math.max(15, 19 - bonusCritMargin),
      itemBonusesText: itemBonusTags.join(', '),
      summary: `🎲 D20 [${d20}] ➔ Acción Libre (${4 + bonusDmg} PS)`
    };
  }

  // 1. HABILIDADES DE ATAQUE
  if (ability.minDmg && ability.maxDmg) {
    const baseCritThresh = isTacticalAdvantage ? 16 : 19;
    const critThreshold = Math.max(15, baseCritThresh - bonusCritMargin);
    const isCrit = d20 >= critThreshold;

    let damage = ability.minDmg;
    let tier = 'normal';
    let tierName = 'Impacto Normal';

    if (isCrit) {
      tier = 'crit';
      tierName = '¡Golpe Crítico Gravitacional!';
      const critSpread = (ability.critMaxDmg || (ability.maxDmg + 2)) - (ability.critMinDmg || (ability.maxDmg + 1));
      const critOffset = Math.floor(((d20 - critThreshold) / (20 - critThreshold + 1)) * (critSpread + 1));
      damage = (ability.critMinDmg || (ability.maxDmg + 1)) + Math.min(critSpread, critOffset);
    } else if (d20 <= 4) {
      tier = 'glance';
      tierName = 'Rozadura Leve';
      damage = ability.minDmg;
    } else if (d20 <= 13) {
      tier = 'normal';
      tierName = 'Impacto Normal';
      const spread = ability.maxDmg - ability.minDmg;
      const step = spread > 1 ? Math.floor(((d20 - 5) / 9) * spread) : 0;
      damage = ability.minDmg + step;
    } else {
      tier = 'solid';
      tierName = 'Golpe Sólido';
      damage = ability.maxDmg;
    }

    damage += bonusDmg;

    const itemTagStr = itemBonusTags.length > 0 ? ` [🎁 ${itemBonusTags.join(', ')}]` : '';
    return {
      d20,
      tier,
      tierName,
      damage,
      penetration,
      isCrit,
      itemBonusesText: itemBonusTags.join(', '),
      summary: `🎲 D20 [${d20}] ➔ ${tierName} (${damage} PS)${itemTagStr}`
    };
  }

  // 2. DEFENSAS DE EVASIÓN (DODGE)
  if (ability.type === 'dodge') {
    const baseDc = ability.dodgeDc || (ability.dodgeChance >= 0.60 ? 9 : (ability.dodgeChance >= 0.55 ? 10 : 11));
    const dc = Math.max(7, baseDc - dodgeDcBonus);
    const isCritSuccess = d20 === 20;
    const isCritFail = d20 === 1;
    const dodgeSuccess = d20 >= dc;

    let tier = dodgeSuccess ? 'dodge_success' : 'dodge_fail';
    let tierName = dodgeSuccess ? '¡Evasión Exitosa!' : '¡Fallo de Evasión!';
    if (isCritSuccess) {
      tier = 'crit_dodge';
      tierName = '¡Evasión Perfecta con Contragolpe (+1 PS)!';
    } else if (isCritFail) {
      tier = 'crit_fail';
      tierName = '¡Pifia Aérea! (Desestabilizado +1 Daño)';
    }

    return {
      d20,
      dc,
      tier,
      tierName,
      dodgeSuccess,
      isCritSuccess,
      isCritFail,
      itemBonusesText: itemBonusTags.join(', '),
      summary: `🎲 D20 [${d20} vs DC ${dc}] ➔ ${tierName}`
    };
  }

  // 3. DEFENSAS DE BLOQUEO / ESCUDO
  if (ability.type === 'defense') {
    let baseRed = (ability.reduction || 0.35) + bonusMitigation;
    let reduction = baseRed;
    let tier = 'block_normal';
    let tierName = 'Bloqueo Sólido';

    if (d20 <= 5) {
      tier = 'block_partial';
      tierName = 'Guardia Parcial';
      reduction = Math.max(0.20, baseRed - 0.10);
    } else if (d20 <= 14) {
      tier = 'block_normal';
      tierName = 'Bloqueo Sólido';
      reduction = baseRed;
    } else if (d20 <= 18) {
      tier = 'block_master';
      tierName = 'Bloqueo Magistral';
      reduction = Math.min(0.85, baseRed + 0.15);
    } else {
      tier = 'block_perfect';
      tierName = '¡Bloqueo Absoluto Gravitacional!';
      reduction = Math.min(0.90, baseRed + 0.30);
    }

    return {
      d20,
      tier,
      tierName,
      reduction,
      counterDamage: bonusCounter,
      flatDamageReduction,
      itemBonusesText: itemBonusTags.join(', '),
      summary: `🎲 D20 [${d20}] ➔ ${tierName} (-${Math.round(reduction * 100)}% daño)`
    };
  }

  // 4. CONTRAATAQUE (Paladín Retribución)
  if (ability.type === 'counter') {
    const highRoll = d20 >= 10;
    const counterDamage = (highRoll ? (ability.counterDamage + 1) : ability.counterDamage) + bonusCounter;
    const reduction = Math.min(0.80, (highRoll ? 0.40 : 0.30) + bonusMitigation);
    const tierName = highRoll ? `Retribución Potenciada (${counterDamage} PS Contradaño)` : `Retribución Sagrada (${counterDamage} PS Contradaño)`;

    return {
      d20,
      tier: highRoll ? 'counter_empowered' : 'counter_normal',
      tierName,
      reduction,
      counterDamage,
      flatDamageReduction,
      itemBonusesText: itemBonusTags.join(', '),
      summary: `🎲 D20 [${d20}] ➔ ${tierName} (-${Math.round(reduction * 100)}% / Refleja ${counterDamage} PS)`
    };
  }

  // 5. POCIÓN
  if (ability.id === 'universal_pocion' || ability.id === 'universal_pocion_grupo' || ability.healAmount) {
    let heal = (ability.healAmount || 5) + bonusHeal;
    let allyHeal = (ability.allyHealAmount || 0);
    let tierName = ability.id === 'universal_pocion_grupo' ? 'Brebaje de Éter Compartido' : 'Poción Alquímica Estándar';

    if (d20 <= 5) {
      heal = Math.max(3, heal - 1);
      tierName = `${tierName} (Dispersa)`;
    } else if (d20 >= 16) {
      heal += 1;
      if (allyHeal > 0) allyHeal += 1;
      tierName = `¡${tierName} Suprema!`;
    }

    return {
      d20,
      tier: d20 >= 16 ? 'heal_crit' : 'heal_normal',
      tierName,
      healAmount: heal,
      allyHealAmount: allyHeal,
      itemBonusesText: itemBonusTags.join(', '),
      summary: `🎲 D20 [${d20}] ➔ ${tierName} (+${heal} PS${allyHeal > 0 ? ` / +${allyHeal} PS aliado` : ''})`
    };
  }

  return { d20, tier: 'generic', tierName: 'Acción Libre', summary: `🎲 D20 [${d20}]` };
}

// Para uso tanto en Node.js como en el navegador si se importa
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CLASS_ABILITIES,
    UNIVERSAL_ACTIONS,
    LOOT_ITEMS,
    MONSTER_ATTACKS_POOL,
    MONSTER_DEFENSES_POOL,
    getAbilitiesForClass,
    getTurnPlayerAbilities,
    findAbilityById,
    evaluateD20Ability
  };
} else if (typeof window !== 'undefined') {
  window.CLASS_ABILITIES = CLASS_ABILITIES;
  window.UNIVERSAL_ACTIONS = UNIVERSAL_ACTIONS;
  window.LOOT_ITEMS = LOOT_ITEMS;
  window.MONSTER_ATTACKS_POOL = MONSTER_ATTACKS_POOL;
  window.MONSTER_DEFENSES_POOL = MONSTER_DEFENSES_POOL;
  window.getAbilitiesForClass = getAbilitiesForClass;
  window.getTurnPlayerAbilities = getTurnPlayerAbilities;
  window.findAbilityById = findAbilityById;
  window.evaluateD20Ability = evaluateD20Ability;
}
