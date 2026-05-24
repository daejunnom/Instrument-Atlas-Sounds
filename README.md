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
license boundary check script
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
        commercial-safe-no-output-attribution.json
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
        karplus-strong-core.mjs
        wav-encode-browser.mjs
        wav-encode-node.mjs
        karplus-strong.mjs
        karplus-strong-node.mjs

  assets/
    README.md
    samples/
      .gitkeep

  examples/
    resolve-request.json
    render-request.json
    render-karplus-strong.mjs
    resolve-expected-rejection.mjs
    check-resolver-output.mjs
    client-safe-resolve-request.json
    saas-safe-success-request.json
    saas-safe-expected-rejection-request.json
    metadata-resolve-request.json

  scripts/
    validate.mjs
    build.mjs
    package-release.mjs
    check-license-boundaries.mjs

  src/
    resolve/
      resolve-sound-source.mjs

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
- Commercial-safe workflows should block commercial-sharealike, weak-copyleft, server-only copyleft, strong-copyleft, network-copyleft, non-commercial, no-derivatives, proprietary, unknown, disputed, and unverified sources by default.
- Creator/output-attribution-required sources should be used only when the consuming application can generate attribution reports. Notice-required sources may still be usable when license and copyright notices are preserved.

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

### saas-safe

For server-side rendering where the sound engine runs only on infrastructure controlled by the application provider.

Allows:

```txt
public_domain
permissive_code
```

Blocks by default:

```txt
weak_copyleft
server_only_copyleft
commercial_sharealike
strong_copyleft
network_copyleft
noncommercial
no_derivatives
proprietary
unknown
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
ISC
Zlib
Apache-2.0
MIT-STK
```

### commercial-safe

For applications that want commercial-safe sources while blocking non-commercial, no-derivatives, AGPL, proprietary, unknown, disputed, and unverified sources by default.

### commercial-safe-no-output-attribution

For applications that want commercial-safe sources without creator or generated-output attribution requirements.

License text, copyright notices, and NOTICE preservation may still be required.

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
    "noticeRequired": true,
    "licenseTextRequired": true,
    "noticeReportRequired": true,
    "creatorAttributionRequired": false,
    "outputAttributionRequired": false,
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
  },
  "parameters": [
    {
      "id": "damping",
      "type": "number",
      "min": 0,
      "max": 1,
      "default": 0.35
    },
    {
      "id": "brightness",
      "type": "number",
      "min": 0,
      "max": 1,
      "default": 0.65
    }
  ],
  "provenance": {
    "origin": "instrument-atlas-sounds",
    "upstreamName": null,
    "upstreamUrl": null,
    "verifiedAt": "2026-05-23"
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

The prototype is split by runtime boundary:

```txt
karplus-strong-core.mjs
  Client/server-safe render core.

wav-encode-browser.mjs
  Browser-safe WAV encoding using ArrayBuffer, Uint8Array, and DataView.

wav-encode-node.mjs
  Node-only WAV Buffer and file output helpers.

karplus-strong.mjs
  Client-safe compatibility aggregate module.

karplus-strong-node.mjs
  Node compatibility aggregate module.
```

The `client` execution target applies to the render core and browser-safe WAV encoding helpers.

Node-only helpers such as `encodeWavPcm16ToBuffer`, `encodeWavPcm16`, and `writeWavFile` are exposed through `wav-encode-node.mjs` and `karplus-strong-node.mjs`, not through the client-safe aggregate `karplus-strong.mjs`.

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
    commercial-safe-no-output-attribution.json
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

The package script runs the build by default.

When `dist/sounds/v1/` was already generated, use:

```sh
npm run package:from-dist
```

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

Build runtime catalog files after validation has already been run:

```sh
npm run build:skip-validation
```

Create a release zip:

```sh
npm run package
```

Create a release zip from the existing `dist/sounds/v1/` output:

```sh
npm run package:from-dist
```

Resolve the default runtime source example:

```sh
npm run resolve:example
```

Resolve a SaaS-safe success request:

```sh
npm run resolve:saas
```

Resolve a metadata-only request:

```sh
npm run resolve:metadata
```

Check an expected runtime rejection:

```sh
npm run resolve:expected-rejection
```

Check resolver output shape:

```sh
npm run check:resolver-output
```

Render the local Karplus-Strong prototype:

```sh
npm run render:karplus
```

Recommended local workflow:

```sh
npm run ci
npm run render:karplus
```

Expanded CI-equivalent workflow:

```sh
npm run validate
npm run build:skip-validation
npm run resolve:example
npm run resolve:saas
npm run resolve:metadata
npm run resolve:expected-rejection
npm run check:resolver-output
npm run package:from-dist
npm run check:boundaries
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

Expected resolver output check:

```txt
Resolver output check OK
Checked complianceRequirements, compliancePlan, complianceDiagnostics, report booleans, and expected rejection shape.
```

Expected package output:

```txt
Package OK
Generated: release/instrument-atlas-sounds-v0.1.0.zip
Archive root: sounds/v1/
Included files: 31
Size: <size>
```

## Validation and CI checks

The validation script checks source metadata and policy integrity:

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
- duplicate policy array values
- policy allow/deny overlap checks
- policy license group references
- policy and license group semantic conflicts
- deprecated attribution field checks

CI also checks runtime behavior and generated package boundaries:

```txt
npm run resolve:example
npm run resolve:saas
npm run resolve:metadata
npm run resolve:expected-rejection
npm run check:resolver-output
npm run package:from-dist
npm run check:boundaries
```

## Build process

The build script:

1. Runs validation by default, unless `--skip-validation` is provided.
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
  "policyId": "saas-safe",
  "runtime": {
    "allowStatuses": [
      "production",
      "production_candidate",
      "prototype"
    ],
    "allowMetadataOnly": false
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
license-groups/*.json
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
selectedSource.licenseGroups
candidates
rejectedSources
rejectedSources[].reason
rejectedSources[].licenseGroups
rejectionReasons

complianceRequirements
complianceRequirements.source
complianceRequirements.policy
complianceRequirements.effective

compliancePlan

complianceDiagnostics
complianceDiagnostics.reasons
complianceDiagnostics.matchedPolicyRules

noticeReportRequired
attributionReportRequired
complianceReportRequired
```

### Compliance output semantics

The resolver separates compliance output into three layers.

```txt
complianceRequirements
  Structured requirements from the selected source, selected policy, and effective combined result.

compliancePlan
  Application behavior hints derived from source, policy, runtime readiness, and execution target.

complianceDiagnostics
  Explanation data for debugging, logs, administrator views, and audit trails.
```

Use `complianceRequirements` when exact source, policy, and effective requirement boundaries matter.

Use `compliancePlan` when an application needs to decide whether to render, warn, block download, or require additional review.

Use `complianceDiagnostics` when a developer or administrator needs to understand why a source was selected and why a compliance plan was produced.

`compliancePlan` is application behavior guidance, not legal advice or a legal verdict.

`noticeReportRequired`, `attributionReportRequired`, and `complianceReportRequired` are convenience booleans derived from `complianceRequirements.effective`.

Applications that need precise behavior should prefer:

```txt
complianceRequirements.effective.noticeReportRequired
complianceRequirements.effective.attributionReportRequired
complianceRequirements.effective.complianceReportRequired
```

instead of relying only on the top-level convenience booleans.

`attributionReportRequired` means that the selected source requires creator or generated-output attribution handling, such as CC-BY-style attribution.

`complianceReportRequired` is broader. It may be true because a policy requires audit/report capability, because notices must be preserved, because source disclosure must be reviewed, or because creator/output attribution is required.

A SaaS-safe MIT/BSD/Apache-style source may therefore have:

```txt
noticeReportRequired: true
attributionReportRequired: false
complianceReportRequired: true
```

### complianceRequirements

`complianceRequirements.source` describes requirements from the selected source license metadata.

Examples:

```txt
noticeRequired
licenseTextRequired
noticeReportRequired
creatorAttributionRequired
outputAttributionRequired
sourceDisclosureRequired
networkSourceDisclosureRequired
```

`complianceRequirements.policy` describes requirements from the selected policy.

Examples:

```txt
requiresNoticeReport
requiresComplianceReportCapability
requiresAttributionReportCapability
requiresExplicitConsent
requiresSourceDisclosureReview
requiresNetworkSourceDisclosureReview
```

Policy capability fields describe what the consuming application must be able to handle. They do not automatically mean that the selected source itself requires creator or output attribution.

`complianceRequirements.effective` combines source and policy requirements into final requirements that the consuming application should handle.

Examples:

```txt
noticeReportRequired
attributionReportRequired
complianceReportRequired
explicitConsentRequired
sourceDisclosureReviewRequired
networkSourceDisclosureReviewRequired
```

This separation prevents MIT/BSD/Apache notice preservation from being confused with CC-BY-style creator or output attribution.

If no source is selected, `complianceRequirements` is `null`.

### compliancePlan

`compliancePlan` is action-oriented.

It helps consuming applications decide what to do with the selected source.

Fields include:

```txt
canRender
canDistributeToClient
canUseInSaaS
requiresUserConsent
requiresLicenseNotice
requiresLicenseText
requiresNoticeReport
requiresAttributionReport
requiresComplianceReport
requiresCreatorAttribution
requiresOutputAttribution
requiresSourceDisclosureReview
requiresNetworkDisclosureReview
shouldBlockDownload
shouldShowWarning
warningLevel
```

`warningLevel` is intended for application UI and logs.

Current values:

```txt
none
notice
warning
blocked
```

A `blocked` warning level means the source should not be automatically rendered, downloaded, or used without resolving the blocking condition.

A `notice` warning level usually means the source may be usable, but the consuming application should preserve notices, generate reports, or show compliance information.

### complianceDiagnostics

`complianceDiagnostics` is explanation-oriented.

It is intended for debugging, logs, administrator views, and audit trails.

Fields include:

```txt
policyId
sourceLicenseGroups
reasons
matchedPolicyRules
```

`complianceDiagnostics.reasons` lists machine-readable explanation codes.

`complianceDiagnostics.matchedPolicyRules` shows which policy allow or deny rule groups matched the selected source.

`rejectionReasons` and `complianceDiagnostics` have different roles:

```txt
rejectionReasons
  Summarizes why rejected candidates were rejected.

complianceDiagnostics
  Explains the selected source.
```

`rejectedSources[].reason` provides per-source rejection details.

`rejectionReasons` provides a reason-count summary for quick diagnostics.

The resolver enforces policy license groups.

If a policy defines `allowLicenseGroups`, a source must match at least one allowed group.

If a policy defines `denyLicenseGroups`, a source matching any denied group is rejected.

Deny rules win over allow rules.

The resolver does not execute third-party engines.

It only selects a compatible source definition based on the built runtime catalog and the selected policy.

### Runtime readiness

The resolver does not select metadata-only sources by default.

Default allowed source statuses:

```txt
production
production_candidate
prototype
```

The following statuses are excluded by default:

```txt
planned
disabled
```

A consuming application may explicitly allow metadata-only resolution for discovery, planning, or UI preview workflows:

```json
{
  "runtime": {
    "allowStatuses": [
      "production",
      "production_candidate",
      "prototype",
      "experimental",
      "planned"
    ],
    "allowMetadataOnly": true
  }
}
```

Metadata-only resolution should not be treated as render readiness.

A selected `planned` source means that the source is known to the registry, not that it can already generate audio.

### Expected rejection example

Some sources are intentionally listed before they are render-ready.

For example, `src_chowkick_kick_model` is a planned source for `inst_kick_drum`.

The default runtime resolver must reject planned sources unless metadata-only resolution is explicitly allowed.

Run:

```sh
npm run resolve:expected-rejection
```

This command succeeds only when the expected rejection occurs.

## Consumer flow

A consuming application should use this flow:

```txt
1. Load Instrument Atlas metadata.
2. Let the user search or select an instrument.
3. Load the Instrument Atlas Sounds manifest.
4. Load the by-instrument index and the selected license policy.
5. Find available sound sources for the selected Instrument Atlas instrument ID.
6. Filter sources using the application license policy.
7. Enforce runtime readiness and execution target requirements.
8. Prefer physical_model sources when available.
9. Fall back to sample_instrument, one_shot_sample, or synth_patch sources when needed.
10. Read complianceRequirements to understand source, policy, and effective obligations.
11. Read compliancePlan to decide whether to render, warn, block download, or require review.
12. Use complianceDiagnostics for logs, administrator views, and audit trails.
13. Select a runnable source definition.
14. Send a render request to a client or server engine only when the selected source is actually runnable.
15. Return audio plus notice, attribution, or compliance report data when required.
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
