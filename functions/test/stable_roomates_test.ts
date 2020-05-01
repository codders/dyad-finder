import 'mocha';
import '../src/types';
import * as solver from '../src/solver';

const assert = require('assert');

describe("test solver api", () => {

  it("computes trivial match", () => {
    const solution = solver.solve({ student_prefs: [ { A: [ "J" ], J: [ "A" ] } ] });
    assert.deepEqual({ matching: [ ["A", "J"] ] }, solution);
  });

  it("returns empty match if there is no solution", () => {
    const solution = solver.solve({ student_prefs: [ {
        A: [ "B", "C", "D" ],
        B: [ "C", "A", "D" ],
        C: [ "A", "B", "D" ],
        D: [ "A", "B", "C" ]
      } ] });
    assert.deepEqual({ matching: [ ] }, solution);
  });

  it("returns good stable match if there is one", () => {
    const solution = solver.solve({ student_prefs: [ {
        "1": [ "3", "4", "2", "6", "5" ],
        "2": [ "6", "5", "4", "1", "3" ],
        "3": [ "2", "4", "5", "1", "6" ],
        "4": [ "5", "2", "3", "6", "1" ],
        "5": [ "3", "1", "2", "4", "6" ],
        "6": [ "5", "1", "3", "4", "2" ]
      } ] });
    assert.deepEqual({ matching: [ ] }, solution); 
  });

});
