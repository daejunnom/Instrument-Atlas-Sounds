# Assets

This directory is reserved for future verified audio assets.

Instrument Atlas Sounds is not intended to be a generic sample dump.

Audio files should not be committed unless their license and provenance are clear.

Preferred approach:

1. Store playable source metadata in `manifests/v1/sources/`.
2. Store actual audio assets outside the repository, such as in a release asset, CDN, or object storage.
3. Include checksum, source URL, license, and verification metadata in the source manifest.
4. Commit only verified CC0, public-domain, contributor-created, or redistribution-safe samples.

By default, common audio file extensions are ignored by `.gitignore`.