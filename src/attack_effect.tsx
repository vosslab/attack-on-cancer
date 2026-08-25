import type { JSX } from "solid-js";

import { AttackEffectArtwork } from "../generated/visual_assets";
import type { Point, Tower } from "./game_types";

function relayPoint(start: Point, end: Point, fraction: number): Point {
  const point = {
    x: start.x + (end.x - start.x) * fraction,
    y: start.y + (end.y - start.y) * fraction,
  };
  return point;
}

export function AttackEffect(props: { tower: Tower }): JSX.Element {
  const point = props.tower.attackPoint;
  if (point === undefined) return <g />;
  const position = props.tower.position;
  const firstRelay = relayPoint(position, point, 0.32);
  const secondRelay = relayPoint(position, point, 0.62);
  const instanceKey = `attack-${props.tower.id}-${props.tower.attackFlashUntil ?? 0}`;

  return (
    <g
      class={`attack-effect attack-${props.tower.type}`}
      data-visual-state="attacking"
      data-attack-type={props.tower.type}
      data-attack-outcome={props.tower.attackOutcome ?? "hit"}
      pointer-events="none"
    >
      {props.tower.type !== "chemotherapy" ? (
        <line class="attack-path" x1={position.x} y1={position.y} x2={point.x} y2={point.y} />
      ) : null}
      {props.tower.type === "radiation" ? (
        <line class="radiation-core" x1={position.x} y1={position.y} x2={point.x} y2={point.y} />
      ) : null}
      {props.tower.type === "antibody" ? (
        <g class="attack-relays">
          <circle cx={firstRelay.x} cy={firstRelay.y} r="5" />
          <circle cx={secondRelay.x} cy={secondRelay.y} r="6" />
        </g>
      ) : null}
      <g transform={`translate(${point.x} ${point.y})`}>
        <AttackEffectArtwork type={props.tower.type} instanceKey={instanceKey} />
      </g>
    </g>
  );
}
