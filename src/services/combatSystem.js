const matchupWinners = {
  poing: { poing: "draw", pied: "opponent", energie: "player" },
  pied: { poing: "player", pied: "draw", energie: "opponent" },
  energie: { poing: "opponent", pied: "player", energie: "draw" },
};

function calculateDamage(attacker, defender, random = Math.random) {
  const base = 10;
  const strength = attacker.getStrength();
  const endurance = defender.getEndurance();
  const calculated = Math.max(
    1,
    Math.round((base + strength * 2) * (1 - endurance / 100)),
  );
  if (defender.getLuck() > 0) {
    const dodgeRoll = Math.floor(random() * 100) + 1;
    if (defender.getLuck() * 2 >= dodgeRoll) {
      return {
        amount: 0,
        details: { base, strength, endurance, damage: 0, dodged: true },
      };
    }
  }

  return {
    amount: calculated,
    details: { base, strength, endurance, damage: calculated, dodged: false },
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
        ? `${player.getName()} touche et inflige ${result.amount} dégâts.`
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
      ? `${opponent.getName()} touche et inflige ${result.amount} dégâts.`
      : `${player.getName()} esquive l’attaque !`,
  };
}
