import admin = require('firebase-admin');
import funcTest = require('firebase-functions-test');
import { HttpsFunction, Runnable } from 'firebase-functions';
import 'mocha';
import sinon = require('sinon');

describe("test dyad api", () => {
  let dyadapi:{ [key: string]: HttpsFunction & Runnable<any> }, adminInitStub:sinon.SinonStub;
  const tester = funcTest();

  before(async() => {
    adminInitStub = sinon.stub(admin, "initializeApp");
    dyadapi = await import("../src/index");
  });

  it("Does something", () => {
    const wrapped = tester.wrap(dyadapi.postPreference);
    wrapped(null); 
  });

  after(() => {
    adminInitStub.restore();
    tester.cleanup();
  });
});
