function AsmMod(stdlib, foreign, heap) {
    "use asm";

    const MEM8 = new stdlib.Uint8Array(heap);
    const MEM16 = new stdlib.Uint16Array(heap);
    const MEM32 = new stdlib.Uint32Array(heap);
    const log = foreign.log;
    const _throw = foreign._throw;
    const showCons = foreign.showCons;
    const showBitSet = foreign.showBitSet;
    const showKnown = foreign.showKnown;
    const dumpConses = foreign.dumpConses;
    const dumpOrder = foreign.dumpOrder;
    const enter = foreign.enter;
    const leave = foreign.leave;
    const alloca = foreign.alloca;
    const allocaBitSet = foreign.allocaBitSet;
    const allocaCons = foreign.allocaCons;
    const imul = stdlib.Math.imul;

    // 4 uint32's for 128 bit values.
    const bs_bufSize = 4;

    // To solve 128-element problems, the system will hold at least 128
    // constraints. Other constrains are derived from those by variable
    // substitution. If the constraints were independent, each could beget
    // constraints for all subsets of its variable set. But they aren't, and so
    // a) since the variables are deduced in the same order globally, it's
    // impossible to exhaust all subsets of each constraint. And b) many of the
    // subsets end up already having been used up by other constraints. So in
    // practice this recombination tends to give about a half extra constraints
    // (i.e. 150-ish for a 100-variable game). Give a much larger margin of 8x
    // to allow for broader neighborhoods, a number-of-mines equation, and to
    // cover for potential pathological cases.
    // N.B. actual buffer size is 4x cap.
    const csp_cap = 256;

    const LOG_ERR = 0;
    const LOG_INVALID_KEY = 1;
    const LOG_ORDER_CAP_OVFL = 3;
    const LOG_CONS_CAP_OVFL = 4;

    /**************************************************************************
     * BitSet -- a set for up to 128 boolean elements.
     *
     * struct bs {
     *   u32 buf[bs_bufSize];
     * };
     **************************************************************************/

    function bs_sizeOf() {
        return bs_bufSize << 2;
    }

    // For a given displacement, returns address in MEM8 of bset's dpl'th key.
    function bs_bufAddr(bset, dpl) {
        bset = bset|0;
        dpl = dpl|0;
        var ret = 0;
        ret = (bset|0) + (dpl << 2)|0;
        return ret|0;
    }

    // For a given set key, returns at which displacement in the buffer the key
    // is located and the bit index at that displacement. Returns (dpl << 8) |
    // ind.
    function bs_select(key) {
        key = key|0;
        var i = 0;
        var ret = 0;

        i = ((key|0) / 32)|0;
        if (((i|0) < 0)|0 + ((i|0) >= (bs_bufSize|0))|0) {
            _throw(LOG_INVALID_KEY|0, key|0);
        }

        key = ((key|0) - imul(i|0, 32))|0;
        ret = (i << 8) | key;
        return ret|0;
    }

    // Initialize an empty bset.
    function bs_init(bset) {
        bset = bset|0;
        var addr = 0;
        var i = 0;

        addr = bset;
        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            MEM32[addr >> 2] = 0;
            addr = (addr + 4)|0;
        }
    }

    // Initialize a bset by copy from other bset.
    function bs_copy(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;

        addr1 = bset;
        addr2 = other;
        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            MEM32[addr1 >> 2] = MEM32[addr2 >> 2];
            addr1 = (addr1 + 4)|0;
            addr2 = (addr2 + 4)|0;
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
        mask = (1 << ((dpl|0) & 0xff))|0;
        dpl = ((dpl|0) >> 8)|0;
        addr = bs_bufAddr(bset, dpl)|0;

        ret = (MEM32[addr >> 2] & mask)|0;
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
        mask = (1 << ((dpl|0) & 0xff))|0;
        dpl = ((dpl|0) >> 8)|0;
        addr = bs_bufAddr(bset, dpl)|0;

        MEM32[addr >> 2] = MEM32[addr >> 2] | mask;
    }

    // Remove an element with a given key from bset.
    function bs_remove(bset, key) {
        bset = bset|0;
        key = key|0;
        var dpl = 0;
        var mask = 0;
        var addr = 0;

        dpl = bs_select(key)|0;
        mask = (1 << ((dpl|0) & 0xff))|0;
        dpl = ((dpl|0) >> 8)|0;
        addr = bs_bufAddr(bset, dpl)|0;

        if ((MEM32[addr >> 2] & mask)|0) {
            MEM32[addr >> 2] = MEM32[addr >> 2] & ~mask;
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

        addr1 = bset;
        addr2 = other;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v1 = MEM32[addr1 >> 2]|0;
            v2 = MEM32[addr2 >> 2]|0;

            if ((~v1 & v2)|0) {
                return 0;
            }

            addr1 = (addr1 + 4)|0;
            addr2 = (addr2 + 4)|0;
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

        addr1 = bset;
        addr2 = other;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v1 = MEM32[addr1 >> 2]|0;
            v2 = MEM32[addr2 >> 2]|0;

            if ((v1 & v2)|0) {
                return 1;
            }

            addr1 = (addr1 + 4)|0;
            addr2 = (addr2 + 4)|0;
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

        addr1 = bset;
        addr2 = other;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v1 = MEM32[addr1 >> 2]|0;
            v2 = MEM32[addr2 >> 2]|0;

            MEM32[addr1 >> 2] = v1 | v2;

            addr1 = (addr1 + 4)|0;
            addr2 = (addr2 + 4)|0;
        }
    }

    function __bs_removeAllG(bset, other, g) {
        bset = bset|0;
        other = other|0;
        g = g|0;

        var addr1 = 0;
        var addr2 = 0;
        var off = 0;
        var ret = 0;
        var v1 = 0;
        var v2 = 0;

        off = ((g - 1)|0) << 2;
        addr1 = (bset + off)|0;
        addr2 = (other + off)|0;

        v1 = MEM32[addr1 >> 2]|0;
        v2 = MEM32[addr2 >> 2]|0;

        v1 = v1 & ~v2;
        MEM32[addr1 >> 2] = v1;
        if (v1) {
            ret = 1;
        }

        return ret|0;
    }

    function __bs_removeAll(bset, other) {
        bset = bset|0;
        other = other|0;

        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var ret = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bset;
        addr2 = other;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v1 = MEM32[addr1 >> 2]|0;
            v2 = MEM32[addr2 >> 2]|0;

            v1 = v1 & ~v2;
            MEM32[addr1 >> 2] = v1;
            if (v1) {
                ret = 1;
            }

            addr1 = (addr1 + 4)|0;
            addr2 = (addr2 + 4)|0;
        }

        return ret|0;
    }

    // Remove all elements in other set from bset.
    function bs_removeAll(bset, other) {
        bset = bset|0;
        other = other|0;

        __bs_removeAll(bset, other)|0;
    }

    function __bs_retainAllG(bset, other, g) {
        bset = bset|0;
        other = other|0;
        g = g|0;

        var addr1 = 0;
        var addr2 = 0;
        var ret = 0;
        var off = 0;
        var v1 = 0;
        var v2 = 0;

        off = ((g - 1)|0) << 2;
        addr1 = (bset + off)|0;
        addr2 = (other + off)|0;

        v1 = MEM32[addr1 >> 2]|0;
        v2 = MEM32[addr2 >> 2]|0;

        v1 = v1 & v2;
        MEM32[addr1 >> 2] = v1;
        if (v1) {
            ret = 1;
        }

        return ret|0;
    }

    function __bs_retainAll(bset, other) {
        bset = bset|0;
        other = other|0;

        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var ret = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bset;
        addr2 = other;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v1 = MEM32[addr1 >> 2]|0;
            v2 = MEM32[addr2 >> 2]|0;

            v1 = v1 & v2;
            MEM32[addr1 >> 2] = v1;
            if (v1) {
                ret = 1;
            }

            addr1 = (addr1 + 4)|0;
            addr2 = (addr2 + 4)|0;
        }

        return ret|0;
    }

    // Drop from bset all elements except those in other set.
    function bs_retainAll(bset, other) {
        bset = bset|0;
        other = other|0;

        __bs_retainAll(bset, other)|0;
    }

    // Return 1 iff bset and other hold the same elements.
    function bs_equals(bset, other) {
        bset = bset|0;
        other = other|0;
        var ret = 0;

        ret = bs_cmp(bset, other)|0;

        return (!ret)|0;
    }

    // Return -1, 0 or +1 when bset is respectively <, == or > other.
    function bs_cmp(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;

        addr1 = bset;
        addr2 = other;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v1 = MEM32[addr1 >> 2]|0;
            v2 = MEM32[addr2 >> 2]|0;

            if ((v1|0) < (v2|0)) {
                return -1;
            } else if ((v1|0) > (v2|0)) {
                return 1;
            }

            addr1 = (addr1 + 4)|0;
            addr2 = (addr2 + 4)|0;
        }

        return 0;
    }

    function countBits(v) {
        v = v|0;
        var c = 0;

	// http://www.graphics.stanford.edu/~seander/bithacks.html#CountBitsSetKernighan
	for (c = 0; (v|0) != 0; c = (c + 1)|0) {
	    v = v & ((v - 1)|0);
        }
	return c|0;
    }

    // Return number of elements in the set.
    function bs_sizeG(bset, g) {
        bset = bset|0;
        g = g|0;

        var addr = 0;
        var off = 0;
        var size = 0;
        var v = 0;

        off = ((g - 1)|0) << 2;
        addr = (bset + off)|0;
        v = MEM32[addr >> 2]|0;
        size = countBits(v)|0;

        return size|0;
    }

    function bs_size(bset) {
        bset = bset|0;

        var addr = 0;
        var i = 0;
        var size = 0;
        var v = 0;

        addr = bset;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v = MEM32[addr >> 2]|0;
            size = (size + (countBits(v)|0))|0;
            addr = (addr + 4)|0;
        }

        return size|0;
    }

    // Store bset's elements to an array, one element number per byte.
    function bs_elements(bset, array) {
        bset = bset|0;
        array = array|0;
        var ct = 0;
        var i = 0;
        var j = 0;
        var k = 0;
        var v = 0;
        var m = 0;
        var addr = 0;

        addr = bset;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v = MEM32[addr >> 2]|0;
            for (k = 0; (k|0) < 32; k = (k + 1)|0) {
                m = 1 << k;
                if (v & m) {
                    MEM8[array] = j;
                    array = (array + 1)|0;
                    ct = (ct + 1)|0;
                }
                j = (j + 1)|0;
            }
            addr = (addr + 4)|0;
        }

        return ct|0;
    }

    function bs_isEmpty(bset) {
        bset = bset|0;
        var addr = 0;
        var i = 0;

        addr = bset;
        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            if (MEM32[addr >> 2]|0) {
                return 0;
            }
            addr = (addr + 4)|0;
        }

        return 1;
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

    function c_sizeOf() {
        var ret = 0;
        ret = ((bs_sizeOf()|0) + 4)|0;
        return ret|0;
    }

    // Returns address in MEM8 of cons's sum.
    function c_sumAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + (bs_sizeOf()|0))|0;
        return ret|0;
    }

    // Partially initialize a Cons structure--initialize just sum, assuming
    // "cons" refers to a BitSet object that has already been initialized.
    function c_initSumOnly(cons, sum) {
        cons = cons|0;
        sum = sum|0;
        var sumAddr = 0;

        sumAddr = c_sumAddr(cons)|0;
        MEM8[sumAddr] = sum;
    }

    function c_sum(cons) {
        cons = cons|0;
        var sumAddr = 0;
        var ret = 0;

        sumAddr = c_sumAddr(cons)|0;
        ret = MEM8[sumAddr|0]|0;

        return ret|0;
    }

    function c_sumSet(cons, sum) {
        cons = cons|0;
        sum = sum|0;
        var sumAddr = 0;

        sumAddr = c_sumAddr(cons)|0;
        MEM8[sumAddr|0] = sum;
    }

    function c_copy(cons, other) {
        cons = cons|0;
        other = other|0;

        bs_copy(cons, other);
        MEM8[c_sumAddr(cons)|0] = MEM8[c_sumAddr(other)|0];
    }

    function c_fingerprint(cons) {
        cons = cons|0;

        var a = 0;
        var b = 0;
        var c = 0;
        var d = 0;
        var ret = 0;

        a = ((MEM32[cons >> 2]|0) != 0)|0;
        cons = (cons + 4)|0;
        b = ((MEM32[cons >> 2]|0) != 0)|0;
        cons = (cons + 4)|0;
        c = ((MEM32[cons >> 2]|0) != 0)|0;
        cons = (cons + 4)|0;
        d = ((MEM32[cons >> 2]|0) != 0)|0;

        ret = (a << 0) | (b << 1) | (c << 2) | (d << 3);
        return ret|0;
    }

    /**************************************************************************
     * CSP -- a constraint-satisfaction problem
     * A CSP is a set of constraints, each a Cons.
     *
     * struct {
     *   BitSet isKnown;    -- set of knowns (isKnown.has(x) iff x is known)
     *   BitSet knownVal;   -- values of knowns (knownVal.has(x) iff x is 1)
     *   Cons conses[5][cap];-- conses in order of addition
     *                         conses[X], X>0 is for conses whose fingerprint
     *                                       is 1<<(X-1)
     *                         conses[0] is for conses with other fingerprints
     *                           where fingerprint is a four-bit field where
     *                                 each bit corresponds to one word in "vs".
     *                                 Bits are one if the corresponding word is
     *                                 non-0.
     *   u16 order[5][cap]; -- groups of cons indices ordered by Cons.vs
     *   u16 nconsOld[5];   -- number of already-processed conses in each group
     *   u16 ncons[5];      -- number of conses in each group
     * };
     **************************************************************************/

    function csp_fullcap() {
        var fullcap = 0;

        // csp_cap * 5
        fullcap = csp_cap << 2;
        fullcap = (fullcap + csp_cap)|0;

        return fullcap|0;
    }

    function csp_sizeOf() {
        var ret = 0;
        var fullcap = 0;

        fullcap = csp_fullcap()|0;
        ret = ((bs_sizeOf()|0) +               // isKnown
               (bs_sizeOf()|0) +               // knownVal
               (imul(c_sizeOf()|0, fullcap)) + // Cons conses[5][cap]
               (imul(10, csp_cap)) +           // u16 order[5][cap]
               10 +                            // nconsOld[5]
               10)|0;                          // ncons[5]

        return ret|0;
    }

    function csp_isKnownAddr(csp) {
        csp = csp|0;

        return csp|0;
    }

    function csp_knownValAddr(csp) {
        csp = csp|0;

        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_isKnownAddr(csp)|0;
        sz = bs_sizeOf()|0;
        off = 0;
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_consAddr(csp, g, i) {
        csp = csp|0;
        g = g|0;
        i = i|0;

        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_knownValAddr(csp)|0;
        sz = bs_sizeOf()|0;
        off = imul((imul(csp_cap, g) + i)|0, c_sizeOf()|0);
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_orderAddr(csp, g, i) {
        csp = csp|0;
        g = g|0;
        i = i|0;

        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_consAddr(csp, 5, 0)|0; // One beyond last item in last group.
        sz = 0;
        off = (imul(csp_cap, g) + i) << 1;
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_nconsOldAddr(csp, g) {
        csp = csp|0;
        g = g|0;

        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_orderAddr(csp, 5, 0)|0; // One beyond last item in last group.
        sz = 0;
        off = g << 1;
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_nconsAddr(csp, g) {
        csp = csp|0;
        g = g|0;

        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_nconsOldAddr(csp, 5)|0; // One beyond last group.
        sz = 0;
        off = g << 1;
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_nconsOld(csp, g) {
        csp = csp|0;
        g = g|0;

        var addr = 0;
        var ret = 0;

        addr = csp_nconsOldAddr(csp, g)|0;
        ret = MEM16[addr >> 1]|0;

        return ret|0;
    }

    function csp_nconsOldSet(csp, g, n) {
        csp = csp|0;
        g = g|0;
        n = n|0;

        var addr = 0;
        var ret = 0;

        addr = csp_nconsOldAddr(csp, g)|0;
        MEM16[addr >> 1] = n;
    }

    function csp_ncons(csp, g) {
        csp = csp|0;
        g = g|0;

        var addr = 0;
        var ret = 0;

        addr = csp_nconsAddr(csp, g)|0;
        ret = MEM16[addr >> 1]|0;

        return ret|0;
    }

    function csp_nconsTot(csp) {
        csp = csp|0;

        var g = 0;
        var tot = 0;

        for (; (g|0) < 5; g = (g + 1)|0) {
            tot = (tot + (csp_ncons(csp, g)|0))|0;
        }

        return tot|0;
    }

    function csp_nconsSet(csp, g, n) {
        csp = csp|0;
        g = g|0;
        n = n|0;

        var addr = 0;

        addr = csp_nconsAddr(csp, g)|0;
        MEM16[addr >> 1] = n;
    }

    function csp_order(csp, g, i) {
        csp = csp|0;
        g = g|0;
        i = i|0;

        var addr = 0;
        var id = 0;

        addr = csp_orderAddr(csp, g, i)|0;
        id = MEM16[addr >> 1]|0;

        return id|0;
    }

    function csp_orderSet(csp, g, i, id) {
        csp = csp|0;
        g = g|0;
        i = i|0;
        id = id|0;

        var addr = 0;

        addr = csp_orderAddr(csp, g, i)|0;
        MEM16[addr >> 1] = id;
    }

    function csp_orderInsert(csp, g, i, id) {
        csp = csp|0;
        g = g|0;
        i = i|0;
        id = id|0;

        var j = 0;
        var k = 0;
        var ord = 0;
        var ncons = 0;

        ncons = csp_ncons(csp, g)|0;
        if ((ncons|0) >= (csp_cap|0)) {
            _throw(LOG_ORDER_CAP_OVFL|0);
        }

        for (j = ncons; (j|0) > (i|0); ) {
            k = j;
            j = (j - 1)|0;
            ord = csp_order(csp, g, j)|0;
            csp_orderSet(csp, g, k, ord);
        }

        csp_orderSet(csp, g, i, id);
    }

    function csp_init(csp) {
        csp = csp|0;

        var isKnown = 0;
        var knownVal = 0;
        var g = 0;

        isKnown = csp_isKnownAddr(csp)|0;
        bs_init(isKnown);

        knownVal = csp_knownValAddr(csp)|0;
        bs_init(knownVal);

        for (g = 0; (g|0) < 5; g = (g + 1)|0) {
            csp_nconsSet(csp, g, 0);
            csp_nconsOldSet(csp, g, 0);
        }
    }

    // Return position of cons within csp or -(pos+1) if there's no such cons.
    // The position encoded in the negative return value shows the sort order of
    // cons.
    function csp_findCons(csp, g, cons) {
        csp = csp|0;
        g = g|0;
        cons = cons|0;

        var a = 0;
        var b = 0;
        var cand = 0;  // Candidate.
        var candI = 0; // Candidate index.
        var cmp = 0;
        var mid = 0;
        var ncons = 0;

        ncons = csp_ncons(csp, g)|0;
        b = ncons;
        while (((a|0) < (ncons|0)) & ((a|0) < (b|0))) {
            mid = (a + b) >> 1;
            candI = csp_order(csp, g, mid)|0;
            cand = csp_consAddr(csp, g, candI)|0;
            cmp = bs_cmp(cons, cand)|0;
            if ((cmp|0) == 0) {
                return mid|0;
            }

            if ((cmp|0) < 0) {
                // cons < cand
                b = mid;
            } else {
                // cons > cand
                a = (mid + 1)|0;
            }
        }

        return (0 - a - 1)|0;
    }

    function csp_consGroup(cons) {
        cons = cons|0;

        var fp = 0;
        var ret = 0;

        fp = c_fingerprint(cons)|0;

        if ((fp|0) == 1) {
            ret = 1;
        } else if ((fp|0) == 2) {
            ret = 2;
        } else if ((fp|0) == 4) {
            ret = 3;
        } else if ((fp|0) == 8) {
            ret = 4;
        }

        return ret|0;
    }

    function csp_hasCons(csp, cons) {
        csp = csp|0;
        cons = cons|0;

        var consI = 0;
        var ret = 0;
        var g = 0;

        g = csp_consGroup(cons)|0;
        consI = csp_findCons(csp, g, cons)|0;
        ret = ((consI|0) >= 0)|0;
        return ret|0;
    }

    function csp_pushCons(csp, cons) {
        csp = csp|0;
        cons = cons|0;

        var ncons = 0;
        var newCons = 0;
        var no = 0;
        var g = 0;

        g = csp_consGroup(cons)|0;
        no = csp_findCons(csp, g, cons)|0;
        if ((no|0) >= 0) {
            return 0;
        }
        no = (-((no + 1)|0))|0;

        ncons = csp_ncons(csp, g)|0;
        if ((ncons|0) >= (csp_cap|0)) {
            _throw(LOG_CONS_CAP_OVFL|0);
        }
        newCons = csp_consAddr(csp, g, ncons)|0;
        c_copy(newCons, cons);
        csp_orderInsert(csp, g, no, ncons);
        csp_nconsSet(csp, g, (ncons + 1)|0);
        return 1;
    }

    function csp_substKnowns(csp, cons, newCons, onesBs) {
        csp = csp|0;
        cons = cons|0;
        newCons = newCons|0;
        onesBs = onesBs|0;

        var sum = 0;
        var ret = 0;

        // newCons.vs should include the subset of cons.vs that is unknown.
        bs_copy(newCons, cons);

        if (__bs_removeAll(newCons, csp_isKnownAddr(csp)|0)|0) {
            // onesBs is subset of cons.vs that evaluates to 1.
            // This assumes that knownVal of unknown is 0.
            bs_copy(onesBs, cons);
            bs_retainAll(onesBs, csp_knownValAddr(csp)|0);

            // Finish newCons initialization & push it.
            sum = ((c_sum(cons)|0) - (bs_size(onesBs)|0))|0;
            c_initSumOnly(newCons, sum);
            ret = csp_pushCons(csp, newCons)|0;
        }

        return ret|0;
    }

    function csp_deduceVs(csp, bs, val) {
        csp = csp|0;
        bs = bs|0;
        val = val|0;

        bs_addAll(csp_isKnownAddr(csp)|0, bs);
        if (val) {
            bs_addAll(csp_knownValAddr(csp)|0, bs);
        }
    }

    function csp_deduceSimple(csp, cons) {
        csp = csp|0;
        cons = cons|0;
        var sum = 0;
        var nvs = 0;

        // For a constraint of one of the following shapes:
        //  1) A0 + A1 + ... + An = n
        //  2) A0 + A1 + ... + An = 0
        // Deduce that:
        //  in case 1) A0 = A1 = ... = An = 1
        //  in case 2) A0 = A1 = ... = An = 0
        sum = c_sum(cons)|0;
        if (!sum) {
            csp_deduceVs(csp, cons, 0);
        } else {
            nvs = bs_size(cons)|0;
            if ((nvs|0) == (sum|0)) {
                csp_deduceVs(csp, cons, 1);
            }
        }
    }

    // For two constraints of the following shape:
    //  1) A0 + A1 + ... + Ak + B0 + B1 + ... + Bm = p + k
    //  2) B0 + B1 + ... + Bm + C0 + C1 + ... + Cn = p
    // Deduce that:
    //  A0 = A1 = ... = Ak = 1
    //  C0 = C1 = ... = Cn = 0

    function __csp_deduceCoupledG(csp, cons1, cons2, g, common) {
        csp = csp|0;
        cons1 = cons1|0;
        cons2 = cons2|0;
        g = g|0;
        common = common|0;

        var diffCons = 0;
        var k = 0;
        var p = 0;
        var ret = 0;

        k = ((bs_sizeG(cons1, g)|0) - (bs_sizeG(common, g)|0))|0;
        p = c_sum(cons2)|0;
        if ((c_sum(cons1)|0) == ((p + k)|0)) {
            diffCons = allocaCons()|0;

            ret = 1;

            c_copy(diffCons, cons1);
            if (__bs_removeAllG(diffCons, common, g)|0) {
                csp_deduceVs(csp, diffCons, 1);
                ret = 2;
            }

            c_copy(diffCons, cons2);
            if (__bs_removeAllG(diffCons, common, g)|0) {
                csp_deduceVs(csp, diffCons, 0);
                ret = 2;
            }
        }

        return ret|0;
    }

    function __csp_deduceCoupled(csp, cons1, cons2, common) {
        csp = csp|0;
        cons1 = cons1|0;
        cons2 = cons2|0;
        common = common|0;

        var diffCons = 0;
        var k = 0;
        var p = 0;
        var ret = 0;

        k = ((bs_size(cons1)|0) - (bs_size(common)|0))|0;
        p = c_sum(cons2)|0;
        if ((c_sum(cons1)|0) == ((p + k)|0)) {
            diffCons = allocaCons()|0;

            ret = 1;

            c_copy(diffCons, cons1);
            if (__bs_removeAll(diffCons, common)|0) {
                csp_deduceVs(csp, diffCons, 1);
                ret = 2;
            }

            c_copy(diffCons, cons2);
            if (__bs_removeAll(diffCons, common)|0) {
                csp_deduceVs(csp, diffCons, 0);
                ret = 2;
            }
        }

        return ret|0;
    }

    function csp_deduceCoupledG(csp, cons1, cons2, g, common) {
        csp = csp|0;
        cons1 = cons1|0;
        cons2 = cons2|0;
        g = g|0;
        common = common|0;

        var ret = 0;

        bs_copy(common, cons1);
        if (__bs_retainAllG(common, cons2, g)|0) {
            ret = __csp_deduceCoupledG(csp, cons1, cons2, g, common)|0;
            if (!ret)
                ret = __csp_deduceCoupledG(csp, cons2, cons1, g, common)|0;
        }

        return ret|0;
    }

    function csp_deduceCoupled(csp, cons1, cons2, common) {
        csp = csp|0;
        cons1 = cons1|0;
        cons2 = cons2|0;
        common = common|0;

        var ret = 0;

        bs_copy(common, cons1);
        if (__bs_retainAll(common, cons2)|0) {
            ret = __csp_deduceCoupled(csp, cons1, cons2, common)|0;
            if (!ret)
                ret = __csp_deduceCoupled(csp, cons2, cons1, common)|0;
        }

        x = (x + 1)|0;
        return ret|0;
    }

    // Test new conses in G1 against all conses in G2.
    function csp_deduceCoupledBunch(csp, g1, g2, nconsOrig, tmpBs) {
        csp = csp|0;
        g1 = g1|0;
        g2 = g2|0;
        nconsOrig = nconsOrig|0;
        tmpBs = tmpBs|0;

        var ret = 0;
        var deduced = 0;
        var nconsOld = 0;
        var addr = 0;
        var i = 0;
        var j = 0;
        var ncons1 = 0;
        var ncons2 = 0;
        var cons1 = 0;
        var cons2 = 0;

        nconsOld = csp_nconsOld(csp, g1)|0;
        addr = (nconsOrig + (g1 << 1))|0;
        ncons1 = MEM16[addr >> 1]|0;
        addr = (nconsOrig + (g2 << 1))|0;
        ncons2 = MEM16[addr >> 1]|0;

        for (i = nconsOld|0; (i|0) < (ncons1|0); i = (i + 1)|0) {
            cons1 = csp_consAddr(csp, g1, i)|0;
            for (j = 0; (j|0) < (ncons2|0); j = (j + 1)|0) {
                cons2 = csp_consAddr(csp, g2, j)|0;
                //log(0, g1|0, g2|0, i|0, j|0);
                deduced = csp_deduceCoupled(csp, cons1, cons2,
                                            tmpBs)|0;
                if ((deduced|0) == 2) {
                    ret = 2;
                }
            }
        }

        return ret|0;
    }

    function csp_simplify(csp, knownsArray) {
        csp = csp|0;
        knownsArray = knownsArray|0;

        var cons = 0;
        var cons2 = 0;
        var deduced = 0;
        var dstAddr = 0;
        var g = 0;
        var i = 0;
        var isKnownAddr = 0;
        var j = 0;
        var k = 0;
        var ncons = 0;
        var nconsAddr = 0;
        var nconsOld = 0;
        var nconsOldAddr = 0;
        var nconsOrig = 0;
        var newKnowns = 0;
        var norder = 0;
        var oldKnowns = 0;
        var progress = 0;
        var ret = 0;
        var srcAddr = 0;
        var srcAddr2 = 0;
        var tmpBs = 0;
        var tmpCons = 0;

        isKnownAddr = csp_isKnownAddr(csp)|0;

        enter();
        {
            oldKnowns = allocaBitSet()|0;
            bs_copy(oldKnowns, isKnownAddr);

            tmpCons = allocaCons()|0;
            tmpBs = allocaBitSet()|0;
            nconsOrig = alloca(10)|0; // 5*u16

            nconsAddr = csp_nconsAddr(csp, 0)|0;
            nconsOldAddr = csp_nconsOldAddr(csp, 0)|0;

            while (1) {
                progress = 0;

                srcAddr = nconsAddr;
                dstAddr = nconsOrig;
                for (g = 0; (g|0) < 5; g = (g + 1)|0) {
                    MEM16[dstAddr >> 1] = MEM16[srcAddr >> 1]|0;
                    srcAddr = (srcAddr + 2)|0;
                    dstAddr = (dstAddr + 2)|0;
                }

                for (g = 0; (g|0) < 5; g = (g + 1)|0) {
                    nconsOld = csp_nconsOld(csp, g)|0;
                    srcAddr = (nconsOrig + (g << 1))|0;
                    ncons = MEM16[srcAddr >> 1]|0;
                    for (i = nconsOld|0; (i|0) < (ncons|0); i = (i + 1)|0) {
                        cons = csp_consAddr(csp, g, i)|0;
                        csp_deduceSimple(csp, cons);
                    }
                }

                for (g = 0; (g|0) < 5; g = (g + 1)|0) {
                    deduced = csp_deduceCoupledBunch(csp, 0, g, nconsOrig,
                                                     tmpBs)|0;
                    if ((deduced|0) == 2) {
                        progress = 1;
                    }
                }

                for (g = 1; (g|0) < 5; g = (g + 1)|0) {
                    deduced = csp_deduceCoupledBunch(csp, g, g, nconsOrig,
                                                     tmpBs)|0;
                    if ((deduced|0) == 2) {
                        progress = 1;
                    }

                    deduced = csp_deduceCoupledBunch(csp, g, 0, nconsOrig,
                                                     tmpBs)|0;
                    if ((deduced|0) == 2) {
                        progress = 1;
                    }
                }

                // xxx only process those conses whose set-words are touched by
                // newly-added knowns.
                for (g = 0; (g|0) < 5; g = (g + 1)|0) {
                    srcAddr = (nconsOrig + (g << 1))|0;
                    ncons = MEM16[srcAddr >> 1]|0;
                    for (j = 0; (j|0) < (ncons|0); j = (j + 1)|0) {
                        cons2 = csp_consAddr(csp, g, j)|0;
                        if (csp_substKnowns(csp, cons2, tmpCons, tmpBs)|0) {
                            progress = 1;
                        }
                    }
                }

                srcAddr = nconsOrig;
                dstAddr = nconsOldAddr;
                for (g = 0; (g|0) < 5; g = (g + 1)|0) {
                    MEM16[dstAddr >> 1] = MEM16[srcAddr >> 1]|0;
                    srcAddr = (srcAddr + 2)|0;
                    dstAddr = (dstAddr + 2)|0;
                }

                if (!progress) {
                    break;
                }
            }

            if (knownsArray) {
                newKnowns = allocaBitSet()|0;
                bs_copy(newKnowns, isKnownAddr);
                bs_removeAll(newKnowns, oldKnowns);
                ret = bs_elements(newKnowns, knownsArray)|0;
            } else {
                ret = 0;
            }
        }
        leave();

        return ret|0;
    }

    function csp_knownsSize(csp) {
        csp = csp|0;
        var ret = 0;

        ret = bs_size(csp_isKnownAddr(csp)|0)|0;
        return ret|0;
    }

    function csp_isKnown(csp, v) {
        csp = csp|0;
        v = v|0;
        var ret = 0;
        var isKnown = 0;

        isKnown = csp_isKnownAddr(csp)|0;
        ret = bs_has(isKnown, v)|0;

        return ret|0;
    }

    function csp_known(csp, v) {
        csp = csp|0;
        v = v|0;
        var ret = 0;
        var knownVal = 0;

        if (!(csp_isKnown(csp, v)|0)) {
            return -1;
        }

        knownVal = csp_knownValAddr(csp)|0;
        ret = !!(bs_has(knownVal, v)|0);
        return ret|0;
    }

    return {
        bs_sizeOf: bs_sizeOf,
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
        bs_cmp: bs_cmp,
        bs_equals: bs_equals,
        bs_size: bs_size,
        bs_isEmpty: bs_isEmpty,

        c_sizeOf: c_sizeOf,
        c_initSumOnly: c_initSumOnly,
        c_sum: c_sum,
        c_sumSet: c_sumSet,
        c_copy: c_copy,

        csp_sizeOf: csp_sizeOf,
        csp_consAddr: csp_consAddr,
        csp_ncons: csp_nconsTot,
        csp_nconsSet: csp_nconsSet,
        csp_nconsOld: csp_nconsOld,
        csp_nconsOldSet: csp_nconsOldSet,
        csp_order: csp_order,
        csp_orderSet: csp_order,
        csp_init: csp_init,
        csp_hasCons: csp_hasCons,
        csp_pushCons: csp_pushCons,
        csp_simplify: csp_simplify,
        csp_knownsSize: csp_knownsSize,
        csp_isKnown: csp_isKnown,
        csp_known: csp_known,
    };
};

export { AsmMod };
