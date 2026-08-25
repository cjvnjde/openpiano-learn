import { Show, createSignal } from "solid-js";
import { MusicSheetRenderer } from "./music-sheet-renderer";
import "./sheet-renderer-page.css";

export function SheetRendererPage() {
  const [selectedFile, setSelectedFile] = createSignal<File>();

  const pickerHint = () => selectedFile()?.name ?? "Nothing is selected";

  return (
    <main class="sheet-renderer-page">
      <header class="sheet-renderer-hero">
        <p class="eyebrow">OpenPiano · Sheet renderer</p>
        <h1>Render MusicXML notation</h1>
        <p class="intro">
          Choose a MusicXML score and inspect the engraved notation produced by
          OpenSheetMusicDisplay. The file stays in this browser.
        </p>
      </header>

      <section
        class="sheet-renderer-workbench"
        aria-labelledby="sheet-renderer-heading"
      >
        <div class="sheet-renderer-workbench__copy">
          <p class="label">Local file</p>
          <h2 id="sheet-renderer-heading">Choose a score</h2>
          <p>
            Supports uncompressed <code>.musicxml</code> and <code>.xml</code>
            files, plus compressed <code>.mxl</code> scores.
          </p>
        </div>

        <label class="sheet-renderer-picker">
          <input
            type="file"
            accept=".musicxml,.xml,.mxl,application/vnd.recordare.musicxml+xml,application/vnd.recordare.musicxml"
            onClick={(event) => {
              event.currentTarget.value = "";
            }}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];

              if (file) {
                setSelectedFile(file);
              }
            }}
          />
          <span class="sheet-renderer-picker__action">Choose MusicXML</span>
          <span class="sheet-renderer-picker__hint">{pickerHint()}</span>
        </label>
      </section>

      <Show keyed when={selectedFile()}>
        {(file) => <MusicSheetRenderer file={file} />}
      </Show>
    </main>
  );
}
