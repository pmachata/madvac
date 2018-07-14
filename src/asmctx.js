import { AsmMod } from './asm.js';

function format(str) {
    var args = [...arguments];
    args.splice(0, 1);
    return str.replace(/{(\d+)}/g,
                       function(match, number) {
                           return typeof args[number] != 'undefined'
                               ? args[number]
                               : match;
                       });
}

var messages = {
    1: "Invalid key: {0}",
};

function getStr(code) {
    var args = [...arguments];
    args.splice(0, 1);
    return format(messages[code], ...args);
}

function log(code) {
    console.log(getStr(...arguments));
}

function _throw(code) {
    throw getStr(...arguments);
}

function bs_toArray(bs) {
    let ret = [];
    for (let i = 0; i < 128; ++i) {
        if (asm.bs_has(bs, i)) {
            ret.push(i);
        }
    }
    return ret;
}

function bs_toString(bs) {
    let show = "";
    let seen = false;
    for (let v of bs_toArray(bs)) {
        if (seen) {
            show += " + ";
        }
        show += "x" + v;
        seen = true;
    }
    return show;
}

function showBitSet(addr) {
    console.log(bs_toString(addr));
}

function cons_toString(addr) {
    return bs_toString(addr) + " = " + asm.c_sum(addr);
}

function showCons(addr) {
    console.log(cons_toString(addr));
}

function knowns_toMap(knowns, vals) {
    var ret = new Map();
    for (let x of bs_toArray(knowns)) {
        ret.set(x, asm.bs_has(vals, x));
    }
    return ret;
}

function knowns_toString(knowns, vals) {
    var show = "{";
    var seen = false;
    for (let [x, v] of knowns_toMap(knowns, vals)) {
        if (seen) {
            show += ", ";
        }
        seen = true;
        show += "x" + x + "=" + (!!v);
    }

    return show + "}";
}

function showKnown(knowns, vals) {
    console.log(knowns_toString(knowns, vals));
}

function dumpConses(csp) {
    for (let i = 0; i < asm.csp_ncons(csp); ++i) {
        console.log(i + ": " + cons_toString(asm.csp_consAddr(csp, i)));
    }
}

function dumpOrder(csp) {
    for (let i = 0; i < asm.csp_ncons(csp); ++i) {
        console.log(i + " => " + asm.csp_order(csp, i));
    }
}

function enter() {
    return heap.enter();
}

function leave() {
    return heap.leave();
}

function allocaBitSet() {
    return heap.allocaBitSet();
}

function allocaCons() {
    return heap.allocaCons();
}

var logger = {
    log: log,
    _throw: _throw,
    cons_toString: cons_toString,
    showBitSet: showBitSet,
    showCons: showCons,
    showKnown: showKnown,
    dumpConses: dumpConses,
    dumpOrder: dumpOrder,
    enter: enter,
    leave: leave,
    allocaCons: allocaCons,
    allocaBitSet: allocaBitSet,
};

class Heap {
    constructor(size) {
        this.heap = new ArrayBuffer(size);
        this.MEM8 = new Uint32Array(this.heap);
        this.start = 0;
        this.starts = [];

        this.wipe(0, size);

        // Let's not have 0 a valid pointer.
        this.alloca(0x100);
    }

    wipe(addr, size) {
        for (let i = addr; i < addr + size; ++i) {
            this.heap[i] = 0x55;
        }
    }

    alloca(size) {
        // Word-align all allocations.
        var nsize = (((size - 1) >> 2) + 1) << 2;
        var ret = this.start;
        this.start += nsize;
        return ret;
    }

    enter() {
        this.starts.push(this.start);
    }

    leave() {
        this.start = this.starts.pop();
    }

    allocaBitSet() {
        return this.alloca(asm.bs_sizeOf());
    }

    allocaCons() {
        return this.alloca(asm.c_sizeOf());
    }

    allocaCsp() {
        return this.alloca(asm.csp_sizeOf());
    }

    allocaNewKnowns() {
        return this.alloca(128);
    }

    array(addr, size) {
        return new Int8Array(this.heap.slice(addr, addr + size));
    }
};

var heap = new Heap(0x10000);
var asm = AsmMod(global, logger, heap.heap);

export { asm, logger, heap };
