import { assert } from 'chai';
import { asm, heap } from './asmctx.js';

heap.enter();

var vs = heap.allocaBitSet();
asm.bs_init(vs);
assert.strictEqual(asm.bs_select(0x00), 0x000, "select 0x0");
assert.strictEqual(asm.bs_select(0x04), 0x004, "select 0x4");
assert.strictEqual(asm.bs_select(0x08), 0x008, "select 0x8");
assert.strictEqual(asm.bs_select(0x0c), 0x00c, "select 0xc");
assert.strictEqual(asm.bs_select(0x10), 0x010, "select 0x10");
assert.strictEqual(asm.bs_select(0x14), 0x014, "select 0x10");
assert.strictEqual(asm.bs_select(0x20), 0x100, "select 0x20");
assert.strictEqual(asm.bs_select(0x30), 0x110, "select 0x20");
assert.strictEqual(asm.bs_select(0x40), 0x200, "select 0x20");

for (let i = 0; i < 128; ++i) {
    assert.isNotOk(asm.bs_has(vs, i), "hasKey " + i);
}
assert.isOk(asm.bs_isEmpty(vs), "isEmpty");

var keys = [2, 4, 50, 8, 9, 10, 15, 20, 40, 100];
for (let i = 0; i < keys.length; ++i) {
    var key = keys[i];
    assert.strictEqual(asm.bs_size(vs), i,
                       "size " + i + " before addition");
    asm.bs_add(vs, key);
    assert.isNotOk(asm.bs_isEmpty(vs), "!isEmpty");
    assert.strictEqual(asm.bs_size(vs), i+1,
                       "size " + (i+1) + " after addition");
    assert.isOk(asm.bs_has(vs, key), "hasKey " + key + " after addition");
}

for (let i = 0; i < keys.length; ++i) {
    var key = keys[i];
    assert.isOk(asm.bs_has(vs, key), "hasKey " + key + " still holds");
}

var vs2 = heap.allocaBitSet();
asm.bs_copy(vs2, vs);

assert.isOk(asm.bs_equals(vs, vs), "vs equals itself");
assert.isOk(asm.bs_equals(vs, vs2), "vs equals copy");
assert.isOk(asm.bs_equals(vs2, vs), "copy equals vs");

var vs3 = heap.allocaBitSet();
asm.bs_init(vs3);
for (let i = keys.length - 1; i >= 0; --i) {
    asm.bs_add(vs3, keys[i]);
}

var vs4 = heap.allocaBitSet();
asm.bs_init(vs4);

var vs5 = heap.allocaBitSet();
asm.bs_init(vs5);

assert.isOk(asm.bs_equals(vs, vs3) && asm.bs_equals(vs3, vs),
            "sets are equal 2");
assert.isOk(asm.bs_equals(vs4, vs5) && asm.bs_equals(vs5, vs4),
            "sets are equal 3");
assert.isNotOk(asm.bs_equals(vs, vs4) && !asm.bs_equals(vs4, vs),
               "sets are inequal");

assert.isOk(asm.bs_hasAll(vs, vs4),
            "non-empty set contains empty set");
assert.isOk(asm.bs_hasAll(vs4, vs5),
            "empty set contains other empty set");
assert.isOk(asm.bs_hasAll(vs, vs),
            "a non-empty set contains itself");
assert.isOk(asm.bs_hasAll(vs, vs3),
            "a non-empty set contains equivalent set");
assert.isNotOk(asm.bs_hasAll(vs4, vs),
               "an empty set doesn't contain a non-empty one");

for (let i = 0; i < keys.length; ++i) {
    if ((i % 2) == 0) {
        asm.bs_add(vs4, keys[i]);
    }
}
assert.isOk(asm.bs_hasAll(vs, vs4),
            "a set contains it's own \"odd\" subset");
assert.isNotOk(asm.bs_hasAll(vs4, vs),
               "a set's \"odd\" subset doesn't contain the original set");

var vs6 = heap.allocaBitSet();
asm.bs_copy(vs6, vs4);

asm.bs_addAll(vs5, vs4);
assert.isOk(asm.bs_equals(vs5, vs4), "sets are the same after addAll");

asm.bs_addAll(vs5, vs);
assert.isOk(asm.bs_equals(vs5, vs), "sets are the same after addAll 2");

asm.bs_retainAll(vs5, vs4);
assert.isOk(asm.bs_equals(vs5, vs4), "sets are the same after retainAll");

for (let i = 0; i < keys.length; ++i) {
    let s = asm.bs_size(vs4);
    let should = (i % 2) == 0;
    let was = asm.bs_remove(vs4, keys[i]);
    assert.equal(should, was,
                 "<element should be in the set> matches <element is in the set>");
    assert.isOk(!should || asm.bs_size(vs4) == s - 1,
                "the size changed after removal of element that should be in the set");
    assert.isNotOk(asm.bs_has(vs4, keys[i]), "the element disappeared");
}

var vs7 = heap.allocaBitSet();
asm.bs_init(vs7);
assert.isOk(asm.bs_equals(vs4, vs7), "set is empty again");

asm.bs_removeAll(vs5, vs5);
assert.equal(asm.bs_size(vs5), 0,
             "the set is empty after self-subtraction");

asm.bs_addAll(vs5, vs6);
asm.bs_removeAll(vs5, vs6);
assert.equal(asm.bs_size(vs5), 0,
             "the set is empty after subtraction of the same set");

asm.bs_addAll(vs5, vs6);
// xxx asset.equal(vs5.diff(vs6).size == 0, "result of differenceOf between two same sets is empty set");
// xxx asset.equal(vs5.diff(vs5).size == 0, "result of differenceOf between the set and itself");
// xxx asset.equal(vs5.diff(new BitSet128()).equals(vs5), "differenceOf set and empty set is original set");

assert.isNotOk(asm.bs_hasAny(vs3, vs7),
               "set doesn't contain any key from the empty set");
assert.isNotOk(asm.bs_hasAny(vs7, vs3),
               "empty set doesn't contain any keys");
assert.isOk(asm.bs_hasAny(vs3, vs3),
            "the set contains some keys from itself");
// xxx check(vs3.hasAny(new BitSet128(vs3)),
//           "the set contains some keys from the copy of itself");
assert.isOk(asm.bs_hasAny(vs, vs6),
            "the set contains some keys from subset of itself");
assert.isOk(asm.bs_hasAny(vs6, vs),
            "set contains some keys from superset of itself");

for (let i = 0; i < keys.length; ++i) {
    heap.enter();
    var vs8 = heap.allocaBitSet();
    asm.bs_init(vs8);

    let key = keys[i];
    asm.bs_add(vs8, key);
    assert.isOk(asm.bs_hasAny(vs, vs8),
                "set <hasAny> from the set that is one-element subset of that set");
    assert.isOk(asm.bs_hasAny(vs8, vs),
                "one element subset of set should have any from that set");

    var vs9 = heap.allocaBitSet();
    asm.bs_copy(vs9, vs5);
    asm.bs_removeAll(vs9, vs8);
    if (asm.bs_has(vs5, key)) {
        assert.equal(asm.bs_size(vs9), asm.bs_size(vs5) - 1,
                     "differenceOf set is smaller by one");
    } else {
        assert.equal(asm.bs_size(vs9), asm.bs_size(vs5),
                     "size of differenceOf set didn't change");
    }
    assert.isNotOk(asm.bs_has(vs9, key),
                   "differenceOf set doesn't contain ruled-out key");

    heap.leave();
}

for (let i = 0; i < 128; ++i) {
    heap.enter();
    var vs8 = heap.allocaBitSet();
    asm.bs_init(vs8);
    asm.bs_add(vs8, i);
    assert.equal(asm.bs_size(vs8), 1, "correct element count for any key");
    assert.isOk(asm.bs_has(vs8, i), "each key visible");
    heap.leave();
}

heap.leave();
