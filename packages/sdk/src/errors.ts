import { AnchorError } from "@coral-xyz/anchor";
import idl from "./mandateos.json";

export interface ProtocolError {
  code: string;
  number: number;
  message: string;
  logs: string[];
}
/** Only maps matching source-IDL errors actually present in supplied logs. */
export function interpretProtocolError(
  error: unknown,
): ProtocolError | undefined {
  const candidate = error as { logs?: unknown } | null;
  if (
    !candidate ||
    !Array.isArray(candidate.logs) ||
    !candidate.logs.every((l) => typeof l === "string")
  )
    return undefined;
  const logs = candidate.logs as string[];
  const parsed = AnchorError.parse(logs)?.error;
  const definition = idl.errors.find(
    (e) =>
      e.code === parsed?.errorCode.number && e.name === parsed?.errorCode.code,
  );
  return definition
    ? {
        code: definition.name,
        number: definition.code,
        message: definition.msg,
        logs: [...logs],
      }
    : undefined;
}
