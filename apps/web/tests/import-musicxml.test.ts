import { expect, test, vi } from "vitest";
import { importMusicXml } from "../src/modules/song-import/import-musicxml";
import {
  IMPORT_WARNING_CODE,
  PART_ROLE,
} from "../src/modules/song-import/model";

const SCORE = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC
  "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work><work-title>Practice Study</work-title></work>
  <identification>
    <creator type="composer">OpenPiano</creator>
    <rights>CC0</rights>
  </identification>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <key><fifths>1</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <direction><sound tempo="60"/></direction>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>2</duration><voice>1</voice><staff>1</staff>
      </note>
      <note>
        <chord/><pitch><step>E</step><octave>4</octave></pitch>
        <duration>2</duration><voice>1</voice><staff>1</staff>
      </note>
      <note>
        <pitch><step>D</step><alter>1</alter><octave>4</octave></pitch>
        <duration>2</duration><voice>1</voice><staff>1</staff>
      </note>
      <backup><duration>4</duration></backup>
      <note>
        <pitch><step>G</step><octave>2</octave></pitch>
        <duration>4</duration><voice>2</voice><staff>2</staff>
      </note>
    </measure>
    <measure number="2">
      <attributes><divisions>3</divisions></attributes>
      <direction><sound tempo="120"/></direction>
      <note>
        <pitch><step>A</step><octave>4</octave></pitch>
        <duration>3</duration><voice>1</voice><staff>1</staff>
        <tie type="start"/>
        <notations><technical><fingering>2</fingering></technical></notations>
      </note>
      <note><rest/><duration>3</duration><voice>1</voice></note>
      <barline location="right"><repeat direction="backward"/></barline>
    </measure>
  </part>
</score-partwise>`;

test("imports a partwise piano score into a tick timeline", async () => {
  const { song, summary } = await importMusicXml(SCORE, "practice-study");

  expect(song.metadata).toEqual({
    title: "Practice Study",
    composer: "OpenPiano",
    copyright: "CC0",
  });
  expect(song.ppq).toBe(480);
  expect(song.durationTicks).toBe(1_920);
  expect(song.tempoChanges).toEqual([
    { tick: 0, bpm: 60 },
    { tick: 960, bpm: 120 },
  ]);
  expect(song.timeSignatures).toEqual([{ tick: 0, beats: 4, beatType: 4 }]);
  expect(song.keySignatures).toEqual([{ tick: 0, fifths: 1, mode: "major" }]);
  expect(song.parts).toEqual([
    {
      id: "P1",
      name: "Piano",
      role: PART_ROLE.RIGHT,
      staves: 2,
    },
  ]);
  expect(
    song.notes.map((note) => ({
      pitch: note.pitch,
      startTick: note.startTick,
      endTick: note.endTick,
      role: note.role,
      fingerings: note.fingerings,
      tiedToNext: note.tiedToNext,
    })),
  ).toEqual([
    {
      pitch: 60,
      startTick: 0,
      endTick: 480,
      role: PART_ROLE.RIGHT,
      fingerings: [],
      tiedToNext: false,
    },
    {
      pitch: 64,
      startTick: 0,
      endTick: 480,
      role: PART_ROLE.RIGHT,
      fingerings: [],
      tiedToNext: false,
    },
    {
      pitch: 63,
      startTick: 480,
      endTick: 960,
      role: PART_ROLE.RIGHT,
      fingerings: [],
      tiedToNext: false,
    },
    {
      pitch: 43,
      startTick: 0,
      endTick: 960,
      role: PART_ROLE.LEFT,
      fingerings: [],
      tiedToNext: false,
    },
    {
      pitch: 69,
      startTick: 960,
      endTick: 1_440,
      role: PART_ROLE.RIGHT,
      fingerings: ["2"],
      tiedToNext: true,
    },
  ]);
  expect(song.measures).toEqual([
    {
      id: "measure-0",
      sourceIndex: 0,
      displayedNumber: "1",
      startTick: 0,
      endTick: 960,
    },
    {
      id: "measure-1",
      sourceIndex: 1,
      displayedNumber: "2",
      startTick: 960,
      endTick: 1_920,
    },
  ]);
  expect(summary).toEqual({
    measures: 2,
    notes: 5,
    durationSeconds: 3,
    tempoMinimum: 60,
    tempoMaximum: 120,
    staves: 2,
  });
  expect(song.sourceHash).toMatch(/^[a-f0-9]{64}$/u);
  expect(song.warnings).toEqual([
    {
      code: IMPORT_WARNING_CODE.WRITTEN_REPEATS,
      message:
        "Written repeats are not expanded; playback follows measure order.",
    },
  ]);
});

test("uses defaults when tempo and divisions are absent", async () => {
  const source = `<score-partwise>
    <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
    <part id="P1"><measure number="1"><note>
      <pitch><step>C</step><octave>4</octave></pitch><duration>1</duration>
    </note></measure></part>
  </score-partwise>`;

  const { song } = await importMusicXml(source, "defaults");

  expect(song.metadata.title).toBe("Untitled score");
  expect(song.ppq).toBe(480);
  expect(song.tempoChanges).toEqual([{ tick: 0, bpm: 120 }]);
  expect(song.warnings.map((warning) => warning.code)).toEqual([
    IMPORT_WARNING_CODE.MISSING_DIVISIONS,
    IMPORT_WARNING_CODE.MISSING_TEMPO,
  ]);
});

test("rejects unsupported MusicXML document roots", async () => {
  await expect(
    importMusicXml("<score-timewise/>", "unsupported"),
  ).rejects.toThrow(/Only MusicXML score-partwise documents are supported/u);
});

test("rejects entity declarations before parsing", async () => {
  const source = `<!DOCTYPE score-partwise [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
    <score-partwise><part-list/><part id="P1">&xxe;</part></score-partwise>`;

  await expect(importMusicXml(source, "unsafe")).rejects.toThrow(
    /Entity declarations are not allowed/u,
  );
});

test("logs and rejects a blank song id", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  try {
    await expect(importMusicXml("", " ")).rejects.toThrow(
      /Song id is required/u,
    );
    expect(consoleError).toHaveBeenCalledWith("Song id is required");
  } finally {
    consoleError.mockRestore();
  }
});
