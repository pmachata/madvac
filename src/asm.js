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
    const enter = foreign.enter;
    const leave = foreign.leave;
    const allocaBitSet = foreign.allocaBitSet;
    const allocaCons = foreign.allocaCons;
    const imul = stdlib.Math.imul;

    // 4 uint32's for 128 bit values.
    const bs_bufSize = 4;

    // Whether this Cons tree node is red.
    const c_f_red = 0x1;

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

    var x = 0;

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

    function __bs_removeAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;
        var ret = 0;

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

    function __bs_retainAll(bset, other) {
        bset = bset|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;
        var i = 0;
        var v1 = 0;
        var v2 = 0;
        var ret = 0;

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
    function bs_size(bset) {
        bset = bset|0;
        var size = 0;
        var addr = 0;
        var i = 0;
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
     *   BitSet128 bloom; -- bloom filter of vs's in the tree rooted here
     *   u8 sum;
     *   u8 flags;        -- c_f_*.
     *   u16 parent;      -- index of parent Cons (of 0xffff for root)
     *   u16 left;        -- index of left Cons (or 0xffff for NULL)
     *   u16 right;       -- index of right Cons (or 0xffff for NULL)
     * };
     *
     * Cons is modeled as a subclass of BitSet128. Manipulation of "vs" is done
     * directly through BitSet operations.
     **************************************************************************/

    function c_sizeOf() {
        var ret = 0;
        ret = (((bs_sizeOf()|0) << 1) + 8)|0;
        return ret|0;
    }

    function c_bloomAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + (bs_sizeOf()|0))|0;
        return ret|0;
    }

    // Returns address in MEM8 of cons's sum.
    function c_sumAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + ((bs_sizeOf()|0) << 1))|0;
        return ret|0;
    }

    function c_flagsAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + ((bs_sizeOf()|0) << 1) + 1)|0;
        return ret|0;
    }

    function c_parentAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + ((bs_sizeOf()|0) << 1) + 2)|0;
        return ret|0;
    }

    function c_leftAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + ((bs_sizeOf()|0) << 1) + 4)|0;
        return ret|0;
    }

    function c_rightAddr(cons) {
        cons = cons|0;
        var ret = 0;
        ret = (cons + ((bs_sizeOf()|0) << 1) + 6)|0;
        return ret|0;
    }

    // Partially initialize a Cons structure--initialize just sum (and the
    // service fields as well), assuming "cons" refers to a BitSet object that
    // has already been initialized.
    function c_initSumOnly(cons, sum) {
        cons = cons|0;
        sum = sum|0;
        var addr = 0;

        bs_init(c_bloomAddr(cons)|0);

        addr = c_sumAddr(cons)|0;
        MEM8[addr] = sum;
        addr = (addr + 1)|0;
        MEM8[addr] = 0; // flags
        addr = (addr + 1)|0;
        MEM16[addr >> 1] = 0xffff; // parent = 0xffff
        addr = (addr + 2)|0;
        MEM32[addr >> 2] = 0xffffffff; // left = right = 0xffff
    }

    function c_copy(cons, other) {
        cons = cons|0;
        other = other|0;
        var addr1 = 0;
        var addr2 = 0;

        bs_copy(cons, other);

        addr1 = c_bloomAddr(cons)|0;
        addr2 = c_bloomAddr(other)|0;
        bs_copy(addr1, addr2);

        addr1 = c_sumAddr(cons)|0;
        addr2 = c_sumAddr(other)|0;
        MEM32[addr1 >> 2] = MEM32[addr2 >> 2]; // sum & flags & parent

        addr1 = (addr1 + 4)|0;
        addr2 = (addr2 + 4)|0;
        MEM32[addr1 >> 2] = MEM32[addr2 >> 2]; // left & right
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

    function c_flags(cons) {
        cons = cons|0;
        var flagsAddr = 0;
        var ret = 0;

        flagsAddr = c_flagsAddr(cons)|0;
        ret = MEM8[flagsAddr|0]|0;

        return ret|0;
    }

    function c_flagsSet(cons, flags) {
        cons = cons|0;
        flags = flags|0;
        var flagsAddr = 0;

        flagsAddr = c_flagsAddr(cons)|0;
        MEM8[flagsAddr|0] = flags;
    }

    function c_parent(cons) {
        cons = cons|0;
        var parentAddr = 0;
        var ret = 0;

        parentAddr = c_parentAddr(cons)|0;
        ret = MEM16[parentAddr >> 1]|0;

        return ret|0;
    }

    function c_parentSet(cons, parent) {
        cons = cons|0;
        parent = parent|0;
        var parentAddr = 0;

        parentAddr = c_parentAddr(cons)|0;
        MEM16[parentAddr >> 1] = parent;
    }

    function c_left(cons) {
        cons = cons|0;
        var leftAddr = 0;
        var ret = 0;

        leftAddr = c_leftAddr(cons)|0;
        ret = MEM16[leftAddr >> 1]|0;

        return ret|0;
    }

    function c_leftSet(cons, left) {
        cons = cons|0;
        left = left|0;
        var leftAddr = 0;

        leftAddr = c_leftAddr(cons)|0;
        MEM16[leftAddr >> 1] = left;
    }

    function c_right(cons) {
        cons = cons|0;
        var rightAddr = 0;
        var ret = 0;

        rightAddr = c_rightAddr(cons)|0;
        ret = MEM16[rightAddr >> 1]|0;

        return ret|0;
    }

    function c_rightSet(cons, right) {
        cons = cons|0;
        right = right|0;
        var rightAddr = 0;

        rightAddr = c_rightAddr(cons)|0;
        MEM16[rightAddr >> 1] = right;
    }

    function c_markRed(cons) {
        cons = cons|0;

        var flags = 0;
        flags = c_flags(cons)|0;
        flags = flags | c_f_red;
        c_flagsSet(cons, flags);
    }

    function c_isRed(cons) {
        cons = cons|0;

        var flags = 0;
        var ret = 0;
        if ((c_flags(cons)|0) & c_f_red) {
            ret = 1;
        }
        return ret|0;
    }

    function c_markBlack(cons) {
        cons = cons|0;

        var flags = 0;
        flags = c_flags(cons)|0;
        flags = flags & ~c_f_red;
        c_flagsSet(cons, flags);
    }

    function c_isBlack(cons) {
        cons = cons|0;

        var ret = 0;
        ret = !(c_isRed(cons)|0);
        return ret|0;
    }

    /**************************************************************************
     * CSP -- a constraint-satisfaction problem
     * A CSP is a set of constraints, each a Cons.
     *
     * struct {
     *   BitSet isKnown;   -- set of knowns (isKnown.has(x) iff x is known)
     *   BitSet knownVal;  -- values of knowns (knownVal.has(x) iff x is 1)
     *   u16 root;         -- index of root Cons (or 0xffff if NULL).
     *   u16 _padding;
     *   Cons conses[cap]; -- conses in order of addition
     *   int nconsOld;     -- number of already-processed conses
     *   int ncons;        -- total number of conses
     * };
     *
     **************************************************************************/

    function csp_sizeOf() {
        var ret = 0;

        ret = ((bs_sizeOf()|0) +               // isKnown
               (bs_sizeOf()|0) +               // knownVal
               4 +                             // root & padding
               (imul(c_sizeOf()|0, csp_cap)) + // conses
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

    function csp_rootAddr(csp) {
        csp = csp|0;
        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_knownValAddr(csp)|0;
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

        b = csp_rootAddr(csp)|0;
        sz = 4;
        off = imul(c_sizeOf()|0, i|0);
        addr = (b + sz + off)|0;

        return addr|0;
    }

    function csp_nconsOldAddr(csp) {
        csp = csp|0;
        var b = 0;
        var sz = 0;
        var off = 0;
        var addr = 0;

        b = csp_consAddr(csp, csp_cap)|0;
        sz = 0; // csp_cap'th cons points just after the end of the array
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

    function csp_root(csp) {
        csp = csp|0;
        var addr = 0;
        var ret = 0;

        addr = csp_rootAddr(csp)|0;
        ret = MEM16[addr >> 1]|0;
        return ret|0;
    }

    function csp_rootSet(csp, root) {
        csp = csp|0;
        root = root|0;
        var addr = 0;

        addr = csp_rootAddr(csp)|0;
        MEM16[addr >> 1] = root;
    }

    function csp_init(csp) {
        csp = csp|0;
        var isKnown = 0;
        var knownVal = 0;

        isKnown = csp_isKnownAddr(csp)|0;
        bs_init(isKnown);

        knownVal = csp_knownValAddr(csp)|0;
        bs_init(knownVal);

        csp_rootSet(csp, 0xffff);
        csp_nconsOldSet(csp, 0);
        csp_nconsSet(csp, 0);
    }

    function csp_dump(csp, level, nodeI) {
        csp = csp|0;
        level = level|0;
        nodeI = nodeI|0;

        var node = 0;
        var childI = 0;

        log(0, 999, level|0, nodeI|0);

        if ((nodeI|0) != 0xffff) {
            node = csp_consAddr(csp, nodeI)|0;
            showBitSet(c_bloomAddr(node)|0);
            childI = c_left(node)|0;
            csp_dump(csp, (level + 1)|0, childI);
            childI = c_right(node)|0;
            csp_dump(csp, (level + 1)|0, childI);
        }
    }

    // Pass in 0xffff for consI to not actually perform the insertion.
    function __csp_insertCons(csp, cons, consI) {
        csp = csp|0;
        cons = cons|0;
        consI = consI|0;

        var nodeI = 0;
        var node = 0;
        var cmp = 0;
        var childI = 0;

        nodeI = csp_root(csp)|0;
        if ((nodeI|0) == 0xffff) {
            if ((consI|0) != 0xffff) {
                csp_rootSet(csp, consI);
            }
        } else {
            while (1) {
                node = csp_consAddr(csp, nodeI)|0;
                cmp = bs_cmp(cons, node)|0;
                if ((cmp|0) == 0) {
                    return 0;
                }

                if ((cmp|0) < 0) {
                    childI = c_left(node)|0;
                    if ((childI|0) == 0xffff) {
                        if ((consI|0) != 0xffff) {
                            c_leftSet(node, consI);
                        }
                        break;
                    }
                } else {
                    childI = c_right(node)|0;
                    if ((childI|0) == 0xffff) {
                        if ((consI|0) != 0xffff) {
                            c_rightSet(node, consI);
                        }
                        break;
                    }
                }
                nodeI = childI;
            }
        }

        if ((consI|0) != 0xffff) {
            c_markRed(cons);
            c_parentSet(cons, nodeI);

            nodeI = consI;
            while ((nodeI|0) != 0xffff) {
                node = csp_consAddr(csp, nodeI)|0;
                bs_addAll(c_bloomAddr(node)|0, cons);
                nodeI = csp_parentI(csp, nodeI)|0;
            }
        }
        return 1;
    }

    function csp_hasCons(csp, cons) {
        csp = csp|0;
        cons = cons|0;

        var ret = 0;
        ret = !(__csp_insertCons(csp, cons, 0xffff)|0);
        return ret|0;
    }

    function csp_parentI(csp, consI) {
        csp = csp|0;
        consI = consI|0;

        var cons = 0;
        var nodeI = 0;

        cons = csp_consAddr(csp, consI)|0;
        nodeI = c_parent(cons)|0;
        return nodeI|0;
    }

    function csp_gparentI(csp, consI) {
        csp = csp|0;
        consI = consI|0;

        var parentI = 0;
        var gparentI = 0xffff;

        parentI = csp_parentI(csp, consI)|0;
        if ((parentI|0) != 0xffff) {
            gparentI = csp_parentI(csp, parentI)|0;
        }
        return gparentI|0;
    }

    function csp_siblingI(csp, consI) {
        csp = csp|0;
        consI = consI|0;

        var parentI = 0;
        var parent = 0;
        var leftI = 0;
        var siblingI = 0;

        parentI = csp_parentI(csp, consI)|0;
        if ((parentI|0) == 0xffff) {
            return 0xffff;
        }

        parent = csp_consAddr(csp, parentI)|0;
        leftI = c_left(parent)|0;
        if ((consI|0) == (leftI|0)) {
            siblingI = c_right(parent)|0;
        } else {
            siblingI = leftI;
        }

        return siblingI|0;
    }

    function csp_uncleI(csp, consI) {
        csp = csp|0;
        consI = consI|0;

        var parentI = 0;
        var siblingI = 0;

        parentI = csp_parentI(csp, consI)|0;
        if ((parentI|0) == 0xffff) {
            return 0xffff;
        }

        siblingI = csp_siblingI(csp, parentI)|0;
        return siblingI|0;
    }

    function csp_rotateLeftI(csp, consI) {
        csp = csp|0;
        consI = consI|0;

        var cons = 0;
        var nnewI = 0;
        var nnew = 0;

        cons = csp_consAddr(csp, consI)|0;
        nnewI = c_right(cons)|0;
        nnew = csp_consAddr(csp, nnewI)|0;
        c_rightSet(nnew, c_left(nnew)|0);
        c_leftSet(nnew, consI);
        c_parentSet(nnew, c_parent(cons)|0);
        // xxx update cons->parent->left or ...->right
    }

    function __csp_repairTree(csp, consI) {
        csp = csp|0;
        consI = consI|0;

        var cons = 0;
        var parentI = 0;
        var parent = 0;
        var gparentI = 0;
        var gparent = 0;
        var uncleI = 0;
        var uncle = 0;

        do {
            cons = csp_consAddr(csp, consI)|0;
            parentI = csp_parentI(csp, consI)|0;
            if ((parentI|0) == 0xffff) {
                // Root is always black.
                c_markBlack(cons);
                break;
            }

            parent = csp_consAddr(csp, parentI)|0;
            if (c_isBlack(parent)|0) {
                // Parent is black. Nothing to do.
                break;
            }

            uncleI = csp_uncleI(csp, consI)|0;
            if ((uncleI|0) == 0xffff) {
                break;
                // The code out there generally doesn't check for uncle
                // NULLness, but guard this case. Currently this throws because
                // we don't maintain RB tree properties, hence the break above.
                _throw(0, 1111, 2222, 3333, 4444);
            }
            uncle = csp_consAddr(csp, uncleI)|0;

            gparentI = csp_gparentI(csp, consI)|0;
            gparent = csp_consAddr(csp, gparentI)|0;

            if (c_isRed(uncle)|0) {
                // Parent is red, uncle is red.
                c_markBlack(parent);
                c_markBlack(uncle);
                c_markRed(gparent);

                // Recurse
                consI = gparentI;
                continue;
            }

            // Parent is red, uncle is black.
            // xxx
        } while (0);
    }

    function csp_pushCons(csp, cons) {
        csp = csp|0;
        cons = cons|0;

        var nnI = 0;
        var nn = 0;
        var rc = 0;

        //log(0, 1, 1, 1, 1);
        // Add node into storage.
        nnI = csp_ncons(csp)|0;
        nn = csp_consAddr(csp, nnI)|0;
        bs_copy(nn, cons);
        c_initSumOnly(nn, c_sum(cons)|0);

        // Insert it into the tree.
        if (!(__csp_insertCons(csp, nn, nnI)|0)) {
            //log(0, 1, 2, 3, 4);
            // Already present.
            // xxx fix unnecessary node addition above
            return 0;
        }

        __csp_repairTree(csp, nnI);
        csp_nconsSet(csp, (nnI + 1)|0);
        //csp_dump(csp, 0, csp_root(csp)|0);
        //log(0, 0, 0, 0, 0);
        return 1;
    }

    function csp_substKnowns(csp, cons, ncons, onesBs) {
        csp = csp|0;
        cons = cons|0;
        ncons = ncons|0;
        onesBs = onesBs|0;
        var sum = 0;
        var ret = 0;

        // ncons.vs should include the subset of cons.vs that is unknown.
        bs_copy(ncons, cons);

        if (__bs_removeAll(ncons, csp_isKnownAddr(csp)|0)|0) {
            // onesBs is subset of cons.vs that evaluates to 1.
            // This assumes that knownVal of unknown is 0.
            bs_copy(onesBs, cons);
            bs_retainAll(onesBs, csp_knownValAddr(csp)|0);

            // Finish ncons initialization & push it.
            sum = ((c_sum(cons)|0) - (bs_size(onesBs)|0))|0;
            c_initSumOnly(ncons, sum);
            ret = csp_pushCons(csp, ncons)|0;
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

    function csp_deduceCoupled(csp, cons1, cons2, common) {
        csp = csp|0;
        cons1 = cons1|0;
        cons2 = cons2|0;
        common = common|0;
        var ret = 0;

	// For two constraints of the following shape:
	//  1) A0 + A1 + ... + Ak + B0 + B1 + ... + Bm = p + k
	//  2) B0 + B1 + ... + Bm + C0 + C1 + ... + Cn = p
	// Deduce that:
	//  A0 = A1 = ... = Ak = 1
	//  C0 = C1 = ... = Cn = 0

        bs_copy(common, cons1);
        if (__bs_retainAll(common, cons2)|0) {
            ret = __csp_deduceCoupled(csp, cons1, cons2, common)|0;
            if (!ret)
                ret = __csp_deduceCoupled(csp, cons2, cons1, common)|0;
        }

        x = (x + 1)|0;

        return ret|0;
    }

    function csp_deduceCoupledRec(csp, cons1, common, ncons, nodeI) {
        csp = csp|0;
        cons1 = cons1|0;
        common = common|0;
        ncons = ncons|0; // xxx drop
        nodeI = nodeI|0;

        var ret = 0;
        var j = 0;
        var cons2 = 0;
        var deduced = 0;
        var node = 0;
        var bloom = 0;

        if ((nodeI|0) == 0xffff) {
            return 0;
        }

        node = csp_consAddr(csp, nodeI)|0;
        bloom = c_bloomAddr(node)|0;
        if (bs_hasAny(bloom, cons1)|0) {
            deduced = csp_deduceCoupled(csp, cons1, node, common)|0;
            if ((deduced|0) == 2) {
                ret = 2;
            }

            deduced = csp_deduceCoupledRec(csp, cons1, common, ncons,
                                           c_left(node)|0)|0;
            if ((deduced|0) == 2) {
                ret = 2;
            }

            deduced = csp_deduceCoupledRec(csp, cons1, common, ncons,
                                           c_right(node)|0)|0;
            if ((deduced|0) == 2) {
                ret = 2;
            }
        }

        /*
        for (j = 0; (j|0) < (ncons|0); j = (j + 1)|0) {
            cons2 = csp_consAddr(csp, j)|0;
            deduced = csp_deduceCoupled(csp, cons1, cons2, common)|0;
            if ((deduced|0) == 2) {
                ret = 2;
            }
        }
        */

        return ret|0;
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
        var tmpCons = 0;
        var tmpBs = 0;
        var isKnownAddr = 0;
        var deduced = 0;
        var rootI = 0;

        isKnownAddr = csp_isKnownAddr(csp)|0;

        enter();
        {
            oldKnowns = allocaBitSet()|0;
            bs_copy(oldKnowns, isKnownAddr);

            tmpCons = allocaCons()|0;
            tmpBs = allocaBitSet()|0;

            while (1) {
                progress = 0;

                ncons = csp_ncons(csp)|0;
                nconsOld = csp_nconsOld(csp)|0;

                for (i = nconsOld|0; (i|0) < (ncons|0); i = (i + 1)|0) {
                    cons = csp_consAddr(csp, i)|0;
                    csp_deduceSimple(csp, cons);
                }

                for (j = 0; (j|0) < (ncons|0); j = (j + 1)|0) {
                    cons2 = csp_consAddr(csp, j)|0;
                    if (csp_substKnowns(csp, cons2, tmpCons, tmpBs)|0) {
                        progress = 1;
                    }
                }

                rootI = csp_root(csp)|0;
                for (i = nconsOld|0; (i|0) < (ncons|0); i = (i + 1)|0) {
                    cons = csp_consAddr(csp, i)|0;
                    deduced = csp_deduceCoupledRec(csp, cons, tmpBs,
                                                   ncons, rootI)|0;
                    if ((deduced|0) == 2) {
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

    function getx() {
        var a = 0;

        a = x;
        return a|0;
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
        csp_ncons: csp_ncons,
        csp_nconsSet: csp_nconsSet,
        csp_nconsOld: csp_nconsOld,
        csp_nconsOldSet: csp_nconsOldSet,
        csp_init: csp_init,
        csp_hasCons: csp_hasCons,
        csp_pushCons: csp_pushCons,
        csp_simplify: csp_simplify,
        csp_knownsSize: csp_knownsSize,
        csp_isKnown: csp_isKnown,
        csp_known: csp_known,

        x: getx,
    };
};

export { AsmMod };
