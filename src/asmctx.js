import { AsmMod } from './asm.js';

function log(err, j, k) {
    if (err) {
        console.log("ERR " + err + "; j=" + j + "; k=" + k);
    } else {
        console.log("j=" + j + "; k=" + k);
    }
}

function cons_toString(addr) {
    let show = "";
    let seen = false;
    for (let i = 0; i < 128; ++i) {
        if (asm.bs_has(addr, i)) {
            if (seen) {
                show += " + ";
            }
            show += "x" + i;
            seen = true;
        }
    }
    show += " = " + asm.c_sum(addr);
    return show;
}

function showCons(addr) {
    console.log(cons_toString(addr));
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
    cons_toString: cons_toString,
    showCons: showCons,
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
        this.blocks = new Map();
        this.freeList = [];
        this.end = 0;
        this.stackEnd = size;
        this.stackEnds = [];

        this.wipe(0, size);

        // Let's not have 0 a valid pointer.
        this.alloc(0x100);
    }

    wipe(addr, size) {
        for (let i = addr; i < addr + size; ++i) {
            this.heap[i] = 0x55;
        }
    }

    alloc(size) {
        for (let i in this.freeList) {
            const [bAddr, bSize] = this.freeList[i];
            if (bSize >= size) {
                this.freeList.splice(i, 1);
                this.blocks.set(bAddr, bSize);
                return bAddr;
            }
        }

        // Take from the heap.
        const bAddr = this.end;
        this.blocks.set(bAddr, size);
        this.end += size;
        return bAddr;
    }

    free(addr) {
        const size = this.blocks.get(addr);
        if (size === undefined) {
            throw "Invalid free.";
        }
        this.blocks.delete(addr);
        this.freeList.push([addr, size]);
        this.wipe(addr, size);
    }

    alloca(size) {
        this.stackEnd -= size;
        return this.stackEnd;
    }

    enter() {
        this.stackEnds.push(this.stackEnd);
    }

    leave() {
        this.stackEnd = this.stackEnds.pop();
    }

    allocBitSet() {
        return this.alloc(asm.bs_sizeOf());
    }

    allocaBitSet() {
        return this.alloca(asm.bs_sizeOf());
    }

    allocCons() {
        return this.alloc(asm.c_sizeOf());
    }

    allocaCons() {
        return this.alloca(asm.c_sizeOf());
    }

    allocCsp() {
        return this.alloc(asm.csp_sizeOf());
    }

    leakCheck(addr) {
        if (this.blocks.size != 1 ||
            !this.blocks.has(0)) {
            for (var [bAddr, bSize] of this.blocks) {
                console.log("unfreed " + bAddr + " with size " + bSize);
            }
            throw "Leak check failed.";
        }
    }
};

var heap = new Heap(0x10000);
var asm = AsmMod(global, logger, heap.heap);

export { asm, logger, heap };
