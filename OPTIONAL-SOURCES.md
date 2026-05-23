# Optional Sources Policy

Instrument Atlas Sounds is designed to be safe by default.

The default repository clone, install, validation, build, and release package must not download or include optional third-party engines, optional samples, GPL sources, AGPL sources, non-commercial sources, no-derivatives sources, proprietary sources, or unknown-license sources.

Optional sources may be indexed by metadata, but they must be fetched explicitly by a user or consuming application that understands the relevant license obligations.

This document describes how optional sources are grouped, documented, and separated.

This document is not legal advice. Consuming applications are responsible for final license compliance.

## Default behavior

The default workflow must stay clean:

```sh
git clone <repo>
npm install
npm run validate
npm run build
npm run package
```

The default workflow must include only:

```txt
core registry metadata
license policies
source manifests
generated runtime indexes
direct project code
direct project engines
safe permissive metadata
```

The default workflow must not include:

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

## Directory model

```txt
optional-sources/
  Registry metadata only.
  This directory is tracked by Git.

_optional/
  Downloaded optional source files.
  This directory is ignored by Git.

third_party_optional/
  Optional third-party payloads.
  This directory is ignored by Git.
```

`optional-sources/` may describe optional sources.

`_optional/` and `third_party_optional/` may contain downloaded files only after an explicit fetch command. They must not be committed.

## License grouping model

Optional sources should be grouped by exact license ID and by license family.

### License family

The `licenseFamily` field should describe the broad legal category.

Recommended values:

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

### License ID

The `licenseId` field should use a precise license identifier when possible.

Examples:

```txt
CC0-1.0
Public-Domain
MIT
BSD-2-Clause
BSD-3-Clause
Apache-2.0
ISC
Zlib
MPL-2.0
LGPL-2.1-or-later
LGPL-3.0-or-later
GPL-2.0-only
GPL-2.0-or-later
GPL-3.0-only
GPL-3.0-or-later
AGPL-3.0-only
AGPL-3.0-or-later
CC-BY-4.0
CC-BY-SA-4.0
CC-BY-NC-4.0
CC-BY-ND-4.0
CC-BY-NC-SA-4.0
CC-BY-NC-ND-4.0
proprietary
unknown
```

Policy decisions may use license families, but download grouping, attribution, notices, and audit trails should use exact license IDs.

## Recommended optional groups

Optional registry files should be grouped by source type and license.

Recommended engine registry groups:

```txt
optional-sources/registry/engines/mit.json
optional-sources/registry/engines/apache-2.0.json
optional-sources/registry/engines/bsd-2-clause.json
optional-sources/registry/engines/bsd-3-clause.json
optional-sources/registry/engines/isc.json
optional-sources/registry/engines/zlib.json
optional-sources/registry/engines/mpl-2.0.json
optional-sources/registry/engines/lgpl.json
optional-sources/registry/engines/gpl.json
optional-sources/registry/engines/agpl.json
optional-sources/registry/engines/unknown-blocked.json
```

Recommended sample registry groups:

```txt
optional-sources/registry/samples/cc0.json
optional-sources/registry/samples/public-domain.json
optional-sources/registry/samples/cc-by.json
optional-sources/registry/samples/cc-by-sa.json
optional-sources/registry/samples/cc-by-nc.json
optional-sources/registry/samples/cc-by-nd.json
optional-sources/registry/samples/cc-by-nc-sa.json
optional-sources/registry/samples/cc-by-nc-nd.json
optional-sources/registry/samples/proprietary-blocked.json
optional-sources/registry/samples/unknown-blocked.json
```

## Default-safe groups

The following groups may be considered for default-safe or commercial-safe workflows after metadata validation:

```txt
CC0-1.0
Public-Domain
MIT
BSD-2-Clause
BSD-3-Clause
ISC
Zlib
Apache-2.0
```

Apache-2.0 should still preserve license and notice obligations.

CC-BY may be allowed in commercial workflows only when attribution handling is implemented.

## Attribution-required groups

The following groups may require attribution reports or notice handling:

```txt
Apache-2.0
CC-BY-4.0
CC-BY-SA-4.0
```

These sources should not be treated as no-attribution sources.

A consuming application should be able to produce an attribution report before using them in generated outputs, redistributed assets, or public releases.

## ShareAlike groups

The following groups require extra caution:

```txt
CC-BY-SA-4.0
CC-BY-NC-SA-4.0
```

ShareAlike sources should not be included in default commercial-safe workflows unless the consuming application explicitly supports their obligations.

## Non-commercial groups

The following groups must be opt-in only:

```txt
CC-BY-NC-4.0
CC-BY-NC-SA-4.0
CC-BY-NC-ND-4.0
```

Non-commercial sources must not be included in commercial-safe policies, commercial release packages, paid SaaS workflows, monetized content workflows, or default application downloads.

## No-derivatives groups

The following groups must be opt-in only:

```txt
CC-BY-ND-4.0
CC-BY-NC-ND-4.0
```

No-derivatives sources are not suitable for workflows that modify, transform, resample, pitch-shift, time-stretch, edit, remix, or sample-map the source.

They may only be considered for use cases that preserve the original work without creating derivatives, and only when the consuming application explicitly accepts that restriction.

## Copyleft engine groups

The following groups must be optional and disabled by default:

```txt
MPL-2.0
LGPL-2.1-or-later
LGPL-3.0-or-later
GPL-2.0-only
GPL-2.0-or-later
GPL-3.0-only
GPL-3.0-or-later
AGPL-3.0-only
AGPL-3.0-or-later
```

Recommended handling:

```txt
MPL / LGPL:
  Optional.
  Prefer server-side or clearly separated integration.

GPL:
  Optional.
  Server-only by default.
  Must not be bundled into client code by default.

AGPL:
  Optional.
  Hidden or strongly warned by default.
  Must not be enabled in SaaS workflows unless the consuming application explicitly accepts AGPL network obligations.
```

## Blocked groups

The following groups must not be fetchable by default:

```txt
proprietary
unknown
disputed
unverified
```

Blocked sources may be documented only as disabled metadata when there is a clear reason to track them.

They must not be downloaded, mirrored, packaged, or exposed as usable runtime sources.

## Optional fetch behavior

Any future optional fetch command should require explicit intent.

Example shape:

```sh
npm run fetch:optional-source -- --group samples-cc0 --accept-license CC0-1.0
npm run fetch:optional-source -- --group samples-cc-by --accept-license CC-BY-4.0
npm run fetch:optional-source -- --group engines-gpl --accept-license GPL-3.0-only
```

The command must not run automatically during:

```txt
npm install
npm run validate
npm run build
npm run package
```

Downloaded optional files should be stored under:

```txt
_optional/
```

and must remain ignored by Git.

## Required metadata for optional sources

Every optional source entry should include:

```txt
id
title
sourceType
licenseId
licenseFamily
restrictions
upstreamUrl
upstreamName
upstreamAuthor
verifiedAt
downloadUrl
checksum
checksumAlgorithm
expectedSizeBytes
redistributionAllowed
commercialUse
derivativesAllowed
attributionRequired
shareAlikeRequired
sourceDisclosureRequired
networkSourceDisclosureRequired
clientDistributionAllowed
serverUseAllowed
defaultBlocked
requiresExplicitConsent
```

For sample sources, also include:

```txt
durationMs
sampleRate
channels
format
bitDepth
previewAllowed
mirrorAllowed
```

For engine sources, also include:

```txt
language
runtime
buildSystem
supportedPlatforms
adapterRequired
adapterStatus
executionTargets
```

## CI boundary rules

CI should eventually fail if:

```txt
GPL source code is committed to the core repository tree.
AGPL source code is committed to the core repository tree.
NC sources are included in commercial-safe output.
ND sources are included in editable/renderable/sample-mapping output.
AGPL sources are included in saas-safe output.
GPL sources include client execution targets.
CC-BY sources are missing attribution metadata.
Apache-2.0 sources are missing notice metadata when required.
Unknown-license sources are fetchable.
Optional downloaded files are committed.
Optional downloaded files are included in the default release zip.
```

## Release package rules

The default release package should include only core registry files.

Default package:

```txt
instrument-atlas-sounds-vX.Y.Z.zip
```

Optional packages may be added later, but must be separate.

Possible future optional packages:

```txt
instrument-atlas-sounds-optional-engines-mit-vX.Y.Z.zip
instrument-atlas-sounds-optional-engines-apache-2.0-vX.Y.Z.zip
instrument-atlas-sounds-optional-samples-cc0-vX.Y.Z.zip
instrument-atlas-sounds-optional-samples-cc-by-vX.Y.Z.zip
```

GPL, AGPL, NC, and ND packages should not be created unless their warnings, metadata, and boundary checks are fully implemented.

## Summary

The core project should remain safe by default.

Optional sources may exist as metadata, but actual source files and assets must be downloaded only through explicit opt-in workflows.

Exact license IDs should be preserved for auditability, while policy groups may be used for high-level filtering.