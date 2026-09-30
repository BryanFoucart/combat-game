# Fight Club

Application de combat au tour par tour développée avec Vue 3 et Vite. L’interface est en Vue ; le modèle, le contrôleur et les règles de combat sont écrits en JavaScript simple.

## Lancer le projet

```sh
npm install
npm run dev
```

Pour vérifier le build de production : `npm run build`.

## Organisation

- `src/models/Character.js` : personnage et accesseurs ; le niveau dépend de l’XP et les PV maximum de l’endurance.
- `src/controllers/CharacterController.js` : création, édition, restauration et génération de l’IA.
- `src/services/combatSystem.js` : comparaison des actions, esquive et calcul des dégâts.
- `src/App.vue` : accueil, consentement, création/profil et arène.
- `src/components/CharacterCard.vue` : fiche de combattant réutilisée dans l’arène.

## Règles

Un personnage de niveau 1 répartit 6 points entre quatre attributs, puis gagne 2 points par niveau. Chaque attribut est plafonné à 10 et le niveau à 10. Les niveaux suivants commencent à 101, 201, 301 XP, etc. L’IA partage le niveau du joueur, reçoit le budget d’attributs correspondant et un avatar différent.

Poing bat Énergie, Pied bat Poing et Énergie bat Pied. Une attaque gagnante inflige `(10 + Force × 2) × (1 - Endurance de la cible / 100)` dégâts, arrondis à l’entier. Chaque point de chance donne 2 % de chance d’annuler une attaque reçue. Une victoire rapporte 25 XP ; une défaite, 10 XP.

Le choix de consentement est conservé dans `localStorage` sous `CookieAllows` (`yes` ou `no`). `yes` restaure le personnage et masque la demande lors des prochaines visites. `no` redemande l’autorisation à la visite suivante et ne conserve pas le personnage.

## Avatars WEBP

Place deux découpes par personnage, avec les mêmes numéros dans chaque dossier :

- Profil : `src/assets/avatars/profil/avatar_1.webp` à `avatar_30.webp`, en **720 × 900 px (4:5)**. Cette image remplit le grand cadre du profil.
- Combat : `src/assets/avatars/fight/avatar_1.webp` à `avatar_30.webp`, en **960 × 600 px (8:5)**. Cette découpe paysage remplit le cadre des cartes de combat.

Vite intègre les deux familles au build. Chaque vue sélectionne sa propre découpe selon le numéro d’avatar du personnage. Si un fichier manque, un portrait généré est affiché en secours.
