import terminal from 'terminal-kit';
const { terminal: term } = terminal;
import { GameManager } from './game_manager.js';
import { TerminalInputManager, TerminalActuator } from './terminal.js';
import { LLMInputManager, LLMActuator, textGrid } from './llm.js';

export function Game(mode: 'interactive' | 'llm' = 'interactive') {
  let inputTokens = 0;
  let outputTokens = 0;

  term('Running game in mode ').green(mode)('\n');
  let mgr: GameManager | null = null;
  if (mode === 'interactive') {
    mgr = new GameManager(4, new TerminalInputManager(), new TerminalActuator());
  } else {
    mgr = new GameManager(4, new LLMInputManager(), new LLMActuator());
  }

  // Logging event handler.
  mgr.actuator.on('move', (move: any) => {
    console.log('MOVE IS: ', move.move);

    const maxTile = move.grid.cells.reduce((max: number, row: any) => {
      return Math.max(
        max,
        row.reduce((max: number, cell: any) => (cell ? Math.max(max, cell.value) : max), 0)
      );
    }, 0);

    term('Current score: ').green(move.score || '0');
    term(' Max tile: ').green(maxTile || '0');

    if ('inputTokens' in move) {
      term(' Tokens: ').yellow(move.inputTokens + move.outputTokens);
      term(' Cost: $').yellow(move.cost.toFixed(4));
    }
    if (move.over) {
      term.yellow(' over is true!');
    }
    if (move.won) {
      term.green(' won is true!');
    }
    console.log(textGrid(move.grid));
  });

  // Termination event handler.
  mgr.actuator.on('terminate', () => {
    term.red('Game over! Final score: ').green(mgr.score)('\n');
    term.grabInput(false);
    setTimeout(function () {
      process.exit();
    }, 100);
  });

  // Get things rolling.
  mgr.actuate();
}
