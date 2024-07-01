// @ts-ignore
import { GameManager } from '../lib/game_manager.js';
import { TerminalInputManager, TerminalActuator } from './terminal.js';
import { LLMInputManager, LLMActuator } from './llm.js';

class DummyStorageManager {
  getBestScore() {
    return 0;
  }

  setBestScore(score: any) {
    // Do nothing.
  }

  clearGameState() {
    // Do nothing.
  }

  getGameState() {
    return null;
  }

  setGameState(gameState: any) {
    // Do nothing.
  }
}

export function Game(mode: 'interactive' | 'llm' = 'interactive') {
  if (mode === 'interactive') {
    const mgr = new GameManager(4, TerminalInputManager, TerminalActuator, DummyStorageManager);
  } else {
    const mgr = new GameManager(4, LLMInputManager, LLMActuator, DummyStorageManager);
  }
}
