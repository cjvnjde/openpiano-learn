import { createSignal, onSettled } from "solid-js";
import { isServer } from "@solidjs/web";
import {
  getConnectedMidiInputs,
  getMidiDevices,
  type MidiDevice,
} from "./web-midi/midi-devices";
import { listenToMidiInputs } from "./web-midi/listen-to-midi-inputs";
import { MIDI_STATUS, type MidiStatus } from "./web-midi/midi-status";
import { requestMidiAccess } from "./web-midi/request-midi-access";
import type { PressedMidiNote } from "./web-midi/create-midi-note-tracker";

export function createMidi() {
  const [status, setStatus] = createSignal<MidiStatus>(MIDI_STATUS.PENDING);
  const [devices, setDevices] = createSignal<readonly MidiDevice[]>([]);
  const [pressedNotes, setPressedNotes] = createSignal<
    readonly PressedMidiNote[]
  >([]);

  let stopListeningToInputs: (() => void) | undefined;
  let checkVersion = 0;

  const clearMidiState = () => {
    stopListeningToInputs?.();
    stopListeningToInputs = undefined;
    setDevices([]);
    setPressedNotes([]);
  };

  const runDeviceCheck = async () => {
    const version = ++checkVersion;

    clearMidiState();
    setStatus(MIDI_STATUS.PENDING);

    const result = await requestMidiAccess();

    if (version !== checkVersion) {
      return;
    }

    setStatus(result.status);

    if (result.status !== MIDI_STATUS.READY) {
      return;
    }

    const inputs = getConnectedMidiInputs(result.access.inputs);

    setDevices(getMidiDevices(inputs));
    stopListeningToInputs = listenToMidiInputs(inputs, setPressedNotes);
  };

  const checkDevices = () => {
    void runDeviceCheck();
  };

  onSettled(() => {
    if (isServer) {
      return;
    }

    checkDevices();

    return () => {
      checkVersion += 1;
      stopListeningToInputs?.();
    };
  });

  return { status, devices, pressedNotes, checkDevices };
}
