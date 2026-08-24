export type OrderedNode = Record<string, unknown>;

type Attributes = Record<string, string | number>;

export function isOrderedNode(value: unknown): value is OrderedNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function elementName(node: OrderedNode) {
  return Object.keys(node).find((key) => key !== ":@" && key !== "#text");
}

export function elementChildren(node: OrderedNode) {
  const name = elementName(node);
  const value = name ? node[name] : undefined;

  return Array.isArray(value) ? value.filter(isOrderedNode) : [];
}

export function childrenNamed(nodes: readonly OrderedNode[], name: string) {
  return nodes.filter((node) => elementName(node) === name);
}

export function firstNamed(nodes: readonly OrderedNode[], name: string) {
  return childrenNamed(nodes, name)[0];
}

export function attributesOf(
  node: OrderedNode | undefined,
): Attributes | undefined {
  const value = node?.[":@"];

  if (!isOrderedNode(value)) {
    return undefined;
  }

  const attributes: Attributes = {};

  for (const [name, attribute] of Object.entries(value)) {
    if (typeof attribute !== "string" && typeof attribute !== "number") {
      return undefined;
    }

    attributes[name] = attribute;
  }

  return attributes;
}

export function textContent(node: OrderedNode | undefined): string {
  if (!node) {
    return "";
  }

  let result = "";

  for (const child of elementChildren(node)) {
    const text = child["#text"];

    if (typeof text === "string" || typeof text === "number") {
      result += String(text);
    } else {
      result += textContent(child);
    }
  }

  return result.trim();
}

export function childText(nodes: readonly OrderedNode[], name: string) {
  return textContent(firstNamed(nodes, name));
}

export function collectElements(
  nodes: readonly OrderedNode[],
  name: string,
  output: OrderedNode[],
) {
  for (const node of nodes) {
    if (elementName(node) === name) {
      output.push(node);
    }

    collectElements(elementChildren(node), name, output);
  }
}
