import {
  MIDI_NOTE_MESSAGE_TYPE,
  type MidiNoteMessage,
} from "./midi-note-message";

export type PressedMidiNote = Readonly<{
  note: number;
  velocity: number;
}>;

type ActiveMidiNote = Readonly<{
  note: number;
  velocity: number;
}>;

function projectPressedNotes(
  activeNotes: ReadonlyMap<string, ActiveMidiNote>,
): readonly PressedMidiNote[] {
  const velocityByNote = new Map<number, number>();

  for (const activeNote of activeNotes.values()) {
    const currentVelocity = velocityByNote.get(activeNote.note) ?? 0;

    if (activeNote.velocity > currentVelocity) {
      velocityByNote.set(activeNote.note, activeNote.velocity);
    }
  }

  return Array.from(velocityByNote, ([note, velocity]) => ({
    note,
    velocity,
  })).sort((left, right) => left.note - right.note);
}

export function createMidiNoteTracker() {
  const activeNotes = new Map<string, ActiveMidiNote>();
  let pressedNotes: readonly PressedMidiNote[] = [];

  const handleMessage = (inputId: string, message: MidiNoteMessage) => {
    const key = `${inputId}:${message.channel}:${message.note}`;

    if (message.type === MIDI_NOTE_MESSAGE_TYPE.OFF) {
      if (!activeNotes.delete(key)) {
        return pressedNotes;
      }
    } else {
      activeNotes.set(key, {
        note: message.note,
        velocity: message.velocity,
      });
    }

    pressedNotes = projectPressedNotes(activeNotes);

    return pressedNotes;
  };

  return { handleMessage };
}
