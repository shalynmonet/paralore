import { useEffect, useState } from "react";
import { useActionMutation } from "@agent-native/core/client/hooks";
import { Panel, Eyebrow, PLButton, Notice, ConfirmDialog } from "../primitives";
import { INDICATOR_KEYS, INDICATOR_META, formatIndex, errorText, type World } from "../world";

export function TimelineControls({ world, refresh }: { world: World; refresh: () => unknown }) {
  const [targetYear, setTargetYear] = useState(String(world.year + 5));
  const [restartYear, setRestartYear] = useState<number | null>(null);
  const reset = useActionMutation("reset-simulation", { onSuccess: () => { setRestartYear(null); setSnapshotId(""); refresh(); } });
  const [snapshotId, setSnapshotId] = useState("");
  const advance = useActionMutation("advance-to-year", { onSuccess: refresh });
  useEffect(() => { setTargetYear(String(world.year + 5)); }, [world.year]);
  const snapshot = world.timeline.find(item => item.id === snapshotId);
  return <Panel className="p-6"><div className="grid gap-6 lg:grid-cols-2">
    <form onSubmit={event => { event.preventDefault(); const year = Number(targetYear); if (year < world.year) setRestartYear(year); else advance.mutate({ targetYear: year, expectedRevision: world.revision }); }}>
      <Eyebrow>Choose the horizon</Eyebrow><p className="mt-2 text-sm text-muted-foreground">Choose a year from 2027 onward. Later years simulate forward; earlier years offer a fresh start.</p>
      <label className="mt-4 block text-sm" htmlFor="target-year">Simulate to year</label>
      <div className="mt-2 flex gap-3"><input id="target-year" type="number" required min={2027} max={Math.min(9999, world.year + 50)} step="1" className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 tabular-nums" value={targetYear} onChange={event => setTargetYear(event.target.value)} /><PLButton type="submit" variant="primary" disabled={advance.isPending || reset.isPending || Number(targetYear) === world.year}>{advance.isPending ? "Simulating…" : "Go to year"}</PLButton></div>
      <p className="mt-2 text-xs text-muted-foreground">Choose 2027–{Math.min(9999, world.year + 50)}. Forward simulation changes the world and makes previews out of date. Going earlier requires confirming a restart.</p>
      {advance.error && <div className="mt-3"><Notice tone="error">{errorText(advance.error)}</Notice></div>}
    </form>
    <div><Eyebrow>Look back without changing the world</Eyebrow><label htmlFor="history-snapshot" className="mt-4 block text-sm">Inspect a saved moment</label><select id="history-snapshot" className="mt-2 w-full rounded border border-border bg-background px-3 py-3 text-sm" value={snapshotId} onChange={event => setSnapshotId(event.target.value)}><option value="">Current world · {world.year}</option>{world.timeline.map((item, index) => <option key={item.id} value={item.id}>{item.year} · {item.kind === "enactment" ? `Decision ${index}` : item.kind === "baseline" ? "Starting point" : "Year end"}</option>)}</select><p className="mt-2 text-xs text-muted-foreground">Earlier years are a read-only record. To start over in 2027 or later, enter an earlier year; saved household profiles remain.</p></div>
  </div>{snapshot && <div className="mt-6 border-t border-border pt-5"><p className="mb-4 text-sm text-pl-amber">Historical snapshot · {snapshot.label}</p><dl className="grid grid-cols-2 gap-4 md:grid-cols-3">{INDICATOR_KEYS.map(key => <div key={key}><dt className="text-xs text-muted-foreground">{INDICATOR_META[key].label}</dt><dd className="mt-1 text-xl tabular-nums">{formatIndex(snapshot.indicators[key])}{key === "ownership" ? "%" : ""}</dd></div>)}</dl></div>}<ConfirmDialog open={restartYear !== null} onOpenChange={open => { if (!open) setRestartYear(null); }} title={`Start again in ${restartYear ?? 2027}?`} description="This clears active policies, proposals and timeline and restores baseline scores, population and job replacement defaults. Saved household profiles remain. These are illustrative starting conditions, not historical estimates for the selected year." confirmLabel={`Restart in ${restartYear ?? 2027}`} pending={reset.isPending} danger error={reset.error ? errorText(reset.error) : null} onConfirm={() => { if (restartYear !== null) reset.mutate({ startYear: restartYear, expectedRevision: world.revision }); }} /></Panel>;
}
