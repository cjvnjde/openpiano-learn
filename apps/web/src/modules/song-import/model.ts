export const PART_ROLE = {
  ACCOMPANIMENT: "accompaniment",
  LEFT: "left",
  RIGHT: "right",
} as const;

export const IMPORT_WARNING_CODE = {
  COMPLEX_NAVIGATION: "complex-navigation",
  FRACTIONAL_DIVISIONS: "fractional-divisions",
  GRACE_PLAYBACK: "grace-playback",
  LARGE_MEASURE_COUNT: "large-measure-count",
  LARGE_NOTE_COUNT: "large-note-count",
  MISSING_DIVISIONS: "missing-divisions",
  MISSING_INITIAL_TEMPO: "missing-initial-tempo",
  MISSING_TEMPO: "missing-tempo",
  PPQ_QUANTIZED: "ppq-quantized",
  WRITTEN_REPEATS: "written-repeats",
} as const;

export const NORMALIZED_SONG_SCHEMA_VERSION = 1;

export type ImportWarningCode =
  (typeof IMPORT_WARNING_CODE)[keyof typeof IMPORT_WARNING_CODE];

export type PartRole = (typeof PART_ROLE)[keyof typeof PART_ROLE];

export type ImportWarning = {
  code: ImportWarningCode;
  message: string;
  measureIndex?: number;
};

export type SongMetadata = {
  title: string;
  composer?: string;
  arranger?: string;
  copyright?: string;
};

export type SongPart = {
  id: string;
  name: string;
  role: PartRole;
  staves: number;
};

export type SourceNoteRef = {
  partId: string;
  measureIndex: number;
  childIndex: number;
  staff?: number;
  voice?: string;
};

export type NoteEvent = {
  id: string;
  pitch: number;
  startTick: number;
  endTick: number;
  velocity: number;
  partId: string;
  role: PartRole;
  staff?: number;
  voice?: string;
  tiedFromPrevious: boolean;
  tiedToNext: boolean;
  grace: boolean;
  fingerings: readonly string[];
  sourceRef: SourceNoteRef;
};

export type Measure = {
  id: string;
  sourceIndex: number;
  displayedNumber: string;
  startTick: number;
  endTick: number;
};

export type TempoChange = {
  tick: number;
  bpm: number;
};

export type TimeSignatureChange = {
  tick: number;
  beats: number;
  beatType: number;
};

export type KeySignatureChange = {
  tick: number;
  fifths: number;
  mode?: string;
};

export type NormalizedSong = {
  schemaVersion: typeof NORMALIZED_SONG_SCHEMA_VERSION;
  id: string;
  sourceHash: string;
  metadata: SongMetadata;
  ppq: number;
  durationTicks: number;
  tempoChanges: readonly TempoChange[];
  timeSignatures: readonly TimeSignatureChange[];
  keySignatures: readonly KeySignatureChange[];
  parts: readonly SongPart[];
  measures: readonly Measure[];
  notes: readonly NoteEvent[];
  warnings: readonly ImportWarning[];
};

export type ImportSummary = {
  measures: number;
  notes: number;
  durationSeconds: number;
  tempoMinimum: number;
  tempoMaximum: number;
  staves: number;
};

export type ImportedSong = {
  song: NormalizedSong;
  summary: ImportSummary;
};
