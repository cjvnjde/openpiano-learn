import { XMLParser, XMLValidator } from "fast-xml-parser";
import { assert } from "../../shared/lib/assert";
import { elementChildren, elementName, isOrderedNode } from "./musicxml-nodes";

const MAX_FILE_BYTES = 10_485_760;
const DOCTYPE_MARKER_PATTERN = /<!DOCTYPE\b/giu;
const EXTERNAL_SCORE_DOCTYPE_PATTERN =
  /<!DOCTYPE\s+score-partwise\s+(?:PUBLIC\s+(?:"[^"]*"|'[^']*')\s+(?:"[^"]*"|'[^']*')|SYSTEM\s+(?:"[^"]*"|'[^']*'))\s*>/iu;

function stripExternalDoctype(source: string) {
  const maskedComments = source.replace(/<!--[\s\S]*?-->/gu, (comment) => {
    return comment.replace(/[^\r\n]/gu, " ");
  });

  assert(
    !/<!ENTITY\b/iu.test(maskedComments),
    "Entity declarations are not allowed",
  );

  const declarationMarkers = maskedComments.match(DOCTYPE_MARKER_PATTERN) ?? [];

  if (declarationMarkers.length === 0) {
    return source;
  }

  const declaration = EXTERNAL_SCORE_DOCTYPE_PATTERN.exec(maskedComments);

  assert(
    declarationMarkers.length === 1 && declaration !== null,
    "Only external score-partwise DOCTYPE declarations without an " +
      "internal subset are allowed",
  );

  return (
    source.slice(0, declaration.index) +
    source.slice(declaration.index + declaration[0].length)
  );
}

export function parseMusicXmlDocument(source: string) {
  const sourceBytes = new TextEncoder().encode(source);

  assert(
    sourceBytes.byteLength <= MAX_FILE_BYTES,
    "MusicXML file exceeds 10 MiB limit",
  );

  const xmlForParser = stripExternalDoctype(source);
  const validationResult = XMLValidator.validate(xmlForParser);

  if (validationResult !== true) {
    throw new Error(`Malformed MusicXML: ${validationResult.err.msg}`);
  }

  const parser = new XMLParser({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: false,
  });
  const parsed: unknown = parser.parse(xmlForParser);

  assert(Array.isArray(parsed), "MusicXML parser returned an invalid document");

  const root = parsed.find((node) => {
    return isOrderedNode(node) && elementName(node) === "score-partwise";
  });

  assert(
    isOrderedNode(root),
    "Only MusicXML score-partwise documents are supported",
  );

  return {
    rootChildren: elementChildren(root),
    sourceBytes,
  };
}
