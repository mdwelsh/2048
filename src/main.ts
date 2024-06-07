/**
 * This is a command-line utility to manage the set of Podcasts in the Podverse app.
 */

import { program } from 'commander';
import terminal from 'terminal-kit';
const { terminal: term } = terminal;

program.name('llm2048').version('0.0.1').description('LLM2048.');

program
  .command('hello')
  .description('Hello, world.')
  .action(async () => {
    term.blue('Hello, world!\n');
  });


program.parse(process.argv);
