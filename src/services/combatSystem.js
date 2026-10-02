const matchupWinners = {
  poing: { poing: "draw", pied: "opponent", energie: "player" },
  pied: { poing: "player", pied: "draw", energie: "opponent" },
  energie: { poing: "opponent", pied: "player", energie: "draw" },
};

function calculateDamage(attacker, defender, random = Math.random) {
  const base = 10;
  const strength = attacker.getStrength();
  const endurance = defender.getEndurance();
  const dexterity = defender.getDexterity();

  if (dexterity > 0) {
    const dodgeRoll = Math.floor(random() * 100) + 1;
    if (dexterity * 2 >= dodgeRoll) {
      return {
        amount: 0,
        details: {
          base,
          strength,
          endurance,
          dexterity,
          damage: 0,
          dodged: true,
          critical: false,
        },
      };
    }
  }

  const rawDamage = base + strength * 2;
  const critical =
    attacker.getLuck() > 0 &&
    Math.floor(random() * 100) + 1 <= attacker.getLuck() * 2;
  const damageBeforeEndurance = critical
    ? Math.floor(rawDamage * 1.5)
    : rawDamage;
  const amount = Math.max(0, damageBeforeEndurance - endurance);

  return {
    amount,
    details: {
      base,
      strength,
      endurance,
      dexterity,
      damage: amount,
      dodged: false,
      critical,
    },
  };
}

export function resolveCombat(player, opponent, random = Math.random) {
  const playerAction = player.getAction();
  const opponentAction = opponent.getAction();
  const winner = matchupWinners[playerAction]?.[opponentAction] ?? "draw";

  if (winner === "draw") {
    return {
      damageToPlayer: 0,
      damageToOpponent: 0,
      winner: "draw",
      message: "Même attaque : aucun dégât.",
      damageDetails: null,
    };
  }

  if (winner === "player") {
    const result = calculateDamage(player, opponent, random);
    return {
      damageToPlayer: 0,
      damageToOpponent: result.amount,
      winner: "player",
      damageDetails: result.details,
      message: result.amount
        ? `${player.getName()} touche et inflige ${result.amount} dégâts.${result.details.critical ? " Coup critique !" : ""}`
        : `${opponent.getName()} esquive l’attaque !`,
    };
  }

  const result = calculateDamage(opponent, player, random);
  return {
    damageToPlayer: result.amount,
    damageToOpponent: 0,
    winner: "opponent",
    damageDetails: result.details,
    message: result.amount
      ? `${opponent.getName()} touche et inflige ${result.amount} dégâts.${result.details.critical ? " Coup critique !" : ""}`
      : `${player.getName()} esquive l’attaque !`,
  };
}
