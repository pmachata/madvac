import { Cons, CSP } from './csp.js';
import { assert } from 'chai';

var csp = new CSP();
csp.pushCons(new Cons([0, 1], 10));
csp.simplify();
assert.strictEqual(csp.knowns.size, 0, "1: knowns.size");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 3));
csp.simplify();
assert.strictEqual(csp.knowns.size, 3, "2: knowns.size");
assert.strictEqual(csp.knowns.get(1), 1, "2: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 1, "2: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 1, "2: knowns.get(5)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 0));
csp.simplify();
assert.strictEqual(csp.knowns.size, 3, "3: knowns.size");
assert.strictEqual(csp.knowns.get(1), 0, "3: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 0, "3: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 0, "3: knowns.get(5)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 0));
csp.pushCons(new Cons([2, 4, 6], 3));
csp.simplify();
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
assert.strictEqual(csp.knowns.size, 4, "4: knowns.size");
assert.strictEqual(csp.knowns.get(1), 1, "4: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 1, "4: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 1, "4: knowns.get(5)");
assert.strictEqual(csp.knowns.get(6), 0, "4: knowns.get(6)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 6], 2));
csp.pushCons(new Cons([1, 3, 5], 3));
csp.simplify();
assert.strictEqual(csp.knowns.size, 4, "4a: knowns.size");
assert.strictEqual(csp.knowns.get(1), 1, "4a: knowns.get(1)");
assert.strictEqual(csp.knowns.get(3), 1, "4a: knowns.get(3)");
assert.strictEqual(csp.knowns.get(5), 1, "4a: knowns.get(5)");
assert.strictEqual(csp.knowns.get(6), 0, "4a: knowns.get(6)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 6], 2));
csp.pushCons(new Cons([1, 3, 5, 6], 3));
csp.simplify();
assert.strictEqual(csp.knowns.get(5), 1, "5: knowns.get(5)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 6], 2));
csp.pushCons(new Cons([1, 3, 5, 6, 7], 4));
csp.simplify();
assert.strictEqual(csp.knowns.get(5), 1, "6: knowns.get(5)");
assert.strictEqual(csp.knowns.get(7), 1, "6: knowns.get(7)");

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 6], 2));
csp.pushCons(new Cons([1, 3, 5, 6, 7], 2));
csp.simplify();
assert.strictEqual(csp.knowns.get(5), 0, "7: knowns.get(5)");
assert.strictEqual(csp.knowns.get(7), 0, "7: knowns.get(7)");

var csp = new CSP();
csp.pushCons(new Cons([1, 2, 3, 4, 5], 2));
csp.pushCons(new Cons([3, 4, 5, 6, 7], 4));
csp.simplify();
assert.strictEqual(csp.knowns.get(1), 0, "8: knowns.get(1)");
assert.strictEqual(csp.knowns.get(2), 0, "8: knowns.get(2)");
assert.isNotOk(csp.knowns.has(3), "8: knowns.get(3)");
assert.isNotOk(csp.knowns.has(4), "8: knowns.get(4)");
assert.isNotOk(csp.knowns.has(5), "8: knowns.get(5)");
assert.strictEqual(csp.knowns.get(6), 1, "8: knowns.get(6)");
assert.strictEqual(csp.knowns.get(7), 1, "8: knowns.get(7)");

var csp = new CSP();
csp.pushCons(new Cons([1, 2, 3], 2));
csp.pushCons(new Cons([2, 3, 4], 1));
csp.pushCons(new Cons([1, 4, 5], 2));
csp.simplify();
assert.strictEqual(csp.knowns.get(1), 1, "9: knowns.get(1)");
assert.strictEqual(csp.knowns.get(4), 0, "9: knowns.get(4)");
assert.strictEqual(csp.knowns.get(5), 1, "9: knowns.get(5)");

console.log("CSP OK!");
