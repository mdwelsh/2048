import { Direction, GameState, InputManager, Actuator } from './game_manager.js';
import terminal from 'terminal-kit';
const { terminal: term } = terminal;

export function showGrid(grid: any) {
  const colors = {
    '2': '^G',
    '4': '^Y',
    '8': '^B',
    '16': '^C',
    '32': '^M',
    '64': '^R',
    '128': '^g',
    '256': '^y',
    '512': '^b',
    '1024': '^c',
    '2048': '^m',
  };

  const cells = [];
  for (let x = 0; x < grid.size; x++) {
    const row = [];
    for (let y = 0; y < grid.size; y++) {
      const tile = grid.cells[y][x];
      const value = tile ? tile.value.toString() : '';
      // @ts-ignore
      const color = colors[value] || '^K';
      const markup = `${color}${value}^:`;
      row.push(markup.padStart(8));
    }
    cells.push(row);
  }
  term.table(cells, {
    contentHasMarkup: true,
    borderChars: 'lightRounded',
    borderAttr: { color: 'blue' },
    width: 60,
    fit: true,
  });
}

export class TerminalInputManager extends InputManager {
  constructor() {
    super();

    term.grabInput(true);
    term.on('key', (name: any, matches: any, data: any) => {
      if (name === 'CTRL_C' || name === 'q') {
        term.grabInput(false);
        setTimeout(function () {
          process.exit();
        }, 100);
      } else if (name === 'UP') {
        this.emit('move', 0);
      } else if (name === 'RIGHT') {
        this.emit('move', 1);
      } else if (name === 'DOWN') {
        this.emit('move', 2);
      } else if (name === 'LEFT') {
        this.emit('move', 3);
      }
    });
  }
}

export class TerminalActuator extends Actuator {
  actuate(gameState: GameState, move?: Direction) {
    term.clear();
    term('Current score: ').green(gameState.score || '0')('\n');
    if (move !== undefined) {
      term('Move: ').yellow(move === 0 ? 'UP' : move === 1 ? 'RIGHT' : move === 2 ? 'DOWN' : 'LEFT')('\n');
    }
    showGrid(gameState.grid);
    if (gameState.over) {
      term.red('Game over!\n');
      term.grabInput(false);
      setTimeout(function () {
        process.exit();
      }, 100);
    }
  }
}
