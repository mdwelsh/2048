/**
 * This is a command-line utility to manage the set of Podcasts in the Podverse app.
 */

import { program } from 'commander';
import terminal from 'terminal-kit';
const { terminal: term } = terminal;
import { Game } from './game.js';

program.name('llm2048').version('0.0.1').description('LLM2048.');

program
  .command('run [mode]')
  .description('Run the game.')
  .action(async (mode: 'interactive' | 'llm') => {
    Game(mode);
  });

program.parse(process.argv);
