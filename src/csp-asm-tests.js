import { assert } from 'chai';
import { asm, logger, heap } from './asmctx.js';

function csp_pushCons(csp, vs, sum) {
    heap.enter();
    let cons = heap.allocaCons();
    asm.bs_init(cons);
    for (let v of vs) {
        asm.bs_add(cons, v);
    }
    asm.c_initSumOnly(cons, sum);
    asm.csp_pushCons(csp, cons);
    heap.leave();
}

function csp_new() {
    const ret = heap.allocaCsp();
    asm.csp_init(ret);
    return ret;
}

{
    heap.enter();

    let csp = csp_new();
    assert.strictEqual(asm.csp_ncons(csp), 0, "empty CSP has 0 conses");
    assert.strictEqual(asm.csp_nconsOld(csp), 0, "empty CSP has 0 old conses");

    // Insert x1+x2+x3=10.
    let cons = heap.allocaCons();
    asm.bs_init(cons);
    asm.bs_add(cons, 1);
    asm.bs_add(cons, 2);
    asm.bs_add(cons, 3);
    asm.c_initSumOnly(cons, 10);
    assert.strictEqual(asm.csp_nconsOld(csp), 0, "0: CSP has 0 oldConses");
    assert.isOk(asm.csp_pushCons(csp, cons), "1: pushed cons");
    assert.strictEqual(asm.csp_ncons(csp), 1, "1: CSP has 1 conses");
    assert.strictEqual(asm.csp_nconsOld(csp), 0, "1: CSP has 0 oldConses");
    // Insert x1+x2+x3=10 once more, this shouldn't do anything.
    asm.csp_pushCons(csp, cons);
    assert.strictEqual(asm.csp_ncons(csp), 1, "2: CSP has 1 conses");
    assert.strictEqual(asm.csp_nconsOld(csp), 0, "2: CSP has 0 oldConses");
    // Insert x1+x2+x3+x4=10.
    asm.bs_add(cons, 4);
    asm.csp_pushCons(csp, cons);
    assert.strictEqual(asm.csp_ncons(csp), 2, "3: CSP has 2 conses");
    assert.strictEqual(asm.csp_nconsOld(csp), 0, "3: CSP has 0 oldConses");
    // Insert x2+x3+x4=10.
    asm.bs_remove(cons, 1);
    asm.csp_pushCons(csp, cons);
    assert.strictEqual(asm.csp_ncons(csp), 3, "4: CSP has 2 conses");

    heap.leave();
}

{
    heap.enter();

    let csp = csp_new();
    let vss = [];
    for (let i = 0; i < 50; ++i) {
        // The first element serves as a pseudo-random key to shuffle the
        // elements up a bit.
        vss.push([1, i, i+1, i+2]);
    }
    vss.sort()

    let conses = [];
    for (let [_, ...vs] of vss) {
        // cons := a+b+c = 10 with a,b,c's defined above.
        let cons = heap.allocaCons();
        asm.bs_init(cons);
        for (let v of vs) {
            asm.bs_add(cons, v);
        }
        asm.c_initSumOnly(cons, 10);
        conses.push(cons);
    }

    let expectN = 0;
    for (let i = 0; i < conses.length; ++i) {
        let cons = conses[i];
        asm.csp_pushCons(csp, cons);
        assert.strictEqual(asm.csp_ncons(csp), ++expectN,
                           "5: CSP has " + expectN + " conses");

        for (let j = 0; j < conses.length; ++j) {
            let consj = conses[j];
            if (j <= i) {
                assert.isOk(asm.csp_hasCons(csp, consj),
                            "5: CSP has cons " + j + ":" + i);
            } else {
                assert.isNotOk(asm.csp_hasCons(csp, consj),
                               "5: CSP doesn't have cons " + j + ":" + i);
            }
        }
    }

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [0, 1], 10);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_knownsSize(csp), 0, "6: knowns.size");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [].toString(), "6: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 5], 3);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_knownsSize(csp), 3, "7: knowns.size");
    assert.strictEqual(asm.csp_known(csp, 1), 1, "7: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 3), 1, "7: knowns.get(3)");
    assert.strictEqual(asm.csp_known(csp, 5), 1, "7: knowns.get(5)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [1, 3, 5].toString(), "7: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 5], 0);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_knownsSize(csp), 3, "8: knowns.size");
    assert.strictEqual(asm.csp_known(csp, 1), 0, "8: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 3), 0, "8: knowns.get(3)");
    assert.strictEqual(asm.csp_known(csp, 5), 0, "8: knowns.get(5)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [1, 3, 5].toString(), "8: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 5], 0);
    csp_pushCons(csp, [2, 4, 6], 3);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_knownsSize(csp), 6, "9: knowns.size");
    assert.strictEqual(asm.csp_known(csp, 1), 0, "9: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 3), 0, "9: knowns.get(3)");
    assert.strictEqual(asm.csp_known(csp, 5), 0, "9: knowns.get(5)");
    assert.strictEqual(asm.csp_known(csp, 2), 1, "9: knowns.get(2)");
    assert.strictEqual(asm.csp_known(csp, 4), 1, "9: knowns.get(4)");
    assert.strictEqual(asm.csp_known(csp, 6), 1, "9: knowns.get(6)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [1, 2, 3, 4, 5, 6].toString(), "9: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 5], 3);
    csp_pushCons(csp, [1, 3, 6], 2);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_knownsSize(csp), 4, "10: knowns.size");
    assert.strictEqual(asm.csp_known(csp, 1), 1, "10: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 3), 1, "10: knowns.get(3)");
    assert.strictEqual(asm.csp_known(csp, 5), 1, "10: knowns.get(5)");
    assert.strictEqual(asm.csp_known(csp, 6), 0, "10: knowns.get(6)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [1, 3, 5, 6].toString(), "10: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 6], 2);
    csp_pushCons(csp, [1, 3, 5], 3);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_knownsSize(csp), 4, "11: knowns.size");
    assert.strictEqual(asm.csp_known(csp, 1), 1, "11: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 3), 1, "11: knowns.get(3)");
    assert.strictEqual(asm.csp_known(csp, 5), 1, "11: knowns.get(5)");
    assert.strictEqual(asm.csp_known(csp, 6), 0, "11: knowns.get(6)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [1, 3, 5, 6].toString(), "11: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 6], 2);
    csp_pushCons(csp, [1, 3, 5, 6], 3);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_known(csp, 5), 1, "11: knowns.get(5)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [5].toString(), "12: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 6], 2);
    csp_pushCons(csp, [1, 3, 5, 6, 7], 4);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_known(csp, 5), 1, "12: knowns.get(5)");
    assert.strictEqual(asm.csp_known(csp, 7), 1, "12: knowns.get(7)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [5, 7].toString(), "12: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 3, 6], 2);
    csp_pushCons(csp, [1, 3, 5, 6, 7], 2);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_known(csp, 5), 0, "13: knowns.get(5)");
    assert.strictEqual(asm.csp_known(csp, 7), 0, "13: knowns.get(7)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [5, 7].toString(), "13: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 2, 3, 4, 5], 2);
    csp_pushCons(csp, [3, 4, 5, 6, 7], 4);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_known(csp, 1), 0, "14: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 2), 0, "14: knowns.get(2)");
    assert.isNotOk(asm.csp_isKnown(csp, 3), "14: knowns.get(3)");
    assert.isNotOk(asm.csp_isKnown(csp, 4), "14: knowns.get(4)");
    assert.isNotOk(asm.csp_isKnown(csp, 5), "14: knowns.get(5)");
    assert.strictEqual(asm.csp_known(csp, 6), 1, "14: knowns.get(6)");
    assert.strictEqual(asm.csp_known(csp, 7), 1, "14: knowns.get(7)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [1, 2, 6, 7].toString(), "14: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    csp_pushCons(csp, [1, 2, 3], 2);
    csp_pushCons(csp, [2, 3, 4], 1);
    csp_pushCons(csp, [1, 4, 5], 2);
    let c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_known(csp, 1), 1, "15: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 4), 0, "15: knowns.get(4)");
    assert.strictEqual(asm.csp_known(csp, 5), 1, "15: knowns.get(5)");
    assert.strictEqual(heap.array(newKnowns, c).toString(),
                       [1, 4, 5].toString(), "15: array of knowns");

    heap.leave();
}

{
    heap.enter();

    let newKnowns = heap.allocaNewKnowns();
    let csp = csp_new();
    let c;

    csp_pushCons(csp, [7], 0);
    csp_pushCons(csp, [0, 1], 1);
    csp_pushCons(csp, [1, 2], 1);
    c = asm.csp_simplify(csp, newKnowns);
    csp_pushCons(csp, [0, 1, 2], 2);
    c = asm.csp_simplify(csp, newKnowns);

    assert.strictEqual(asm.csp_known(csp, 0), 1, "16: step 6: knowns.get(0)");
    assert.strictEqual(asm.csp_known(csp, 1), 0, "16: step 6: knowns.get(1)");
    assert.strictEqual(asm.csp_known(csp, 2), 1, "16: step 6: knowns.get(2)");
    assert.strictEqual(asm.csp_known(csp, 7), 0, "16: step 6: knowns.get(7)");

    heap.leave();
}
