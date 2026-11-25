# ADR-0005: Evidence storage and certificate signing

Status: Accepted

## Decision
- Artifacts are content-addressed (`sha256:`) in an S3-compatible store; manifests reference digests only.
- Certificates and gate reports are signed with Sigstore keyless signing using the CI's OIDC identity, stored as DSSE envelopes (in-toto attestation format) next to the JSON.
- The policy engine verifies the signature and the signer identity (the Trellis gate workflow on the protected branch) before trusting a certificate.
- Build artifacts additionally get SLSA provenance via the standard GitHub attestation action.
