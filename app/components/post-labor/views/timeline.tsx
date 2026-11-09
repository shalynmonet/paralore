import { useEffect, useState } from "react";
import { useActionMutation } from "@agent-native/core/client/hooks";
import { Panel, Eyebrow, PLButton, Notice } from "../primitives";
import { INDICATOR_KEYS, INDICATOR_META, formatIndex, errorText, type World } from "../world";

export function TimelineControls({ world, refresh }: { world: World; refresh: () => unknown }) {
  const [targetYear, setTargetYear] = useState(String(world.year + 5));
  const [snapshotId, setSnapshotId] = useState("");
  const advance = useActionMutation("advance-to-year", { onSuccess: refresh });
  useEffect(() => { setTargetYear(String(world.year + 5)); }, [world.year]);
  const snapshot = world.timeline.find(item => item.id === snapshotId);
  return <Panel className="p-6"><div className="grid gap-6 lg:grid-cols-2">
    <form onSubmit={event => { event.preventDefault(); advance.mutate({ targetYear: Number(targetYear), expectedRevision: world.revision }); }}>
      <Eyebrow>Choose the horizon</Eyebrow><p className="mt-2 text-sm text-muted-foreground">Simulate every year up to your chosen date under the active policies.</p>
      <label className="mt-4 block text-sm" htmlFor="target-year">Simulate to year</label>
      <div className="mt-2 flex gap-3"><input id="target-year" type="number" required min={world.year + 1} max={Math.min(9999, world.year + 50)} step="1" className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 tabular-nums" value={targetYear} onChange={event => setTargetYear(event.target.value)} /><PLButton type="submit" variant="primary" disabled={advance.isPending}>{advance.isPending ? "Simulating…" : "Go to year"}</PLButton></div>
      <p className="mt-2 text-xs text-muted-foreground">Choose {world.year + 1}–{world.year + 50}. This changes the world and makes existing previews out of date.</p>
      {advance.error && <div className="mt-3"><Notice tone="error">{errorText(advance.error)}</Notice></div>}
    </form>
    <div><Eyebrow>Look back without changing the world</Eyebrow><label htmlFor="history-snapshot" className="mt-4 block text-sm">Inspect a saved moment</label><select id="history-snapshot" className="mt-2 w-full rounded border border-border bg-background px-3 py-3 text-sm" value={snapshotId} onChange={event => setSnapshotId(event.target.value)}><option value="">Current world · {world.year}</option>{world.timeline.map((item, index) => <option key={item.id} value={item.id}>{item.year} · {item.kind === "enactment" ? `Decision ${index}` : item.kind === "baseline" ? "Starting point" : "Year end"}</option>)}</select><p className="mt-2 text-xs text-muted-foreground">Earlier years are a read-only record. To make different choices from 2040, reset the simulation; saved household profiles remain.</p></div>
  </div>{snapshot && <div className="mt-6 border-t border-border pt-5"><p className="mb-4 text-sm text-pl-amber">Historical snapshot · {snapshot.label}</p><dl className="grid grid-cols-2 gap-4 md:grid-cols-3">{INDICATOR_KEYS.map(key => <div key={key}><dt className="text-xs text-muted-foreground">{INDICATOR_META[key].label}</dt><dd className="mt-1 text-xl tabular-nums">{formatIndex(snapshot.indicators[key])}{key === "ownership" ? "%" : ""}</dd></div>)}</dl></div>}</Panel>;
}
