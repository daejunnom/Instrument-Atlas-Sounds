# Instrument Atlas Sounds v0.1.0

Initial alpha release of Instrument Atlas Sounds, a playable, license-aware sound-source registry for Instrument Atlas instrument IDs.

## Included

- Sound source manifests for physical models, sample instruments, one-shots, and synth patches
- License-aware resolver for selecting compatible sound sources
- Policy files for client-safe, SaaS-safe, commercial-safe, permissive-only, CC0-only, and opt-in restricted workflows
- License group metadata for public-domain, permissive, attribution, copyleft, non-commercial, no-derivatives, and blocked sources
- Custom Karplus-Strong plucked-string prototype renderer
- Client/server boundary split for the Karplus-Strong prototype
- Runtime build artifacts under `sounds/v1/`
- Release package zip for application consumption
- CI validation, resolver examples, package generation, and license boundary checks

## Resolver highlights

The resolver can select compatible sound sources based on:

- Instrument Atlas instrument ID
- execution target
- source status
- license category
- license groups
- policy rules
- runtime readiness

The resolver also separates:

```txt
noticeReportRequired
attributionReportRequired
complianceReportRequired
```

This avoids confusing permissive-license notice preservation with CC-BY-style creator or output attribution.

## Notes

This is an early alpha release.

The repository does not vendor third-party engine source code or unverified audio assets. Third-party engines and optional sources are represented as metadata unless explicitly integrated later.

Default workflows are designed to remain conservative, auditable, and commercial-safe by default.

## Useful commands

```sh
npm run ci
npm run render:karplus
npm run resolve:saas
npm run check:resolver-output
```
