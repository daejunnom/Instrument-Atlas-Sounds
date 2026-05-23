# Instrument Atlas Sounds

Instrument Atlas Sounds is a playable sound-source registry for Instrument Atlas instrument IDs.

It prioritizes physical modeling engines and uses licensed sample-based sources as fallbacks when physical modeling is not available or practical.

This repository is designed to help applications resolve an instrument ID, such as `inst_cello` or `inst_kick_drum`, into a playable sound source that can be rendered, previewed, or loaded by an audio application.

## Purpose

Instrument Atlas provides instrument metadata.

Instrument Atlas Sounds provides ways to make those instruments audible.

The two repositories are intentionally separated:

- Instrument Atlas stores instrument names, aliases, tags, packs, taxonomy, and metadata.
- Instrument Atlas Sounds stores playable sound-source definitions, engine references, license policies, and asset manifests.
- Applications such as music editors, audio tools, and creative systems can combine both repositories.

## What this project is

Instrument Atlas Sounds is:

- A playable sound-source registry
- A physical-modeling-first sound source catalog
- A license-aware registry for instrument rendering
- A bridge between Instrument Atlas instrument IDs and actual sound generation
- A place to describe physical models, synthesis engines, multisample maps, and one-shot sample sources

## What this project is not

Instrument Atlas Sounds is not:

- A generic sample dump
- A repository for unverified audio files
- A place for copyrighted sample packs
- A YouTube, game, film, or commercial music extraction archive
- A replacement for a full DAW sampler engine

Audio files should not be added unless their license and provenance are clear.

## Design goals

This project aims to support:

- Physical modeling engines as first-class sound sources
- Licensed sample fallback sources
- License-aware source selection
- Server-side and client-side execution policies
- Instrument ID compatibility with Instrument Atlas
- SaaS-safe sound source resolution
- Clear separation between metadata, engines, samples, and generated outputs

## Source types

A sound source may be one of the following:

- `physical_model`
- `sample_instrument`
- `one_shot_sample`
- `synth_patch`
- `external_engine`

Physical modeling sources are preferred when available.

Sample-based sources are allowed only when their license and source information are clear.

## License policy model

Sound sources should declare license metadata so applications can choose what they are allowed to load.

Example policy categories:

- `public_domain`
- `permissive_code`
- `weak_copyleft`
- `server_only_copyleft`
- `network_copyleft`
- `restricted`

Recommended default behavior:

- Client-side execution should allow only public domain and permissive sources.
- Server-side execution may allow GPL-compatible server-only sources when the application policy permits it.
- AGPL, non-commercial, no-derivatives, proprietary, and unknown-license sources should be blocked by default.

## Repository structure

Planned structure:

```txt
instrument-atlas-sounds/
  README.md
  LICENSE
  THIRD_PARTY_NOTICES.md
  ASSET-POLICY.md

  manifests/
    v1/
      manifest.json

      sources/
        physical-models.json
        sample-instruments.json
        one-shots.json

      maps/
        by-instrument.json
        by-license.json
        by-engine.json

  schemas/
    sound-source.schema.json
    render-request.schema.json
    license-policy.schema.json

  engines/
    custom/
      karplus-strong/
        manifest.json
        README.md

  assets/
    README.md
    samples/

  scripts/
    validate.mjs
    build.mjs
    package-release.mjs

  examples/
    resolve-request.json
    render-request.json
```

## Example sound source

```json
{
  "id": "src_custom_karplus_strong_pluck",
  "instrumentIds": [
    "inst_acoustic_guitar",
    "inst_harp",
    "inst_lute"
  ],
  "sourceType": "physical_model",
  "engineType": "karplus_strong",
  "priority": 100,
  "status": "experimental",
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
    "polyphony": true,
    "realtime": true,
    "offlineRender": true
  }
}
```

## Example resolve request

```json
{
  "instrumentId": "inst_cello",
  "executionTarget": "server",
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
    "allowServerOnlyCopyleft": true,
    "allowClientDistribution": false,
    "preferPublicDomain": true
  },
  "enginePreference": {
    "preferSourceTypes": [
      "physical_model",
      "sample_instrument",
      "one_shot_sample"
    ]
  }
}
```

## Example render request

```json
{
  "instrumentId": "inst_cello",
  "sourceId": "src_stk_bowed_string_basic",
  "note": {
    "name": "C4",
    "midi": 60,
    "frequencyHz": 261.6256
  },
  "durationMs": 2500,
  "velocity": 0.75,
  "render": {
    "sampleRate": 48000,
    "channels": 2,
    "format": "flac"
  }
}
```

## Initial priorities

Phase 1:

- Define the sound source manifest format
- Define license policy categories
- Add validation scripts
- Add physical modeling source entries
- Add basic examples for resolve and render requests

Phase 2:

- Add custom Karplus-Strong plucked string model metadata
- Add server-side physical modeling engine references
- Add sample fallback source metadata
- Add build artifacts for application consumption

Phase 3:

- Add real engine adapters
- Add server render worker examples
- Add curated CC0 sample fallback entries
- Add integration guide for consuming applications

## Relationship with Instrument Atlas

Instrument Atlas Sounds depends on stable Instrument Atlas instrument IDs.

For example:

```txt
inst_cello
inst_acoustic_guitar
inst_kick_drum
inst_cowbell
```

A consuming application should use Instrument Atlas for search and metadata, then use Instrument Atlas Sounds to resolve a playable sound source.

## License

Code and repository tooling are licensed under the MIT License unless otherwise stated.

Third-party engines and sound sources retain their original licenses.

Sound sources must declare their license and provenance before they can be used by consuming applications.
