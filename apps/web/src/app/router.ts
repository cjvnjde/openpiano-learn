import { createRouter, hashHistory } from "@solidjs/router";
import { MidiPage } from "../modules/midi";
import { SongImportPage } from "../modules/song-import";

export const ROUTE_PATHS = {
  songImport: "/",
  midi: "/midi",
} as const;

export const Router = createRouter({
  explicitLinks: true,
  history: hashHistory(),
  routes: [
    { path: ROUTE_PATHS.songImport, component: SongImportPage },
    { path: ROUTE_PATHS.midi, component: MidiPage },
  ],
});
