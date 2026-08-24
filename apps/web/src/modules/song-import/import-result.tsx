import { For, Show } from "solid-js";
import type { ImportedSong } from "./model";

type ImportResultProps = {
  fileName: string;
  result: ImportedSong;
};

function formatDuration(seconds: number) {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function ImportResult(props: ImportResultProps) {
  const tempoLabel = () => {
    const { tempoMinimum, tempoMaximum } = props.result.summary;

    return tempoMinimum === tempoMaximum
      ? `${tempoMinimum} BPM`
      : `${tempoMinimum}–${tempoMaximum} BPM`;
  };

  return (
    <section class="import-result" aria-labelledby="import-result-heading">
      <div class="import-result__heading">
        <div>
          <p class="label">Imported locally</p>
          <h2 id="import-result-heading">{props.result.song.metadata.title}</h2>
          <p class="import-result__file">{props.fileName}</p>
        </div>
        <span class="import-result__status">Ready</span>
      </div>

      <dl class="import-metrics">
        <div>
          <dt>Measures</dt>
          <dd>{props.result.summary.measures}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{props.result.summary.notes}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(props.result.summary.durationSeconds)}</dd>
        </div>
        <div>
          <dt>Tempo</dt>
          <dd>{tempoLabel()}</dd>
        </div>
        <div>
          <dt>Staves</dt>
          <dd>{props.result.summary.staves}</dd>
        </div>
        <div>
          <dt>PPQ</dt>
          <dd>{props.result.song.ppq}</dd>
        </div>
      </dl>

      <div class="import-details">
        <section aria-labelledby="parts-heading">
          <p class="label">Detected structure</p>
          <h3 id="parts-heading">Parts</h3>
          <ul class="import-parts">
            <For each={props.result.song.parts}>
              {(part) => {
                const staffLabel = `${part.staves} ${
                  part.staves === 1 ? "staff" : "staves"
                }`;

                return (
                  <li>
                    <strong>{part.name}</strong>
                    <span>
                      {part.role} · {staffLabel}
                    </span>
                  </li>
                );
              }}
            </For>
          </ul>
        </section>

        <section aria-labelledby="source-heading">
          <p class="label">Source identity</p>
          <h3 id="source-heading">SHA-256</h3>
          <code class="import-hash">{props.result.song.sourceHash}</code>
        </section>
      </div>

      <Show when={props.result.song.warnings.length > 0}>
        <aside class="import-warnings" aria-labelledby="warnings-heading">
          <p class="label">Review before practice</p>
          <h3 id="warnings-heading">Importer warnings</h3>
          <ul>
            <For each={props.result.song.warnings}>
              {(warning) => <li>{warning.message}</li>}
            </For>
          </ul>
        </aside>
      </Show>
    </section>
  );
}
