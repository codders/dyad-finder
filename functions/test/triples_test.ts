import 'mocha';
import '../src/types';
import * as triple_solver from '../src/triple_solver';

const assert = require('assert');

describe("test solve_for_triples", () => {

  it("computes trivial match", () => {
    const solution = triple_solver.solve_for_triples({ student_prefs: [ { A: [ "J", "H" ], J: [ "H", "A" ], H: [ "A", "J" ] } ] });
    assert.deepEqual({ matching: [ ["A", "H", "J"] ] }, solution);
  });

  it("computes a more complex match", () => {
    const solution = triple_solver.solve_for_triples({ student_prefs: [ {
        A: [ "B", "C", "D" ],
        B: [ "C", "A", "D" ],
        C: [ "A", "B", "D" ],
        D: [ "A", "B", "C" ]
      } ] });
    assert.deepEqual({ matching: [ [ "A", "B", "C" ] ], unmatched: [ "D" ], reason: "Unstable map, Unstable map" }, solution);
  });

  it("computes a good match on a larger group", () => {
    const solution = triple_solver.solve_for_triples({ student_prefs: [ {
        "1": [ "3", "4", "2", "6", "5" ],
        "2": [ "6", "5", "4", "1", "3" ],
        "3": [ "2", "4", "5", "1", "6" ],
        "4": [ "5", "2", "3", "6", "1" ],
        "5": [ "3", "1", "2", "4", "6" ],
        "6": [ "5", "1", "3", "4", "2" ]
      } ] });
    assert.deepEqual({ matching: [ [1,3,6], [2,4,5] ] }, solution); 
  });

});
