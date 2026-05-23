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

