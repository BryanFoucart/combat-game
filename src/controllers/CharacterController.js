import { Character } from "../models/Character.js";

const attributes = ["strength", "endurance", "dexterity", "luck"];

export class CharacterController {
  createCharacter(data) {
    const character = new Character({ ...data, xp: data.xp ?? 0 });
    this.applyAttributes(character, data);
    const pointsAvailable = 6 + (character.getLevel() - 1) * 2;
    const pointsAssigned = attributes.reduce(
      (total, attribute) =>
        total +
        character[`get${attribute[0].toUpperCase()}${attribute.slice(1)}`](),
      0,
    );
    if (!character.getName() || pointsAssigned !== pointsAvailable) {
      throw new RangeError(
        `A level ${character.getLevel()} character must assign exactly ${pointsAvailable} attribute points.`,
      );
    }
    return character;
  }

  restoreCharacter(data) {
    const character = new Character(data);
    character.setHP(data.hp);
    return character;
  }

  editCharacter(character, changes) {
    const updated = this.createCharacter({
      ...this.serializeCharacter(character),
      ...changes,
    });
    updated.setXP(character.getXP());
    return updated;
  }

  serializeCharacter(character) {
    return {
      name: character.getName(),
      level: character.getLevel(),
      xp: character.getXP(),
      hp: character.getHP(),
      strength: character.getStrength(),
      endurance: character.getEndurance(),
      dexterity: character.getDexterity(),
      luck: character.getLuck(),
      avatar: character.getAvatar(),
    };
  }

  createAI(player) {
    const level = player.getLevel();
    const totalPoints = 6 + (level - 1) * 2;
    const stats = { strength: 0, endurance: 0, dexterity: 0, luck: 0 };
    let remaining = totalPoints;

    while (remaining > 0) {
      const available = attributes.filter((attribute) => stats[attribute] < 10);
      const chosen = available[Math.floor(Math.random() * available.length)];
      stats[chosen] += 1;
      remaining -= 1;
    }

    const availableAvatars = Array.from(
      { length: 30 },
      (_, index) => `avatar_${index + 1}`,
    ).filter((avatar) => avatar !== player.getAvatar());
    const avatar =
      availableAvatars[Math.floor(Math.random() * availableAvatars.length)];

    return this.createCharacter({
      name: "Adversaire",
      level,
      xp: player.getXP(),
      avatar,
      ...stats,
    });
  }

  applyAttributes(character, data) {
    character.setStrength(data.strength);
    character.setDexterity(data.dexterity);
    character.setLuck(data.luck);
    character.setEndurance(data.endurance);
  }
}
