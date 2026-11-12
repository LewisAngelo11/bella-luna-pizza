import { buildShell } from "./shell.js";
import { buildWindow } from "./window.js";
import { buildMenu } from "./menu.js";
import { buildNeon } from "./neon.js";
import { buildCounter } from "./counter.js";
import { buildFreezer } from "./freezer.js";
import { buildOven } from "./oven.js";
import { buildDoor } from "./door.js";
import { buildKitchenProps } from "./kitchenProps.js";
import { buildTables } from "./tables.js";
import { buildLamp } from "./lamp.js";
import { buildPizzaBoxes } from "./pizzaBoxes.js";
import { buildPlant } from "./plant.js";
import { buildPoster } from "./poster.js";
import { buildClock } from "./clock.js";
import { buildRug } from "./rug.js";
import { buildStains } from "./stains.js";
import { buildRain } from "./rain.js";
import { setupCustomer } from "./customer.js";
import { setupJumpscare } from "./jumpscare.js";
import { setupDust } from "./dust.js";
import { setupEmbers } from "./embers.js";

/** Monta todas las entidades dibujables de la escena. */
export function buildEntities(r) {
  buildShell(r);
  buildWindow(r);
  buildMenu(r);
  buildNeon(r);
  buildCounter(r);
  buildFreezer(r);
  buildOven(r);
  buildDoor(r);
  buildKitchenProps(r);
  buildTables(r);
  buildLamp(r);
  buildPizzaBoxes(r);
  buildPlant(r);
  buildPoster(r);
  buildClock(r);
  buildRug(r);
  buildStains(r);
  buildRain(r);
  setupCustomer(r);
  setupJumpscare(r);
  setupDust(r);
  setupEmbers(r);
}

export { applyCustomer } from "./customer.js";
