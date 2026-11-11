import { buildShell } from "./shell.js";
import { buildWindow } from "./window.js";
import { buildMenuAndNeon } from "./menu.js";
import { buildCounter } from "./counter.js";
import { buildFreezer } from "./freezer.js";
import { buildOven } from "./oven.js";
import { buildBackDoor } from "./backDoor.js";
import { buildTables } from "./tables.js";
import { buildDecor } from "./decor.js";
import { setupRain } from "../particles.js";

/** Ensambla la sala completa a partir de piezas con una sola responsabilidad. */
export function buildRoom(r) {
  buildShell(r);
  buildWindow(r);
  buildMenuAndNeon(r);
  buildCounter(r);
  buildFreezer(r);
  buildOven(r);
  buildBackDoor(r);
  buildTables(r);
  buildDecor(r);
  setupRain(r);
}
