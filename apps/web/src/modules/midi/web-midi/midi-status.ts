export const MIDI_STATUS = {
  PENDING: "pending",
  UNSUPPORTED: "unsupported",
  DENIED: "denied",
  READY: "ready",
} as const;

export type MidiStatus = (typeof MIDI_STATUS)[keyof typeof MIDI_STATUS];
