import "server-only";

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createWorker, OEM } from "tesseract.js";

const require = createRequire(import.meta.url);
const languagePath = join(
  dirname(require.resolve("@tesseract.js-data/eng")),
  "4.0.0",
);
const monthNames =
  "(?:jan(?:uary|uari)?|feb(?:ruary|ruari)?|mar(?:ch|et)?|apr(?:il)?|may|mei|jun(?:e|i)?|jul(?:y|i)?|aug(?:ust|ustus)?|sep(?:tember)?|oct(?:ober)?|oktober|nov(?:ember)?|dec(?:ember)?|desember)";
const datePattern = new RegExp(
  String.raw`\b(?:(?:19|20)\d{2}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-](?:\d{2}|\d{4})|\d{1,2}\s+${monthNames}\s+\d{2,4}|${monthNames}\s+\d{1,2},?\s+\d{2,4})\b`,
  "gi",
);
const timePattern =
  /\b(?:[01]?\d|2[0-3])(?:[:.]|h)[0-5]\d(?:[:.][0-5]\d)?(?:\s*(?:a\.?m\.?|p\.?m\.?|wib|wita|wit))?\b/gi;
const MAX_TIMESTAMP_GAP = 80;

function getMatchIndexes(text: string, pattern: RegExp) {
  const indexes: number[] = [];
  pattern.lastIndex = 0;

  let match = pattern.exec(text);
  while (match) {
    indexes.push(match.index);
    match = pattern.exec(text);
  }

  return indexes;
}

function containsDateAndTime(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const dates = getMatchIndexes(normalized, datePattern);
  const times = getMatchIndexes(normalized, timePattern);

  return dates.some((dateIndex) =>
    times.some(
      (timeIndex) => Math.abs(dateIndex - timeIndex) <= MAX_TIMESTAMP_GAP,
    ),
  );
}

export async function hasVisibleTimestamp(image: Buffer) {
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    langPath: languagePath,
    gzip: true,
    cacheMethod: "none",
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(image);

    return containsDateAndTime(text);
  } finally {
    await worker.terminate();
  }
}
