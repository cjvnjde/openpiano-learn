import { createRouter } from "@solidjs/router";
import { MidiPage } from "../modules/midi";
import { SongImportPage } from "../modules/song-import";

export const Router = createRouter({
  routes: [
    { path: "/", component: SongImportPage },
    { path: "/midi", component: MidiPage },
  ],
});
