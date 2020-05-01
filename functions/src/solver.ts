'use strict';

interface ProposerState {
  name: string,
  acceptedProposal?: string,
  preferences: string[]
}

const remove_preference = (preference: string, targets: string[], state: { [key: string]: ProposerState }) => {
  targets.forEach(target => {
    console.log("Removing " + preference + " from preferences for " + target + " (if present)");
    if (state[target].preferences.includes(preference)) {
      state[target].preferences.splice(state[target].preferences.indexOf(preference), 1);
    }
  });
}

const make_proposal = (proposer: string, state: { [key: string]: ProposerState }) => {
  console.log("Making proposal as " + proposer);
  const proposer_preference = state[proposer].preferences;
  if (proposer_preference.length === 0) {
    console.log("Proposer " + proposer + " has no further preferences");
    return;
  }
  const first_preference = proposer_preference[0];
  if (state[first_preference].preferences.includes(proposer)) {
    console.log("Proposee " + first_preference + " is interested in my proposal");
    state[first_preference].acceptedProposal = proposer;
    const rejected = state[first_preference].preferences.slice(state[first_preference].preferences.indexOf(proposer) + 1);
    remove_preference(first_preference, rejected, state);
    state[first_preference].preferences = state[first_preference].preferences.slice(0, state[first_preference].preferences.indexOf(proposer) + 1);
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
  var proposers = Object.keys(state);
  while (proposers.length > 0) {
    const proposer = proposers[0];
    if (state[proposer].acceptedProposal != undefined && state[state[proposer].acceptedProposal!].acceptedProposal == proposer) {
      result.push([proposer, state[proposer].acceptedProposal!]);
      proposers.splice(proposers.indexOf(state[proposer].acceptedProposal!), 1);
    } else {
      console.log("No match found for " + proposer);
    }
    proposers.shift();
  } 
  return { matching: result };
}

export const not_all_matched = (state: { [key: string]:  ProposerState }): boolean => {
  let not_all_matched = false;
  Object.keys(state).forEach(name => {
    if (state[name].acceptedProposal == undefined || state[name].preferences.length > 0) {
      not_all_matched = true;
    }
  });
  return not_all_matched;
}

export const execute_phase_1 = (state: { [key: string]:  ProposerState }) => {
  console.log("Executing Phase 1");
  let changed = true;
  while (changed && not_all_matched(state)) {
    changed = false;
    const pre_image = JSON.stringify(state);

    const proposers = Object.keys(state);
    console.log("ProposerArray: " + JSON.stringify(proposers));
    
    console.log("Making round of proposals");
    proposers.forEach(name => make_proposal(name, state));
    console.log("Proposers: " + JSON.stringify(state, undefined, 2));
    changed = (JSON.stringify(state) != pre_image);
    console.log("Changed: ", changed);
  }
  console.log("Phase 1 complete");
}

export const unstable = (state: { [key: string]:  ProposerState }): boolean => {
  let unstable = false;
  Object.keys(state).forEach(name => {
    if (state[name].preferences.length == 0) {
      unstable = true;
    }
  }); 
  console.log("Map unstable? ", unstable);
  return unstable;
}

export const minimal_stable = (state: { [key: string]:  ProposerState }): boolean => {
  let stable = true;
  Object.keys(state).forEach(name => {
    if (state[name].preferences.length != 1) {
      stable = false;
    }
  }); 
  console.log("Map stable? ", stable);
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
    if (entry[0] == tuple[0] && entry[1] == tuple[1]) {
      found = true;
    }
  });
  return found;
}

export const tuple_list_tail = (list: [string,string][], head: [string,string]): [string,string][] => {
  const result = <[string,string][]>[];
  let copying = false;
  list.forEach(entry => {
    if (entry[0] == head[0] && entry[1] == head[1]) {
      copying = true;
    }
    if (copying) {
      result.push(entry);
    }
  });
  return result;
}

export const find_loop = (state: { [key: string]:  ProposerState }): [string,string][] => {
  console.log("Looking for a loop");
  const loop_start = Object.keys(state).find(name => state[name].preferences.length > 1);
  console.log("Starting with: " + loop_start!);
  const loop_entries = <[string,string][]>[];
  let next_entry: [string,string] = [ loop_start!, state[loop_start!].preferences[0] ];
  while (!tuple_list_includes(loop_entries, next_entry)) {
    console.log("  Adding " + next_entry);
    loop_entries.push(next_entry);
    next_entry = calculate_next_loop_entry(next_entry, state);
  }
  
  return tuple_list_tail(loop_entries, next_entry);
}

export const remove_loop = (state: { [key: string]:  ProposerState }, loop: [string,string][]) => {
  const loop_with_buffer = [loop[loop.length - 1]].concat(loop);
  for (var i=1; i<loop_with_buffer.length; i++) {
    const previous_cell = loop_with_buffer[i-1];
    const cell = loop_with_buffer[i];
    console.log("Removing ", cell); 
    console.log("Removing the head of " + cell[0] + "'s preferences");
    state[cell[0]].preferences = state[cell[0]].preferences.slice(1);
    console.log("After R1: " + JSON.stringify(state, undefined, 2));
    console.log("Removing everything after " + previous_cell[0] + " from " + cell[1] + "'s prefernces");
    state[cell[1]].preferences = state[cell[1]].preferences.slice(0, state[cell[1]].preferences.indexOf(previous_cell[0]) + 1);
    console.log("After R2: " + JSON.stringify(state, undefined, 2));
  }
}

export const clear_acceptances = (state: { [key: string]:  ProposerState }) => {
  Object.keys(state).forEach(key => {
    state[key].acceptedProposal = undefined;
  });
}

export const solve = (preferences: PreferenceRecord): Assignment => {
  const map = proposer_map(preferences);
  console.log("Proposers: " + JSON.stringify(map, undefined, 2));

  execute_phase_1(map);
  while (!unstable(map) && !minimal_stable(map)) {
    const loop = find_loop(map);
    console.log("Found loop: " + JSON.stringify(loop));
    if (loop.length > 0) {
      remove_loop(map, loop);
      console.log("Proposers: " + JSON.stringify(map, undefined, 2));
    } else {
      break;
    }
  }
  clear_acceptances(map);
  execute_phase_1(map);

  return extract_assignment(map);  
} 

//  return { sri_matching: { "A": [{"student_1": "A", "student_2": "J"}] } }
