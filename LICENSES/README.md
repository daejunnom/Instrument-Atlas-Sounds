# Licenses

This directory contains license reference documentation for Instrument Atlas Sounds.

The root `LICENSE` file defines the default license for this repository's own code, tools, documentation, and directly maintained project files unless another file states otherwise.

Third-party engines, third-party assets, optional sources, sample libraries, and sound sources retain their original licenses.

This directory does not replace the full legal text of any third-party license.

## Files

```txt
LICENSES/
  README.md
  LICENSE-REFERENCE.md
```

## Root license

The root `LICENSE` file applies to the repository's own code and tooling unless a file, directory, manifest, or source entry declares a different license.

At the time of writing, the project default license is:

```txt
MIT
```

## Third-party licenses

Third-party engines, third-party assets, optional sources, sample libraries, and sound sources must declare their own license metadata before they can be used by consuming applications.

A source being referenced in this repository does not automatically mean that its code, binary, model, sample, or asset is vendored or redistributed by this repository.

## License IDs

Instrument Atlas Sounds uses precise license identifiers where possible.

Examples:

```txt
CC0-1.0
MIT
BSD-2-Clause
BSD-3-Clause
Apache-2.0
MPL-2.0
LGPL-3.0-or-later
GPL-3.0-only
AGPL-3.0-only
CC-BY-4.0
CC-BY-NC-4.0
CC-BY-ND-4.0
unknown
proprietary
```

License IDs are used for:

```txt
source manifests
license groups
policy filters
optional source registries
release checks
attribution reports
```

## Reference only

`LICENSE-REFERENCE.md` is a practical project guide.

It is not legal advice.

It is not a substitute for the full license text.

Consuming applications are responsible for final license compliance.

## Relationship to other policy files

See also:

```txt
ASSET-POLICY.md
OPTIONAL-SOURCES.md
THIRD_PARTY_NOTICES.md
manifests/v1/license-groups/
manifests/v1/policies/
```

## Future license texts

If this repository later vendors third-party source code, optional engines, or redistributable assets, the relevant full license texts may be added under a future directory such as:

```txt
LICENSES/texts/
```

Do not add copied license texts casually.

Only add full license texts when they are needed for redistributed or vendored content, and preserve the original text without modification.
