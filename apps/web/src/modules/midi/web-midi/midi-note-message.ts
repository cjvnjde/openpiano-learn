export const MIDI_NOTE_MESSAGE_TYPE = {
  ON: "note-on",
  OFF: "note-off",
} as const;

export type MidiNoteMessage =
  | Readonly<{
      type: typeof MIDI_NOTE_MESSAGE_TYPE.ON;
      channel: number;
      note: number;
      velocity: number;
    }>
  | Readonly<{
      type: typeof MIDI_NOTE_MESSAGE_TYPE.OFF;
      channel: number;
      note: number;
    }>;
