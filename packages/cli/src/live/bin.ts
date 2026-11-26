#!/usr/bin/env node
import { Effect, FileSystem } from "effect";
import { commands } from "../commands.js";
import { runCli } from "../registry.js";
import { nodeFileSystem } from "./fs.js";

const output = await Effect.runPromise(
  runCli(commands, process.argv.slice(2), { cwd: process.cwd() }).pipe(
    Effect.provideService(FileSystem.FileSystem, nodeFileSystem),
  ),
);
process.stdout.write(output.stdout);
process.stderr.write(output.stderr);
process.exitCode = output.exitCode;
