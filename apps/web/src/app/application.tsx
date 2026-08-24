import type { ParentProps } from "solid-js";
import { useLocation } from "@solidjs/router";
import { Router } from "./router";
import "./application.css";

export function Application(props: ParentProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav class="tool-navigation" aria-label="Development pages">
        <a
          class={
            isActive(Router.paths())
              ? "tool-navigation__link tool-navigation__link--active"
              : "tool-navigation__link"
          }
          href={Router.paths()}
          aria-current={isActive(Router.paths()) ? "page" : undefined}
        >
          MusicXML import
        </a>
        <a
          class={
            isActive(Router.paths.midi())
              ? "tool-navigation__link tool-navigation__link--active"
              : "tool-navigation__link"
          }
          href={Router.paths.midi()}
          aria-current={isActive(Router.paths.midi()) ? "page" : undefined}
        >
          MIDI input
        </a>
      </nav>

      {props.children}
    </>
  );
}
