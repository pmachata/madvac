function BitSet128AsmMod(stdlib, foreign, heap) {
    "use asm";

    var MEM8 = new stdlib.Uint8Array(heap);
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

    // Initialize an empty bset.
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

    // Initialize a bset by copy from other bset.
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

    // Return 1 if bset contains an element with a given key, 0 otherwise.
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

    // Add an element with a given key to bset.
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

    // Remove an element with a given key from bset.
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

    // Return 1 iff bset contains all elements of other.
    function hasAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var off1 = 0;
        var off2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        off1 = bufOff(bset, 0)|0;
        off2 = bufOff(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[off1]|0;
            v2 = MEM8[off2]|0;

            if ((~v1 & v2)|0) {
                return 0;
            }

            off1 = (off1 + 1)|0;
            off2 = (off2 + 1)|0;
        }

        return 1;
    }

    // Return 1 iff bset contains at least one element of other.
    function hasAny(bset, other) {
        bset = bset|0;
        other = other|0;
        var off1 = 0;
        var off2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        off1 = bufOff(bset, 0)|0;
        off2 = bufOff(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[off1]|0;
            v2 = MEM8[off2]|0;

            if ((v1 & v2)|0) {
                return 1;
            }

            off1 = (off1 + 1)|0;
            off2 = (off2 + 1)|0;
        }

        return 0;
    }

    // Add all elements in other set to bset.
    function addAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var off1 = 0;
        var off2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        off1 = bufOff(bset, 0)|0;
        off2 = bufOff(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[off1]|0;
            v2 = MEM8[off2]|0;

            MEM8[off1] = v1 | v2;

            off1 = (off1 + 1)|0;
            off2 = (off2 + 1)|0;
        }
    }

    // Remove all elements in other set from bset.
    function removeAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var off1 = 0;
        var off2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        off1 = bufOff(bset, 0)|0;
        off2 = bufOff(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[off1]|0;
            v2 = MEM8[off2]|0;

            MEM8[off1] = v1 & ~v2;

            off1 = (off1 + 1)|0;
            off2 = (off2 + 1)|0;
        }
    }

    // Drop from bset all elements except those in other set.
    function retainAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var off1 = 0;
        var off2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        off1 = bufOff(bset, 0)|0;
        off2 = bufOff(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[off1]|0;
            v2 = MEM8[off2]|0;

            MEM8[off1] = v1 & v2;

            off1 = (off1 + 1)|0;
            off2 = (off2 + 1)|0;
        }
    }

    // Return 1 iff bset and other hold the same elements.
    function equals(bset, other) {
        bset = bset|0;
        other = other|0;
        var off1 = 0;
        var off2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        off1 = bufOff(bset, 0)|0;
        off2 = bufOff(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[off1]|0;
            v2 = MEM8[off2]|0;

            if (((v1|0) != (v2|0))|0) {
                return 0;
            }

            off1 = (off1 + 1)|0;
            off2 = (off2 + 1)|0;
        }

        return 1;
    }

    function countBits(v) {
        v = v|0;
        var c = 0;

	// http://www-graphics.stanford.edu/~seander/bithacks.html#CountBitsSetKernighan
	for (c = 0; (v|0) != 0; c = (c + 1)|0) {
	    v = v & ((v - 1)|0);
        }
	return c|0;
    }

    // Return number of elements in the set.
    function size(bset) {
        bset = bset|0;
        var size = 0;
        var off = 0;
        var i = 0;
        var v = 0;

        off = bufOff(bset, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v = MEM8[off]|0;
            size = (size + (countBits(v)|0))|0;
            off = (off + 1)|0;
        }

        return size|0;
    }

    return {
        init: init,
        copy: copy,
        select: select,
        has: has,
        add: add,
        remove: remove,
        hasAll: hasAll,
        hasAny: hasAny,
        addAll: addAll,
        removeAll: removeAll,
        retainAll: retainAll,
        equals: equals,
        size: size,
    };
};

export { BitSet128AsmMod };
