"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authorityPath, statusOf, type AuthorityModel } from "@/lib/authority";
import NativeAuthority from "./native-authority";
import CapitalNumber from "./capital-number";

const Scene = dynamic(() => import("./loom-scene"), { ssr: false });
export interface LoomProps {
  model: AuthorityModel;
  selected: string;
  onSelect: (id: string) => void;
  chapter?: string;
  grant?: string;
  grantDuration?: number;
  trace?: boolean;
  traceEpoch?: number;
  preview?: string;
  cascade?: boolean;
  flatten?: boolean;
  arena?: {
    status: string;
    candidate: number;
    preview: boolean;
    names: string[];
    winnerIndex: number;
  };
  onUnavailable?: () => void;
}
class CanvasBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export default function SpatialLoom(props: LoomProps) {
  const host = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [failed, setFailed] = useState(false);
  const selectedPath = new Set(
    authorityPath(props.model, props.selected).map((n) => n.id),
  );
  const unavailable = useCallback(() => {
    if (host.current) host.current.dataset.webgl = "lost";
    setFailed(true);
  }, []);
  useEffect(() => {
    const query = matchMedia(
      "(min-width: 1100px) and (prefers-reduced-motion: no-preference)",
    );
    const sync = () => {
      setEnabled(query.matches);
      if (!query.matches && host.current) delete host.current.dataset.webgl;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return (
    <div
      ref={host}
      className={`spatial-loom ${props.arena ? "arena-loom" : "authority-loom"} ${props.flatten || props.chapter === "enter" ? "loom-flatten" : ""}`}
      data-testid={
        props.arena ? "spatial-execution-world" : "persistent-authority-world"
      }
    >
      {enabled && !failed && (
        <CanvasBoundary onFailure={unavailable}>
          <Scene {...props} onUnavailable={unavailable} />
        </CanvasBoundary>
      )}
      {!props.arena && (
        <>
          <div className="loom-fallback">
            <NativeAuthority {...props} />
          </div>
          <div
            className="loom-annotations"
            aria-label="Spatial authority structure"
          >
            <svg className="loom-guides" aria-hidden="true">
              {props.model.nodes
                .filter((n) => n.parent)
                .map((n) => (
                  <path key={n.id} data-loom-guide={n.id} />
                ))}
            </svg>
            <svg className="loom-flat-rails" aria-hidden="true">
              {props.model.nodes
                .filter((n) => n.parent)
                .map((n) => (
                  <path
                    key={n.id}
                    data-plane-edge={n.id}
                    className={`plane-edge ${statusOf(props.model, n.id)} ${selectedPath.has(n.id) ? "on-path" : ""}`}
                  />
                ))}
            </svg>
            {props.model.nodes.map((n) => {
              const status = statusOf(props.model, n.id);
              return (
                <button
                  key={n.id}
                  data-loom-label={n.id}
                  data-testid={`loom-node-${n.id}`}
                  aria-label={`Select ${n.name}`}
                  aria-pressed={props.selected === n.id}
                  onClick={() => props.onSelect(n.id)}
                  className={`loom-label ${status} ${props.selected === n.id ? "selected" : ""}`}
                >
                  <span>
                    {n.name}
                    <i>D{n.depth}</i>
                  </span>
                  <strong>
                    <CapitalNumber
                      value={n.available}
                      decimals={props.model.decimals}
                    />{" "}
                    <small>{props.model.unit}</small>
                  </strong>
                  <small className={`status ${status}`}>
                    {status} · {n.parent ? "own available" : "root available"}
                  </small>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
