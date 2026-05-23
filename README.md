# Instrument Atlas Sounds

Instrument Atlas Sounds is a playable sound-source registry for Instrument Atlas instrument IDs.

It prioritizes physical modeling engines and uses licensed sample-based sources as fallbacks when physical modeling is not available or practical.

This repository is designed to help applications resolve an instrument ID, such as `inst_cello`, `inst_acoustic_guitar`, or `inst_kick_drum`, into a playable sound source that can be rendered, previewed, or loaded by an audio application.

## Purpose

Instrument Atlas provides instrument metadata.

Instrument Atlas Sounds provides ways to make those instruments audible.

The two repositories are intentionally separated:

- Instrument Atlas stores instrument names, aliases, tags, packs, taxonomy, localization, and metadata.
- Instrument Atlas Sounds stores playable sound-source definitions, engine references, license policies, license groups, and source manifests.
- Applications such as music editors, audio tools, DAWs, and creative systems can combine both repositories.

## What this project is

Instrument Atlas Sounds is:

- A playable sound-source registry
- A physical-modeling-first sound source catalog
- A license-aware registry for instrument rendering
- A bridge between Instrument Atlas instrument IDs and actual sound generation
- A place to describe physical models, synthesis engines, multisample maps, one-shot sample sources, and future render backends
- A policy layer for commercial-safe, client-safe, SaaS-safe, and opt-in sound source selection

## What this project is not

Instrument Atlas Sounds is not:

- A generic sample dump
- A repository for unverified audio files
- A place for copyrighted sample packs
- A YouTube, game, film, anime, or commercial music extraction archive
- A replacement for a full DAW sampler engine
- A repository that automatically vendors every third-party engine it references

Audio files should not be added unless their license and provenance are clear.

By default, common audio file extensions are ignored by this repository.

## Current status

Instrument Atlas Sounds is in early alpha development.

Current project state:

```txt
4 source manifest files
11 license policy files
10 license group files
3 initial physical modeling source entries
1 custom prototype render engine
5 generated runtime indexes
validation script
runtime build script
release package script
example resolve/render requests
GitHub Actions CI and release workflows
```

Initial physical modeling source entries:

```txt
src_custom_karplus_strong_pluck
src_chowkick_kick_model
src_stk_basic_models
```

`src_custom_karplus_strong_pluck` has a local JavaScript prototype renderer.

Other third-party entries are currently registry definitions and integration targets. They do not mean that third-party engine source code is vendored in this repository.

## Design goals

This project aims to support:

- Physical modeling engines as first-class sound sources
- Licensed sample fallback sources
- License-aware source selection
- Server-side and client-side execution policies
- Instrument ID compatibility with Instrument Atlas
- SaaS-safe sound source resolution
- Commercial-safe default workflows
- Explicit opt-in handling for GPL, AGPL, non-commercial, no-derivatives, proprietary, unknown, or otherwise restricted sources
- Clear separation between metadata, engines, samples, optional downloads, and generated outputs
- Runtime artifacts that applications can consume directly

## Repository structure

```txt
instrument-atlas-sounds/
  README.md
  LICENSE
  LICENSES/
    README.md
    LICENSE-REFERENCE.md
  THIRD_PARTY_NOTICES.md
  ASSET-POLICY.md
  OPTIONAL-SOURCES.md
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
        commercial-safe.json
        commercial-safe-no-attribution.json
        commercial-safe-with-attribution.json
        noncommercial-opt-in.json
        no-derivatives-opt-in.json
        copyleft-server-opt-in.json
        network-copyleft-opt-in.json

      license-groups/
        public-domain.json
        permissive.json
        notice-attribution.json
        sharealike.json
        weak-copyleft.json
        strong-copyleft.json
        network-copyleft.json
        noncommercial.json
        no-derivatives.json
        blocked.json

  optional-sources/
    README.md
    registry/
      engines/
      samples/

  engines/
    custom/
      karplus-strong/
        README.md
        manifest.json
        karplus-strong.mjs

  assets/
    README.md
    samples/
      .gitkeep

  examples/
    resolve-request.json
    render-request.json
    render-karplus-strong.mjs
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
        license-groups/
        indexes/

  release/
    instrument-atlas-sounds-v0.1.0.zip
```

`dist/` and `release/` are generated artifacts and should not be committed.

`_local/` is a local-only helper workspace and should not be committed.

`_optional/` and `third_party_optional/` are reserved for future explicit optional downloads and should not be committed.

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

Policy categories currently include:

```txt
public_domain
permissive_code
commercial_attribution
commercial_sharealike
weak_copyleft
server_only_copyleft
strong_copyleft
network_copyleft
noncommercial
no_derivatives
proprietary
unknown
restricted
to_be_verified
```

Recommended default behavior:

- Client-side execution should allow only public-domain and permissive sources.
- Server-side execution may allow weak-copyleft and server-only copyleft sources only when the application policy permits it.
- AGPL, non-commercial, no-derivatives, proprietary, unknown-license, and unverified sources should be blocked by default.
- Commercial-safe workflows should block non-commercial, no-derivatives, network-copyleft, proprietary, unknown, disputed, and unverified sources by default.
- Attribution-required sources should be used only when the consuming application can generate or preserve attribution and notice reports.

## Included policies

### client-safe

For browser, WASM, AudioWorklet, desktop client, or other client-distributed runtimes.

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

### commercial-safe

For applications that want commercial-safe sources while blocking non-commercial, no-derivatives, AGPL, proprietary, unknown, disputed, and unverified sources by default.

### commercial-safe-no-attribution

For applications that want commercial-safe sources without generated-output attribution requirements.

License notices may still be required for software licenses.

### commercial-safe-with-attribution

For applications that can preserve notices and generate attribution reports.

### noncommercial-opt-in

For explicit non-commercial workflows only.

This policy must not be used in paid SaaS, monetized content, commercial products, or commercial-safe release packages.

### no-derivatives-opt-in

For explicit workflows that preserve the original work without editing, remixing, pitch shifting, time stretching, sample mapping, or generated-output use.

### copyleft-server-opt-in

For explicit server-side use of weak-copyleft and GPL-family sources.

These sources must not be bundled into client-distributed code by default.

### network-copyleft-opt-in

For explicit AGPL-family experimentation only.

This policy is blocked from default SaaS-safe workflows.

## License groups

License group files describe human and machine-readable groupings for license behavior.

Generated runtime artifacts include:

```txt
sounds/v1/license-groups/public-domain.json
sounds/v1/license-groups/permissive.json
sounds/v1/license-groups/notice-attribution.json
sounds/v1/license-groups/sharealike.json
sounds/v1/license-groups/weak-copyleft.json
sounds/v1/license-groups/strong-copyleft.json
sounds/v1/license-groups/network-copyleft.json
sounds/v1/license-groups/noncommercial.json
sounds/v1/license-groups/no-derivatives.json
sounds/v1/license-groups/blocked.json
```

For a human-readable explanation, see:

```txt
LICENSES/LICENSE-REFERENCE.md
```

## Optional sources

Optional sources are described separately from the core registry.

Default clone, install, validation, build, and release package workflows must not download or include:

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

Optional source metadata may be placed under:

```txt
optional-sources/
```

Downloaded optional files must go to ignored local folders such as:

```txt
_optional/
third_party_optional/
```

For details, see:

```txt
OPTIONAL-SOURCES.md
```

## Sound source model

A sound source describes one way to make one or more Instrument Atlas instruments audible.

Example:

```json
{
  "id": "src_custom_karplus_strong_pluck",
  "title": "Custom Karplus-Strong Plucked String",
  "description": "A lightweight plucked-string physical model prototype for early client and server experiments.",
  "instrumentIds": [
    "inst_acoustic_guitar",
    "inst_harp",
    "inst_lute",
    "inst_koto"
  ],
  "sourceType": "physical_model",
  "engineType": "karplus_strong",
  "priority": 100,
  "status": "prototype",
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

## Custom Karplus-Strong prototype

This repository includes a small JavaScript prototype renderer for `src_custom_karplus_strong_pluck`.

Run:

```sh
npm run render:karplus
```

Expected output:

```txt
_local/renders/src_custom_karplus_strong_pluck_C4.wav
```

This prototype is useful for early local testing. It is not intended to replace a production-grade guitar, harp, lute, or koto model.

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
    commercial-safe.json
    commercial-safe-no-attribution.json
    commercial-safe-with-attribution.json
    noncommercial-opt-in.json
    no-derivatives-opt-in.json
    copyleft-server-opt-in.json
    network-copyleft-opt-in.json

  license-groups/
    public-domain.json
    permissive.json
    notice-attribution.json
    sharealike.json
    weak-copyleft.json
    strong-copyleft.json
    network-copyleft.json
    noncommercial.json
    no-derivatives.json
    blocked.json

  indexes/
    by-instrument.json
    by-license.json
    by-engine.json
    by-execution-target.json
    by-source-type.json
```

Applications should load `manifest.json` first, then load indexes, policies, license groups, or source files on demand.

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
sounds/v1/policies/*.json
sounds/v1/license-groups/*.json
sounds/v1/indexes/by-instrument.json
sounds/v1/indexes/by-license.json
sounds/v1/indexes/by-engine.json
sounds/v1/indexes/by-execution-target.json
sounds/v1/indexes/by-source-type.json
```

Current expected file count:

```txt
31 files
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

Validate source manifests, policies, and license groups:

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

Resolve a runtime sound source example:

```sh
npm run resolve:example
```

Render the local Karplus-Strong prototype:

```sh
npm run render:karplus
```

Recommended local workflow:

```sh
npm run validate
npm run build
npm run package
npm run render:karplus
```

Expected validation output:

```txt
Validation OK
Checked 11 policies.
Checked 10 license groups.
Checked source manifests.
```

Expected build output:

```txt
Build OK
Generated manifest: dist/sounds/v1/manifest.json
Copied source files: 4
Copied policy files: 11
Copied license group files: 10
Generated indexes: 5
Indexed sound sources: 3
```

Expected package output:

```txt
Package OK
Generated: release/instrument-atlas-sounds-v0.1.0.zip
Archive root: sounds/v1/
Included files: 31
```

## Validation

The validation script checks:

- JSON parse errors
- manifest file presence
- policy ID and filename consistency
- license group ID and filename consistency
- duplicate policy IDs
- duplicate license group IDs
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
- manifest references to source, policy, and license group files

## Build process

The build script:

1. Runs validation.
2. Reads source manifests.
3. Reads license policies.
4. Reads license groups.
5. Copies runtime source files into `dist/sounds/v1/sources/`.
6. Copies policy files into `dist/sounds/v1/policies/`.
7. Copies license group files into `dist/sounds/v1/license-groups/`.
8. Generates runtime indexes.
9. Generates `dist/sounds/v1/manifest.json`.

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
    "format": "wav"
  }
}
```

## Runtime resolver

The runtime resolver selects a playable source for a requested Instrument Atlas instrument ID.

It loads generated runtime artifacts from:

```txt
dist/sounds/v1/
```

It uses:

```txt
manifest.json
indexes/by-instrument.json
policies/*.json
sources/*.json
```

Example command:

```sh
npm run resolve:example
```

Default input:

```txt
examples/resolve-request.json
```

A custom request file may also be passed directly:

```sh
node examples/resolve-sound-source.mjs examples/client-safe-resolve-request.json
```

Resolver input should include:

```txt
instrumentId
executionTarget
policyId or licensePolicy
enginePreference
```

Resolver output includes:

```txt
selectedSource
candidates
rejectedSources
rejectionReasons
attributionRequired
```

The resolver does not execute third-party engines.

It only selects a compatible source definition based on the built runtime catalog and the selected policy.

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
10. Check runtime readiness before rendering.
11. Check attribution, notice, and source disclosure requirements.
12. Send a render request to a client or server engine only when the selected source is actually runnable.
13. Return audio plus a license report when required.
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
- runtime policy selection
- optional source boundary documentation

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

## Optional source policy

See:

```txt
OPTIONAL-SOURCES.md
```

Summary:

- Optional third-party engines and optional samples are not downloaded by default.
- GPL, AGPL, NC, ND, proprietary, unknown, and unverified sources are not included in the default workflow.
- Optional sources may be described as metadata.
- Actual optional source files must require explicit opt-in before download or use.

## Third-party notices

See:

```txt
THIRD_PARTY_NOTICES.md
```

Third-party engines and sound sources retain their original licenses.

A third-party source listed in this repository is not necessarily vendored or redistributed by this repository.

## License

Code and repository tooling are licensed under the MIT License unless otherwise stated.

See:

```txt
LICENSE
```

Third-party engines, third-party assets, optional sources, sample libraries, and sound sources retain their original licenses.

A third-party source being referenced by this repository does not automatically mean that its code, binary, model, sample, or asset is vendored or redistributed by this repository.

Sound sources must declare their license and provenance before they can be used by consuming applications.

For human-readable license grouping and project policy guidance, see:

```txt
LICENSES/LICENSE-REFERENCE.md
```

For optional source separation rules, see:

```txt
OPTIONAL-SOURCES.md
```