import { Match, Switch } from "solid-js";
import { pluralize } from "../../shared/lib/pluralize";
import { MIDI_STATUS, type MidiStatus } from "./web-midi/midi-status";

type MidiStatusProps = {
  status: MidiStatus;
  deviceCount: number;
};

type ReadyMidiStatusProps = {
  deviceCount: number;
};

function ReadyMidiStatus(props: ReadyMidiStatusProps) {
  return (
    <>
      <strong>
        {props.deviceCount === 0
          ? "No MIDI devices connected"
          : `${props.deviceCount} MIDI ${pluralize(props.deviceCount, "device")} connected`}
      </strong>
      <p>
        {props.deviceCount === 0
          ? "Connect a MIDI keyboard, then check devices again."
          : "Play your keyboard to test note input."}
      </p>
    </>
  );
}

function MidiStatusMessage(props: MidiStatusProps) {
  return (
    <Switch>
      <Match when={props.status === MIDI_STATUS.PENDING}>
        <strong>Checking MIDI devices</strong>
        <p>Allow MIDI access if your browser asks.</p>
      </Match>
      <Match when={props.status === MIDI_STATUS.UNSUPPORTED}>
        <strong>Web MIDI is unavailable</strong>
        <p>Use a browser with Web MIDI support, such as Chrome or Edge.</p>
      </Match>
      <Match when={props.status === MIDI_STATUS.DENIED}>
        <strong>MIDI access was denied</strong>
        <p>Allow MIDI access in your browser settings, then check again.</p>
      </Match>
      <Match when={props.status === MIDI_STATUS.READY}>
        <ReadyMidiStatus deviceCount={props.deviceCount} />
      </Match>
    </Switch>
  );
}

export function MidiStatus(props: MidiStatusProps) {
  return (
    <section
      class={`status status--${props.status}`}
      role="status"
      aria-live="polite"
    >
      <span class="status__indicator" aria-hidden="true" />
      <div>
        <MidiStatusMessage
          status={props.status}
          deviceCount={props.deviceCount}
        />
      </div>
    </section>
  );
}
