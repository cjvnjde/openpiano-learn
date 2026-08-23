export type MidiDevice = Readonly<{
  id: string;
  manufacturer: string | undefined;
  name: string;
}>;

export function getConnectedMidiInputs(inputs: MIDIAccess["inputs"]) {
  const connectedInputs: MIDIInput[] = [];

  inputs.forEach((input) => {
    if (input.state === "connected") {
      connectedInputs.push(input);
    }
  });

  return connectedInputs;
}

export function getMidiDevices(
  inputs: readonly MIDIInput[],
): readonly MidiDevice[] {
  return inputs
    .map((input) => ({
      id: input.id,
      manufacturer: input.manufacturer?.trim() || undefined,
      name: input.name?.trim() || "Unnamed MIDI input",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
