import { buildTable } from "./table.js";

const LAYOUT = [
  { id: 1, x: -1.8, z: 8.5 },
  { id: 2, x: 0.4, z: 9.3 },
  { id: 6, x: -2.7, z: 6.1 },
];

export function buildTables(r) {
  r.tables = {};
  LAYOUT.forEach((t) => buildTable(r, t));
}
