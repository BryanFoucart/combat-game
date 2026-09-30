export class Character {
  constructor({
    name = "",
    level = 1,
    xp = 0,
    hp,
    strength = 0,
    endurance = 0,
    dexterity = 0,
    luck = 0,
    avatar = "avatar_1",
    action = "",
  } = {}) {
    this.name = name;
    this.xp = xp;
    this.level = level;
    this.strength = strength;
    this.endurance = endurance;
    this.dexterity = dexterity;
    this.luck = luck;
    this.avatar = avatar;
    this.action = action;
    this.hp = hp ?? this.getMaxHP();
    this.setXP(xp);
  }

  getName() {
    return this.name;
  }
  setName(value) {
    this.name = String(value).trim();
  }
  getLevel() {
    return this.level;
  }
  setLevel(value) {
    this.level = Math.min(10, Math.max(1, Number(value) || 1));
  }
  getXP() {
    return this.xp;
  }
  setXP(value) {
    this.xp = Math.max(0, Number(value) || 0);
    this.setLevel(Math.min(10, Math.floor(Math.max(0, this.xp - 1) / 100) + 1));
  }
  getHP() {
    return this.hp;
  }
  setHP(value) {
    this.hp = Math.min(this.getMaxHP(), Math.max(0, Number(value) || 0));
  }
  getMaxHP() {
    return 50 + this.endurance * 10;
  }
  getStrength() {
    return this.strength;
  }
  setStrength(value) {
    this.strength = Math.min(10, Math.max(0, Math.floor(Number(value) || 0)));
  }
  getEndurance() {
    return this.endurance;
  }
  setEndurance(value) {
    this.endurance = Math.min(10, Math.max(0, Math.floor(Number(value) || 0)));
    this.setHP(this.getMaxHP());
  }
  getDexterity() {
    return this.dexterity;
  }
  setDexterity(value) {
    this.dexterity = Math.min(10, Math.max(0, Math.floor(Number(value) || 0)));
  }
  getLuck() {
    return this.luck;
  }
  setLuck(value) {
    this.luck = Math.min(10, Math.max(0, Math.floor(Number(value) || 0)));
  }
  getAvatar() {
    return this.avatar;
  }
  setAvatar(value) {
    this.avatar = String(value || "avatar_1");
  }
  getAction() {
    return this.action;
  }
  setAction(value) {
    this.action = String(value || "");
  }
}
