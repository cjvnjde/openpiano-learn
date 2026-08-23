import {
  createMidiNoteTracker,
  type PressedMidiNote,
} from "./create-midi-note-tracker";
import { parseMidiNoteMessage } from "./parse-midi-note-message";
import type { MidiNoteMessage } from "./midi-note-message";

function listenToMidiInput(
  input: MIDIInput,
  listener: (message: MidiNoteMessage) => void,
) {
  const messageListener = (event: MIDIMessageEvent) => {
    const message = parseMidiNoteMessage(event.data);

    if (!message) {
      return;
    }

    listener(message);
  };

  input.addEventListener("midimessage", messageListener);

  void input.open().catch((error: unknown) => {
    reportError(error);
  });

  return () => {
    input.removeEventListener("midimessage", messageListener);

    void input.close().catch((error: unknown) => {
      reportError(error);
    });
  };
}

export function listenToMidiInputs(
  inputs: readonly MIDIInput[],
  updatePressedNotes: (notes: readonly PressedMidiNote[]) => void,
) {
  const noteTracker = createMidiNoteTracker();
  const stopInputListeners = inputs.map((input) =>
    listenToMidiInput(input, (message) => {
      updatePressedNotes(noteTracker.handleMessage(input.id, message));
    }),
  );

  return () => {
    for (const stopListening of stopInputListeners) {
      stopListening();
    }
  };
}
