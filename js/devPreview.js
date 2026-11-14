/**
 * Preview de entidades solo en desarrollo (localhost).
 * En producción (p. ej. workers.dev) se ignora por completo.
 *
 * Ejemplos:
 *   http://localhost:8080/?preview=teeth
 *   http://localhost:8080/?preview=customer&id=too_many_teeth
 *   http://localhost:8080/?preview=customer&id=no_shadow
 *   http://localhost:8080/?preview=customer&id=red_eyes
 *   http://localhost:8080/?preview=customer&id=normal
 *
 * En preview: [ / ] ciclan plantillas. Esc = menú. El reloj y eventos no corren.
 */
import { NORMAL_CUSTOMERS, ANOMALIES } from "./rules.js";

const ALIASES = {
  teeth: "too_many_teeth",
  smile: "too_many_teeth",
  too_many_teeth: "too_many_teeth",
  shadow: "no_shadow",
  no_shadow: "no_shadow",
  redeyes: "red_eyes",
  red_eyes: "red_eyes",
  manager: "fake_manager",
  fake_manager: "fake_manager",
  pineapple: "pineapple_after",
  pineapple_after: "pineapple_after",
  early_pineapple: "wrong_pineapple_early",
  wrong_pineapple_early: "wrong_pineapple_early",
  normal: "normal",
  customer: "normal",
};

export function isDevHost(hostname = location.hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  );
}

export function listPreviewCustomerIds() {
  return ["normal", ...ANOMALIES.map((a) => a.id)];
}

export function resolvePreviewCustomer(id) {
  const key = ALIASES[id] || id;
  if (!key || key === "normal") {
    const pick = NORMAL_CUSTOMERS[0];
    return { ...pick, anomaly: false, previewId: "normal" };
  }
  const pick = ANOMALIES.find((a) => a.id === key);
  if (!pick) return null;
  return { ...pick, anomaly: true, previewId: pick.id };
}

/**
 * @returns {{ kind: "customer", id: string } | null}
 */
export function parseDevPreview(search = location.search) {
  if (!isDevHost()) return null;

  const q = new URLSearchParams(search);
  const raw = (q.get("preview") || "").trim().toLowerCase();
  if (!raw) return null;

  let id = (q.get("id") || q.get("anomaly") || "").trim().toLowerCase();

  // ?preview=teeth  ó  ?preview=customer&id=teeth
  if (raw !== "customer" && raw !== "entity" && raw !== "1") {
    id = raw;
  }
  if (!id) id = "normal";

  const resolved = ALIASES[id] || id;
  if (resolved !== "normal" && !ANOMALIES.some((a) => a.id === resolved)) {
    console.warn(
      `[devPreview] id desconocido: "${id}". Usa: ${listPreviewCustomerIds().join(", ")}`,
    );
    return null;
  }

  return { kind: "customer", id: resolved };
}
