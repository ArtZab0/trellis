/** Flags as given on the command line: `--name value`, `--name=value`, or a bare `--name`. */
export type Flags = Readonly<Record<string, string | boolean>>;

/** A command line split into the command, its positional arguments and its flags. */
export interface Argv {
  readonly command: string | undefined;
  readonly positionals: ReadonlyArray<string>;
  readonly flags: Flags;
}

const isFlag = (token: string | undefined): boolean => token?.startsWith("--") ?? false;

/** Splits argv (without the node and script entries). A flag takes the next token unless it is a flag. */
export const parseArgv = (argv: ReadonlyArray<string>): Argv => {
  const positionals: Array<string> = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i] ?? "";
    if (!isFlag(token)) {
      positionals.push(token);
      continue;
    }
    const body = token.slice(2);
    const eq = body.indexOf("=");
    if (eq >= 0) {
      flags[body.slice(0, eq)] = body.slice(eq + 1);
    } else if (i + 1 < argv.length && !isFlag(argv[i + 1])) {
      flags[body] = argv[i + 1] ?? "";
      i += 1;
    } else {
      flags[body] = true;
    }
  }
  const [command, ...rest] = positionals;
  return { command, positionals: rest, flags };
};
