import { assert } from "../../shared/lib/assert";
import type {
  KeySignatureChange,
  Measure,
  NoteEvent,
  TempoChange,
  TimeSignatureChange,
} from "./model";
import {
  attributesOf,
  childText,
  elementChildren,
  elementName,
  type OrderedNode,
} from "./musicxml-nodes";
import { applyAttributes, applyDirection } from "./parse-measure-metadata";
import { applyNote } from "./parse-measure-note";
import { parsePositiveNumber, type ParsedPart } from "./score-structure";

const CURSOR_MOVE = {
  BACKWARD: "backup",
  FORWARD: "forward",
} as const;

type CursorMove = (typeof CURSOR_MOVE)[keyof typeof CURSOR_MOVE];

export type ScoreTimeline = {
  notes: NoteEvent[];
  measures: Measure[];
  tempoChanges: TempoChange[];
  timeSignatures: TimeSignatureChange[];
  keySignatures: KeySignatureChange[];
};

export type PartState = {
  divisions: number;
  measureStart: number;
};

type MeasureState = {
  cursor: number;
  maximumCursor: number;
  previousStart: number;
  previousVoice: string;
};

type ChildContext = {
  timeline: ScoreTimeline;
  part: ParsedPart;
  partIndex: number;
  measureIndex: number;
  childIndex: number;
  measureStart: number;
  ppq: number;
};

function moveCursor(
  name: CursorMove,
  children: readonly OrderedNode[],
  context: ChildContext,
  partState: PartState,
  measureState: MeasureState,
) {
  const duration = parsePositiveNumber(
    childText(children, "duration"),
    `${name} duration`,
  );
  const ticks = Math.round((duration / partState.divisions) * context.ppq);

  measureState.cursor += name === CURSOR_MOVE.BACKWARD ? -ticks : ticks;

  assert(
    measureState.cursor >= 0,
    `Backup before measure start in measure ${context.measureIndex + 1}`,
  );

  measureState.maximumCursor = Math.max(
    measureState.maximumCursor,
    measureState.cursor,
  );
}

function applyMeasureChild(
  child: OrderedNode,
  context: ChildContext,
  partState: PartState,
  measureState: MeasureState,
) {
  const name = elementName(child);
  const children = elementChildren(child);

  if (name === "attributes") {
    applyAttributes(children, context, partState);
    return;
  }

  if (name === "direction") {
    applyDirection(children, context, measureState);
    return;
  }

  if (name === CURSOR_MOVE.BACKWARD || name === CURSOR_MOVE.FORWARD) {
    moveCursor(name, children, context, partState, measureState);
    return;
  }

  if (name === "note") {
    applyNote(children, context, partState.divisions, measureState);
  }
}

function addCanonicalMeasure(
  timeline: ScoreTimeline,
  measureNode: OrderedNode,
  measureIndex: number,
  startTick: number,
  duration: number,
) {
  const displayedNumber = String(
    attributesOf(measureNode)?.number ?? measureIndex + 1,
  );

  timeline.measures.push({
    id: `measure-${measureIndex}`,
    sourceIndex: measureIndex,
    displayedNumber,
    startTick,
    endTick: startTick + duration,
  });
}

export function parseMeasure(
  measureNode: OrderedNode,
  part: ParsedPart,
  partIndex: number,
  measureIndex: number,
  ppq: number,
  timeline: ScoreTimeline,
  partState: PartState,
) {
  const measureChildren = elementChildren(measureNode);
  const measureState: MeasureState = {
    cursor: 0,
    maximumCursor: 0,
    previousStart: 0,
    previousVoice: "",
  };

  for (
    let childIndex = 0;
    childIndex < measureChildren.length;
    childIndex += 1
  ) {
    const child = measureChildren[childIndex];

    if (child) {
      applyMeasureChild(
        child,
        {
          timeline,
          part,
          partIndex,
          measureIndex,
          childIndex,
          measureStart: partState.measureStart,
          ppq,
        },
        partState,
        measureState,
      );
    }
  }

  if (partIndex === 0) {
    addCanonicalMeasure(
      timeline,
      measureNode,
      measureIndex,
      partState.measureStart,
      measureState.maximumCursor,
    );
  }

  partState.measureStart += measureState.maximumCursor;
}
