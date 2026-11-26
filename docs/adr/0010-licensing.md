# ADR-0010: Licensing

Status: Accepted

- `packages/*`, `packs/*`, CLI, GitHub App, CI workflows: **Apache-2.0** (maximize adoption; people plug in their own agents).
- `apps/control-plane`: **AGPL-3.0** for self-hosting, with the hosted/managed service as the commercial offering. Its own `LICENSE` file is added when that directory gets code.
- Spec packs contributed by the community: Apache-2.0.
- Vendored third-party code keeps its license, recorded in `packages/stack-ts/vendor/LICENSES.md` (ADR-0015).
