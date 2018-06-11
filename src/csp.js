class Cons {
    constructor(vs, sum) {
        this.vs = new Set(vs);
        this.sum = sum;
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
        this.conses = [];
        this.knowns = new Map();
    }

    pushCons(cons) {
        this.conses.push(cons);
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
            for (var i = 0; i < this.conses.length; ) {
                var cons = this.conses[i];
                if (this.simplifyCons(cons)) {
                    simplified = true;
                }
                for (var j = i + 1; j < this.conses.length; ++j) {
                    var consj = this.conses[j];
                    if (this.simplifyCons2(cons, consj)
                        || this.simplifyCons2(consj, cons)) {
                        simplified = true;
                    }
                }
                if (cons.isTrivial()) {
                    this.conses.splice(i, 1);
                } else {
                    ++i;
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
