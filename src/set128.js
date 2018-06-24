function bit_set(stdlib, foreign, heap) {
    "use asm";

    var MEM8 = new stdlib.Int8Array(heap);
    var log = foreign.log;
    var imul = stdlib.Math.imul;

    var ERR_KEY = 1;

    // struct {
    //   u8 buf[bufSize];
    // };
    var bufSize = 16;

    // For a given displacement, returns offset in MEM8 of bset's off'th key.
    function bufOff(bset, dpl) {
        bset = bset|0;
        dpl = dpl|0;
        var ret = 0;
        ret = (bset|0) + dpl|0;
        return ret|0;
    }

    // For a given set key, returns at which displacement in the buffer the key
    // is located and the corresponding mask. Returns (dpl << 8) | mask.
    function select(key) {
        key = key|0;
        var i = 0;
        var ret = 0;

        i = ((key|0) / 8)|0;
        if (((i|0) < 0)|0 + ((i|0) >= (bufSize|0))|0) {
            log(ERR_KEY|0, i|0, 0);
            i = 0;
        }

        key = ((key|0) - imul(i|0, 8))|0;
        ret = ((i|0) << 8) | (1 << (key|0));
        return ret|0;
    }

    function init(bset) {
        bset = bset|0;
        var off = 0;
        var i = 0;

        off = bufOff(bset, 0)|0;
        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            MEM8[off] = 0;
            off = (off + 1)|0;
        }
    }

    function copy(bset, other) {
        bset = bset|0;
        other = other|0;
        var off1 = 0;
        var off2 = 0;
        var i = 0;

        off1 = bufOff(bset, 0)|0;
        off2 = bufOff(other, 0)|0;
        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            MEM8[off1] = MEM8[off2];
            off1 = (off1 + 1)|0;
            off2 = (off2 + 1)|0;
        }
    }

    function has(bset, key) {
        bset = bset|0;
        key = key|0;
        var dpl = 0;
        var mask = 0;
        var off = 0;
        var ret = 0;

        dpl = select(key)|0;
        mask = ((dpl|0) & 0xff)|0;
        dpl = ((dpl|0) >> 8)|0;
        off = bufOff(bset, dpl)|0;

        ret = (MEM8[off] & mask)|0;
        return ret|0;
    }

    function add(bset, key) {
        bset = bset|0;
        key = key|0;
        var dpl = 0;
        var mask = 0;
        var off = 0;

        dpl = select(key)|0;
        mask = ((dpl|0) & 0xff)|0;
        dpl = ((dpl|0) >> 8)|0;
        off = bufOff(bset, dpl)|0;

        MEM8[off] = MEM8[off] | mask;
    }

    function remove(bset, key) {
        bset = bset|0;
        key = key|0;
        var dpl = 0;
        var mask = 0;
        var off = 0;

        dpl = select(key)|0;
        mask = ((dpl|0) & 0xff)|0;
        dpl = ((dpl|0) >> 8)|0;
        off = bufOff(bset, dpl)|0;

        if ((MEM8[off] & mask)|0) {
            MEM8[off] = MEM8[off] & ~mask;
            return 1;
        }

        return 0;
    }

    return {
        init: init,
        copy: copy,
        select: select,
        has: has,
        add: add,
        remove: remove,
    };
};

class BitSet128 {
    constructor(copy) {
        this.clear();
        if (copy) {
            this.addAll(copy);
        }
    }

    clear() {
        this._values = new Uint32Array([0, 0, 0, 0]);
    }

    diff(other) {
	var ret = new BitSet128();
	if (this === other)
	    return ret;

        for (var i = 0; i < this._values.length; ++i) {
            ret._values[i] = this._values[i] & ~other._values[i];
        }
	return ret;
    }

    countBits(v) {
	// http://www-graphics.stanford.edu/~seander/bithacks.html#CountBitsSetKernighan
	var c = 0;
	for (c = 0; v != 0; c++)
	    v &= v - 1;
	return c;
    }

    size() {
        // xxx make it not a function
        var ret = 0;
        for (var v of this._values) {
            ret += this.countBits(v);
        }
        return ret;
    }

    select(key) {
        var i = Math.floor(key / 32);
        if (i < 0 || i >= this._values.length)
            throw "Key out of bounds";
        key -= i * 32;
        return [i, key];
    }

    containsKey(key) {
	var [i, k] = this.select(key);
	return ((1 << k) & this._values[i]) != 0;
    }

    add(key) {
	var [i, k] = this.select(key);
        this._values[i] |= 1 << k;
    }

    remove(key) {
	var [i, k] = this.select(key);
        var orig = this._values[i];
        this._values[i] &= ~(1 << k);
        return this._values[i] != orig;
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < 128; ++i) {
            if (this.containsKey(i)) {
                yield i;
            }
        }
    }

    containsAll(other) {
	return other.diff(this).size() == 0;
    }

    containsAny(other) {
        for (var i = 0; i < this._values.length; ++i) {
            if ((this._values[i] & other._values[i]) != 0) {
                return true;
            }
        }
        return false;
    }

    addAll(other) {
        for (var i = 0; i < this._values.length; ++i) {
            this._values[i] |= other._values[i];
        }
    }

    removeAll(other) {
        for (var i = 0; i < this._values.length; ++i) {
            this._values[i] &= ~other._values[i];
        }
    }

    retainAll(other) {
        for (var i = 0; i < this._values.length; ++i) {
            this._values[i] &= other._values[i];
        }
    }

    equals(other) {
        for (var i = 0; i < this._values.length; ++i) {
            if (this._values[i] != other._values[i]) {
                return false;
            }
        }
        return true;
    }
}

export { BitSet128 };
