import {
  MIDI_NOTE_MESSAGE_TYPE,
  type MidiNoteMessage,
} from "./midi-note-message";

const MIDI_MESSAGE_TYPE_MASK = 0xf0;
const MIDI_CHANNEL_MASK = 0x0f;
const MIDI_NOTE_OFF_MESSAGE_TYPE = 0x80;
const MIDI_NOTE_ON_MESSAGE_TYPE = 0x90;

export function parseMidiNoteMessage(
  data: Uint8Array<ArrayBuffer> | null,
): MidiNoteMessage | undefined {
  if (!data || data.length < 3) {
    return;
  }

  const [statusByte, note, velocity] = data;
  const messageType = statusByte & MIDI_MESSAGE_TYPE_MASK;
  const channel = statusByte & MIDI_CHANNEL_MASK;

  if (messageType === MIDI_NOTE_ON_MESSAGE_TYPE && velocity > 0) {
    return {
      type: MIDI_NOTE_MESSAGE_TYPE.ON,
      channel,
      note,
      velocity,
    };
  }

  if (
    messageType === MIDI_NOTE_OFF_MESSAGE_TYPE ||
    (messageType === MIDI_NOTE_ON_MESSAGE_TYPE && velocity === 0)
  ) {
    return { type: MIDI_NOTE_MESSAGE_TYPE.OFF, channel, note };
  }
}
