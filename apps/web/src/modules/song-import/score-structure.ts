import { assert } from "../../shared/lib/assert";
import {
  IMPORT_WARNING_CODE,
  type ImportWarning,
  type SongMetadata,
} from "./model";
import {
  attributesOf,
  childText,
  childrenNamed,
  collectElements,
  elementChildren,
  elementName,
  firstNamed,
  textContent,
  type OrderedNode,
} from "./musicxml-nodes";

const NAVIGATION_ATTRIBUTES = [
  "dacapo",
  "dalsegno",
  "segno",
  "coda",
  "tocoda",
  "fine",
] as const;

const DEFAULT_PPQ = 480;
const MAX_PPQ = 9_600;

export type ParsedPart = {
  id: string;
  name: string;
  node: OrderedNode;
};

export function parsePositiveNumber(value: string, label: string) {
  const parsed = Number(value);

  assert(
    Number.isFinite(parsed) && parsed > 0,
    `${label} must be a positive number`,
  );

  return parsed;
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

function leastCommonMultiple(left: number, right: number) {
  return Math.abs(left * right) / greatestCommonDivisor(left, right);
}

export function collectCompatibilityWarnings(
  rootChildren: readonly OrderedNode[],
) {
  const warnings: ImportWarning[] = [];
  const graceNodes: OrderedNode[] = [];
  collectElements(rootChildren, "grace", graceNodes);

  if (graceNodes.length > 0) {
    warnings.push({
      code: IMPORT_WARNING_CODE.GRACE_PLAYBACK,
      message:
        "Grace notes use their written onset and have zero notated duration.",
    });
  }

  const repeatNodes: OrderedNode[] = [];
  collectElements(rootChildren, "repeat", repeatNodes);

  if (repeatNodes.length > 0) {
    warnings.push({
      code: IMPORT_WARNING_CODE.WRITTEN_REPEATS,
      message:
        "Written repeats are not expanded; playback follows measure order.",
    });
  }

  const soundNodes: OrderedNode[] = [];
  collectElements(rootChildren, "sound", soundNodes);
  const hasComplexNavigation = soundNodes.some((node) => {
    return NAVIGATION_ATTRIBUTES.some((name) => {
      return attributesOf(node)?.[name] !== undefined;
    });
  });

  if (hasComplexNavigation) {
    warnings.push({
      code: IMPORT_WARNING_CODE.COMPLEX_NAVIGATION,
      message:
        "D.C., D.S., Segno, Coda, and Fine navigation is not expanded; " +
        "playback follows measure order.",
    });
  }

  return warnings;
}

export function calculatePpq(rootChildren: readonly OrderedNode[]) {
  const divisionNodes: OrderedNode[] = [];
  collectElements(rootChildren, "divisions", divisionNodes);

  if (divisionNodes.length === 0) {
    return {
      ppq: DEFAULT_PPQ,
      warnings: [
        {
          code: IMPORT_WARNING_CODE.MISSING_DIVISIONS,
          message: "No divisions found; using 480 PPQ.",
        },
      ] satisfies ImportWarning[],
    };
  }

  let ppq = 1;

  for (const divisionNode of divisionNodes) {
    const division = parsePositiveNumber(
      textContent(divisionNode),
      "MusicXML divisions",
    );

    if (!Number.isInteger(division)) {
      return {
        ppq: DEFAULT_PPQ,
        warnings: [
          {
            code: IMPORT_WARNING_CODE.FRACTIONAL_DIVISIONS,
            message: "Fractional divisions were quantized.",
          },
        ] satisfies ImportWarning[],
      };
    }

    const candidate = leastCommonMultiple(ppq, division);

    if (candidate > MAX_PPQ) {
      return {
        ppq: MAX_PPQ,
        warnings: [
          {
            code: IMPORT_WARNING_CODE.PPQ_QUANTIZED,
            message: `Exact PPQ exceeds ${MAX_PPQ}; durations were quantized.`,
          },
        ] satisfies ImportWarning[],
      };
    }

    ppq = candidate;
  }

  return {
    ppq: Math.max(ppq, DEFAULT_PPQ),
    warnings: [] satisfies ImportWarning[],
  };
}

export function parseMetadata(
  rootChildren: readonly OrderedNode[],
): SongMetadata {
  const work = firstNamed(rootChildren, "work");
  const workTitle = childText(elementChildren(work ?? {}), "work-title");
  const movementTitle = childText(rootChildren, "movement-title");
  const identification = firstNamed(rootChildren, "identification");
  const credits: Partial<
    Pick<SongMetadata, "composer" | "arranger" | "copyright">
  > = {};

  for (const child of elementChildren(identification ?? {})) {
    const name = elementName(child);

    if (name === "rights") {
      credits.copyright = textContent(child);
      continue;
    }

    if (name !== "creator") {
      continue;
    }

    const type = String(attributesOf(child)?.type ?? "");

    if (type === "composer") {
      credits.composer = textContent(child);
    } else if (type === "arranger") {
      credits.arranger = textContent(child);
    }
  }

  return {
    title: workTitle || movementTitle || "Untitled score",
    ...credits,
  };
}

export function parseParts(rootChildren: readonly OrderedNode[]): ParsedPart[] {
  const partList = firstNamed(rootChildren, "part-list");
  const names = new Map<string, string>();

  for (const scorePart of childrenNamed(
    elementChildren(partList ?? {}),
    "score-part",
  )) {
    const id = String(attributesOf(scorePart)?.id ?? "");

    if (!id) {
      continue;
    }

    const name = childText(elementChildren(scorePart), "part-name");
    names.set(id, name || id);
  }

  return childrenNamed(rootChildren, "part").map((part, index) => {
    const id = String(attributesOf(part)?.id ?? `part-${index + 1}`);

    return { id, name: names.get(id) ?? id, node: part };
  });
}
