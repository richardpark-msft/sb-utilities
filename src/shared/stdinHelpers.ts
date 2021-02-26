import { EOL } from "os";
import { createInterface } from "readline";

export function readFromStdinAndExecute(mode: "perLine" | "onceAtEnd", fn: (text: string) => void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const readlineInterface = createInterface({
      input: process.stdin,
      output: process.stdin.isTTY ? process.stdout : undefined,
      terminal: process.stdin.isTTY,
    });

    const lines: string[] = [];

    readlineInterface.on('line', (line) => {
      try {
        if (mode === "perLine") {
          fn(line);
        } else {
          lines.push(line);
        }
      } catch (err) {
        readlineInterface.close();
        reject(err);
      }
    });

    readlineInterface.on('close', () => {
      try {
        if (mode === "onceAtEnd") {
          fn(lines.join(EOL));
        }

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}