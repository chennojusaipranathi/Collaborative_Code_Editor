// Compares two texts line by line and returns a list of rows:
// { type: "same" | "removed" | "added", text: "..." }
// It uses the "longest common subsequence" idea: find the lines both versions
// share, and mark everything else as removed (old only) or added (new only).
export function diffLines(oldText, newText) {
  const a = oldText.split("\n");
  const b = newText.split("\n");

  // table[i][j] = length of the common lines between a[i..] and b[j..]
  const table = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  // Walk through the table to build the result
  const rows = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ type: "removed", text: a[i] });
      i++;
    } else {
      rows.push({ type: "added", text: b[j] });
      j++;
    }
  }
  while (i < a.length) rows.push({ type: "removed", text: a[i++] });
  while (j < b.length) rows.push({ type: "added", text: b[j++] });

  return rows;
}