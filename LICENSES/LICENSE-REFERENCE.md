# License Reference

This document is a practical license reference for Instrument Atlas Sounds.

It explains how this project classifies licenses for source manifests, optional source registries, generated indexes, and consuming applications.

This document is not legal advice. It is not a substitute for the full license text. Consuming applications are responsible for final license compliance.

## Project default

The repository's own code and tooling are licensed under the root `LICENSE` file unless another file states otherwise.

Current project default:

```txt
MIT
```

Third-party engines, third-party assets, optional sources, sample libraries, and sound sources retain their original licenses.

A source being listed in this repository does not automatically mean that the source is vendored, mirrored, downloaded, redistributed, or safe for every use case.

## License metadata model

Instrument Atlas Sounds should preserve exact license metadata whenever possible.

Recommended fields:

```txt
license.id
license.family
license.category
license.restrictions
license.commercialUse
license.derivativesAllowed
license.redistributionAllowed
license.attributionRequired
license.noticeRequired
license.shareAlikeRequired
license.sourceDisclosureRequired
license.networkSourceDisclosureRequired
license.clientDistributionAllowed
license.serverUseAllowed
```

Policy groups may simplify decisions, but exact license IDs should remain available for auditability.

## Default safety rule

The default clone, install, build, package, and release workflow should remain commercial-safe and conservative.

Default workflows must not include:

```txt
optional downloaded engines
optional downloaded samples
GPL source code
AGPL source code
non-commercial assets
no-derivatives assets
proprietary assets
unknown-license assets
unverified audio files
```

Optional or restricted sources may be described as metadata, but actual source files and assets must require explicit opt-in before download or use.

## License families

Recommended license families:

```txt
public_domain
permissive
commercial_attribution
commercial_sharealike
weak_copyleft
strong_copyleft
network_copyleft
noncommercial
no_derivatives
proprietary
unknown
```

## Public domain and CC0

Examples:

```txt
CC0-1.0
Public-Domain
```

Project default:

```txt
allow in core when provenance is clear
allow in commercial-safe workflows
allow in client-safe workflows
allow in server-safe workflows
```

Typical requirements:

```txt
verify provenance
preserve source record
keep checksum when mirroring assets
```

Notes:

```txt
CC0 and public-domain-style sources are preferred for sample fallback assets.
They still need provenance and checksum metadata when mirrored or packaged.
```

## MIT, BSD, ISC, and Zlib

Examples:

```txt
MIT
BSD-2-Clause
BSD-3-Clause
ISC
Zlib
MIT-STK
```

Project default:

```txt
allow in core when provenance is clear
allow in commercial-safe workflows
allow in client-safe workflows
allow in server-safe workflows
```

Typical requirements:

```txt
preserve license notice
preserve copyright notice
track upstream source
track local modifications when vendored
```

Notes:

```txt
These licenses are generally treated as permissive code licenses.
They are not no-obligation licenses. Notices still matter.
```

## Apache-2.0

Example:

```txt
Apache-2.0
```

Project default:

```txt
allow in commercial-safe workflows
allow in client-safe workflows when notice handling is implemented
allow in server-safe workflows
```

Typical requirements:

```txt
preserve license text
preserve copyright notices
preserve NOTICE file when present
track modifications when vendored
```

Notes:

```txt
Apache-2.0 is permissive, but it should not be treated as identical to MIT.
If NOTICE files are present upstream, the project should preserve them.
```

## CC-BY

Examples:

```txt
CC-BY-4.0
```

Project default:

```txt
allow only when attribution handling is implemented
exclude from no-attribution workflows
allow in commercial-safe-with-attribution workflows
```

Typical requirements:

```txt
provide attribution
preserve source URL
preserve author or creator name when known
preserve license ID
preserve modification notes when required
generate attribution report for consuming applications
```

Notes:

```txt
CC-BY may be suitable for some sample or asset workflows, but attribution must not be lost.
```

## CC-BY-SA

Examples:

```txt
CC-BY-SA-4.0
```

Project default:

```txt
opt-in only
exclude from default commercial-safe workflows
exclude from no-attribution workflows
```

Typical requirements:

```txt
provide attribution
track source URL
track creator
track license ID
track ShareAlike obligations
review derivative and adapted-material workflows
```

Notes:

```txt
ShareAlike sources can create downstream license obligations.
They should not be used in default generation, remix, or distribution workflows unless the consuming application explicitly supports those obligations.
```

## CC-BY-NC

Examples:

```txt
CC-BY-NC-4.0
CC-BY-NC-SA-4.0
CC-BY-NC-ND-4.0
```

Project default:

```txt
opt-in only
exclude from commercial-safe workflows
exclude from paid SaaS workflows
exclude from monetized content workflows
exclude from default release packages
```

Typical requirements:

```txt
provide attribution
block commercial use
mark as noncommercial
require explicit consent before optional download
```

Notes:

```txt
Non-commercial sources are not suitable for users who need commercial-safe output.
```

## CC-BY-ND

Examples:

```txt
CC-BY-ND-4.0
CC-BY-NC-ND-4.0
```

Project default:

```txt
opt-in only
exclude from editing workflows
exclude from remix workflows
exclude from pitch-shift workflows
exclude from time-stretch workflows
exclude from sample-mapping workflows
exclude from generated-output workflows by default
```

Typical requirements:

```txt
provide attribution
preserve original work
block derivative-producing use cases
require explicit consent before optional download
```

Notes:

```txt
No-derivatives sources are especially risky for audio generation, sampling, DAW editing, and transformation workflows.
They may only be considered when the consuming application preserves the original work without creating derivatives.
```

## MPL and LGPL

Examples:

```txt
MPL-2.0
LGPL-2.1-or-later
LGPL-3.0-or-later
```

Project default:

```txt
optional
exclude from client-safe workflows by default
allow only with explicit integration review
prefer server-side or clearly separated integration
```

Typical requirements:

```txt
preserve notices
track source code availability obligations
track modifications
avoid accidental client bundling
```

Notes:

```txt
Weak copyleft sources may be usable in some projects, but the integration model matters.
```

## GPL

Examples:

```txt
GPL-2.0-only
GPL-2.0-or-later
GPL-3.0-only
GPL-3.0-or-later
```

Project default:

```txt
optional only
server-only by default
exclude from client-safe workflows
exclude from default release packages
exclude from browser, WASM, Electron, and client-distributed bundles by default
```

Typical requirements:

```txt
preserve license text
provide corresponding source when required
avoid linking or bundling into client-distributed code unless compliance is handled
require explicit consent before optional download
```

Notes:

```txt
GPL sources may be referenced as optional server-side candidates, but they must not be included in the default package.
```

## AGPL

Examples:

```txt
AGPL-3.0-only
AGPL-3.0-or-later
```

Project default:

```txt
blocked by default
optional only with strong warning
exclude from saas-safe workflows by default
exclude from default release packages
exclude from client-safe workflows
```

Typical requirements:

```txt
preserve license text
track source disclosure obligations
track network source disclosure obligations
require explicit consent before optional download
require project-level review before server use
```

Notes:

```txt
AGPL sources are especially sensitive for network services and SaaS workflows.
Do not enable them by default.
```

## Proprietary, unknown, disputed, or unverified

Examples:

```txt
proprietary
unknown
disputed
unverified
```

Project default:

```txt
blocked
not fetchable by default
not packageable by default
not usable by default
```

Typical requirements:

```txt
do not mirror
do not redistribute
do not expose as runtime-usable
mark as disabled metadata only when tracking is necessary
```

Notes:

```txt
If rights are unclear, block the source.
This project should prefer false negatives over unsafe inclusion.
```

## Quick policy table

| License group | Core default | Commercial-safe | Client-safe | Server-safe | Optional only | Main concern |
| --- | --- | --- | --- | --- | --- | --- |
| CC0 / Public Domain | Yes, if verified | Yes | Yes | Yes | No | Provenance |
| MIT / BSD / ISC / Zlib | Yes, if verified | Yes | Yes | Yes | No | Notice preservation |
| Apache-2.0 | Yes, if notices handled | Yes | Yes | Yes | No | NOTICE preservation |
| CC-BY | No | With attribution | Policy-dependent | Policy-dependent | Usually | Attribution |
| CC-BY-SA | No | Policy-dependent | Policy-dependent | Policy-dependent | Yes | ShareAlike |
| CC-BY-NC | No | No | No by default | Noncommercial only | Yes | Non-commercial restriction |
| CC-BY-ND | No | Policy-dependent | No by default | Policy-dependent | Yes | No derivatives |
| MPL / LGPL | No | Policy-dependent | No by default | Policy-dependent | Yes | Integration model |
| GPL | No | Policy-dependent | No | Server-only by default | Yes | Source disclosure / linking |
| AGPL | No | No by default | No | No by default | Yes | Network source disclosure |
| Proprietary / unknown | No | No | No | No | No | Rights unclear |

## Practical rules for contributors

When adding a source:

```txt
1. Use the exact license ID whenever possible.
2. Preserve the upstream URL.
3. Preserve the upstream author or project name.
4. Add verification date.
5. Add checksum if a file is mirrored or packaged.
6. Mark optional sources as optional.
7. Mark NC, ND, GPL, and AGPL sources as explicit opt-in only.
8. Never place unknown-license audio in the repository.
9. Never place optional downloaded source files in the default package.
10. Prefer CC0, public domain, direct project code, MIT, BSD, ISC, Zlib, or Apache-2.0 for default-safe workflows.
```

## Relationship to machine-readable metadata

Human-readable policy lives here:

```txt
LICENSES/LICENSE-REFERENCE.md
```

Machine-readable license grouping lives here:

```txt
manifests/v1/license-groups/
```

Machine-readable policy filters live here:

```txt
manifests/v1/policies/
```

Optional source registry metadata lives here:

```txt
optional-sources/registry/
```

All of these should agree with each other.
