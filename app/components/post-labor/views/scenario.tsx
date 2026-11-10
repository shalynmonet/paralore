import { useEffect, useState } from "react";
import { useActionMutation } from "@agent-native/core/client/hooks";
import { PLButton, Notice } from "../primitives";
import { type World, errorText } from "../world";
export function ScenarioControls({ world }: { world: World }) {
  const [population, setPopulation] = useState(String(world.population));
  const [replacement, setReplacement] = useState(String(world.jobReplacementPercent));
  const [saved, setSaved] = useState(false);
  const update = useActionMutation("update-scenario", { onSuccess: () => setSaved(true) });
  useEffect(() => { setPopulation(String(world.population)); setReplacement(String(world.jobReplacementPercent)); }, [world.population, world.jobReplacementPercent]);
  const changed = Number(population) !== world.population || Number(replacement) !== world.jobReplacementPercent;
  const inputClass = "mt-2 w-full rounded border border-border bg-background px-3 py-2 text-foreground";
  return <form className="space-y-3 border-y border-border py-4" onSubmit={event => { event.preventDefault(); setSaved(false); update.mutate({ population: Number(population), jobReplacementPercent: Number(replacement) }); }}>
    <div className="flex flex-wrap items-end gap-4"><label className="min-w-40 flex-1 text-sm text-muted-foreground">Population<input aria-label="Population" className={inputClass} type="number" required min="1" max="10000000000" step="1" value={population} onChange={event => { setPopulation(event.target.value); setSaved(false); }} /></label><label className="min-w-40 flex-1 text-sm text-muted-foreground">AI job replacement (%)<input aria-label="AI job replacement (%)" className={inputClass} type="number" required min="0" max="100" step="any" value={replacement} onChange={event => { setReplacement(event.target.value); setSaved(false); }} /></label><PLButton type="submit" disabled={update.isPending || !changed}>{update.isPending ? "Saving…" : "Save scenario"}</PLButton><span className="py-2 text-sm text-muted-foreground">Active policies <b className="ml-2 font-medium text-foreground">{Object.values(world.levels).filter(level => level > 0).length} / 4</b></span></div>
    <p className="text-xs text-muted-foreground">Scenario context. Defaults: 10,000,000 residents and 75% job replacement. These settings do not change the model’s indicator or household formulas. Reset restores the defaults.</p>
    {saved && !changed && <Notice tone="success">Scenario saved.</Notice>}{update.error && <Notice tone="error">{errorText(update.error)}</Notice>}
  </form>;
}
