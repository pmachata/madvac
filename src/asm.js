function AsmMod(stdlib, foreign, heap) {
    "use asm";

    const MEM8 = new stdlib.Uint8Array(heap);
    const log = foreign.log;
    const imul = stdlib.Math.imul;

    const ERR_KEY = 1;

    /**************************************************************************
     * BitSet -- a set for up to 128 boolean elements.
     *
     * struct bs {
     *   u8 buf[bufSize];
     * };
     **************************************************************************/
    const bufSize = 16;

    function bs_sizeOf() {
        return bufSize;
    }

    // For a given displacement, returns address in MEM8 of bset's dpl'th key.
    function bs_bufAddr(bset, dpl) {
        bset = bset|0;
        dpl = dpl|0;
        var ret = 0;
        ret = (bset|0) + dpl|0;
        return ret|0;
    }

    // For a given set key, returns at which displacement in the buffer the key
    // is located and the corresponding mask. Returns (dpl << 8) | mask.
    function bs_select(key) {
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
    function bs_init(bset) {
        bset = bset|0;
        var addr = 0;
        var i = 0;

        addr = bs_bufAddr(bset, 0)|0;
        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            MEM8[addr] = 0;
            addr = (addr + 1)|0;
        }
    }

    // Initialize a bset by copy from other bset.
    function bs_copy(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;
        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            MEM8[addr1] = MEM8[addr2];
            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
        }
    }

    // Return 1 if bset contains an element with a given key, 0 otherwise.
    function bs_has(bset, key) {
        bset = bset|0;
        key = key|0;
        var dpl = 0;
        var mask = 0;
        var addr = 0;
        var ret = 0;

        dpl = bs_select(key)|0;
        mask = ((dpl|0) & 0xff)|0;
        dpl = ((dpl|0) >> 8)|0;
        addr = bs_bufAddr(bset, dpl)|0;

        ret = (MEM8[addr] & mask)|0;
        return ret|0;
    }

    // Add an element with a given key to bset.
    function bs_add(bset, key) {
        bset = bset|0;
        key = key|0;
        var dpl = 0;
        var mask = 0;
        var addr = 0;

        dpl = bs_select(key)|0;
        mask = ((dpl|0) & 0xff)|0;
        dpl = ((dpl|0) >> 8)|0;
        addr = bs_bufAddr(bset, dpl)|0;

        MEM8[addr] = MEM8[addr] | mask;
    }

    // Remove an element with a given key from bset.
    function bs_remove(bset, key) {
        bset = bset|0;
        key = key|0;
        var dpl = 0;
        var mask = 0;
        var addr = 0;

        dpl = bs_select(key)|0;
        mask = ((dpl|0) & 0xff)|0;
        dpl = ((dpl|0) >> 8)|0;
        addr = bs_bufAddr(bset, dpl)|0;

        if ((MEM8[addr] & mask)|0) {
            MEM8[addr] = MEM8[addr] & ~mask;
            return 1;
        }

        return 0;
    }

    // Return 1 iff bset contains all elements of other.
    function bs_hasAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[addr1]|0;
            v2 = MEM8[addr2]|0;

            if ((~v1 & v2)|0) {
                return 0;
            }

            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
        }

        return 1;
    }

    // Return 1 iff bset contains at least one element of other.
    function bs_hasAny(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[addr1]|0;
            v2 = MEM8[addr2]|0;

            if ((v1 & v2)|0) {
                return 1;
            }

            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
        }

        return 0;
    }

    // Add all elements in other set to bset.
    function bs_addAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[addr1]|0;
            v2 = MEM8[addr2]|0;

            MEM8[addr1] = v1 | v2;

            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
        }
    }

    // Remove all elements in other set from bset.
    function bs_removeAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[addr1]|0;
            v2 = MEM8[addr2]|0;

            MEM8[addr1] = v1 & ~v2;

            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
        }
    }

    // Drop from bset all elements except those in other set.
    function bs_retainAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[addr1]|0;
            v2 = MEM8[addr2]|0;

            MEM8[addr1] = v1 & v2;

            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
        }
    }

    // Return 1 iff bset and other hold the same elements.
    function bs_equals(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[addr1]|0;
            v2 = MEM8[addr2]|0;

            if (((v1|0) != (v2|0))|0) {
                return 0;
            }

            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
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
    function bs_size(bset) {
        bset = bset|0;
        var size = 0;
        var addr = 0;
        var i = 0;
        var v = 0;

        addr = bs_bufAddr(bset, 0)|0;

        for (; (i|0) < (bufSize|0); i = (i + 1)|0) {
            v = MEM8[addr]|0;
            size = (size + (countBits(v)|0))|0;
            addr = (addr + 1)|0;
        }

        return size|0;
    }

    /**************************************************************************
     * Cons -- a constraint in a CSP problem
     * A constraint is an equation x0 + x1 + ... + xn = sum.
     *
     * struct {
     *   BitSet128 vs;    -- set of variables on LHS
     *   u8 sum;
     *   u8 _padding[3];
     * };
     *
     * Since Cons is just a bit set and sum, manipulation of "vs" is done
     * directly through BitSet operations.
     **************************************************************************/

    // Returns address in MEM8 of cons's sum.
    function c_sumAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + (bs_sizeOf()|0))|0;
        return ret|0;
    }

    function c_init(cons, sum) {
        cons = cons|0;
        sum = sum|0;

        bs_init(cons);
        c_initSumOnly(cons, sum);
    }

    // Partially initialize a Cons structure--initialize just sum, assuming
    // "cons" refers to a BitSet object that has already been initialized.
    function c_initSumOnly(cons, sum) {
        cons = cons|0;
        sum = sum|0;
        var sumAddr = 0;

        sumAddr = c_sumAddr(cons)|0;
        MEM8[sumAddr|0] = sum;
    }

    function c_sum(cons) {
        cons = cons|0;
        var sumAddr = 0;
        var ret = 0;

        sumAddr = c_sumAddr(cons)|0;
        ret = MEM8[sumAddr|0]|0;

        return ret|0;
    }

    return {
        bs_init: bs_init,
        bs_copy: bs_copy,
        bs_select: bs_select,
        bs_has: bs_has,
        bs_add: bs_add,
        bs_remove: bs_remove,
        bs_hasAll: bs_hasAll,
        bs_hasAny: bs_hasAny,
        bs_addAll: bs_addAll,
        bs_removeAll: bs_removeAll,
        bs_retainAll: bs_retainAll,
        bs_equals: bs_equals,
        bs_size: bs_size,
        bs_sizeOf: bs_sizeOf,

        c_init: c_init,
        c_initSumOnly: c_initSumOnly,
        c_sum: c_sum,
    };
};

export { AsmMod };
