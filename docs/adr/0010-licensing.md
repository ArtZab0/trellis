# ADR-0010: Licensing

Status: Accepted

- Everything in this repository is Apache-2.0 (`LICENSE`), except the control plane.
- The control plane (`apps/control-plane/`) is AGPL-3.0. Its own `LICENSE` file is added when that
  directory is created.
- Vendored third-party code keeps its license, recorded in `packages/stack-ts/vendor/LICENSES.md`
  (ADR-0015).
