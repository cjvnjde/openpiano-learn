import { assert } from "../../shared/lib/assert";
import {
  type KeySignatureChange,
  type TempoChange,
  type TimeSignatureChange,
} from "./model";
import {
  attributesOf,
  childText,
  elementChildren,
  firstNamed,
  type OrderedNode,
} from "./musicxml-nodes";
import { parsePositiveNumber } from "./score-structure";

type AttributeContext = {
  timeline: {
    timeSignatures: TimeSignatureChange[];
    keySignatures: KeySignatureChange[];
  };
  partIndex: number;
  measureIndex: number;
  measureStart: number;
};

type DirectionContext = {
  timeline: { tempoChanges: TempoChange[] };
  partIndex: number;
  measureStart: number;
};

type DivisionsState = { divisions: number };
type CursorState = { cursor: number };

function parseTimeSignature(
  children: readonly OrderedNode[],
  tick: number,
): TimeSignatureChange | undefined {
  const time = firstNamed(children, "time");

  if (!time) {
    return undefined;
  }

  const timeChildren = elementChildren(time);

  return {
    tick,
    beats: parsePositiveNumber(childText(timeChildren, "beats"), "Time beats"),
    beatType: parsePositiveNumber(
      childText(timeChildren, "beat-type"),
      "Time beat-type",
    ),
  };
}

function parseKeySignature(
  children: readonly OrderedNode[],
  tick: number,
): KeySignatureChange | undefined {
  const key = firstNamed(children, "key");

  if (!key) {
    return undefined;
  }

  const keyChildren = elementChildren(key);
  const fifths = Number(childText(keyChildren, "fifths") || 0);

  assert(Number.isInteger(fifths), "Key fifths must be an integer");

  const mode = childText(keyChildren, "mode");

  return {
    tick,
    fifths,
    ...(mode ? { mode } : {}),
  };
}

export function applyAttributes(
  children: readonly OrderedNode[],
  context: AttributeContext,
  partState: DivisionsState,
) {
  const divisionsText = childText(children, "divisions");

  if (divisionsText) {
    partState.divisions = parsePositiveNumber(
      divisionsText,
      `Divisions in measure ${context.measureIndex + 1}`,
    );
  }

  if (context.partIndex !== 0) {
    return;
  }

  const time = parseTimeSignature(children, context.measureStart);
  const key = parseKeySignature(children, context.measureStart);

  if (time) {
    context.timeline.timeSignatures.push(time);
  }

  if (key) {
    context.timeline.keySignatures.push(key);
  }
}

function tempoFromDirection(
  children: readonly OrderedNode[],
): number | undefined {
  const soundTempo = attributesOf(firstNamed(children, "sound"))?.tempo;
  const soundBpm = soundTempo === undefined ? 0 : Number(soundTempo);

  if (soundBpm > 0) {
    return soundBpm;
  }

  const directionType = firstNamed(children, "direction-type");
  const metronome = firstNamed(
    elementChildren(directionType ?? {}),
    "metronome",
  );
  const perMinute = childText(elementChildren(metronome ?? {}), "per-minute");
  const metronomeBpm = perMinute ? Number(perMinute) : 0;

  return metronomeBpm > 0 ? metronomeBpm : undefined;
}

export function applyDirection(
  children: readonly OrderedNode[],
  context: DirectionContext,
  measureState: CursorState,
) {
  if (context.partIndex !== 0) {
    return;
  }

  const bpm = tempoFromDirection(children);

  if (bpm !== undefined) {
    context.timeline.tempoChanges.push({
      tick: context.measureStart + measureState.cursor,
      bpm,
    });
  }
}
