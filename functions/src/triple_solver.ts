'use strict';

import * as solver from './solver';

interface RankScoring {
  [key: string]: { [key: string]: number };
}

const dyad_key = (dyad: [string,string]): string => {
  return dyad.sort().join("/");
}

const score = (a: string, b: string, preferences: PreferenceRecord): number => {
  return preferences["student_prefs"][0][a].indexOf(b);
}

const score_dyads = (dyads: [string,string][], thirds: string[], preferences: PreferenceRecord): RankScoring => {
  const result: RankScoring = {};
  thirds.forEach(third => {
    dyads.forEach(dyad => {
      if (result[third] === undefined) {
        result[third] = {};
      }
      result[third][dyad_key(dyad)] = (score(third, dyad[0], preferences) + score(third, dyad[1], preferences))/2;
    });      
  });
  return result;
}

const score_thirds = (dyads: [string,string][], thirds: string[], preferences: PreferenceRecord): RankScoring => {
  const result: RankScoring = {};
  dyads.forEach(dyad => {
    thirds.forEach(third => {
      if (result[dyad_key(dyad)] === undefined) {
        result[dyad_key(dyad)] = {};
      }
      result[dyad_key(dyad)][third] = (score(dyad[0], third, preferences) + score(dyad[1], third, preferences))/2;
    });
  });
  return result;
}

const ranks_to_preference = (ranks: RankScoring) => {
  const result: { [key: string]: string[] } = {};
  Object.keys(ranks).forEach(ranker => {
    result[ranker] = Object.entries(ranks[ranker]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
  });
  return result;
}

const unpack_dyad = (key: string): string[] => {
  return key.split("/");
}

export const solve_for_triples = (preferences: PreferenceRecord): TripleAssignment => {
  const dyad_matching = solver.solve(preferences);
  console.log("SOLVING FOR TRIPLES");
  console.log("Preferences " + JSON.stringify(preferences, undefined, 2));
  let thirds = dyad_matching.unmatched || [];
  const pairs = dyad_matching.matching;
  console.log("Unmatched: " + thirds);
  while (pairs.length > 1 && thirds.length < pairs.length) {
    const unpopped = pairs.pop() || [];
    thirds = thirds.concat(unpopped);
  }
  const dyad_scores = score_dyads(pairs, thirds, preferences);
  const third_scores = score_thirds(pairs, thirds, preferences);
  console.log("Scores for dyads: ", dyad_scores);
  console.log("Dyad scores for thirds: ", third_scores);
  const triple_preferences = Object.assign(ranks_to_preference(dyad_scores), ranks_to_preference(third_scores));
  console.log("Triple Preferences: " + JSON.stringify(triple_preferences, undefined, 2));
  const triple_solution = solver.solve({ "student_prefs": [ triple_preferences ] });
  const result: TripleAssignment = { 
    matching: triple_solution.matching.map(match => unpack_dyad(match[0]).concat(unpack_dyad(match[1]))).map(match => match.sort()).map(match => [match[0], match[1], match[2]])
  };
  if (triple_solution.unmatched !== undefined) {
    result.unmatched = triple_solution.unmatched.map(match => unpack_dyad(match)).reduce((i, a) => i.concat(a), []);
  }
  result.reason = [ triple_solution.reason, dyad_matching.reason ].filter(i => i !== undefined).reduce((i,a) => i.concat(a!), <string[]>[]).join(", ");
  if (result.reason === "") {
    delete result.reason;
  }
  return result;
}

