'use strict';

interface ProposerState {
  name: string,
  acceptedProposal?: string,
  preferences: string[]
}

let log_buffer : string[];

const log = (...strings: any[]) => {
  log_buffer.push(strings.join(""));
}

const remove_preference = (preference: string, targets: string[], state: { [key: string]: ProposerState }) => {
  targets.forEach(target => {
    log("Removing " + preference + " from preferences for " + target + " (if present)");
    if (state[target].preferences.includes(preference)) {
      state[target].preferences.splice(state[target].preferences.indexOf(preference), 1);
    }
  });
}

const make_proposal = (proposer: string, state: { [key: string]: ProposerState }, force_accept: boolean) => {
  log("Making proposal as " + proposer);
  const proposer_preference = state[proposer].preferences;
  if (proposer_preference.length === 0) {
    log("Proposer " + proposer + " has no further preferences");
    return;
  }
  const first_preference = proposer_preference[0];
  if (state[first_preference].preferences.includes(proposer) || force_accept) {
    log("Proposee " + first_preference + " is interested in my proposal");
    state[first_preference].acceptedProposal = proposer;
    const rejected = state[first_preference].preferences.slice(state[first_preference].preferences.indexOf(proposer) + 1);
    remove_preference(first_preference, rejected, state);
    state[first_preference].preferences = state[first_preference].preferences.slice(0, state[first_preference].preferences.indexOf(proposer) + 1);
    if (force_accept) {
      state[proposer].acceptedProposal = first_preference;
    }
  }
}

const proposer_map = (preferences: PreferenceRecord): { [key: string]:  ProposerState } => {
  const result = <{ [key: string]: ProposerState}>{};
  Object.entries(preferences.student_prefs[0]).forEach(([key, value]) => {
    result[key] = {
      name: key,
      preferences: value
    };
  });
  return result;
}

const extract_assignment = (state: { [key: string]:  ProposerState }): Assignment => {
  const result = <[string,string][]>[];
  const proposers = Object.keys(state);
  while (proposers.length > 0) {
    const proposer = proposers[0];
    if (state[proposer].acceptedProposal !== undefined && state[state[proposer].acceptedProposal!].acceptedProposal === proposer) {
      result.push([proposer, state[proposer].acceptedProposal!]);
      proposers.splice(proposers.indexOf(state[proposer].acceptedProposal!), 1);
    } else {
      log("No match found for " + proposer);
    }
    proposers.shift();
  } 
  return { matching: result };
}

export const not_all_matched = (state: { [key: string]:  ProposerState }): boolean => {
  let all_matched = true;
  Object.keys(state).forEach(name => {
    if (state[name].acceptedProposal === undefined || state[name].preferences.length > 0) {
      all_matched = false;
    }
  });
  return !all_matched;
}

export const execute_phase_1 = (state: { [key: string]:  ProposerState }, force_accept: boolean) => {
  log("Executing Phase 1");
  let changed = true;
  while (changed && not_all_matched(state)) {
    changed = false;
    const pre_image = JSON.stringify(state);

    const proposers = Object.keys(state);
    log("ProposerArray: " + JSON.stringify(proposers));
    
    log("Making round of proposals");
    proposers.forEach(name => make_proposal(name, state, force_accept));
    log("Proposers: " + JSON.stringify(state, undefined, 2));
    changed = (JSON.stringify(state) !== pre_image);
    log("Changed: ", changed);
  }
  log("Phase 1 complete");
}

export const unstable = (state: { [key: string]:  ProposerState }): boolean => {
  let is_unstable = false;
  Object.keys(state).forEach(name => {
    if (state[name].preferences.length === 0) {
      is_unstable = true;
    }
  }); 
  log("Map unstable? ", is_unstable);
  return is_unstable;
}

export const minimal_stable = (state: { [key: string]:  ProposerState }): boolean => {
  let stable = true;
  Object.keys(state).forEach(name => {
    if (state[name].preferences.length !== 1) {
      stable = false;
    }
  }); 
  log("Map stable? ", stable);
  return stable;
}

export const calculate_next_loop_entry = (current_entry: [string,string], state: { [key: string]:  ProposerState }): [string,string] => {
  const qidash = state[current_entry[0]].preferences[1];
  const pidash = state[qidash].preferences[state[qidash].preferences.length - 1];
  return <[string,string]>[pidash, qidash];
}

export const tuple_list_includes = (list: [string,string][], tuple: [string,string]): boolean => {
  let found = false;
  list.forEach(entry => {
    if (entry[0] === tuple[0] && entry[1] === tuple[1]) {
      found = true;
    }
  });
  return found;
}

export const tuple_list_tail = (list: [string,string][], head: [string,string]): [string,string][] => {
  const result = <[string,string][]>[];
  let copying = false;
  list.forEach(entry => {
    if (entry[0] === head[0] && entry[1] === head[1]) {
      copying = true;
    }
    if (copying) {
      result.push(entry);
    }
  });
  return result;
}

export const find_loop = (state: { [key: string]:  ProposerState }): [string,string][] => {
  log("Looking for a loop");
  const loop_start = Object.keys(state).find(name => state[name].preferences.length > 1);
  log("Starting with: " + loop_start!);
  const loop_entries = <[string,string][]>[];
  let next_entry: [string,string] = [ loop_start!, state[loop_start!].preferences[0] ];
  while (!tuple_list_includes(loop_entries, next_entry)) {
    log("  Adding " + next_entry);
    loop_entries.push(next_entry);
    next_entry = calculate_next_loop_entry(next_entry, state);
  }
  
  return tuple_list_tail(loop_entries, next_entry);
}

export const remove_loop = (state: { [key: string]:  ProposerState }, loop: [string,string][]) => {
  const loop_with_buffer = [loop[loop.length - 1]].concat(loop);
  for (let i=1; i<loop_with_buffer.length; i++) {
    const previous_cell = loop_with_buffer[i-1];
    const cell = loop_with_buffer[i];
    log("Removing ", cell); 
    log("Removing the head of " + cell[0] + "'s preferences");
    state[cell[0]].preferences = state[cell[0]].preferences.slice(1);
    log("After R1: " + JSON.stringify(state, undefined, 2));
    log("Removing everything after " + previous_cell[0] + " from " + cell[1] + "'s prefernces");
    state[cell[1]].preferences = state[cell[1]].preferences.slice(0, state[cell[1]].preferences.indexOf(previous_cell[0]) + 1);
    log("After R2: " + JSON.stringify(state, undefined, 2));
  }
}

export const clear_acceptances = (state: { [key: string]:  ProposerState }) => {
  Object.keys(state).forEach(key => {
    state[key].acceptedProposal = undefined;
  });
}

export const solve_for_stable = (preferences: PreferenceRecord): Assignment => {
  const map = JSON.parse(JSON.stringify(proposer_map(preferences)));
  log("Proposers: " + JSON.stringify(map, undefined, 2));

  execute_phase_1(map, false);
  if (unstable(map)) {
    return { matching: [], reason: "Unstable map" };
  }
  while (!unstable(map) && !minimal_stable(map)) {
    const loop = find_loop(map);
    log("Found loop: " + JSON.stringify(loop));
    if (loop.length > 0) {
      remove_loop(map, loop);
      log("Proposers: " + JSON.stringify(map, undefined, 2));
    } else {
      break;
    }
  }
  clear_acceptances(map);
  execute_phase_1(map, false);

  return extract_assignment(map);  
}

export const bogo_solve = (preferences: PreferenceRecord): Assignment => {
  const map = JSON.parse(JSON.stringify(proposer_map(preferences)));
  log("Proposers: " + JSON.stringify(map, undefined, 2));
  log("Bogo matching...");
  execute_phase_1(map, true);

  return extract_assignment(map);
}

export const filter_matches = (preferences: PreferenceRecord, matches: [string,string][]): PreferenceRecord => {
  const state = JSON.parse(JSON.stringify(preferences.student_prefs[0]));
  const matched = matches.reduce((acc, r) => acc.concat([r[0], r[1]]), <string[]>[])
  matched.forEach(student => { delete state[student] });
  Object.keys(state).forEach(key => {
    log("Filtering out " + key + " (" + state[key] + ")");
    state[key] = state[key].filter((word: string) => !matched.includes(word))
  });
  return { student_prefs: [ state ] };
}

export const solve = (preferences: PreferenceRecord): Assignment => {
  log_buffer = <string[]>[];
  let matches = <[string,string][]>[];  
  const reasons = [];
  let bogo_match = false;
  let preferences_to_match = preferences;
  log("In solver: " + Object.keys(preferences.student_prefs[0]).length);
  while (matches.length < Math.floor(Object.keys(preferences.student_prefs[0]).length/2)) {
    log("Attempting to find a solution");
    let assignment: Assignment;
    if (!bogo_match) {
      assignment = solve_for_stable(preferences_to_match);
    } else {
      assignment = bogo_solve(preferences_to_match);
    }
    log("Got assignment for " + (assignment.matching.length * 2) + " participants");
    if (assignment.reason !== undefined) {
      reasons.push(assignment.reason);
    }
    if (assignment.matching.length > 0) {
      matches = matches.concat(assignment.matching);
      if (assignment.matching.length < Math.floor(Object.keys(preferences.student_prefs[0]).length/2)) {
        preferences_to_match = filter_matches(preferences_to_match, matches);
      }
    } else {
      bogo_match = true
      log_buffer.forEach(line => {
        console.log(line);
      });
    }
  }

  const result: Assignment = { matching: matches };

  const matched = matches.reduce((acc, r) => acc.concat([r[0], r[1]]), <string[]>[]);
  if (matched.length < Object.keys(preferences.student_prefs[0]).length) {
    const unmatched: string[] = [];
    Object.keys(preferences.student_prefs[0]).forEach(student => {
      if (!matched.includes(student)) {
        unmatched.push(student);
      }
    });
    result.unmatched = unmatched;
  }

  if (reasons.length > 0) {
    result.reason = reasons.join(", ");
  }

  return result;
} 
