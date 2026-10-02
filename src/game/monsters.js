import { fallbackAvatarUrl } from "./avatar.js";

const monsterAssets = import.meta.glob(
  "../assets/monsters/*.{webp,png,jpg,jpeg}",
  { eager: true, import: "default", query: "?url" },
);

const monsterUrls = Object.fromEntries(
  Object.entries(monsterAssets).map(([path, url]) => [
    path
      .split("/")
      .at(-1)
      .replace(/\.[^.]+$/, ""),
    url,
  ]),
);

export function chooseMonsterAvatar(excludedName, random = Math.random) {
  const availableNames = Object.keys(monsterUrls).filter(
    (name) => name !== excludedName,
  );

  if (availableNames.length === 0) return "monster_fallback";
  return availableNames[Math.floor(random() * availableNames.length)];
}

export function monsterAvatarUrl(name) {
  return monsterUrls[name] || fallbackAvatarUrl(6, "fight");
}
