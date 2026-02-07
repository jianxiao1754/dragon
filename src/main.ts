import './style.css'
import { Game } from './game/Game'

window.addEventListener('load', () => {
  const game = new Game('gameCanvas');
  game.start();
});
