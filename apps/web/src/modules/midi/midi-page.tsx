import { Button } from "@kobalte/core/button";
import { For } from "solid-js";
import { createMidi } from "./create-midi";
import { midiNoteName } from "./midi-note";
import { MidiStatus } from "./midi-status";
import { MIDI_STATUS } from "./web-midi/midi-status";
import "./midi-page.css";

export function MidiPage() {
  const midi = createMidi();

  return (
    <main class="app">
      <header class="hero">
        <p class="eyebrow">OpenPiano · MIDI input</p>
        <h1>Test your piano connection</h1>
        <p class="intro">
          Connect a MIDI keyboard, grant browser access, and play a few notes.
        </p>
      </header>

      <div class="status-toolbar">
        <MidiStatus
          status={midi.status()}
          deviceCount={midi.devices().length}
        />
        <Button
          class="device-check"
          type="button"
          disabled={
            midi.status() === MIDI_STATUS.PENDING ||
            midi.status() === MIDI_STATUS.UNSUPPORTED
          }
          onClick={midi.checkDevices}
        >
          {midi.status() === MIDI_STATUS.PENDING
            ? "Checking…"
            : "Check devices"}
        </Button>
      </div>

      <div class="panels">
        <section class="panel" aria-labelledby="devices-heading">
          <div class="panel__heading">
            <div>
              <p class="label">Hardware</p>
              <h2 id="devices-heading">Connected devices</h2>
            </div>
            <span class="count" aria-label={`${midi.devices().length} devices`}>
              {midi.devices().length}
            </span>
          </div>

          <ul class="device-list">
            <For
              each={midi.devices()}
              fallback={
                <li class="empty">
                  Connect a device, then select Check devices.
                </li>
              }
            >
              {(device) => (
                <li class="device">
                  <div>
                    <strong>{device.name}</strong>
                    <span>
                      {device.manufacturer ?? "Manufacturer unavailable"}
                    </span>
                  </div>
                  <span class="device__state">Connected</span>
                </li>
              )}
            </For>
          </ul>
        </section>

        <section class="panel" aria-labelledby="notes-heading">
          <div class="panel__heading">
            <div>
              <p class="label">Live input</p>
              <h2 id="notes-heading">Pressed notes</h2>
            </div>
            <span
              class="count"
              aria-label={`${midi.pressedNotes().length} pressed notes`}
            >
              {midi.pressedNotes().length}
            </span>
          </div>

          <ul class="note-list" aria-live="polite">
            <For
              each={midi.pressedNotes()}
              fallback={<li class="empty">No notes pressed.</li>}
            >
              {(pressedNote) => (
                <li class="note">
                  <strong>{midiNoteName(pressedNote.note)}</strong>
                  <span>
                    MIDI {pressedNote.note} · Velocity {pressedNote.velocity} /
                    127
                  </span>
                </li>
              )}
            </For>
          </ul>
        </section>
      </div>
    </main>
  );
}
