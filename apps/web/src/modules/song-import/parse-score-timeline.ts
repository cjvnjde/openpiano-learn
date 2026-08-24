import { assert } from "../../shared/lib/assert";
import { IMPORT_WARNING_CODE, type ImportWarning } from "./model";
import { childrenNamed, elementChildren } from "./musicxml-nodes";
import {
  parseMeasure,
  type PartState,
  type ScoreTimeline,
} from "./parse-score-measure";
import type { ParsedPart } from "./score-structure";

const MAX_MEASURES = 5_000;
const MAX_NOTES = 100_000;

function createTimeline(): ScoreTimeline {
  return {
    notes: [],
    measures: [],
    tempoChanges: [],
    timeSignatures: [],
    keySignatures: [],
  };
}

function parsePart(
  part: ParsedPart,
  partIndex: number,
  ppq: number,
  timeline: ScoreTimeline,
) {
  const measureNodes = childrenNamed(elementChildren(part.node), "measure");

  assert(
    measureNodes.length <= MAX_MEASURES,
    `Score exceeds ${MAX_MEASURES} measures`,
  );

  const partState: PartState = { divisions: 1, measureStart: 0 };

  for (
    let measureIndex = 0;
    measureIndex < measureNodes.length;
    measureIndex += 1
  ) {
    const measureNode = measureNodes[measureIndex];

    if (measureNode) {
      parseMeasure(
        measureNode,
        part,
        partIndex,
        measureIndex,
        ppq,
        timeline,
        partState,
      );
    }
  }
}

function collectScaleWarnings(timeline: ScoreTimeline) {
  assert(
    timeline.notes.length <= MAX_NOTES,
    `Score exceeds ${MAX_NOTES} notes`,
  );

  const warnings: ImportWarning[] = [];

  if (timeline.notes.length > 20_000) {
    warnings.push({
      code: IMPORT_WARNING_CODE.LARGE_NOTE_COUNT,
      message: "Score exceeds tested 20,000-note rendering target.",
    });
  }

  if (timeline.measures.length > 500) {
    warnings.push({
      code: IMPORT_WARNING_CODE.LARGE_MEASURE_COUNT,
      message: "Score exceeds tested 500-measure rendering target.",
    });
  }

  return warnings;
}

export function parseScoreTimeline(parts: readonly ParsedPart[], ppq: number) {
  const timeline = createTimeline();

  for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
    const part = parts[partIndex];

    if (part) {
      parsePart(part, partIndex, ppq, timeline);
    }
  }

  const warnings = collectScaleWarnings(timeline);

  if (timeline.tempoChanges.length === 0) {
    timeline.tempoChanges.push({ tick: 0, bpm: 120 });
    warnings.push({
      code: IMPORT_WARNING_CODE.MISSING_TEMPO,
      message: "No tempo found; using 120 BPM.",
    });
  }

  assert(
    timeline.measures.length > 0 && timeline.measures.at(-1)?.endTick !== 0,
    "Score has no timed measures",
  );

  return { timeline, warnings };
}
