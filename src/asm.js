function AsmMod(stdlib, foreign, heap) {
    "use asm";

    const MEM8 = new stdlib.Uint8Array(heap);
    const MEM32 = new stdlib.Uint32Array(heap);
    const log = foreign.log;
    const _throw = foreign._throw;
    const showCons = foreign.showCons;
    const showBitSet = foreign.showBitSet;
    const showKnown = foreign.showKnown;
    const enter = foreign.enter;
    const leave = foreign.leave;
    const allocaBitSet = foreign.allocaBitSet;
    const allocaCons = foreign.allocaCons;
    const imul = stdlib.Math.imul;

    // 16 bytes for 128 bit values.
    const bs_bufSize = 16;

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
    const csp_cap = 1024;

    const LOG_ERR = 0;
    const LOG_INVALID_KEY = 1;

    /**************************************************************************
     * BitSet -- a set for up to 128 boolean elements.
     *
     * struct bs {
     *   u8 buf[bs_bufSize];
     * };
     **************************************************************************/

    function bs_sizeOf() {
        return bs_bufSize;
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
        if (((i|0) < 0)|0 + ((i|0) >= (bs_bufSize|0))|0) {
            _throw(LOG_INVALID_KEY|0, key|0);
        }

        // xxx make it i = i << 3?
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
        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
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
        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
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

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
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

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
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

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
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

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
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

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
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

        addr1 = bs_bufAddr(bset, 0)|0;
        addr2 = bs_bufAddr(other, 0)|0;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v1 = MEM8[addr1]|0;
            v2 = MEM8[addr2]|0;

            if ((v1|0) < (v2|0)) {
                return -1;
            } else if ((v1|0) > (v2|0)) {
                return 1;
            }

            addr1 = (addr1 + 1)|0;
            addr2 = (addr2 + 1)|0;
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
    function bs_size(bset) {
        bset = bset|0;
        var size = 0;
        var addr = 0;
        var i = 0;
        var v = 0;

        addr = bs_bufAddr(bset, 0)|0;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v = MEM8[addr]|0;
            size = (size + (countBits(v)|0))|0;
            addr = (addr + 1)|0;
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
        var v = 0;
        var m = 0;
        var addr = 0;

        addr = bs_bufAddr(bset, 0)|0;

        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            v = MEM8[addr]|0;
            for (m = 1; (m|0) < 0x100; m = m << 1) {
                if (v & m) {
                    MEM8[array] = j;
                    array = (array + 1)|0;
                    ct = (ct + 1)|0;
                }
                j = (j + 1)|0;
            }
            addr = (addr + 1)|0;
        }

        return ct|0;
    }

    function bs_isEmpty(bset) {
        bset = bset|0;
        var addr = 0;
        var i = 0;

        addr = bs_bufAddr(bset, 0)|0;
        for (; (i|0) < (bs_bufSize|0); i = (i + 1)|0) {
            if (MEM8[addr]|0) {
                return 0;
            }
            addr = (addr + 1)|0;
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
        c_sumSet(cons, c_sum(other)|0);
    }

    /**************************************************************************
     * CSP -- a constraint-satisfaction problem
     * A CSP is a set of constraints, each a Cons.
     *
     * struct {
     *   BitSet isKnown;   -- set of knowns (isKnown.has(x) iff x is known)
     *   BitSet knownVal;  -- values of knowns (isKnown.has(x) iff x is 1)
     *   Cons conses[cap]; -- conses in order of addition
     *   int order[cap];   -- cons indices ordered by Cons.vs
     *   int nconsOld;     -- number of already-processed conses
     *   int ncons;        -- total number of conses
     * };
     *
     * Since Cons is just a bit set and sum, manipulation of "vs" is done
     * directly through BitSet operations.
     **************************************************************************/

    function csp_sizeOf() {
        var ret = 0;

        ret = ((bs_sizeOf()|0) +               // isKnown
               (bs_sizeOf()|0) +               // knownVal
               (imul(c_sizeOf()|0, csp_cap)) + // conses
               (imul(4, csp_cap)) +            // order
               4 +                             // nconsOld
               4)|0;                           // ncons

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

    function csp_consAddr(csp, i) {
        csp = csp|0;
        i = i|0;
        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_knownValAddr(csp)|0;
        sz = bs_sizeOf()|0;
        off = imul(c_sizeOf()|0, i|0);
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_orderAddr(csp, i) {
        csp = csp|0;
        i = i|0;
        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_consAddr(csp, csp_cap)|0;
        sz = 0; // csp_cap'th cons points just after the end of the array
        off = imul(4, (i - 1)|0);
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_nconsOldAddr(csp) {
        csp = csp|0;
        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_orderAddr(csp, csp_cap)|0;
        sz = 0; // csp_cap'th order points just after the end of the array
        off = 0;
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_nconsAddr(csp) {
        csp = csp|0;
        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_nconsOldAddr(csp)|0;
        sz = 4;
        off = 0;
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_nconsOld(csp) {
        csp = csp|0;
        var addr = 0;
        var ret = 0;

        addr = csp_nconsOldAddr(csp)|0;
        ret = MEM32[addr >> 2]|0;

        return ret|0;
    }

    function csp_nconsOldSet(csp, n) {
        csp = csp|0;
        n = n|0;
        var addr = 0;
        var ret = 0;

        addr = csp_nconsOldAddr(csp)|0;
        MEM32[addr >> 2] = n;
    }

    function csp_ncons(csp) {
        csp = csp|0;
        var addr = 0;
        var ret = 0;

        addr = csp_nconsAddr(csp)|0;
        ret = MEM32[addr >> 2]|0;

        return ret|0;
    }

    function csp_nconsSet(csp, n) {
        csp = csp|0;
        n = n|0;
        var addr = 0;
        var ret = 0;

        addr = csp_nconsAddr(csp)|0;
        MEM32[addr >> 2] = n;
    }

    function csp_order(csp, i) {
        csp = csp|0;
        i = i|0;
        var addr = 0;
        var ret = 0;

        addr = csp_orderAddr(csp, i)|0;
        ret = MEM32[addr >> 2]|0;

        return ret|0;
    }

    function csp_orderSet(csp, i, id) {
        csp = csp|0;
        i = i|0;
        id = id|0;
        var addr = 0;

        addr = csp_orderAddr(csp, i)|0;
        MEM32[addr >> 2] = id;
    }

    function csp_orderInsert(csp, i, id) {
        csp = csp|0;
        i = i|0;
        id = id|0;
        var j = 0;
        var ord = 0;

        for (j = csp_ncons(csp)|0; (j|0) > (i|0); j = (j - 1)|0) {
            ord = csp_order(csp, (j - 1)|0)|0;
            csp_orderSet(csp, j, ord);
        }
        csp_orderSet(csp, i, id);
    }

    function csp_init(csp) {
        csp = csp|0;
        var isKnown = 0;
        var knownVal = 0;

        isKnown = csp_isKnownAddr(csp)|0;
        bs_init(isKnown);

        knownVal = csp_knownValAddr(csp)|0;
        bs_init(knownVal);

        csp_nconsOldSet(csp, 0);
        csp_nconsSet(csp, 0);
    }

    // Return position of cons within csp or -(pos+1) if there's no such cons.
    // The position encoded in the negative return value shows the sort order of
    // cons.
    function csp_findCons(csp, cons) {
        csp = csp|0;
        cons = cons|0;
        var ncons = 0;
        var a = 0;
        var b = 0;
        var mid = 0;
        var candI = 0; // Candidate index.
        var cand = 0;  // Candidate.
        var cmp = 0;

        ncons = csp_ncons(csp)|0;
        b = ncons;
        while (((a|0) < (ncons|0)) & ((a|0) < (b|0))) {
            mid = (a + b) >> 1;
            candI = csp_order(csp, mid)|0;
            cand = csp_consAddr(csp, candI)|0;
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

        return (-a-1)|0;
    }

    function csp_hasCons(csp, cons) {
        csp = csp|0;
        cons = cons|0;
        var consI = 0;
        var ret = 0;

        consI = csp_findCons(csp, cons)|0;
        ret = ((consI|0) >= 0)|0;
        return ret|0;
    }

    function csp_pushCons(csp, cons) {
        csp = csp|0;
        cons = cons|0;
        var ni = 0;
        var ncons = 0;
        var no = 0;

        if (bs_isEmpty(cons)|0) { // xxx
            return 0;
        }

        no = csp_findCons(csp, cons)|0;
        if ((no|0) >= 0) {
            return 0;
        }
        no = (-((no + 1)|0))|0;

        ni = csp_ncons(csp)|0;
        ncons = csp_consAddr(csp, ni)|0;
        c_copy(ncons, cons);
        csp_orderInsert(csp, no, ni);
        csp_nconsSet(csp, (ni + 1)|0);
        return 1;
    }

    function csp_substKnowns(csp, cons) {
        csp = csp|0;
        cons = cons|0;
        var isKnown = 0;
        var knownVal = 0;
        var ncons = 0;
        var onesBs = 0;
        var sum = 0;
        var ret = 0;

        isKnown = csp_isKnownAddr(csp)|0;
        knownVal = csp_knownValAddr(csp)|0;

        enter();
        {
            // ncons.vs should include the subset of cons.vs that is unknown.
            ncons = allocaCons()|0;
            bs_copy(ncons, cons);
            bs_removeAll(ncons, isKnown);

            if (!(bs_isEmpty(ncons)|0)) {
                // onesBs is subset of cons.vs that evaluates to 1.
                // This assumes that knownVal of unknown is 0.
                onesBs = allocaBitSet()|0;
                bs_copy(onesBs, cons);
                bs_retainAll(onesBs, knownVal);

                // Finish ncons initialization & push it.
                sum = ((c_sum(cons)|0) - (bs_size(onesBs)|0))|0;
                c_initSumOnly(ncons, sum);
                ret = csp_pushCons(csp, ncons)|0;
            }
        }
        leave();

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

    function csp_deduceCoupled(csp, cons1, cons2) {
        csp = csp|0;
        cons1 = cons1|0;
        cons2 = cons2|0;
        var common = 0;
        var diffCons = 0;
        var k = 0;
        var p = 0;

	// For two constraints of the following shape:
	//  1) A0 + A1 + ... + Ak + B0 + B1 + ... + Bm = p + k
	//  2) B0 + B1 + ... + Bm + C0 + C1 + ... + Cn = p
	// Deduce that:
	//  A0 = A1 = ... = Ak = 1
	//  C0 = C1 = ... = Cn = 0

        enter();
        {
            common = allocaBitSet()|0;
            bs_copy(common, cons1);
            bs_retainAll(common, cons2);
            if (!(bs_isEmpty(common)|0)) { // xxx
                k = ((bs_size(cons1)|0) - (bs_size(common)|0))|0;
                p = c_sum(cons2)|0;
                if ((c_sum(cons1)|0) == ((p + k)|0)) {
                    diffCons = allocaCons()|0;

                    c_copy(diffCons, cons1);
                    bs_removeAll(diffCons, common);
                    csp_deduceVs(csp, diffCons, 1);

                    c_copy(diffCons, cons2);
                    bs_removeAll(diffCons, common);
                    csp_deduceVs(csp, diffCons, 0);
                }
            }
        }
        leave();
    }

    function csp_simplify(csp, knownsArray) {
        csp = csp|0;
        knownsArray = knownsArray|0;
        var progress = 0;
        var cons = 0;
        var cons2 = 0;
        var ncons = 0;
        var nconsOld = 0;
        var i = 0;
        var j = 0;
        var oldKnowns = 0;
        var newKnowns = 0;
        var ret = 0;

        enter();
        {
            oldKnowns = allocaBitSet()|0;
            bs_copy(oldKnowns, csp_isKnownAddr(csp)|0);

            while (1) {
                progress = 0;

                ncons = csp_ncons(csp)|0;
                nconsOld = csp_nconsOld(csp)|0;

                for (j = 0; (j|0) < (ncons|0); j = (j + 1)|0) {
                    cons = csp_consAddr(csp, j)|0;
                    if (csp_substKnowns(csp, cons)|0) {
                        progress = 1;
                    }
                }

                for (i = nconsOld|0; (i|0) < (ncons|0); i = (i + 1)|0) {
                    cons = csp_consAddr(csp, i)|0;
                    csp_deduceSimple(csp, cons);

                    for (j = 0; (j|0) < (ncons|0); j = (j + 1)|0) {
                        cons2 = csp_consAddr(csp, j)|0;
                        csp_deduceCoupled(csp, cons, cons2);
                        csp_deduceCoupled(csp, cons2, cons);
                    }
                    if (!(bs_equals(oldKnowns, csp_isKnownAddr(csp)|0)|0)) {
                        progress = 1;
                    }
                }

                if (!progress) {
                    break;
                }
                csp_nconsOldSet(csp, ncons);
            }

            if (knownsArray) {
                newKnowns = allocaBitSet()|0;
                bs_copy(newKnowns, csp_isKnownAddr(csp)|0);
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
        c_init: c_init,
        c_initSumOnly: c_initSumOnly,
        c_sum: c_sum,
        c_sumSet: c_sumSet,
        c_copy: c_copy,

        csp_sizeOf: csp_sizeOf,
        csp_consAddr: csp_consAddr,
        csp_ncons: csp_ncons,
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
