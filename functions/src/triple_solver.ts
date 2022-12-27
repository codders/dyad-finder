"use strict";

import * as solver from "./solver";

interface RankScoring {
  [key: string]: { [key: string]: number };
}

const dyadKey = (dyad: [string, string]): string => {
  return dyad.sort().join("/");
};

const score = (a: string, b: string, preferences: PreferenceRecord): number => {
  return preferences["student_prefs"][0][a].indexOf(b);
};

const scoreDyads = (dyads: [string, string][],
    thirds: string[],
    preferences: PreferenceRecord): RankScoring => {
  const result: RankScoring = {};
  thirds.forEach((third) => {
    dyads.forEach((dyad) => {
      if (result[third] === undefined) {
        result[third] = {};
      }
      result[third][dyadKey(dyad)] = (
        score(third, dyad[0], preferences) +
          score(third, dyad[1], preferences)
      )/2;
    });
  });
  return result;
};

const scoreThirds = (dyads: [string, string][],
    thirds: string[],
    preferences: PreferenceRecord): RankScoring => {
  const result: RankScoring = {};
  dyads.forEach((dyad) => {
    thirds.forEach((third) => {
      if (result[dyadKey(dyad)] === undefined) {
        result[dyadKey(dyad)] = {};
      }
      result[dyadKey(dyad)][third] = (
        score(dyad[0], third, preferences) +
            score(dyad[1], third, preferences)
      )/2;
    });
  });
  return result;
};

const ranksToPreference = (ranks: RankScoring) => {
  const result: { [key: string]: string[] } = {};
  Object.keys(ranks).forEach((ranker) => {
    result[ranker] = Object.entries(ranks[ranker])
        .sort((a, b) => a[1] - b[1]).map((a) => a[0]);
  });
  return result;
};

const unpackDyad = (key: string): string[] => {
  return key.split("/");
};

export const solveForTriples =
  (preferences: PreferenceRecord): TripleAssignment => {
    const dyadMatching = solver.solve(preferences);
    console.log("SOLVING FOR TRIPLES");
    console.log("Preferences " + JSON.stringify(preferences, undefined, 2));
    let thirds = dyadMatching.unmatched || [];
    const pairs = dyadMatching.matching;
    console.log("Unmatched: " + thirds);
    while (pairs.length > 1 && thirds.length < pairs.length) {
      const unpopped = pairs.pop() || [];
      thirds = thirds.concat(unpopped);
    }
    const dyadScores = scoreDyads(pairs, thirds, preferences);
    const thirdScores = scoreThirds(pairs, thirds, preferences);
    console.log("Scores for dyads: ", dyadScores);
    console.log("Dyad scores for thirds: ", thirdScores);
    const triplePreferences = Object.assign(
        ranksToPreference(dyadScores),
        ranksToPreference(thirdScores)
    );
    console.log("Triple Preferences: " +
      JSON.stringify(triplePreferences, undefined, 2));
    const tripleSolution = solver.solve(
        {"student_prefs": [triplePreferences]});
    const result: TripleAssignment = {
      matching: tripleSolution.matching.map((match) =>
        unpackDyad(match[0]).concat(unpackDyad(match[1])))
          .map((match) => match.sort())
          .map((match) => [match[0], match[1], match[2]]),
    };
    if (tripleSolution.unmatched !== undefined) {
      result.unmatched = tripleSolution.unmatched.map((match) =>
        unpackDyad(match))
          .reduce((i, a) => i.concat(a), []);
    }
    result.reason = [tripleSolution.reason, dyadMatching.reason]
        .filter((i) => i !== undefined)
        .reduce((i, a) => i.concat(a!), <string[]>[])
        .join(", ");
    if (result.reason === "") {
      delete result.reason;
    }
    return result;
  };

