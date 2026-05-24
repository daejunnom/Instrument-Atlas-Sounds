# Custom Karplus-Strong Plucked String

This directory contains a lightweight JavaScript prototype of a Karplus-Strong plucked-string physical model.

It is intended as the first real engine implementation for `src_custom_karplus_strong_pluck`.

## Purpose

This engine can generate simple plucked-string tones for early testing.

It is suitable for prototype mappings such as:

```txt
inst_acoustic_guitar
inst_harp
inst_lute
inst_koto
```

The output is not intended to replace a production-grade guitar, harp, or koto model yet.

## License

This implementation is part of Instrument Atlas Sounds and is licensed under the repository MIT License unless otherwise stated.

## Module layout

The Karplus-Strong prototype is split into client-safe rendering code and Node-only audio I/O.

```txt
karplus-strong-core.mjs
  Client/server-safe render core.
  Uses typed arrays and does not depend on Node Buffer, fs, or path.

wav-encode-browser.mjs
  Browser-safe WAV encoder.
  Uses ArrayBuffer, Uint8Array, and DataView.

wav-encode-node.mjs
  Node-only WAV helpers.
  Uses Buffer, fs, and path for local file output.

karplus-strong.mjs
  Client-safe compatibility aggregate module.
  Re-exports the core and browser encoder only.

karplus-strong-node.mjs
  Node compatibility aggregate module.
  Re-exports the core, browser encoder, and Node helpers.
```

Client applications should import from `karplus-strong-core.mjs` and `wav-encode-browser.mjs`.

Node tools may import from `wav-encode-node.mjs` or the Node aggregate `karplus-strong-node.mjs`.

## Current output

The local example renderer outputs 16-bit PCM WAV files.

FLAC or MP3 output should be handled later by a separate encoder or server-side post-processing pipeline.