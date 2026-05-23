# Third-Party Notices

This file tracks third-party engines, source libraries, sound libraries, and external references used or indexed by Instrument Atlas Sounds.

The repository may describe third-party sound sources before directly including their code or audio files.

A source being listed here does not automatically mean that its code or assets are vendored in this repository.

## Notice policy

Every third-party source should include:

- name
- upstream URL
- license
- license category
- whether code is vendored
- whether audio assets are mirrored
- intended execution target
- verification date
- notes

## Sources

No third-party source code or audio assets are currently vendored in this repository.

Initial candidates to evaluate:

### Synthesis ToolKit

- Name: Synthesis ToolKit
- Short name: STK
- Source type: physical modeling engine
- License: MIT-STK
- License category: permissive_code
- Code vendored: no
- Audio assets mirrored: no
- Intended execution target: server
- Status: planned
- Notes: Candidate for server-side physical modeling experiments.

### ChowKick

- Name: ChowKick
- Source type: physical modeling / circuit-modeled kick drum engine
- License: BSD-3-Clause
- License category: permissive_code
- Code vendored: no
- Audio assets mirrored: no
- Intended execution target: server
- Status: planned
- Notes: Candidate for kick drum and 808-style kick generation.

### Faust physical modeling libraries

- Name: Faust physical modeling libraries
- Source type: physical modeling DSP library
- License: function and library dependent
- License category: to_be_verified
- Code vendored: no
- Audio assets mirrored: no
- Intended execution target: client or server after verification
- Status: planned
- Notes: Function-level license verification is required before use.

### Mutable Instruments DSP

- Name: Mutable Instruments DSP
- Source type: synthesis and resonator DSP
- License: module dependent
- License category: to_be_verified
- Code vendored: no
- Audio assets mirrored: no
- Intended execution target: server after verification
- Status: planned
- Notes: STM32F projects may use permissive licenses, while some older projects may use GPL. Module-level verification is required.

### GPL server-only engines

- Name: GPL server-only physical modeling engines
- Source type: physical modeling engine
- License: GPL family
- License category: server_only_copyleft
- Code vendored: no
- Audio assets mirrored: no
- Intended execution target: server only
- Status: planned
- Notes: These sources must not be bundled into client-side code or distributed to users unless the consuming project complies with the relevant license.