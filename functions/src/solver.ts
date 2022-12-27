"use strict";

interface ProposerState {
  name: string,
  acceptedProposal?: string,
  preferences: string[]
}

let logBuffer : string[];

const log = (...strings: string[]) => {
  logBuffer.push(strings.join(""));
};

const removePreference = (
    preference: string,
    targets: string[],
    state: {[key: string]: ProposerState}
) => {
  targets.forEach((target) => {
    log("Removing " + preference + " from preferences for " +
      target + " (if present)");
    if (state[target].preferences.includes(preference)) {
      state[target].preferences.splice(
          state[target].preferences.indexOf(preference),
          1
      );
    }
  });
};

const makeProposal = (
    proposer: string,
    state: {[key: string]: ProposerState},
    forceAccept: boolean
) => {
  log("Making proposal as " + proposer);
  const proposerPreference = state[proposer].preferences;
  if (proposerPreference.length === 0) {
    log("Proposer " + proposer + " has no further preferences");
    return;
  }
  const firstPreference = proposerPreference[0];
  if (state[firstPreference].preferences.includes(proposer) || forceAccept) {
    log("Proposee " + firstPreference + " is interested in my proposal");
    state[firstPreference].acceptedProposal = proposer;
    const rejected = state[firstPreference].preferences.slice(
        state[firstPreference].preferences.indexOf(proposer) + 1
    );
    removePreference(firstPreference, rejected, state);
    state[firstPreference].preferences = state[firstPreference]
        .preferences
        .slice(0, state[firstPreference].preferences.indexOf(proposer) + 1);
    if (forceAccept) {
      state[proposer].acceptedProposal = firstPreference;
    }
  }
};

const proposerMap =
    (preferences: PreferenceRecord): {[key: string]: ProposerState} => {
      const result = <{ [key: string]: ProposerState}>{};
      Object.entries(preferences.student_prefs[0]).forEach(([key, value]) => {
        result[key] = {
          name: key,
          preferences: value,
        };
      });
      return result;
    };

const extractAssignment =
    (state: {[key: string]: ProposerState}): Assignment => {
      const result = <[string, string][]>[];
      const proposers = Object.keys(state);
      while (proposers.length > 0) {
        const proposer = proposers[0];
        if (state[proposer].acceptedProposal !== undefined &&
            state[state[proposer].acceptedProposal!].acceptedProposal ===
              proposer) {
          result.push([proposer, state[proposer].acceptedProposal!]);
          proposers.splice(
              proposers.indexOf(state[proposer].acceptedProposal!), 1);
        } else {
          log("No match found for " + proposer);
        }
        proposers.shift();
      }
      return {matching: result};
    };

export const notAllMatched =
  (state: {[key: string]: ProposerState}): boolean => {
    let allMatched = true;
    Object.keys(state).forEach((name) => {
      if (state[name].acceptedProposal === undefined ||
          state[name].preferences.length > 0) {
        allMatched = false;
      }
    });
    return !allMatched;
  };

export const executePhase1 =
  (state: {[key: string]: ProposerState}, forceAccept: boolean) => {
    log("Executing Phase 1");
    let changed = true;
    while (changed && notAllMatched(state)) {
      changed = false;
      const preImage = JSON.stringify(state);

      const proposers = Object.keys(state);
      log("ProposerArray: " + JSON.stringify(proposers));

      log("Making round of proposals");
      proposers.forEach((name) =>
        makeProposal(name, state, forceAccept));
      log("Proposers: " + JSON.stringify(state, undefined, 2));
      changed = (JSON.stringify(state) !== preImage);
      log("Changed: " + changed);
    }
    log("Phase 1 complete");
  };

export const unstable =
  (state: {[key: string]: ProposerState}): boolean => {
    let isUnstable = false;
    Object.keys(state).forEach((name) => {
      if (state[name].preferences.length === 0) {
        isUnstable = true;
      }
    });
    log("Map unstable? " + isUnstable);
    return isUnstable;
  };

export const minimalStable =
  (state: {[key: string]: ProposerState}): boolean => {
    let stable = true;
    Object.keys(state).forEach((name) => {
      if (state[name].preferences.length !== 1) {
        stable = false;
      }
    });
    log("Map stable? " + stable);
    return stable;
  };

export const calculateNextLoopEntry =
  (currentEntry: [string, string],
      state: {[key: string]: ProposerState}): [string, string] => {
    const qidash = state[currentEntry[0]].preferences[1];
    const pidash = state[qidash].preferences[
        state[qidash].preferences.length - 1
    ];
    return <[string, string]>[pidash, qidash];
  };

export const tupleListIncludes =
  (list: [string, string][], tuple: [string, string]): boolean => {
    let found = false;
    list.forEach((entry) => {
      if (entry[0] === tuple[0] && entry[1] === tuple[1]) {
        found = true;
      }
    });
    return found;
  };

export const tupleListTail =
  (list: [string, string][], head: [string, string]): [string, string][] => {
    const result = <[string, string][]>[];
    let copying = false;
    list.forEach((entry) => {
      if (entry[0] === head[0] && entry[1] === head[1]) {
        copying = true;
      }
      if (copying) {
        result.push(entry);
      }
    });
    return result;
  };

export const findLoop =
  (state: {[key: string]: ProposerState}): [string, string][] => {
    log("Looking for a loop");
    const loopStart = Object.keys(state).find((name) =>
      state[name].preferences.length > 1);
    log("Starting with: " + loopStart!);
    const loopEntries = <[string, string][]>[];
    let nextEntry: [string, string] = [
      loopStart!,
      state[loopStart!].preferences[0],
    ];
    while (!tupleListIncludes(loopEntries, nextEntry)) {
      log("  Adding " + nextEntry);
      loopEntries.push(nextEntry);
      nextEntry = calculateNextLoopEntry(nextEntry, state);
    }

    return tupleListTail(loopEntries, nextEntry);
  };

export const removeLoop =
  (state: {[key: string]: ProposerState}, loop: [string, string][]) => {
    const loopWithBuffer = [loop[loop.length - 1]].concat(loop);
    for (let i=1; i<loopWithBuffer.length; i++) {
      const previousCell = loopWithBuffer[i-1];
      const cell = loopWithBuffer[i];
      log("Removing[" + cell[0] + ", " + cell[1] + "]");
      log("Removing the head of " + cell[0] + "'s preferences");
      state[cell[0]].preferences = state[cell[0]].preferences.slice(1);
      log("After R1: " + JSON.stringify(state, undefined, 2));
      log("Removing everything after " +
        previousCell[0] +
        " from " + cell[1] + "'s prefernces");
      state[cell[1]].preferences = state[cell[1]]
          .preferences
          .slice(0, state[cell[1]]
              .preferences
              .indexOf(previousCell[0]) + 1);
      log("After R2: " + JSON.stringify(state, undefined, 2));
    }
  };

export const clearAcceptances = (state: {[key: string]: ProposerState}) => {
  Object.keys(state).forEach((key) => {
    state[key].acceptedProposal = undefined;
  });
};

export const solveForStable = (preferences: PreferenceRecord): Assignment => {
  const map = JSON.parse(JSON.stringify(proposerMap(preferences)));
  log("Input Table: " + JSON.stringify(map, undefined, 2));

  executePhase1(map, false);
  if (unstable(map)) {
    return {matching: [], reason: "Unstable map"};
  }
  log("Phase 1 Table: " + JSON.stringify(map, undefined, 2));
  while (!unstable(map) && !minimalStable(map)) {
    const loop = findLoop(map);
    log("Found loop: " + JSON.stringify(loop));
    if (loop.length > 0) {
      removeLoop(map, loop);
      log("Proposers: " + JSON.stringify(map, undefined, 2));
    } else {
      break;
    }
  }
  clearAcceptances(map);
  executePhase1(map, false);

  return extractAssignment(map);
};

export const bogoSolve = (preferences: PreferenceRecord): Assignment => {
  const map = JSON.parse(JSON.stringify(proposerMap(preferences)));
  log("Proposers: " + JSON.stringify(map, undefined, 2));
  log("Bogo matching...");
  executePhase1(map, true);

  return extractAssignment(map);
};

export const filterMatches =
  (preferences: PreferenceRecord,
      matches: [string, string][]): PreferenceRecord => {
    const state = JSON.parse(JSON.stringify(preferences.student_prefs[0]));
    const matched = matches.reduce((acc, r) =>
      acc.concat([r[0], r[1]]), <string[]>[]);
    matched.forEach((student) => {
      delete state[student];
    });
    Object.keys(state).forEach((key) => {
      log("Filtering out " + key + " (" + state[key] + ")");
      state[key] = state[key].filter((word: string) =>
        !matched.includes(word));
    });
    return {student_prefs: [state]};
  };

export const sanityCheckAndFixupLists =
  (preferences: PreferenceRecord): PreferenceRecord => {
    const map = preferences.student_prefs[0];
    const allKeys = Object.keys(map);
    allKeys.forEach((student) => {
      let preference = map[student];
      preference = preference.filter((selection) =>
        allKeys.includes(selection));
      const keyCopy = Object.assign([], allKeys);
      keyCopy.splice(keyCopy.indexOf(student, 0), 1);
      preference.forEach((selection) => {
        const index = keyCopy.indexOf(selection, 0);
        if (index > -1) {
          keyCopy.splice(index, 1);
        }
      });
      map[student] = preference.concat(keyCopy);
    });
    return preferences;
  };

export const solve = (preferences: PreferenceRecord): Assignment => {
  logBuffer = <string[]>[];
  let matches = <[string, string][]>[];
  const reasons = [];
  let bogoMatch = false;
  let preferencesToMatch = sanityCheckAndFixupLists(preferences);
  console.log(
      "Starting solver with " +
      Object.keys(preferences.student_prefs[0]).length +
      " preferences"
  );
  while (matches.length < Math.floor(
      Object.keys(preferences.student_prefs[0]).length/2)
  ) {
    log("Attempting to find a solution");
    let assignment: Assignment;
    if (!bogoMatch) {
      assignment = solveForStable(preferencesToMatch);
    } else {
      assignment = bogoSolve(preferencesToMatch);
    }
    console.log("Got assignment for " +
      (assignment.matching.length * 2) + " participants");
    if (assignment.reason !== undefined) {
      reasons.push(assignment.reason);
    }
    if (assignment.matching.length > 0) {
      matches = matches.concat(assignment.matching);
      console.log("Got matches", matches);
      if (assignment.matching.length <
        Math.floor(Object.keys(preferences.student_prefs[0]).length/2)) {
        console.log("Filtering preferences");
        preferencesToMatch = filterMatches(preferencesToMatch, matches);
      }
    } else {
      bogoMatch = true;
      logBuffer.forEach((line) => {
        console.log(line);
      });
    }
  }

  const result: Assignment = {matching: matches};

  const matched = matches.reduce((acc, r) =>
    acc.concat([r[0], r[1]]), <string[]>[]);
  if (matched.length < Object.keys(preferences.student_prefs[0]).length) {
    const unmatched: string[] = [];
    Object.keys(preferences.student_prefs[0]).forEach((student) => {
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
};
