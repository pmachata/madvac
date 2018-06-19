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

    vsIntersect(vs) {
        return new Set([...this.vs].filter(x => vs.has(x)));
    }

    vsDiff(vs) {
        return new Set([...this.vs].filter(x => !vs.has(x)));
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
        this.newConses = [];
        this.knowns = new Map();
    }

    pushCons(cons) {
        if (this.conses.has(cons.key)) {
            return false;
        } else {
            //console.log("push " + cons.toString());
            this.conses.set(cons.key, cons);
            this.newConses.push(cons);
            return true;
        }
    }

    vsDeduce(vs, value) {
        for (var v of vs) {
            this.knowns.set(v, value);
        }
    }

    substKnowns(cons) {
        var vs = [];
        var sum = cons.sum;
        for (var v of cons.vs) {
            if (!this.knowns.has(v)) {
                vs.push(v);
            } else {
                sum -= this.knowns.get(v);
            }
        }
        return this.pushCons(new Cons(vs, sum));
    }

    deduceSimple(cons) {
        // For a constraint of one of the following shapes:
        //  1) A0 + A1 + ... + An = n
        //  2) A0 + A1 + ... + An = 0
        // Deduce that:
        //  in case 1) A0 = A1 = ... = An = 1
        //  in case 2) A0 = A1 = ... = An = 0
        var nknowns = this.knowns.size;
        if (cons.sum === cons.vs.size) {
            this.vsDeduce(cons.vs, 1);
        } else if (cons.sum === 0) {
            this.vsDeduce(cons.vs, 0);
        }
        return nknowns > this.knowns.size;
    }

    deduceCoupled(cons1, cons2) {
	// For two constraints of the following shape:
	//  1) A0 + A1 + ... + Ak + B0 + B1 + ... + Bm = p + k
	//  2) B0 + B1 + ... + Bm + C0 + C1 + ... + Cn = p
	// Deduce that:
	//  A0 = A1 = ... = Ak = 1
	//  C0 = C1 = ... = Cn = 0
        var nknowns = this.knowns.size;
        var common = cons1.vsIntersect(cons2.vs);
        if (common.size > 0) {
            var k = cons1.vs.size - common.size;
            var p = cons2.sum;
            if (cons1.sum === p + k) {
                this.vsDeduce(cons1.vsDiff(common), 1);
                this.vsDeduce(cons2.vsDiff(common), 0);
            }
        }
        return nknowns > this.knowns.size;
    }

    simplify() {
        var oldKnowns = new Map(this.knowns);
        while (true) {
            var progress = false;
            for (var cons of this.newConses) {
                //console.log("::" + cons.toString());
                if (this.substKnowns(cons)) {
                    progress = true;
                }
                if (this.deduceSimple(cons)) {
                    progress = true;
                }
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
            this.newConses = [];
        }
        return new Map([...this.knowns.entries()]
                            .filter(entry => !oldKnowns.has(entry[0])))
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
