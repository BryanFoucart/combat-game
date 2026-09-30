const palettes = [
  ["#e6ab83", "#252b35", "#c74e3b"],
  ["#bf7958", "#24252b", "#d49b42"],
  ["#f0c6a3", "#573d38", "#527c73"],
  ["#9d604d", "#1f2931", "#d27d53"],
  ["#dba987", "#45394d", "#6989a0"],
  ["#ac7255", "#343c31", "#cfb15e"],
];

const avatarAssets = {
  profil: import.meta.glob("../assets/avatars/profil/avatar_*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  fight: import.meta.glob("../assets/avatars/fight/avatar_*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
};

function avatarIndex(number) {
  return (((Math.floor(Number(number) || 1) - 1) % 30) + 30) % 30;
}

export function avatarUrl(number = 1, type = "profil") {
  const folder = type === "fight" ? "fight" : "profil";
  const path = `../assets/avatars/${folder}/avatar_${avatarIndex(number) + 1}.webp`;
  return avatarAssets[folder][path] || fallbackAvatarUrl(number, folder);
}

export function fallbackAvatarUrl(number = 1, _type = "profil") {
  const index = avatarIndex(number);
  const [skin, hair, shirt] = palettes[index % palettes.length];
  const variant = Math.floor(index / palettes.length);
  const hairStyle =
    variant % 2
      ? "M31 49c0-21 10-33 29-33 18 0 29 13 28 33l-8-8-5-12c-12 9-26 13-44 14z"
      : "M29 50c-2-22 10-36 31-36 22 0 33 16 29 39l-9-8-2-12c-12 8-27 12-48 12z";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 220"><rect width="180" height="220" fill="#dedbd2"/><path d="M0 178 44 125h92l44 53v42H0z" fill="#c9c3b8"/><ellipse cx="90" cy="210" rx="58" ry="50" fill="${shirt}"/><path d="M60 126h60v45H60z" fill="${skin}"/><ellipse cx="90" cy="82" rx="36" ry="46" fill="${skin}"/><path d="${hairStyle}" fill="${hair}"/><path d="M69 81h10m22 0h10" stroke="#292a2d" stroke-width="5" stroke-linecap="round"/><path d="M81 103q9 7 18 0" fill="none" stroke="#8a4e42" stroke-width="3" stroke-linecap="round"/><path d="m37 191 53-23 53 23" fill="none" stroke="#f2e9d8" stroke-opacity=".55" stroke-width="4"/><text x="14" y="25" fill="#353536" font-family="monospace" font-size="10" letter-spacing="2">FC / ${String(index + 1).padStart(2, "0")}</text><circle cx="90" cy="83" r="72" fill="none" stroke="#353536" stroke-opacity=".18"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
