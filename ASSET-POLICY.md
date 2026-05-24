# Asset Policy

Instrument Atlas Sounds is a playable sound-source registry.

This repository prioritizes physical modeling engines and uses licensed sample-based sources only as fallbacks.

The goal is to make instrument sound sources discoverable, auditable, and usable by applications without mixing unknown-license audio into the project.

## Core rules

1. Every sound source must be linked to one or more Instrument Atlas instrument IDs.
2. Every sound source must declare its license.
3. Every sound source must declare whether it can run on the client, server, or both.
4. Physical modeling sources are preferred when available.
5. Sample-based sources are allowed only when their provenance and license are clear.
6. Unknown-license sources are not allowed.
7. Non-commercial or no-derivatives assets are blocked by default.
8. AGPL-based engines are blocked by default for SaaS use.
9. GPL engines may be listed only as server-only sources unless a consuming application explicitly allows them.
10. Audio files should not be committed unless their license and provenance are verified.

## Allowed source types

Allowed source types include:

- physical_model
- sample_instrument
- one_shot_sample
- synth_patch
- external_engine

## License categories

Sound sources should use one of the following license categories.

### public_domain

Examples:

- CC0-1.0
- Public Domain

Recommended use:

- Client-side execution
- Server-side execution
- Commercial projects
- Open datasets
- Sample fallbacks

### permissive_code

Examples:

- MIT
- BSD-2-Clause
- BSD-3-Clause
- Apache-2.0
- MIT-STK

Recommended use:

- Client-side execution
- Server-side execution
- Commercial projects
- Physical modeling engines
- DSP utilities

### weak_copyleft

Examples:

- LGPL-2.1-or-later
- LGPL-3.0
- MPL-2.0

Recommended use:

- Server-side execution
- Carefully separated components
- Cases where license obligations can be tracked

Not recommended for:

- Bundled browser code unless compliance is clearly handled

### server_only_copyleft

Examples:

- GPL-2.0
- GPL-3.0

Recommended use:

- Server-side execution only
- Isolated render workers
- Non-distributed internal services

Not recommended for:

- Browser bundles
- WASM shipped to users
- Electron apps
- Docker images distributed to users

### network_copyleft

Examples:

- AGPL-3.0

Default policy:

- Blocked by default.

AGPL sources should not be used in SaaS workflows unless the project explicitly decides to comply with AGPL network source obligations.

### restricted

Examples:

- CC-BY-NC
- CC-BY-ND
- proprietary
- unknown

Default policy:

- Blocked by default.

Restricted sources should not be used unless a consuming project has a separate legal basis for doing so.

## Client-side policy

Client-side execution means the code or asset may be delivered to a user's browser, app, or local runtime.

Client-side safe sources should generally be limited to:

- public_domain
- permissive_code

GPL, AGPL, unknown-license, non-commercial, and no-derivatives sources should not be client-side sources by default.

## Server-side policy

Server-side execution means the code runs only on infrastructure controlled by the application provider.

Server-side policies may allow:

- public_domain
- permissive_code
- weak_copyleft
- server_only_copyleft

Server-side policies should still block:

- network_copyleft by default
- restricted licenses
- unknown licenses
- sources with unclear provenance

## Sample policy

Sample-based sources must include:

- source name
- source URL
- license ID
- author or contributor when known
- verification date
- checksum when an audio file is mirrored or stored
- commercial-use status
- notice, creator attribution, and output attribution requirement status

Samples are allowed only when one of the following is true:

- The sample is CC0.
- The sample is public domain.
- The sample was created by project contributors.
- The sample has a license that clearly allows redistribution and commercial use.

Samples are not allowed when they are:

- Extracted from YouTube, games, films, anime, or commercial music.
- Taken from commercial sample packs without redistribution permission.
- Marked as non-commercial.
- Marked as no-derivatives.
- Missing clear license information.
- Uploaded without reliable provenance.

## Physical modeling policy

Physical modeling sources are preferred because they can generate sound without copying audio recordings.

Physical modeling sources must still declare:

- engine name
- engine type
- license
- execution target
- supported instrument IDs
- capabilities
- provenance
- integration status

A physical modeling source may be listed even before the engine is implemented, as long as its status is clearly marked.

Allowed statuses:

- planned
- experimental
- prototype
- production_candidate
- production

## GPL server-only policy

GPL engines may be listed as server-only sources when:

- They are not shipped to the browser.
- They are not bundled into client-side WASM.
- They are not distributed to users as binaries, apps, or Docker images.
- They run only as internal server workers.
- The consuming application explicitly allows server-only copyleft sources.

GPL sources must not include client execution targets by default.

## Takedown and correction policy

If a source has unclear or disputed rights:

1. Mark the source as disabled.
2. Remove it from default build outputs if needed.
3. Preserve a record in third-party notices or issue history.
4. Replace it with a verified source when available.

This project should prefer being conservative over including questionable sources.
