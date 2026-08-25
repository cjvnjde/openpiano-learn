import { Show, createSignal, onSettled } from "solid-js";
import {
  RENDER_STATUS,
  renderMusicSheet,
  type RenderState,
  type SheetLayout,
} from "./render-music-sheet";

const UNAVAILABLE_CONTAINER_MESSAGE = "Renderer container is unavailable";

type MusicSheetRendererProps = {
  file: File;
  layout: SheetLayout;
};

export const MusicSheetRenderer = (props: MusicSheetRendererProps) => {
  const [state, setState] = createSignal<RenderState>({
    status: RENDER_STATUS.RENDERING,
  });
  const [container, setContainer] = createSignal<HTMLDivElement>();

  onSettled(() => {
    const target = container();

    if (!target) {
      setState({
        status: RENDER_STATUS.ERROR,
        message: UNAVAILABLE_CONTAINER_MESSAGE,
      });
      return;
    }

    return renderMusicSheet(target, props.file, props.layout, setState);
  });

  const renderError = () => {
    const currentState = state();

    return currentState.status === RENDER_STATUS.ERROR
      ? currentState
      : undefined;
  };

  const statusLabel = () => {
    const status = state().status;

    if (status === RENDER_STATUS.ERROR) {
      return "Error";
    }

    return status === RENDER_STATUS.READY ? "Rendered" : "Loading";
  };

  return (
    <section
      class={
        props.layout === "single-line"
          ? "sheet-display sheet-display--single-line"
          : "sheet-display"
      }
      aria-labelledby="sheet-display-heading"
    >
      <div class="sheet-display__heading">
        <div>
          <p class="label">OpenSheetMusicDisplay</p>
          <h2 id="sheet-display-heading">{props.file.name}</h2>
        </div>
        <span
          class={
            state().status === RENDER_STATUS.ERROR
              ? "sheet-display__status sheet-display__status--error"
              : "sheet-display__status"
          }
        >
          {statusLabel()}
        </span>
      </div>

      <Show when={state().status === RENDER_STATUS.RENDERING}>
        <p class="sheet-display__feedback" role="status">
          Engraving the score…
        </p>
      </Show>

      <Show when={renderError()}>
        {(error) => (
          <div class="sheet-display__error" role="alert">
            <strong>Could not render {props.file.name}</strong>
            <span>{error().message}</span>
          </div>
        )}
      </Show>

      <div
        ref={setContainer}
        class="sheet-display__canvas"
        aria-label={`Rendered score from ${props.file.name}`}
        aria-busy={
          state().status === RENDER_STATUS.RENDERING ? "true" : undefined
        }
      />
    </section>
  );
};
