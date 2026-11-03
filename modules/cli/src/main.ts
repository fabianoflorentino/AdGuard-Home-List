import { runCli } from './cli';

async function main(): Promise<void> {
  try {
    await runCli(process.argv.slice(2));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`ERROR: ${error.message}`);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  }
}

void main();
