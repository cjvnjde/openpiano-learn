import { MIDI_STATUS } from "./midi-status";

type MidiAccessResult =
  | Readonly<{ status: typeof MIDI_STATUS.READY; access: MIDIAccess }>
  | Readonly<{
      status: typeof MIDI_STATUS.UNSUPPORTED | typeof MIDI_STATUS.DENIED;
    }>;

export async function requestMidiAccess(): Promise<MidiAccessResult> {
  if (typeof navigator.requestMIDIAccess !== "function") {
    return { status: MIDI_STATUS.UNSUPPORTED };
  }

  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });

    return { status: MIDI_STATUS.READY, access };
  } catch {
    return { status: MIDI_STATUS.DENIED };
  }
}
