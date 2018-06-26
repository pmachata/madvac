import { assert } from 'chai';
import { BitSet128, bit_set } from './set128.js';

function check(condition, message) {
    if (!condition) {
        throw "FAIL " + message;
    }
}

class Logger {
    log(err, j, k) {
        if (err) {
            console.log("ERR " + i + "; j=" + j + "; k=" + k);
        } else {
            console.log("j=" + j + "; k=" + k);
        }
    }
};

var heap = new ArrayBuffer(0x10000);
var BitSet = bit_set(global, {log: new Logger().log}, heap);

var vs = 0x100;
BitSet.init(vs);
assert.strictEqual(BitSet.select(0x00), 0x001, "select 0x0");
assert.strictEqual(BitSet.select(0x04), 0x010, "select 0x4");
assert.strictEqual(BitSet.select(0x08), 0x101, "select 0x8");
assert.strictEqual(BitSet.select(0x0c), 0x110, "select 0xc");
assert.strictEqual(BitSet.select(0x10), 0x201, "select 0x10");
assert.strictEqual(BitSet.select(0x14), 0x210, "select 0x10");

for (let i = 0; i < 128; ++i) {
    assert.isNotOk(BitSet.has(vs, i), "hasKey " + i);
}

var keys = [2, 4, 50, 8, 9, 10, 15, 20, 40, 100];
for (let i = 0; i < keys.length; ++i) {
    var key = keys[i];
    assert.strictEqual(BitSet.size(vs), i,
                       "size " + i + " before addition");
    BitSet.add(vs, key);
    assert.strictEqual(BitSet.size(vs), i+1,
                       "size " + (i+1) + " after addition");
    assert.isOk(BitSet.has(vs, key), "hasKey " + key + " after addition");
}

for (let i = 0; i < keys.length; ++i) {
    var key = keys[i];
    assert.isOk(BitSet.has(vs, key), "hasKey " + key + " still holds");
}

var vs2 = 0x200;
BitSet.copy(vs2, vs);

assert.isOk(BitSet.equals(vs, vs), "vs equals itself");
assert.isOk(BitSet.equals(vs, vs2), "vs equals copy");
assert.isOk(BitSet.equals(vs2, vs), "copy equals vs");

var vs3 = 0x300;
BitSet.init(vs3);
for (let i = keys.length - 1; i >= 0; --i) {
    BitSet.add(vs3, keys[i]);
}

var vs4 = 0x400;
BitSet.init(vs4);

var vs5 = 0x500;
BitSet.init(vs5);

assert.isOk(BitSet.equals(vs, vs3) && BitSet.equals(vs3, vs),
            "sets are equal 2");
assert.isOk(BitSet.equals(vs4, vs5) && BitSet.equals(vs5, vs4),
            "sets are equal 3");
assert.isNotOk(BitSet.equals(vs, vs4) && !BitSet.equals(vs4, vs),
               "sets are inequal");

assert.isOk(BitSet.hasAll(vs, vs4),
            "non-empty set contains empty set");
assert.isOk(BitSet.hasAll(vs4, vs5),
            "empty set contains other empty set");
assert.isOk(BitSet.hasAll(vs, vs),
            "a non-empty set contains itself");
assert.isOk(BitSet.hasAll(vs, vs3),
            "a non-empty set contains equivalent set");
assert.isNotOk(BitSet.hasAll(vs4, vs),
               "an empty set doesn't contain a non-empty one");

for (let i = 0; i < keys.length; ++i) {
    if ((i % 2) == 0) {
        BitSet.add(vs4, keys[i]);
    }
}
assert.isOk(BitSet.hasAll(vs, vs4),
            "a set contains it's own \"odd\" subset");
assert.isNotOk(BitSet.hasAll(vs4, vs),
               "a set's \"odd\" subset doesn't contain the original set");

var vs6 = 0x600;
BitSet.copy(vs6, vs4);

BitSet.addAll(vs5, vs4);
assert.isOk(BitSet.equals(vs5, vs4), "sets are the same after addAll");

BitSet.addAll(vs5, vs);
assert.isOk(BitSet.equals(vs5, vs), "sets are the same after addAll 2");

BitSet.retainAll(vs5, vs4);
assert.isOk(BitSet.equals(vs5, vs4), "sets are the same after retainAll");

for (let i = 0; i < keys.length; ++i) {
    let s = BitSet.size(vs4);
    let should = (i % 2) == 0;
    let was = BitSet.remove(vs4, keys[i]);
    assert.equal(should, was,
                 "<element should be in the set> matches <element is in the set>");
    assert.isOk(!should || BitSet.size(vs4) == s - 1,
                "the size changed after removal of element that should be in the set");
    assert.isNotOk(BitSet.has(vs4, keys[i]), "the element disappeared");
}

var vs7 = 0x700;
BitSet.init(vs7);
assert.isOk(BitSet.equals(vs4, vs7), "set is empty again");

BitSet.removeAll(vs5, vs5);
assert.equal(BitSet.size(vs5), 0,
             "the set is empty after self-subtraction");

BitSet.addAll(vs5, vs6);
BitSet.removeAll(vs5, vs6);
assert.equal(BitSet.size(vs5), 0,
             "the set is empty after subtraction of the same set");

BitSet.addAll(vs5, vs6);
// xxx asset.equal(vs5.diff(vs6).size == 0, "result of differenceOf between two same sets is empty set");
// xxx asset.equal(vs5.diff(vs5).size == 0, "result of differenceOf between the set and itself");
// xxx asset.equal(vs5.diff(new BitSet128()).equals(vs5), "differenceOf set and empty set is original set");

assert.isNotOk(BitSet.hasAny(vs3, vs7),
               "set doesn't contain any key from the empty set");
assert.isNotOk(BitSet.hasAny(vs7, vs3),
               "empty set doesn't contain any keys");
assert.isOk(BitSet.hasAny(vs3, vs3),
            "the set contains some keys from itself");
// xxx check(vs3.hasAny(new BitSet128(vs3)),
//           "the set contains some keys from the copy of itself");
assert.isOk(BitSet.hasAny(vs, vs6),
            "the set contains some keys from subset of itself");
assert.isOk(BitSet.hasAny(vs6, vs),
            "set contains some keys from superset of itself");

for (let i = 0; i < keys.length; ++i) {
    var vs8 = 0x800;
    BitSet.init(vs8);

    let key = keys[i];
    BitSet.add(vs8, key);
    assert.isOk(BitSet.hasAny(vs, vs8),
                "set <hasAny> from the set that is one-element subset of that set");
    assert.isOk(BitSet.hasAny(vs8, vs),
                "one element subset of set should have any from that set");

    var vs9 = 0x900;
    BitSet.copy(vs9, vs5);
    BitSet.removeAll(vs9, vs8);
    if (BitSet.has(vs5, key)) {
        assert.equal(BitSet.size(vs9), BitSet.size(vs5) - 1,
                     "differenceOf set is smaller by one");
    } else {
        assert.equal(BitSet.size(vs9), BitSet.size(vs5),
                     "size of differenceOf set didn't change");
    }
    assert.isNotOk(BitSet.has(vs9, key),
                   "differenceOf set doesn't contain ruled-out key");
}

for (let i = 0; i < 128; ++i) {
    var vs8 = 0x800;
    BitSet.init(vs8);
    BitSet.add(vs8, i);
    assert.equal(BitSet.size(vs8), 1, "correct element count for any key");
    assert.isOk(BitSet.has(vs8, i), "each key visible");
}

if (false) {
for (let i = 0, j = keys.length; i < keys.length; ++i, --j) {
    var key = keys[i];
    assert.strictEqual(BitSet.size(vs), j,
                       "size " + j + " before removal");
    BitSet.remove(vs, key);
    assert.isNotOk(BitSet.has(vs, key), "!hasKey " + key + " after removal");
    assert.strictEqual(BitSet.size(vs), j - 1,
                       "size " + (j - 1) + " after removal");
    assert.isOk(BitSet.has(vs2, key), "vs2.hasKey " + key + " after removal in vs");
}
}

// -----------------------------------------------

var vs = new BitSet128();
var keys = [2, 4, 50, 8, 9, 10, 15, 20, 40, 100];
for (let i = 0; i < keys.length; ++i) {
    var key = keys[i];

    check(!vs.containsKey(key), "doesn't contain key " + key + " before adding it");
    check(vs.size() == i, "reports the right size before adding key " + key);

    vs.add(key);
    check(vs.size() == i + 1, "reports the right size after addition of " + key);
    check(vs.containsKey(key), "contains key " + key + " after adding it");
}

for (let i = 0; i < keys.length; ++i) {
    var key = keys[i];
    check(vs.containsKey(key), "contains once added key " + key);
}

var vs2 = new BitSet128();
for (var v of vs) {
    vs2.add(v);
}

check (vs.equals(vs2) && vs2.equals(vs), "sets are equal 1");

var vs3 = new BitSet128();
var vs4 = new BitSet128();
var vs5 = new BitSet128();
for (let i = keys.length - 1; i >= 0; --i)
    vs3.add(keys[i]);

check(vs.equals(vs3) && vs3.equals(vs), "sets are equal 2");
check(vs4.equals(vs5) && vs5.equals(vs4), "sets not equal 3");
check(vs.containsAll(vs4), "non-empty set contains empty set");
check(vs4.containsAll(vs5), "empty set contains other empty set");
check(vs.containsAll(vs) && vs.containsAll(vs3), "a set contains the same set");

for (let i = 0; i < keys.length; ++i)
    if ((i % 2) == 0)
        vs4.add(keys[i]);
check(vs.containsAll(vs4), "a set contains it's own \"odd\" subset");
var vs6 = new BitSet128(vs4);

vs5.addAll(vs4);
check(vs5.equals(vs4), "sets are the same after addAll");

vs5.addAll(vs);
check(vs5.equals(vs), "sets are the same after addAll 2");

vs5.retainAll(vs4);
check(vs5.equals(vs4), "sets are the same after retainAll");

for (let i = 0; i < keys.length; ++i) {
    let s = vs4.size();
    let should = (i % 2) == 0;
    let was = vs4.remove(keys[i]);
    check(should == was, "<element should be in the set> matches <element is in the set>");
    check(!should || vs4.size() == s - 1, "the size changed after removal of element that should be in the set");
    check(!vs4.containsKey(keys[i]), "the element disappeared");
}
check(vs4.equals(new BitSet128()), "set is empty");

vs5.removeAll(vs5);
check(vs5.size() == 0, "the set is empty after self-subtraction");
vs5.addAll(vs6);
vs5.removeAll(vs6);
check(vs5.size() == 0, "the set is empty after subtraction of the same set");

vs5.addAll(vs6);
check(vs5.diff(vs6).size() == 0, "result of differenceOf between two same sets is empty set");
check(vs5.diff(vs5).size() == 0, "result of differenceOf between the set and itself");
check(vs5.diff(new BitSet128()).equals(vs5), "differenceOf set and empty set is original set");

check(!vs3.containsAny(new BitSet128()), "set doesn't contain any key from the empty set");
check(!(new BitSet128()).containsAny(vs3), "empty set doesn't contain any keys");
check(vs3.containsAny(vs3), "the set contains some keys from itself");
check(vs3.containsAny(new BitSet128(vs3)), "the set contains some keys from the copy of itself");
check(vs.containsAny(vs6), "the set contains some keys from subset of itself");
check(vs6.containsAny(vs), "set contains some keys from superset of itself");

for (let i = 0; i < keys.length; ++i) {
    let tmp = new BitSet128();
    let key = keys[i];
    tmp.add(key);
    check(vs.containsAny(tmp), "set <containsAny> from the set that is one element subset of that set");
    check(tmp.containsAny(vs), "one element subset of set should contain any from that set");

    let ds = vs5.diff(tmp);
    if (vs5.containsKey(key))
        check(ds.size() == vs5.size() - 1, "differenceOf set is smaller by one");
    else
        check(ds.size() == vs5.size(), "size of differenceOf set didn't change");
    check(!ds.containsKey(key), "differenceOf set doesn't contain ruled-out key");
}

for (let i = 0; i < 128; ++i) {
    let bs = new BitSet128();
    bs.add(i);
    check(bs.size() == 1, "correct element count for any key");
    check(bs.containsKey(i), "each key visible");
}
