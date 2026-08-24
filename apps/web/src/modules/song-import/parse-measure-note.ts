import { assert } from "../../shared/lib/assert";
import { PART_ROLE, type NoteEvent } from "./model";
import {
  attributesOf,
  childText,
  childrenNamed,
  firstNamed,
  type OrderedNode,
} from "./musicxml-nodes";
import { fingeringTexts, pitchFromNote } from "./note-details";
import { parsePositiveNumber, type ParsedPart } from "./score-structure";

const TIE_TYPE = {
  START: "start",
  STOP: "stop",
} as const;

type NoteContext = {
  timeline: { notes: NoteEvent[] };
  part: ParsedPart;
  partIndex: number;
  measureIndex: number;
  childIndex: number;
  measureStart: number;
  ppq: number;
};

type NoteMeasureState = {
  cursor: number;
  maximumCursor: number;
  previousStart: number;
  previousVoice: string;
};

function noteDuration(children: readonly OrderedNode[], measureIndex: number) {
  const durationText = childText(children, "duration");
  const grace = Boolean(firstNamed(children, "grace"));
  const duration = durationText
    ? parsePositiveNumber(durationText, "Note duration")
    : 0;

  assert(
    grace || duration !== 0,
    `Note lacks duration in measure ${measureIndex + 1}`,
  );

  return { duration, grace };
}

function noteRole(partIndex: number, staff: number | undefined) {
  if (partIndex > 0) {
    return PART_ROLE.ACCOMPANIMENT;
  }

  return staff === 2 ? PART_ROLE.LEFT : PART_ROLE.RIGHT;
}

function addPitchedNote(
  children: readonly OrderedNode[],
  context: NoteContext,
  start: number,
  durationTicks: number,
  grace: boolean,
) {
  const pitch = pitchFromNote(children);

  if (pitch === undefined) {
    return;
  }

  const staffText = childText(children, "staff");
  const staff = staffText ? Number(staffText) : undefined;

  assert(
    staff === undefined || (Number.isInteger(staff) && staff > 0),
    "MusicXML note staff must be a positive integer",
  );

  const voice = childText(children, "voice");
  const tieTypes = childrenNamed(children, "tie").map((tie) => {
    return String(attributesOf(tie)?.type ?? "");
  });
  const noteId = `${context.part.id}-m${context.measureIndex}-n${context.childIndex}`;
  const sourceRef = {
    partId: context.part.id,
    measureIndex: context.measureIndex,
    childIndex: context.childIndex,
    ...(staff !== undefined ? { staff } : {}),
    ...(voice ? { voice } : {}),
  };

  context.timeline.notes.push({
    id: noteId,
    pitch,
    startTick: context.measureStart + start,
    endTick: context.measureStart + start + durationTicks,
    velocity: 80,
    partId: context.part.id,
    role: noteRole(context.partIndex, staff),
    ...(staff !== undefined ? { staff } : {}),
    ...(voice ? { voice } : {}),
    tiedFromPrevious: tieTypes.includes(TIE_TYPE.STOP),
    tiedToNext: tieTypes.includes(TIE_TYPE.START),
    grace,
    fingerings: fingeringTexts(children),
    sourceRef,
  });
}

export function applyNote(
  children: readonly OrderedNode[],
  context: NoteContext,
  divisions: number,
  measureState: NoteMeasureState,
) {
  const { duration, grace } = noteDuration(children, context.measureIndex);
  const durationTicks = Math.round((duration / divisions) * context.ppq);
  const voice = childText(children, "voice");
  const chord = Boolean(firstNamed(children, "chord"));
  const start =
    chord && (!voice || voice === measureState.previousVoice)
      ? measureState.previousStart
      : measureState.cursor;

  addPitchedNote(children, context, start, durationTicks, grace);

  measureState.previousStart = start;
  measureState.previousVoice = voice;

  if (!chord) {
    measureState.cursor += durationTicks;
  }

  measureState.maximumCursor = Math.max(
    measureState.maximumCursor,
    start + durationTicks,
    measureState.cursor,
  );
}
