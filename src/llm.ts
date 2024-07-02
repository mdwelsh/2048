// Control flow works like this:
//
// GameManager instantiates the actuator and the input manager.
// GameManager tells the input manager that when a move event happens, to call back to the
//      GameManager's move function.
// GameManager calls actuator.actuate().
//
// Whenever GameManager.move() is called, it will call actuator.actuate() to update the UI.

// Some strategies to try:
//   * Give a more explicit description of the game and goals.
//   * Render the state of the game as, e.g., a JSON object instead of a table.
//   * Show the result of the four possible moves (pointing out that a new tile will be randomly added).
//   * Give some examples of moves to make in various situations.
//   * Have the LLM respond with both the move and a justification for it, on the premise that forcing
//     the model to "show its work" will yield a better result.
//   * Provide the state of the game and the resulting move for the last, say, 3 moves.
//   * Fine-tune a model on manually played games.

import { Direction, GameState, InputManager, Actuator } from './game_manager.js';
import terminal from 'terminal-kit';
const { terminal: term } = terminal;
import { EventEmitter } from 'node:events';
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

/** All the LLMInputManager does is forward the move event to the GameManager. */
export class LLMInputManager extends InputManager {
  constructor() {
    super();
    nextMove.on('move', (move) => {
      this.emit('move', move);
    });
  }
}

export class LLMActuator extends Actuator {
  inputTokens: number = 0;
  outputTokens: number = 0;

  cost() {
    return this.inputTokens * INPUT_TOKEN_COST + this.outputTokens * OUTPUT_TOKEN_COST;
  }

  actuate(gameState: GameState, move?: Direction) {
    // First emit the current move.
    this.emit('move', {
      move,
      ...gameState,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      cost: this.cost(),
    });

    // Quit if we're done.
    if (gameState.terminated) {
      this.emit('terminate');
    }

    // Get the next move and emit it through nextMove.
    this.getNextMove(gameState.grid).then((proposedMove) => {
      setTimeout(() => {
        nextMove.emit('move', proposedMove);
      }, 100);
    });
  }

  /** Ask the LLM for the next move. */
  private async getNextMove(grid: any): Promise<Direction> {
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
    return proposedMove as Direction;
  }
}
