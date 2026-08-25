import { Show, createSignal } from "solid-js";
import { MusicSheetRenderer } from "./music-sheet-renderer";
import type { SheetLayout } from "./render-music-sheet";
import "./sheet-renderer-page.css";

type SheetRendererPageContentProps = {
  eyebrow: string;
  intro: string;
  layout: SheetLayout;
  title: string;
};

const SheetRendererPageContent = (props: SheetRendererPageContentProps) => {
  const [selectedFile, setSelectedFile] = createSignal<File>();

  const pickerHint = () => selectedFile()?.name ?? "Nothing is selected";

  return (
    <main
      class={
        props.layout === "single-line"
          ? "sheet-renderer-page sheet-renderer-page--single-line"
          : "sheet-renderer-page"
      }
    >
      <header class="sheet-renderer-hero">
        <p class="eyebrow">{props.eyebrow}</p>
        <h1>{props.title}</h1>
        <p class="intro">{props.intro}</p>
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
        {(file) => <MusicSheetRenderer file={file} layout={props.layout} />}
      </Show>
    </main>
  );
};

export const SheetRendererPage = () => (
  <SheetRendererPageContent
    eyebrow="OpenPiano · Sheet renderer"
    title="Render MusicXML notation"
    intro="Choose a MusicXML score and inspect the engraved notation produced by OpenSheetMusicDisplay. The file stays in this browser."
    layout="responsive"
  />
);

export const HorizontalSheetPage = () => (
  <SheetRendererPageContent
    eyebrow="OpenPiano · Horizontal sheet"
    title="Render one continuous sheet"
    intro="Choose a MusicXML score and scroll through its notation as one continuous horizontal system. The file stays in this browser."
    layout="single-line"
  />
);
