import { Show, createSignal } from "solid-js";
import { ImportResult } from "./import-result";
import { importMusicXml } from "./import-musicxml";
import type { ImportedSong } from "./model";
import "./song-import-page.css";

const IMPORT_STATUS = {
  ERROR: "error",
  IDLE: "idle",
  IMPORTING: "importing",
  SUCCESS: "success",
} as const;

type ImportState =
  | { status: typeof IMPORT_STATUS.IDLE }
  | { status: typeof IMPORT_STATUS.IMPORTING; fileName: string }
  | {
      status: typeof IMPORT_STATUS.SUCCESS;
      fileName: string;
      result: ImportedSong;
    }
  | { status: typeof IMPORT_STATUS.ERROR; fileName: string; message: string };

export function SongImportPage() {
  const [state, setState] = createSignal<ImportState>({
    status: IMPORT_STATUS.IDLE,
  });
  let importSequence = 0;

  const importFile = async (file: File) => {
    const sequence = ++importSequence;
    setState({ status: IMPORT_STATUS.IMPORTING, fileName: file.name });

    try {
      const source = await file.text();
      const result = await importMusicXml(source, crypto.randomUUID());

      if (sequence !== importSequence) {
        return;
      }

      setState({
        status: IMPORT_STATUS.SUCCESS,
        fileName: file.name,
        result,
      });
    } catch (cause) {
      if (sequence !== importSequence) {
        return;
      }

      setState({
        status: IMPORT_STATUS.ERROR,
        fileName: file.name,
        message:
          cause instanceof Error ? cause.message : "Could not import MusicXML",
      });
    }
  };

  const successfulImport = () => {
    const currentState = state();

    return currentState.status === IMPORT_STATUS.SUCCESS
      ? currentState
      : undefined;
  };

  const failedImport = () => {
    const currentState = state();

    return currentState.status === IMPORT_STATUS.ERROR
      ? currentState
      : undefined;
  };

  const pickerHint = () => {
    const currentState = state();

    return currentState.status === IMPORT_STATUS.IMPORTING
      ? `Reading ${currentState.fileName}…`
      : "Nothing is uploaded";
  };

  return (
    <main class="import-page">
      <header class="import-hero">
        <p class="eyebrow">OpenPiano · Import diagnostics</p>
        <h1>Test a MusicXML score</h1>
        <p class="intro">
          Choose an uncompressed MusicXML file to inspect the exact score data
          OpenPiano can use for practice. The file stays in this browser.
        </p>
      </header>

      <section class="import-workbench" aria-labelledby="import-heading">
        <div class="import-workbench__copy">
          <p class="label">Local file</p>
          <h2 id="import-heading">Choose a score</h2>
          <p>
            Supported input: partwise <code>.musicxml</code> files up to 10 MiB.
          </p>
        </div>

        <label class="import-picker">
          <input
            type="file"
            accept=".musicxml,application/vnd.recordare.musicxml+xml"
            onClick={(event) => {
              event.currentTarget.value = "";
            }}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];

              if (file) {
                void importFile(file);
              }
            }}
          />
          <span class="import-picker__action">Choose MusicXML</span>
          <span class="import-picker__hint">{pickerHint()}</span>
        </label>
      </section>

      <Show when={state().status === IMPORT_STATUS.IMPORTING}>
        <p class="import-feedback" role="status">
          Parsing score and building its note timeline…
        </p>
      </Show>

      <Show when={failedImport()}>
        {(failure) => (
          <div class="import-error" role="alert">
            <strong>Could not import {failure().fileName}</strong>
            <span>{failure().message}</span>
          </div>
        )}
      </Show>

      <Show when={successfulImport()}>
        {(success) => (
          <ImportResult
            fileName={success().fileName}
            result={success().result}
          />
        )}
      </Show>
    </main>
  );
}
