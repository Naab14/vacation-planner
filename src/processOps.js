/**
 * Pure helpers for mutating the stateful process list. Each takes the current
 * workspace state and returns a new state with `processes`, `demand`, and
 * operator `certifications` kept consistent — because certs and demand are keyed
 * by process name, add/rename/remove must cascade.
 */

/** Add a process (no-op if name blank or already present). */
export function addProcess(state, rawName) {
  const name = (rawName || '').trim();
  if (!name || state.processes.includes(name)) return state;
  const required = state.settings?.defaultRequired ?? 2;
  const col = {};
  for (let w = 1; w <= 52; w++) col[w] = required;
  return {
    ...state,
    processes: [...state.processes, name],
    demand: { ...state.demand, [name]: col },
  };
}

/** Rename a process, cascading to demand keys and operator certifications. */
export function renameProcess(state, oldName, rawNew) {
  const newName = (rawNew || '').trim();
  if (!newName || oldName === newName) return state;
  if (!state.processes.includes(oldName)) return state;
  if (state.processes.includes(newName)) return state; // avoid collision

  const processes = state.processes.map(p => (p === oldName ? newName : p));

  const demand = { ...state.demand };
  if (demand[oldName]) {
    demand[newName] = demand[oldName];
    delete demand[oldName];
  }

  const operators = state.operators.map(op =>
    op.certifications?.includes(oldName)
      ? { ...op, certifications: op.certifications.map(c => (c === oldName ? newName : c)) }
      : op,
  );

  return { ...state, processes, demand, operators };
}

/** Remove a process, cascading to demand and operator certifications. */
export function removeProcess(state, name) {
  if (!state.processes.includes(name)) return state;
  const processes = state.processes.filter(p => p !== name);
  const { [name]: _removed, ...demand } = state.demand;
  const operators = state.operators.map(op =>
    op.certifications?.includes(name)
      ? { ...op, certifications: op.certifications.filter(c => c !== name) }
      : op,
  );
  return { ...state, processes, demand, operators };
}

/** Toggle one operator's certification for a process. */
export function toggleCertification(state, operatorId, process) {
  const operators = state.operators.map(op => {
    if (op.id !== operatorId) return op;
    const has = op.certifications?.includes(process);
    return {
      ...op,
      certifications: has
        ? op.certifications.filter(c => c !== process)
        : [...(op.certifications || []), process],
    };
  });
  return { ...state, operators };
}
