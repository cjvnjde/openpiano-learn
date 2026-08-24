import { assert } from "../../shared/lib/assert";
import {
  childText,
  childrenNamed,
  collectElements,
  elementChildren,
  firstNamed,
  textContent,
  type OrderedNode,
} from "./musicxml-nodes";

const SEMITONE_BY_STEP: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function pitchFromNote(
  children: readonly OrderedNode[],
): number | undefined {
  const pitch = firstNamed(children, "pitch");

  if (!pitch) {
    return undefined;
  }

  const pitchChildren = elementChildren(pitch);
  const step = childText(pitchChildren, "step").toUpperCase();
  const stepSemitone = SEMITONE_BY_STEP[step];
  const octave = Number(childText(pitchChildren, "octave"));
  const alterText = childText(pitchChildren, "alter");
  const alter = alterText ? Number(alterText) : 0;

  assert(
    stepSemitone !== undefined && Number.isInteger(octave),
    "MusicXML note has an invalid pitch",
  );
  assert(
    Number.isInteger(alter),
    "Microtonal MusicXML notes are not supported",
  );

  const midiPitch = (octave + 1) * 12 + stepSemitone + alter;

  assert(
    midiPitch >= 0 && midiPitch <= 127,
    `MusicXML pitch ${step}${octave} is outside MIDI range`,
  );

  return midiPitch;
}

export function fingeringTexts(children: readonly OrderedNode[]) {
  const fingeringNodes: OrderedNode[] = [];

  for (const notations of childrenNamed(children, "notations")) {
    collectElements(elementChildren(notations), "fingering", fingeringNodes);
  }

  return fingeringNodes.map(textContent).filter(Boolean);
}
