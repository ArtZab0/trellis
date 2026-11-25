# Handoff package: missing files

Found while organizing the repo on 2026-11-25. The package arrived flat, with the files saved
under the wrong names. Each file was moved to the path its heading names. These files are
referenced but were not in the package. A human needs to supply them:

- `docs/ARCHITECTURE.md`: rings, packages, dependency rules, determinism boundary (referenced by `HANDOFF.md` and `AGENTS.md`)
- `docs/adr/0003-llms-propose-checkers-decide.md`
- `docs/adr/0011-independent-checks.md`
- `docs/adr/0012-differential-testing.md`
- `docs/adr/0016-area-agents-and-measurement.md`

Inferred names to confirm: `docs/adr/0007-traceability.md`, `docs/components/01-schema-core-cli.md`,
`docs/components/06-dst-mutation-perf.md` and `docs/components/09-orchestrator.md`. The package
had no filenames for these, so they were named from their headings.
