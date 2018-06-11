import { Cons, CSP } from './csp.js';
import { assert } from 'chai';

var csp = new CSP();
csp.pushCons(new Cons([0, 1], [10]));
csp.simplify();
assert.strictEqual(csp.conses.length, 1, "1: conses.length");
assert.strictEqual(csp.knowns.size, 0, "1: knowns.size");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 3));
csp.simplify();
assert.strictEqual(csp.conses.length, 0, "2: conses.length");
assert.strictEqual(csp.knowns.size, 3, "2: knowns.size");
assert.strictEqual(csp.knowns.get(1), 1, "2: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 1, "2: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 1, "2: knowns.get(5)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 0));
csp.simplify();
assert.strictEqual(csp.conses.length, 0, "3: conses.length");
assert.strictEqual(csp.knowns.size, 3, "3: knowns.size");
assert.strictEqual(csp.knowns.get(1), 0, "3: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 0, "3: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 0, "3: knowns.get(5)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 0));
csp.pushCons(new Cons([2, 4, 6], 3));
csp.simplify();
assert.strictEqual(csp.conses.length, 0, "3a: conses.length");
assert.strictEqual(csp.knowns.size, 6, "3a: knowns.size");
assert.strictEqual(csp.knowns.get(1), 0, "3a: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 0, "3a: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 0, "3a: knowns.get(5)");
assert.strictEqual(csp.knowns.get(2), 1, "3a: knowns.get(2)");
assert.strictEqual(csp.knowns.get(4), 1, "3a: knowns.get(4)");
assert.strictEqual(csp.knowns.get(6), 1, "3a: knowns.get(6)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 3));
csp.pushCons(new Cons([1, 3, 6], 2));
csp.simplify();
assert.strictEqual(csp.conses.length, 0, "4: conses.length");
assert.strictEqual(csp.knowns.size, 4, "4: knowns.size");
assert.strictEqual(csp.knowns.get(1), 1, "4: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 1, "4: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 1, "4: knowns.get(5)");
assert.strictEqual(csp.knowns.get(6), 0, "4: knowns.get(6)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 6], 2));
csp.pushCons(new Cons([1, 3, 5], 3));
csp.simplify();
assert.strictEqual(csp.conses.length, 0, "4a: conses.length");
assert.strictEqual(csp.knowns.size, 4, "4a: knowns.size");
assert.strictEqual(csp.knowns.get(1), 1, "4a: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 1, "4a: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 1, "4a: knowns.get(5)");
assert.strictEqual(csp.knowns.get(6), 0, "4a: knowns.get(6)");

/*
var csp = new CSP();
csp.pushCons(new Cons([1, 3, 6], 2));
csp.pushCons(new Cons([1, 3, 5, 6], 3));
csp.simplify();
assert.strictEqual(csp.knowns.get(5), 1, "5: knowns.get(5)");
*/
