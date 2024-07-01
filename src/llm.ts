// Control flow works like this:
//
// GameManager instantiates the actuator and the input manager.
// GameManager tells the input manager that when a move event happens, to call back to the
//      GameManager's move function.
// GameManager calls actuator.actuate().
//
// Whenever GameManager.move() is called, it will call actuator.actuate() to update the UI.

import terminal from 'terminal-kit';
const { terminal: term } = terminal;
import { EventEmitter } from 'node:events';
import { showGrid } from './terminal.js';
import OpenAI from 'openai';

// These values are in USD for GPT-4o.
const INPUT_TOKEN_COST = 5.0 / 1e6;
const OUTPUT_TOKEN_COST = 15.0 / 1e6;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI assistant that plays the game 2048. The goal of this game is to
    combine the numeric tiles in a 4x4 grid to create a tile with the value 2048. Your output
    should consist of one of the following values: 0 (up), 1 (right), 2 (down), or 3 (left).
    You should ONLY output a single number (0, 1, 2, or 3) to indicate the direction in which
    to move, with no other text or explanation for your move. You should not output any other
    information or text.`;

class NextMoveEmitter extends EventEmitter {
  constructor() {
    super();
  }
}

const nextMove = new NextMoveEmitter();

export function textGrid(grid: any): string {
  const rows = [];
  for (let x = 0; x < grid.size; x++) {
    const row = [];
    for (let y = 0; y < grid.size; y++) {
      const tile = grid.cells[y][x];
      const value = tile ? tile.value.toString() : '';
      const markup = `${value}`;
      row.push(markup.padStart(6) + (y === grid.size - 1 ? '' : ''));
    }
    rows.push(' '.repeat(4) + '|' + row.join(' |') + '  |');
  }
  const rowSeparator = ' '.repeat(4) + '+' + '--------'.repeat(grid.size) + '+';
  return '\n' + rowSeparator + '\n' + rows.join('\n' + rowSeparator + '\n') + '\n' + rowSeparator;
}

export class LLMInputManager extends EventEmitter {
  constructor() {
    super();
    this.listen();
  }
  listen() {
    nextMove.on('move', (move) => {
      term('Move: ').yellow(move === 0 ? 'up' : move === 1 ? 'right' : move === 2 ? 'down' : 'left')('\n');
      this.emit('move', move);
    });
  }
}

export class LLMActuator {
  inputTokens: number = 0;
  outputTokens: number = 0;

  cost() {
    return this.inputTokens * INPUT_TOKEN_COST + this.outputTokens * OUTPUT_TOKEN_COST;
  }

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
    const maxTile = grid.cells.reduce((max: number, row: any) => {
      return Math.max(
        max,
        row.reduce((max: number, cell: any) => (cell ? Math.max(max, cell.value) : max), 0)
      );
    }, 0);

    term('Current score: ').green(score || '0');
    term(' Max tile: ').green(maxTile || '0');
    term(' Tokens: ').yellow(this.inputTokens + this.outputTokens);
    term(' Cost: $').yellow(this.cost().toFixed(4));
    if (over) {
      term.yellow(' over is true!');
    }
    if (won) {
      term.green(' won is true!');
    }
    console.log(textGrid(grid));

    if (terminated) {
      term.red('Game over! Final score: ' + score + '\n');
      term.grabInput(false);
      setTimeout(function () {
        process.exit();
      }, 100);
    }

    const move = this.getNextMove(grid).then((move) => {
      setTimeout(() => {
        nextMove.emit('move', move);
      }, 100);
    });
  }

  private async getNextMove(grid: any) {
    const systemPrompt = SYSTEM_PROMPT + '\n\n' + 'The current state of the game board is:\n' + textGrid(grid) + '\n';

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: 'What should my next move be?',
      },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: false,
      // @ts-ignore
      messages,
    });
    //console.log('Response:', JSON.stringify(response, null, 2));
    this.inputTokens += response.usage?.prompt_tokens ?? 0;
    this.outputTokens += response.usage?.completion_tokens ?? 0;

    const proposedMove = parseInt(response.choices[0].message.content ?? '0');
    return proposedMove;
  }
}
