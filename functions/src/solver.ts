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

export const solve = (preferences: PreferenceRecord): Assignment => {
  const map = proposer_map(preferences);
  console.log("Proposers: " + JSON.stringify(map, undefined, 2));

  execute_phase_1(map);

  return extract_assignment(map);  
} 

//  return { sri_matching: { "A": [{"student_1": "A", "student_2": "J"}] } }
