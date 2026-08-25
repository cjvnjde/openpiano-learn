import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export const RENDER_STATUS = {
  ERROR: "error",
  READY: "ready",
  RENDERING: "rendering",
} as const;

export type RenderState =
  | { status: typeof RENDER_STATUS.RENDERING }
  | { status: typeof RENDER_STATUS.READY }
  | { status: typeof RENDER_STATUS.ERROR; message: string };

type UpdateRenderState = (state: RenderState) => void;

function errorMessage(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "OpenSheetMusicDisplay could not render this score";
}

export function renderMusicSheet(
  container: HTMLDivElement,
  file: File,
  updateState: UpdateRenderState,
) {
  const abortController = new AbortController();
  const renderer = new OpenSheetMusicDisplay(container, {
    autoResize: true,
    backend: "svg",
    disableCursor: true,
    drawingParameters: "compacttight",
    drawTitle: true,
    pageFormat: "Endless",
  });
  const loadAndRender = async () => {
    await renderer.load(file, file.name);

    if (abortController.signal.aborted) {
      return;
    }

    renderer.render();
    updateState({ status: RENDER_STATUS.READY });
  };
  const handleRenderError = (cause: unknown) => {
    if (abortController.signal.aborted) {
      return;
    }

    renderer.clear();
    updateState({
      status: RENDER_STATUS.ERROR,
      message: errorMessage(cause),
    });
  };
  const resizeObserver = new ResizeObserver(() => {
    if (container.clientWidth === 0) {
      return;
    }

    resizeObserver.disconnect();
    loadAndRender().catch(handleRenderError);
  });

  resizeObserver.observe(container);

  return () => {
    abortController.abort();
    resizeObserver.disconnect();
    renderer.disableIncrementalRenderingOnScroll();
    renderer.AutoResizeEnabled = false;
    renderer.clear();
  };
}
