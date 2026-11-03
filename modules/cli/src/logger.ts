export class Logger {
  public info(message: string): void {
    console.log(message);
  }

  public warn(message: string): void {
    console.warn(`WARN: ${message}`);
  }

  public error(message: string, error?: unknown): void {
    console.error(`ERROR: ${message}`);

    if (error !== undefined) {
      console.error(error);
    }
  }
}
