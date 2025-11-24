const { BOARD_HEIGHT, BOARD_WIDTH } = require("../constants/game");

/**
 * Ability Engine - Handles execution of all unit abilities
 */

/**
 * Execute an active ability
 * @param {Object} game - Game state
 * @param {string} playerId - Player using the ability
 * @param {Object} unitPos - Position of unit using ability {r, c}
 * @param {Object} ability - Ability data from card.json
 * @param {Object} targetPos - Target position {r, c} or null for self/global
 * @returns {Object} Result with success, message, and effects
 */
const executeActiveAbility = (game, playerId, unitPos, ability, targetPos) => {
  const { board, player1, player2 } = game;
  const player = playerId === player1.id ? player1 : player2;
  const unit = board[unitPos.r][unitPos.c];

  // Validate energy cost
  if (ability.energyCost && player.energy < ability.energyCost) {
    return { success: false, message: "Energía insuficiente" };
  }

  // Validate unit hasn't used ability this turn
  if (unit.abilityUsedThisTurn) {
    return { success: false, message: "Ya usaste una habilidad este turno" };
  }

  // Validate range if applicable
  if (ability.range && targetPos) {
    const dist =
      Math.abs(unitPos.r - targetPos.r) + Math.abs(unitPos.c - targetPos.c);
    if (dist > ability.range) {
      return { success: false, message: "Objetivo fuera de rango" };
    }
  }

  // Validate target
  const targetValidation = validateTarget(
    game,
    playerId,
    ability.target,
    targetPos
  );
  if (!targetValidation.valid) {
    return { success: false, message: targetValidation.message };
  }

  // Deduct energy
  player.energy -= ability.energyCost || 0;

  // Mark ability as used
  unit.abilityUsedThisTurn = true;

  // Execute ability effects
  const effects = [];

  if (ability.areaEffect) {
    // Area of effect ability
    const affectedPositions = getAffectedArea(targetPos, ability.areaSize);
    affectedPositions.forEach((pos) => {
      if (
        pos.r >= 0 &&
        pos.r < BOARD_HEIGHT &&
        pos.c >= 0 &&
        pos.c < BOARD_WIDTH
      ) {
        const target = board[pos.r][pos.c];
        if (target) {
          const effect = applyAbilityEffect(
            game,
            playerId,
            ability,
            target,
            pos
          );
          if (effect) effects.push(effect);
        }
      }
    });
  } else {
    // Single target ability
    const targets = getTargets(game, playerId, ability.target, targetPos);
    targets.forEach(({ target, pos }) => {
      const effect = applyAbilityEffect(game, playerId, ability, target, pos);
      if (effect) effects.push(effect);
    });
  }

  return {
    success: true,
    message: `${ability.name} activada`,
    effects,
    energyCost: ability.energyCost || 0,
  };
};

/**
 * Trigger passive abilities based on events
 * @param {Object} game - Game state
 * @param {string} trigger - Trigger type (onKill, onStartTurn, onBeingDamaged)
 * @param {Object} context - Context data (unit, position, etc.)
 */
const triggerPassiveAbilities = (game, trigger, context) => {
  const { board } = game;
  const effects = [];

  // Find all units with passive abilities matching this trigger
  for (let r = 0; r < BOARD_HEIGHT; r++) {
    for (let c = 0; c < BOARD_WIDTH; c++) {
      const unit = board[r][c];
      if (unit && unit.type === "unit" && unit.abilities) {
        unit.abilities.forEach((ability) => {
          if (
            ability.abilityType === "passive" &&
            ability.trigger === trigger
          ) {
            // Check if this unit should trigger (e.g., onKill only for the killer)
            if (trigger === "onKill" && context.killerPos) {
              if (context.killerPos.r !== r || context.killerPos.c !== c)
                return;
            }

            // Execute passive ability
            const targets = getTargets(game, unit.owner, ability.target, {
              r,
              c,
            });
            targets.forEach(({ target, pos }) => {
              const effect = applyAbilityEffect(
                game,
                unit.owner,
                ability,
                target,
                pos
              );
              if (effect) {
                effect.abilityName = ability.name;
                effect.triggerType = trigger;
                effects.push(effect);
              }
            });
          }
        });
      }
    }
  }

  return effects;
};

/**
 * Apply ability effect to a target
 */
const applyAbilityEffect = (game, playerId, ability, target, targetPos) => {
  const { board } = game;
  const effect = { targetPos, effects: [] };

  // Check friendly fire
  if (!ability.friendlyFire && target.owner === playerId && ability.damage) {
    return null; // Skip friendly targets for damage
  }

  // Apply damage
  if (ability.damage) {
    let damage = ability.damage;

    // Check for custom effects
    if (
      ability.customEffect &&
      ability.customEffect.includes("extraDamageAgainstStructures")
    ) {
      if (target.type === "tower") {
        const extraDamage = parseInt(ability.customEffect.split(":")[1]);
        damage += extraDamage;
      }
    }

    // Apply defense unless ignored
    if (!ability.ignoresDefense && target.defense) {
      damage = Math.max(0, damage - target.defense);
    }

    target.hp -= damage;
    effect.effects.push({ type: "damage", value: damage });

    // Check if target died
    if (target.hp <= 0) {
      board[targetPos.r][targetPos.c] = null;
      effect.effects.push({ type: "kill" });
    }
  }

  // Apply healing
  if (ability.heal) {
    const healAmount = Math.min(ability.heal, target.maxHp - target.hp);
    target.hp += healAmount;
    effect.effects.push({ type: "heal", value: healAmount });
  }

  // Apply buffs
  if (ability.buff) {
    applyBuff(game, target, targetPos, ability.buff, ability.name);
    effect.effects.push({ type: "buff", buff: ability.buff });
  }

  // Apply debuffs
  if (ability.debuff) {
    applyDebuff(game, target, targetPos, ability.debuff, ability.name);
    effect.effects.push({ type: "debuff", debuff: ability.debuff });
  }

  // Special: allowAttackAfterFullMove
  if (ability.allowAttackAfterFullMove) {
    target.hasMoved = false; // Reset move flag to allow attack
    effect.effects.push({ type: "special", value: "canAttackAfterMove" });
  }

  return effect.effects.length > 0 ? effect : null;
};

/**
 * Apply a buff to a target
 */
const applyBuff = (game, target, targetPos, buff, abilityName) => {
  if (!game.activeBuffs) game.activeBuffs = [];

  const buffData = {
    targetPos,
    abilityName,
    type: "buff",
    attack: buff.attack || 0,
    defense: buff.defense || 0,
    speed: buff.speed || 0,
    durationTurns: buff.durationTurns,
    turnsRemaining: buff.durationTurns,
  };

  // Apply stat changes
  if (buff.attack) target.attack += buff.attack;
  if (buff.defense) target.defense += buff.defense;
  if (buff.speed) target.speed += buff.speed;

  // Track buff if it has duration
  if (buff.durationTurns !== null && buff.durationTurns !== undefined) {
    game.activeBuffs.push(buffData);
  }
};

/**
 * Apply a debuff to a target
 */
const applyDebuff = (game, target, targetPos, debuff, abilityName) => {
  if (!game.activeBuffs) game.activeBuffs = [];

  const debuffData = {
    targetPos,
    abilityName,
    type: "debuff",
    attack: debuff.attack || 0,
    defense: debuff.defense || 0,
    speed: debuff.speed || 0,
    durationTurns: debuff.durationTurns,
    turnsRemaining: debuff.durationTurns,
  };

  // Apply stat changes (negative for debuffs)
  if (debuff.attack) target.attack -= debuff.attack;
  if (debuff.defense) target.defense -= debuff.defense;
  if (debuff.speed) target.speed -= debuff.speed;

  // Track debuff if it has duration
  if (debuff.durationTurns !== null && debuff.durationTurns !== undefined) {
    game.activeBuffs.push(debuffData);
  }
};

/**
 * Update buff/debuff durations at turn end
 */
const updateBuffDurations = (game) => {
  if (!game.activeBuffs) return;

  const { board } = game;
  const expiredBuffs = [];

  game.activeBuffs.forEach((buff, index) => {
    if (buff.turnsRemaining !== null && buff.turnsRemaining !== undefined) {
      buff.turnsRemaining--;

      if (buff.turnsRemaining <= 0) {
        // Remove buff effects
        const target = board[buff.targetPos.r][buff.targetPos.c];
        if (target) {
          const multiplier = buff.type === "buff" ? -1 : 1; // Reverse the effect
          if (buff.attack) target.attack += buff.attack * multiplier;
          if (buff.defense) target.defense += buff.defense * multiplier;
          if (buff.speed) target.speed += buff.speed * multiplier;
        }
        expiredBuffs.push(index);
      }
    }
  });

  // Remove expired buffs (in reverse to maintain indices)
  expiredBuffs.reverse().forEach((index) => {
    game.activeBuffs.splice(index, 1);
  });
};

/**
 * Validate target type
 */
const validateTarget = (game, playerId, targetType, targetPos) => {
  const { board } = game;

  if (
    targetType === "self" ||
    targetType === "allAllies" ||
    targetType === "allEnemies"
  ) {
    return { valid: true };
  }

  if (!targetPos) {
    return { valid: false, message: "Debes seleccionar un objetivo" };
  }

  const target = board[targetPos.r][targetPos.c];

  if (targetType === "tile") {
    return { valid: true };
  }

  if (!target) {
    return { valid: false, message: "No hay objetivo en esa posición" };
  }

  if (targetType === "ally" && target.owner !== playerId) {
    return { valid: false, message: "Debes seleccionar un aliado" };
  }

  if (targetType === "enemy" && target.owner === playerId) {
    return { valid: false, message: "Debes seleccionar un enemigo" };
  }

  return { valid: true };
};

/**
 * Get targets based on target type
 */
const getTargets = (game, playerId, targetType, sourcePos) => {
  const { board } = game;
  const targets = [];

  switch (targetType) {
    case "self":
      const selfUnit = board[sourcePos.r][sourcePos.c];
      if (selfUnit) targets.push({ target: selfUnit, pos: sourcePos });
      break;

    case "ally":
    case "enemy":
      const target = board[sourcePos.r][sourcePos.c];
      if (target) targets.push({ target, pos: sourcePos });
      break;

    case "allAllies":
      for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
          const unit = board[r][c];
          if (unit && unit.owner === playerId) {
            targets.push({ target: unit, pos: { r, c } });
          }
        }
      }
      break;

    case "allEnemies":
      for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
          const unit = board[r][c];
          if (unit && unit.owner !== playerId) {
            targets.push({ target: unit, pos: { r, c } });
          }
        }
      }
      break;

    case "tile":
      // For tile-based abilities, we'll handle in area effect
      break;
  }

  return targets;
};

/**
 * Get affected area for AoE abilities
 */
const getAffectedArea = (centerPos, areaSize) => {
  const positions = [];
  const radius = Math.floor(areaSize / 2);

  for (let r = centerPos.r - radius; r <= centerPos.r + radius; r++) {
    for (let c = centerPos.c - radius; c <= centerPos.c + radius; c++) {
      positions.push({ r, c });
    }
  }

  return positions;
};

module.exports = {
  executeActiveAbility,
  triggerPassiveAbilities,
  updateBuffDurations,
};
