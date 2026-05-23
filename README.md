# Instrument Atlas Sounds

Instrument Atlas Sounds is a playable sound-source registry for Instrument Atlas instrument IDs.

It prioritizes physical modeling engines and uses licensed sample-based sources as fallbacks when physical modeling is not available or practical.

This repository is designed to help applications resolve an instrument ID, such as `inst_cello`, `inst_acoustic_guitar`, or `inst_kick_drum`, into a playable sound source that can be rendered, previewed, or loaded by an audio application.

## Purpose

Instrument Atlas provides instrument metadata.

Instrument Atlas Sounds provides ways to make those instruments audible.

The two repositories are intentionally separated:

- Instrument Atlas stores instrument names, aliases, tags, packs, taxonomy, localization, and metadata.
- Instrument Atlas Sounds stores playable sound-source definitions, engine references, license policies, and source manifests.
- Applications such as music editors, audio tools, DAWs, and creative systems can combine both repositories.

## What this project is

Instrument Atlas Sounds is:

- A playable sound-source registry
- A physical-modeling-first sound source catalog
- A license-aware registry for instrument rendering
- A bridge between Instrument Atlas instrument IDs and actual sound generation
- A place to describe physical models, synthesis engines, multisample maps, one-shot sample sources, and future render backends

## What this project is not

Instrument Atlas Sounds is not:

- A generic sample dump
- A repository for unverified audio files
- A place for copyrighted sample packs
- A YouTube, game, film, anime, or commercial music extraction archive
- A replacement for a full DAW sampler engine

Audio files should not be added unless their license and provenance are clear.

By default, common audio file extensions are ignored by this repository.

## Current status

Instrument Atlas Sounds is in early alpha development.

Current project state:

```txt
4 source manifest files
4 license policy files
3 initial physical modeling source entries
5 generated runtime indexes
validation script
runtime build script
release package script
example resolve/render requests
```

Initial physical modeling source entries:

```txt
src_custom_karplus_strong_pluck
src_chowkick_kick_model
src_stk_basic_models
```

These entries are currently registry definitions and integration targets. They do not mean that third-party engine source code is vendored in this repository.

## Design goals

This project aims to support:

- Physical modeling engines as first-class sound sources
- Licensed sample fallback sources
- License-aware source selection
- Server-side and client-side execution policies
- Instrument ID compatibility with Instrument Atlas
- SaaS-safe sound source resolution
- Clear separation between metadata, engines, samples, and generated outputs
- Runtime artifacts that applications can consume directly

## Repository structure

```txt
instrument-atlas-sounds/
  README.md
  LICENSE
  THIRD_PARTY_NOTICES.md
  ASSET-POLICY.md
  package.json

  manifests/
    v1/
      manifest.json

      sources/
        physical-models.json
        sample-instruments.json
        one-shots.json
        synth-patches.json

      policies/
        client-safe.json
        saas-safe.json
        cc0-only.json
        permissive-only.json

      maps/

  assets/
    README.md
    samples/
      .gitkeep

  examples/
    resolve-request.json
    render-request.json
    client-safe-resolve-request.json
    saas-safe-resolve-request.json

  scripts/
    validate.mjs
    build.mjs
    package-release.mjs

  dist/
    sounds/
      v1/
        manifest.json
        sources/
        policies/
        indexes/

  release/
    instrument-atlas-sounds-v0.1.0.zip
```

`dist/` and `release/` are generated artifacts and should not be committed.

`_local/` is a local-only helper workspace and should not be committed.

## Source types

A sound source may be one of the following:

```txt
physical_model
sample_instrument
one_shot_sample
synth_patch
external_engine
```

Physical modeling sources are preferred when available.

Sample-based sources are allowed only when their license and source information are clear.

## License policy model

Sound sources declare license metadata so applications can choose what they are allowed to load.

Policy categories:

```txt
public_domain
permissive_code
weak_copyleft
server_only_copyleft
network_copyleft
restricted
to_be_verified
```

Recommended default behavior:

- Client-side execution should allow only public domain and permissive sources.
- Server-side execution may allow weak-copyleft and GPL-compatible server-only sources when the application policy permits it.
- AGPL, non-commercial, no-derivatives, proprietary, unknown-license, and unverified sources should be blocked by default.

## Included policies

### client-safe

For browser, WASM, AudioWorklet, or other client-distributed runtimes.

Allows:

```txt
public_domain
permissive_code
```

Blocks by default:

```txt
weak_copyleft
server_only_copyleft
network_copyleft
restricted
to_be_verified
```

### saas-safe

For server-side rendering where the sound engine runs only on infrastructure controlled by the application provider.

Allows:

```txt
public_domain
permissive_code
weak_copyleft
server_only_copyleft
```

Blocks by default:

```txt
network_copyleft
restricted
to_be_verified
```

### cc0-only

For applications that want only CC0 or public-domain sources.

Allows:

```txt
CC0-1.0
Public Domain
```

### permissive-only

For applications that want only public-domain and permissive-code sources.

Allows:

```txt
CC0-1.0
Public Domain
MIT
BSD-2-Clause
BSD-3-Clause
Apache-2.0
MIT-STK
```

## Sound source model

A sound source describes one way to make one or more Instrument Atlas instruments audible.

Example:

```json
{
  "id": "src_custom_karplus_strong_pluck",
  "title": "Custom Karplus-Strong Plucked String",
  "description": "A planned lightweight plucked-string physical model for early client and server experiments.",
  "instrumentIds": [
    "inst_acoustic_guitar",
    "inst_harp",
    "inst_lute",
    "inst_koto"
  ],
  "sourceType": "physical_model",
  "engineType": "karplus_strong",
  "priority": 100,
  "status": "planned",
  "executionTargets": [
    "client",
    "server"
  ],
  "license": {
    "id": "MIT",
    "category": "permissive_code",
    "commercialUse": true,
    "attributionRequired": true,
    "sourceRequiredOnDistribution": false,
    "networkSourceRequired": false,
    "clientDistributionAllowed": true,
    "serverUseAllowed": true
  },
  "capabilities": {
    "notes": true,
    "velocity": true,
    "duration": true,
    "pitchBend": false,
    "sustainLoop": false,
    "polyphony": true,
    "realtime": true,
    "offlineRender": true
  },
  "renderDefaults": {
    "durationPolicy": "generated_decay",
    "defaultDurationMs": 1200,
    "minDurationMs": 80,
    "maxDurationMs": 8000
  }
}
```

## Execution targets

A source may declare one or more execution targets:

```txt
client
server
offline
```

Meaning:

```txt
client
  The source may be used in browser, WASM, AudioWorklet, desktop client, or other user-distributed runtimes.

server
  The source may be used by a server-side render worker or backend audio service.

offline
  The source may be used by local/offline tooling or non-realtime generation workflows.
```

GPL-family sources must not include `client` by default.

AGPL-family sources are blocked by default.

## Duration policies

Sound sources may use one of the following duration policies:

```txt
generated_sustain
generated_decay
looped_sustain
natural_decay
one_shot
time_stretch
```

Examples:

```txt
generated_sustain
  A physical model or synth can generate a sustained tone for a requested duration.

generated_decay
  A physical model or synth generates a decaying tone such as a plucked string or kick.

looped_sustain
  A sample instrument uses loop points to sustain a note.

natural_decay
  A sample naturally decays and may not match arbitrary requested durations.

one_shot
  A fixed one-shot sample such as a drum hit, cowbell, crash, or foley sound.

time_stretch
  A source may be stretched or compressed to fit a requested duration.
```

## Runtime build artifacts

Source files under `manifests/v1/` are optimized for review and contribution.

Runtime files under `dist/sounds/v1/` are optimized for application consumption.

Generated structure:

```txt
dist/sounds/v1/
  manifest.json

  sources/
    physical-models.json
    sample-instruments.json
    one-shots.json
    synth-patches.json

  policies/
    client-safe.json
    saas-safe.json
    cc0-only.json
    permissive-only.json

  indexes/
    by-instrument.json
    by-license.json
    by-engine.json
    by-execution-target.json
    by-source-type.json
```

Applications should load `manifest.json` first, then load indexes or source files on demand.

## Release package

The package script creates a zip file for GitHub Releases.

Expected output:

```txt
release/instrument-atlas-sounds-v0.1.0.zip
```

Expected zip contents:

```txt
sounds/v1/manifest.json
sounds/v1/sources/physical-models.json
sounds/v1/sources/sample-instruments.json
sounds/v1/sources/one-shots.json
sounds/v1/sources/synth-patches.json
sounds/v1/policies/client-safe.json
sounds/v1/policies/saas-safe.json
sounds/v1/policies/cc0-only.json
sounds/v1/policies/permissive-only.json
sounds/v1/indexes/by-instrument.json
sounds/v1/indexes/by-license.json
sounds/v1/indexes/by-engine.json
sounds/v1/indexes/by-execution-target.json
sounds/v1/indexes/by-source-type.json
```

Applications should use a fixed release version instead of depending on the latest branch state.

Example:

```txt
INSTRUMENT_ATLAS_SOUNDS_VERSION=v0.1.0
INSTRUMENT_ATLAS_SOUNDS_URL=https://github.com/<owner>/Instrument-Atlas-Sounds/releases/download/v0.1.0/instrument-atlas-sounds-v0.1.0.zip
```

## Scripts

Install dependencies:

```sh
npm install
```

Validate source manifests and policies:

```sh
npm run validate
```

Build runtime catalog files:

```sh
npm run build
```

Create a release zip:

```sh
npm run package
```

Recommended local workflow:

```sh
npm run validate
npm run build
npm run package
```

Expected validation output:

```txt
Validation OK
Checked 4 policies.
Checked source manifests.
```

Expected build output:

```txt
Build OK
Generated manifest: dist/sounds/v1/manifest.json
Copied source files: 4
Copied policy files: 4
Generated indexes: 5
Indexed sound sources: 3
```

Expected package output:

```txt
Package OK
Generated: release/instrument-atlas-sounds-v0.1.0.zip
Archive root: sounds/v1/
Included files: 14
```

## Validation

The validation script checks:

- JSON parse errors
- manifest file presence
- policy ID and filename consistency
- duplicate policy IDs
- valid license categories
- valid source types
- duplicate source IDs
- source ID format
- instrument ID format
- execution target values
- status values
- required license metadata
- blocked AGPL sources
- GPL sources incorrectly marked as client-executable
- capability object shape
- render default object shape
- parameter ranges
- provenance metadata
- manifest references to source and policy files

## Build process

The build script:

1. Runs validation.
2. Reads source manifests.
3. Reads license policies.
4. Copies runtime source files into `dist/sounds/v1/sources/`.
5. Copies policy files into `dist/sounds/v1/policies/`.
6. Generates runtime indexes.
7. Generates `dist/sounds/v1/manifest.json`.

Generated indexes:

```txt
by-instrument.json
by-license.json
by-engine.json
by-execution-target.json
by-source-type.json
```

## Example resolve request

```json
{
  "instrumentId": "inst_acoustic_guitar",
  "executionTarget": "server",
  "useCase": "render",
  "licensePolicy": {
    "allowCategories": [
      "public_domain",
      "permissive_code",
      "weak_copyleft",
      "server_only_copyleft"
    ],
    "denyLicenses": [
      "AGPL-3.0-only",
      "AGPL-3.0-or-later",
      "CC-BY-NC",
      "CC-BY-ND",
      "unknown"
    ],
    "allowCommercialUseOnly": true,
    "allowAttributionRequired": true,
    "allowClientDistribution": false,
    "allowServerOnlyCopyleft": true,
    "preferPublicDomain": true
  },
  "enginePreference": {
    "preferSourceTypes": [
      "physical_model",
      "sample_instrument",
      "one_shot_sample",
      "synth_patch"
    ],
    "preferRealtime": false
  }
}
```

## Example render request

```json
{
  "instrumentId": "inst_acoustic_guitar",
  "sourceId": "src_custom_karplus_strong_pluck",
  "note": {
    "name": "C4",
    "midi": 60,
    "frequencyHz": 261.6256
  },
  "durationMs": 2000,
  "velocity": 0.75,
  "render": {
    "sampleRate": 48000,
    "channels": 2,
    "format": "flac"
  }
}
```

## Consumer flow

A consuming application should use this flow:

```txt
1. Load Instrument Atlas metadata.
2. Let the user search or select an instrument.
3. Resolve the selected Instrument Atlas instrument ID.
4. Load Instrument Atlas Sounds manifest.
5. Load by-instrument index.
6. Find available sound sources for the instrument ID.
7. Filter sources using the application license policy.
8. Prefer physical_model sources when available.
9. Fall back to sample_instrument, one_shot_sample, or synth_patch sources when needed.
10. Send a render request to a client or server engine.
11. Return audio plus a license report.
```

## Relationship with Instrument Atlas

Instrument Atlas Sounds depends on stable Instrument Atlas instrument IDs.

For example:

```txt
inst_cello
inst_acoustic_guitar
inst_kick_drum
inst_cowbell
```

Instrument Atlas should be used for:

- instrument search
- names and aliases
- localization
- taxonomy
- packs
- metadata

Instrument Atlas Sounds should be used for:

- resolving playable sound sources
- license-aware source selection
- render request metadata
- physical modeling source discovery
- sample fallback discovery

## Asset policy

See:

```txt
ASSET-POLICY.md
```

Summary:

- Physical modeling sources are preferred.
- Sample-based sources require clear provenance and license metadata.
- Unknown-license assets are not allowed.
- Non-commercial and no-derivatives sources are blocked by default.
- AGPL sources are blocked by default.
- GPL sources must be server-only unless a consuming project explicitly decides otherwise.
- Audio files should not be committed unless verified.

## Third-party notices

See:

```txt
THIRD_PARTY_NOTICES.md
```

Third-party engines and sound sources retain their original licenses.

A third-party source listed in this repository is not necessarily vendored or redistributed by this repository.

## License

Code and repository tooling are licensed under the MIT License unless otherwise stated.

Third-party engines and sound sources retain their original licenses.

Sound sources must declare their license and provenance before they can be used by consuming applications.