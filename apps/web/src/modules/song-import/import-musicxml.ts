import { assert } from "../../shared/lib/assert";
import {
  IMPORT_WARNING_CODE,
  NORMALIZED_SONG_SCHEMA_VERSION,
  PART_ROLE,
  type ImportedSong,
  type ImportWarning,
  type NormalizedSong,
  type SongPart,
  type TempoChange,
} from "./model";
import { parseMusicXmlDocument } from "./parse-musicxml-document";
import { parseScoreTimeline } from "./parse-score-timeline";
import {
  calculatePpq,
  collectCompatibilityWarnings,
  parseMetadata,
  parseParts,
} from "./score-structure";

async function hashSource(bytes: Uint8Array<ArrayBuffer>) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  let hash = "";

  for (const byte of new Uint8Array(digest)) {
    hash += byte.toString(16).padStart(2, "0");
  }

  return hash;
}

function normalizeTempoChanges(tempoChanges: readonly TempoChange[]) {
  const ordered = tempoChanges.toSorted(
    (left, right) => left.tick - right.tick,
  );
  const normalized: TempoChange[] = [];
  let warning: ImportWarning | undefined;

  if (ordered[0]?.tick !== 0) {
    normalized.push({ tick: 0, bpm: 120 });
    warning = {
      code: IMPORT_WARNING_CODE.MISSING_INITIAL_TEMPO,
      message: "No initial tempo found; using 120 BPM until the first change.",
    };
  }

  for (const change of ordered) {
    const previous = normalized.at(-1);

    if (previous?.tick === change.tick) {
      normalized[normalized.length - 1] = change;
    } else {
      normalized.push(change);
    }
  }

  return {
    tempoChanges: normalized,
    warnings: warning ? [warning] : [],
  };
}

function durationInSeconds(
  durationTicks: number,
  ppq: number,
  tempoChanges: readonly TempoChange[],
) {
  let seconds = 0;
  let previousTick = 0;
  let bpm = 120;

  for (const change of tempoChanges) {
    const changeTick = Math.min(change.tick, durationTicks);
    seconds += ((changeTick - previousTick) * 60) / (ppq * bpm);
    previousTick = changeTick;
    bpm = change.bpm;

    if (change.tick >= durationTicks) {
      return seconds;
    }
  }

  seconds += ((durationTicks - previousTick) * 60) / (ppq * bpm);

  return seconds;
}

export async function importMusicXml(
  source: string,
  songId: string,
): Promise<ImportedSong> {
  assert(songId.trim(), "Song id is required");

  const { rootChildren, sourceBytes } = parseMusicXmlDocument(source);
  const compatibilityWarnings = collectCompatibilityWarnings(rootChildren);
  const { ppq, warnings: ppqWarnings } = calculatePpq(rootChildren);
  const parsedParts = parseParts(rootChildren);

  assert(parsedParts.length > 0, "MusicXML score has no parts");

  const { timeline, warnings: timelineWarnings } = parseScoreTimeline(
    parsedParts,
    ppq,
  );
  const { tempoChanges, warnings: tempoWarnings } = normalizeTempoChanges(
    timeline.tempoChanges,
  );
  const warnings = [
    ...compatibilityWarnings,
    ...ppqWarnings,
    ...timelineWarnings,
    ...tempoWarnings,
  ];
  const stavesByPart = new Map<string, number>();
  let durationTicks = timeline.measures.at(-1)?.endTick ?? 0;

  for (const note of timeline.notes) {
    stavesByPart.set(
      note.partId,
      Math.max(stavesByPart.get(note.partId) ?? 1, note.staff ?? 1),
    );
    durationTicks = Math.max(durationTicks, note.endTick);
  }

  const parts: SongPart[] = [];
  let maximumStaves = 1;

  for (let index = 0; index < parsedParts.length; index += 1) {
    const parsedPart = parsedParts[index];
    const staves = stavesByPart.get(parsedPart.id) ?? 1;

    maximumStaves = Math.max(maximumStaves, staves);
    parts.push({
      id: parsedPart.id,
      name: parsedPart.name,
      role: index === 0 ? PART_ROLE.RIGHT : PART_ROLE.ACCOMPANIMENT,
      staves,
    });
  }

  const sourceHash = await hashSource(sourceBytes);
  const song: NormalizedSong = {
    schemaVersion: NORMALIZED_SONG_SCHEMA_VERSION,
    id: songId,
    sourceHash,
    metadata: parseMetadata(rootChildren),
    ppq,
    durationTicks,
    tempoChanges,
    timeSignatures: timeline.timeSignatures,
    keySignatures: timeline.keySignatures,
    parts,
    measures: timeline.measures,
    notes: timeline.notes,
    warnings,
  };
  let tempoMinimum = tempoChanges[0]?.bpm ?? 120;
  let tempoMaximum = tempoMinimum;

  for (const tempoChange of tempoChanges) {
    tempoMinimum = Math.min(tempoMinimum, tempoChange.bpm);
    tempoMaximum = Math.max(tempoMaximum, tempoChange.bpm);
  }

  return {
    song,
    summary: {
      measures: song.measures.length,
      notes: song.notes.length,
      durationSeconds: durationInSeconds(durationTicks, ppq, tempoChanges),
      tempoMinimum,
      tempoMaximum,
      staves: maximumStaves,
    },
  };
}
