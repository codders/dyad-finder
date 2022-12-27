import "mocha";
import "../src/types";
import * as solver from "../src/solver";

import * as assert from "assert";

describe("test solver api", () => {
  it("computes trivial match", () => {
    const solution = solver.solve({student_prefs: [{A: ["J"], J: ["A"]}]});
    assert.deepEqual({matching: [["A", "J"]]}, solution);
  });

  it("returns a forced match if there is no stable solution", () => {
    const solution = solver.solve({student_prefs: [{
      A: ["B", "C", "D"],
      B: ["C", "A", "D"],
      C: ["A", "B", "D"],
      D: ["A", "B", "C"],
    }]});
    assert.deepEqual(
        {matching: [["A", "C"], ["B", "D"]], reason: "Unstable map"},
        solution
    );
  });

  it("returns a good map with one rejected person if " +
  "there are an uneven number of participants", () => {
    const solution = solver.solve({student_prefs: [{
      "1": ["3", "2", "5", "4"],
      "2": ["5", "4", "1", "3"],
      "3": ["2", "4", "1", "5"],
      "4": ["3", "1", "2", "5"],
      "5": ["4", "1", "3", "2"],
    }]});
    assert.deepEqual(
        {matching: [["3", "4"], ["1", "5"]], unmatched: ["2"]},
        solution
    );
  });

  it("returns good stable match if there is one", () => {
    const solution = solver.solve({student_prefs: [{
      "1": ["3", "4", "2", "6", "5"],
      "2": ["6", "5", "4", "1", "3"],
      "3": ["2", "4", "5", "1", "6"],
      "4": ["5", "2", "3", "6", "1"],
      "5": ["3", "1", "2", "4", "6"],
      "6": ["5", "1", "3", "4", "2"],
    }]});
    assert.deepEqual({matching: [[1, 6], [2, 4], [3, 5]]}, solution);
  });

  it("returns a match for error case #1", () => {
    const solution = solver.solve({student_prefs: [{
      "Arthur": ["Jenny", "Luca"],
      "Jenny": ["Lukas", "Luca"],
      "Luca": ["Arthur", "Jenny", "Lukas"],
      "Lukas": ["Luca"],
    }]});
    assert.deepEqual(
        {matching: [["Arthur", "Luca"], ["Jenny", "Lukas"]]},
        solution
    );
  });
});
