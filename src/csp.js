class Cons {
    constructor(vs, sum) {
        this.vs = new Set(vs);
        this.sum = sum;
    }

    subst(knowns) {
        for (var v of this.vs) {
            if (knowns.hasOwnProperty(v)) {
                this.vs.delete(v);
                this.sum -= knowns[v];
            }
        }
    }

    simplify(knowns) {
        console.log(this.sum);
        console.log(Object.keys(this.vs));
        if (this.sum === this.vs.size) {
            for (var v of this.vs) {
                knowns[v] = 1;
            }
            this.subst(knowns);
        }
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
        this.knowns = {};
    }

    pushCons(cons) {
        this.conses.push(cons);
    }

    simplifyCons(cons) {
        cons.subst(this.knowns);
        cons.simplify(this.knowns);
    }

    simplify() {
        for (var cons of this.conses) {
            if (this.simplifyCons(cons)) {
                // xxx remove it
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
