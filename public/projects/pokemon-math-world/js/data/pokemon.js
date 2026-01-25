// Pokemon data with stats
export const POKEMON = {
  // Starters
  bulbasaur: { id: 1, name: 'Bulbasaur', type: 'grass', hp: 45, atk: 8 },
  charmander: { id: 4, name: 'Charmander', type: 'fire', hp: 39, atk: 9 },
  squirtle: { id: 7, name: 'Squirtle', type: 'water', hp: 44, atk: 8 },
  // Common
  pikachu: { id: 25, name: 'Pikachu', type: 'electric', hp: 35, atk: 10 },
  rattata: { id: 19, name: 'Rattata', type: 'normal', hp: 30, atk: 6 },
  pidgey: { id: 16, name: 'Pidgey', type: 'flying', hp: 35, atk: 6 },
  caterpie: { id: 10, name: 'Caterpie', type: 'bug', hp: 30, atk: 5 },
  weedle: { id: 13, name: 'Weedle', type: 'bug', hp: 30, atk: 5 },
  oddish: { id: 43, name: 'Oddish', type: 'grass', hp: 40, atk: 7 },
  meowth: { id: 52, name: 'Meowth', type: 'normal', hp: 38, atk: 8 },
  psyduck: { id: 54, name: 'Psyduck', type: 'water', hp: 45, atk: 8 },
  geodude: { id: 74, name: 'Geodude', type: 'rock', hp: 40, atk: 10 },
  zubat: { id: 41, name: 'Zubat', type: 'flying', hp: 35, atk: 7 },
  machop: { id: 66, name: 'Machop', type: 'fighting', hp: 45, atk: 11 },
  eevee: { id: 133, name: 'Eevee', type: 'normal', hp: 50, atk: 9 },
  jigglypuff: { id: 39, name: 'Jigglypuff', type: 'fairy', hp: 50, atk: 6 },
  clefairy: { id: 35, name: 'Clefairy', type: 'fairy', hp: 48, atk: 7 },
  abra: { id: 63, name: 'Abra', type: 'psychic', hp: 25, atk: 8 },
  gastly: { id: 92, name: 'Gastly', type: 'ghost', hp: 30, atk: 12 },
  magikarp: { id: 129, name: 'Magikarp', type: 'water', hp: 20, atk: 2 },
  dratini: { id: 147, name: 'Dratini', type: 'dragon', hp: 41, atk: 10 },
  // Gym Pokemon
  onix: { id: 95, name: 'Onix', type: 'rock', hp: 60, atk: 12 },
  staryu: { id: 120, name: 'Staryu', type: 'water', hp: 55, atk: 10 },
  raichu: { id: 26, name: 'Raichu', type: 'electric', hp: 60, atk: 14 },
  // Elite/Champion Pokemon
  lapras: { id: 131, name: 'Lapras', type: 'water', hp: 70, atk: 12 },
  machamp: { id: 68, name: 'Machamp', type: 'fighting', hp: 65, atk: 16 },
  dragonite: { id: 149, name: 'Dragonite', type: 'dragon', hp: 80, atk: 18 },
  gyarados: { id: 130, name: 'Gyarados', type: 'water', hp: 75, atk: 17 },
  alakazam: { id: 65, name: 'Alakazam', type: 'psychic', hp: 55, atk: 15 },
  gengar: { id: 94, name: 'Gengar', type: 'ghost', hp: 60, atk: 16 },
  // Legendary
  articuno: { id: 144, name: 'Articuno', type: 'ice', hp: 90, atk: 15 },
  zapdos: { id: 145, name: 'Zapdos', type: 'electric', hp: 90, atk: 16 },
  moltres: { id: 146, name: 'Moltres', type: 'fire', hp: 90, atk: 17 },
  mewtwo: { id: 150, name: 'Mewtwo', type: 'psychic', hp: 100, atk: 20 },
  mew: { id: 151, name: 'Mew', type: 'psychic', hp: 100, atk: 18 }
};

export const TYPE_COLORS = {
  grass: '#78C850', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  normal: '#A8A878', flying: '#A890F0', bug: '#A8B820', rock: '#B8A038',
  fairy: '#EE99AC', fighting: '#C03028', psychic: '#F85888', ghost: '#705898',
  dragon: '#7038F8', ice: '#98D8D8'
};

export const STARTERS = ['bulbasaur', 'charmander', 'squirtle'];

export function getPokemonSprite(id, back = false) {
  const type = back ? 'back/' : '';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${type}${id}.png`;
}
