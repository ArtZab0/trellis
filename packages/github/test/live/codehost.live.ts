import { githubCodeHost } from "../../src/index.js";
import { codeHostContract } from "../contract.js";

const repo = process.env["TRELLIS_SCRATCH_REPO"] ?? "";
const token = process.env["TRELLIS_SCRATCH_TOKEN"] ?? "";
if (repo === "" || token === "") {
  throw new Error(
    "Set TRELLIS_SCRATCH_REPO (owner/name) and TRELLIS_SCRATCH_TOKEN to run the live suite.",
  );
}

const appJwt = process.env["TRELLIS_APP_JWT"];
const host = () => githubCodeHost({ repo, token, ...(appJwt === undefined ? {} : { appJwt }) });

codeHostContract(`live GitHub (${repo})`, host, { appPermissions: appJwt !== undefined });
