const KEEP_UPPER = new Set([
  "SE",
  "SH",
  "ST",
  "MM",
  "MBA",
  "MSC",
  "APT",
]);

/**
 * Seragamkan nama orang menjadi Title Case.
 * Gelar seperti S.Pd, A.Md., SE, dan H. tetap dipertahankan.
 */
export function toTitleCaseName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .split(" ")
    .map((word) => {
      if (!word) {
        return word;
      }

      const trailing = word.match(/[.,]+$/)?.[0] ?? "";
      const core = trailing ? word.slice(0, -trailing.length) : word;

      if (!core) {
        return word;
      }

      if (core.includes(".")) {
        const dotted = core
          .split(".")
          .map((part) =>
            part
              ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
              : part,
          )
          .join(".");

        return dotted + trailing;
      }

      if (KEEP_UPPER.has(core.toUpperCase())) {
        return core.toUpperCase() + trailing;
      }

      let lower = core.toLowerCase();

      if (lower.startsWith("'")) {
        lower = `'${lower.charAt(1).toUpperCase()}${lower.slice(2)}`;
      } else {
        lower = lower.charAt(0).toUpperCase() + lower.slice(1);
      }

      lower = lower.replace(
        /-([a-z])/g,
        (_, char: string) => `-${char.toUpperCase()}`,
      );

      return lower + trailing;
    })
    .join(" ");
}
