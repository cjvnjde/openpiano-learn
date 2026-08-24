import { Show, createSignal } from "solid-js";
import { MidiPage } from "../modules/midi";
import { SongImportPage } from "../modules/song-import";
import "./application.css";

const APPLICATION_PAGE = {
  IMPORT: "import",
  MIDI: "midi",
} as const;

type ApplicationPage = (typeof APPLICATION_PAGE)[keyof typeof APPLICATION_PAGE];

export function Application() {
  const [page, setPage] = createSignal<ApplicationPage>(
    APPLICATION_PAGE.IMPORT,
  );

  return (
    <>
      <nav class="tool-navigation" aria-label="Development pages">
        <button
          class={
            page() === APPLICATION_PAGE.IMPORT
              ? "tool-navigation__button tool-navigation__button--active"
              : "tool-navigation__button"
          }
          type="button"
          aria-pressed={page() === APPLICATION_PAGE.IMPORT ? "true" : "false"}
          onClick={() => {
            setPage(APPLICATION_PAGE.IMPORT);
          }}
        >
          MusicXML import
        </button>
        <button
          class={
            page() === APPLICATION_PAGE.MIDI
              ? "tool-navigation__button tool-navigation__button--active"
              : "tool-navigation__button"
          }
          type="button"
          aria-pressed={page() === APPLICATION_PAGE.MIDI ? "true" : "false"}
          onClick={() => {
            setPage(APPLICATION_PAGE.MIDI);
          }}
        >
          MIDI input
        </button>
      </nav>

      <Show when={page() === APPLICATION_PAGE.IMPORT} fallback={<MidiPage />}>
        <SongImportPage />
      </Show>
    </>
  );
}
