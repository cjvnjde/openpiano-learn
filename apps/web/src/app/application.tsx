import type { ParentProps } from "solid-js";
import { useLocation } from "@solidjs/router";
import { ROUTE_PATHS, Router } from "./router";
import "./application.css";

export function Application(props: ParentProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav class="tool-navigation" aria-label="Development pages">
        <a
          class={
            isActive(ROUTE_PATHS.songImport)
              ? "tool-navigation__link tool-navigation__link--active"
              : "tool-navigation__link"
          }
          href={Router.paths()}
          aria-current={isActive(ROUTE_PATHS.songImport) ? "page" : undefined}
        >
          MusicXML import
        </a>
        <a
          class={
            isActive(ROUTE_PATHS.sheetRenderer)
              ? "tool-navigation__link tool-navigation__link--active"
              : "tool-navigation__link"
          }
          href={Router.paths["sheet-renderer"]()}
          aria-current={
            isActive(ROUTE_PATHS.sheetRenderer) ? "page" : undefined
          }
        >
          Sheet renderer
        </a>
        <a
          class={
            isActive(ROUTE_PATHS.horizontalSheet)
              ? "tool-navigation__link tool-navigation__link--active"
              : "tool-navigation__link"
          }
          href={Router.paths["horizontal-sheet"]()}
          aria-current={
            isActive(ROUTE_PATHS.horizontalSheet) ? "page" : undefined
          }
        >
          Horizontal sheet
        </a>
        <a
          class={
            isActive(ROUTE_PATHS.midi)
              ? "tool-navigation__link tool-navigation__link--active"
              : "tool-navigation__link"
          }
          href={Router.paths.midi()}
          aria-current={isActive(ROUTE_PATHS.midi) ? "page" : undefined}
        >
          MIDI input
        </a>
      </nav>

      {props.children}
    </>
  );
}
