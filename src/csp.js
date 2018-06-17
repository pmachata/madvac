class Cons {
    constructor(vs, sum) {
        this.vs = new Set(vs);
        this.sum = sum;

        var key = "" + this.sum;
        for (var v of this.vs) {
            key += "," + v;
        }
        this.key = key;
    }

    subst(knowns) {
        var vs = [];
        var sum = this.sum;
        for (var v of this.vs) {
            if (!knowns.has(v)) {
                vs.push(v);
            } else {
                sum -= knowns.get(v);
            }
        }
        return new Cons(vs, sum);
    }

    deduceKnowns(knowns) {
        var simplified = false;
        if (this.sum === this.vs.size || this.sum === 0) {
            for (var v of this.vs) {
                if (!knowns.has(v)) {
                    knowns.set(v, this.sum == 0 ? 0 : 1);
                    simplified = true;
                }
            }
        }
        return simplified;
    }

    isTrivial() {
        return this.vs.size == 0;
    }

    commonVs(cons) {
        var vs = new Set();
        for (var v of this.vs) {
            if (cons.vs.has(v)) {
                vs.add(v);
            }
        }
        return vs;
    }

    subtractVs(vs) {
        var ret = [];
        for (var v of this.vs) {
            if (!vs.has(v)) {
                ret.push(v);
            }
        }
        return ret;
    }

    toString() {
        var ret = "";
        for (var v of this.vs) {
            if (ret != "") {
                ret += " + ";
            }
            ret += "x" + v;
        }
        ret += " = " + this.sum;
        return ret;
    }
};

class CSP {
    constructor() {
        this.conses = new Map();
        this.knowns = new Map();
    }

    pushCons(cons) {
        if (this.conses.has(cons.key)) {
            return false;
        } else {
            //console.log("push " + cons.toString());
            this.conses.set(cons.key, cons);
            return true;
        }
    }

    simplifyCons(cons) {
        var simplified = false;
        if (this.pushCons(cons.subst(this.knowns))) {
            simplified = true;
        }
        if (cons.deduceKnowns(this.knowns)) {
            simplified = true;
        }
        return simplified;
    }

    deduceCoupled(cons1, cons2) {
	// For two constraints of the following shape:
	//  1) A0 + A1 + ... + Ak + B0 + B1 + ... + Bm = p + k
	//  2) B0 + B1 + ... + Bm + C0 + C1 + ... + Cn = p
	// Deduce that:
	//  A0 = A1 = ... = Ak = 1
	//  C0 = C1 = ... = Cn = 0
        var nknowns = this.knowns.size;
        var common = cons1.commonVs(cons2);
        if (common.size > 0) {
            var k = cons1.vs.size - common.size;
            var p = cons2.sum;
            if (cons1.sum === p + k) {
                for (var v of cons1.subtractVs(common)) {
                    this.knowns.set(v, 1);
                }
                for (var v of cons2.subtractVs(common)) {
                    this.knowns.set(v, 0);
                }
            }
        }
        return nknowns > this.knowns.size;
    }

    simplify() {
        while (true) {
            var progress = false;
            for (var [_, cons] of this.conses) {
                //console.log("::" + cons.toString());
                if (this.simplifyCons(cons)) {
                    progress = true;
                }
                // xxx track newly-added conses to not waste time
                // cross-simplifying those that were already done.
                for (var [_, cons2] of this.conses) {
                    if (cons.key < cons2.key) {
                        //console.log("" + cons.toString() + " vs. " + cons2.toString());
                        if (this.deduceCoupled(cons, cons2)
                            || this.deduceCoupled(cons2, cons)) {
                            progress = true;
                        }
                    }
                }
            }
            //console.log("---\n" + this.toString() + "\n====\n\n");
            if (!progress) {
                break;
            }
        }
    }

    toString() {
        var ret = "";
        for (var [_, cons] of this.conses) {
            if (ret != "") {
                ret += "\n";
            }
            ret += cons.toString();
        }
        ret += "\nknowns:";
        for (var [known, value] of this.knowns) {
            ret += " x" + known + "=" + value;
        }
        return ret;
    }
};

export { Cons, CSP };
