import { cpSync, existsSync, readFileSync } from "node:fs";

// Preserve tracked formatting when the built IDL has no semantic changes.
export function syncIdl(source, target) {
  const built = JSON.parse(readFileSync(source, "utf8"));
  if (existsSync(target)) {
    const current = JSON.parse(readFileSync(target, "utf8"));
    if (JSON.stringify(built) === JSON.stringify(current)) return false;
  }
  cpSync(source, target);
  return true;
}
