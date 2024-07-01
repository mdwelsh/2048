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

export class TerminalInputManager {
  events: any;

  constructor() {
    this.events = {};
    this.listen();
  }

  on(event: any, callback: any) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event: any, data: any) {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach((callback: any) => {
        callback(data);
      });
    }
  }

  listen() {
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

export class TerminalActuator {
  continueGame() {
    // Do nothing.
  }

  actuate(
    grid: any,
    {
      score,
      over,
      won,
      bestScore,
      terminated,
    }: { score: number; over: boolean; won: boolean; bestScore: number; terminated: boolean }
  ) {
    term.clear();
    term('Current score: ').green(score || '0')('\n');
    showGrid(grid);
    if (over) {
      term.red('Game over!\n');
      term.grabInput(false);
      setTimeout(function () {
        process.exit();
      }, 100);
    }
    //grid.eachCell((x: any, y: any, tile: any) => {
    //  term(`x: ${x}, y: ${y}, tile: ${tile?.value}\n`);
    //});
  }
}
