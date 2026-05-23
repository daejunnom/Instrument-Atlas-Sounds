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

## Current output

The local example renderer outputs 16-bit PCM WAV files.

FLAC or MP3 output should be handled later by a separate encoder or server-side post-processing pipeline.