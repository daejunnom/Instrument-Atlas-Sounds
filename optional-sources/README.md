# Optional Sources

This directory contains metadata for optional sources.

It must not contain downloaded third-party engine source code, third-party binaries, third-party audio files, or unverified sample assets.

Optional source files must be fetched explicitly into ignored local directories such as `_optional/`.

## Purpose

The purpose of this directory is to describe optional sources without including them in the default repository clone, install, build, or release package.

This helps prevent users from accidentally receiving GPL, AGPL, non-commercial, no-derivatives, proprietary, or unknown-license files when they only intended to use the default commercial-safe registry.

## What may be committed here

Allowed:

```txt
registry metadata
source definitions
license IDs
license families
download URLs
upstream URLs
checksums
verification dates
integration notes
disabled-source records
```

Not allowed:

```txt
downloaded engine source code
downloaded engine binaries
downloaded sample files
downloaded model files
downloaded plugin files
unverified audio files
commercial sample pack files
YouTube/game/film/music extraction files
unknown-license files
```

## Directory structure

```txt
optional-sources/
  README.md

  registry/
    engines/
      .gitkeep

    samples/
      .gitkeep
```

Future structure:

```txt
optional-sources/
  registry/
    engines/
      mit.json
      apache-2.0.json
      bsd-2-clause.json
      bsd-3-clause.json
      isc.json
      zlib.json
      mpl-2.0.json
      lgpl.json
      gpl.json
      agpl.json
      unknown-blocked.json

    samples/
      cc0.json
      public-domain.json
      cc-by.json
      cc-by-sa.json
      cc-by-nc.json
      cc-by-nd.json
      cc-by-nc-sa.json
      cc-by-nc-nd.json
      proprietary-blocked.json
      unknown-blocked.json
```

## Registry file role

A registry file describes optional sources belonging to a license group.

It does not mean that the source is included in this repository.

It does not mean that the source is safe for every use case.

It does not mean that a consuming application may use it without checking its policy.

## Engine registry entries

Engine registry entries should describe optional synthesis engines, physical modeling engines, DSP engines, render workers, or adapter targets.

They should include:

```txt
id
title
sourceType
licenseId
licenseFamily
restrictions
upstreamName
upstreamUrl
upstreamAuthor
verifiedAt
downloadUrl
checksum
buildSystem
runtime
supportedPlatforms
adapterRequired
adapterStatus
executionTargets
commercialUse
clientDistributionAllowed
serverUseAllowed
sourceDisclosureRequired
networkSourceDisclosureRequired
defaultBlocked
requiresExplicitConsent
```

## Sample registry entries

Sample registry entries should describe optional audio assets or sample libraries.

They should include:

```txt
id
title
sourceType
licenseId
licenseFamily
restrictions
upstreamName
upstreamUrl
upstreamAuthor
verifiedAt
downloadUrl
checksum
durationMs
sampleRate
channels
format
bitDepth
commercialUse
derivativesAllowed
redistributionAllowed
attributionRequired
shareAlikeRequired
mirrorAllowed
previewAllowed
defaultBlocked
requiresExplicitConsent
```

## Download destination

Optional downloaded files must go to ignored local folders.

Recommended destination:

```txt
_optional/
```

Alternative destination:

```txt
third_party_optional/
```

These folders must remain ignored by Git.

## License separation

Policy decisions may group sources by broad category, but optional registry files should preserve exact license IDs.

Examples:

```txt
MIT
Apache-2.0
BSD-3-Clause
CC0-1.0
CC-BY-4.0
CC-BY-NC-4.0
CC-BY-ND-4.0
GPL-3.0-only
AGPL-3.0-only
```

This makes attribution, notices, compliance checks, and user choice clearer.

## Default safety rule

If a source has unclear license metadata, missing provenance, missing checksum, disputed rights, proprietary restrictions, or unknown terms, it must be treated as blocked.

Blocked sources must not be fetchable by default.

## Relationship with core manifests

Core manifests under `manifests/v1/sources/` may reference optional sources only as metadata or planned integration targets.

A source being listed as optional does not make it available for automatic rendering or loading.

A consuming application must still check:

```txt
license policy
execution target
runtime readiness
asset verification
download status
attribution requirements
source disclosure requirements
```

## Summary

This directory is for optional source metadata only.

The default Instrument Atlas Sounds package should remain safe, small, auditable, and commercial-friendly by default.