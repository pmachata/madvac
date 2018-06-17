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
        var substituted = false;
        for (var v of this.vs) {
            if (knowns.has(v)) {
                this.vs.delete(v);
                this.sum -= knowns.get(v);
                substituted = true;
            }
        }
        return substituted;
    }

    simplify(knowns) {
        var simplified = false;
        if (this.sum === this.vs.size || this.sum === 0) {
            for (var v of this.vs) {
                knowns.set(v, this.sum == 0 ? 0 : 1);
            }
            this.subst(knowns);
            simplified = true;
        }
        return simplified;
    }

    isTrivial() {
        return this.vs.size == 0;
    }

    isSubOf(cons) {
        for (var v of this.vs) {
            if (!cons.vs.has(v)) {
                return false;
            }
        }
        return true;
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
        this.conses.set(cons.key, cons);
    }

    simplifyCons(cons) {
        var simplified = false;
        if (cons.subst(this.knowns)) {
            simplified = true;
        }
        if (cons.simplify(this.knowns)) {
            simplified = true;
        }
        return simplified;
    }

    simplifyCons2(cons1, cons2) {
        return false;
    }

    simplify() {
        while (true) {
            var simplified = false;
            for (var [_, cons] of this.conses) {
                if (this.simplifyCons(cons)) {
                    simplified = true;
                }
                for (var [_, cons2] of this.conses) {
                    if (cons.key < cons2.key) {
                        if (this.simplifyCons2(cons, cons2)
                            || this.simplifyCons2(cons2, cons)) {
                            simplified = true;
                        }
                    }
                }
                if (cons.isTrivial()) {
                    this.conses.delete(cons.key);
                }
            }
            if (!simplified) {
                break;
            }
        }
    }

    toString() {
        var ret = "";
        for (var cons of this.conses) {
            if (ret != "") {
                ret += "\n";
            }
            ret += cons.toString();
        }
        return ret;
    }
};

export { Cons, CSP };
