import { Board } from './board.js';
import { asm, heap, logger } from './asmctx.js';

class DetGame {
    constructor(board, field, ignoreCoupled) {
        this.board = board;
        this.csp = heap.allocaCsp();
        asm.csp_init(this.csp);

        this.uncoverQueue = [];
        if (field) {
            this.uncoverQueue.push(field);
        }

        for (let field of board.allFields()) {
            if (!field.covered) {
                this.projectUncovered(field);
                asm.csp_setKnown(this.csp, field.id, 0);
            }
            if (field.flagged) {
                asm.csp_setKnown(this.csp, field.id, 1);
            }
        }

        this.ignoreCoupled = ignoreCoupled;
        this.origObserver = this.board.setFieldObserver(this);
    }

    resetObserver() {
        if (this.board.setFieldObserver(this.origObserver) !== this) {
            throw "Inconsistent observer";
        }
    }

    fieldBeforeUncover(field) {
        if (this.origObserver !== null) {
            return this.origObserver.fieldBeforeUncover(field);
        } else {
            return true;
        }
    }

    projectUncovered(field) {
        //console.log("uncovered " + field.toString());
        var sum = field.countNeighMines();
        var cons = heap.allocaCons();
        asm.bs_init(cons);
        for (let neigh of field.neighbors()) {
            asm.bs_add(cons, neigh.id);
        }
        asm.c_initSumOnly(cons, sum);
        //console.log(" => " + logger.cons_toString(cons));
        asm.csp_pushCons(this.csp, cons);
    }

    fieldUncovered(field) {
        this.projectUncovered(field);
        if (this.origObserver !== null) {
            this.origObserver.fieldUncovered(field);
        }
    }

    step() {
        heap.enter();
        var newKnownsPtr = heap.allocaNewKnowns();
        var ct = asm.csp_simplify(this.csp, newKnownsPtr, this.ignoreCoupled);
        var newKnowns = heap.array(newKnownsPtr, ct);
        for (let i in newKnowns) {
            let id = newKnowns[i];
            let value = asm.csp_known(this.csp, id);
            var field = this.board.fieldById(id);
            if (field === null) {
                throw "CSP resolved a variable with no corresponding field";
            }

            if (!value) {
                //console.log("push to uncoverQueue: " + field.toString());
                this.uncoverQueue.push(field);
            }
            if (field.flagged != !!value) {
                field.flag();
            }
        }

        var ret;
        if (this.uncoverQueue.length > 0) {
            var field = this.uncoverQueue.pop();
            field.uncover();
            ret = true;
        } else {
            ret = false;
        }

        heap.leave();
        return ret;
    }
};

function play(board, field0, ignoreCoupled) {
    var ret;

    heap.enter();
    {
        var game = new DetGame(board, field0, ignoreCoupled);
        while (game.step()) {
        }
        game.resetObserver();
        ret = board.allFields().every(field => (!field.covered ||
                                                (field.flagged && field.hasMine)));
    }
    heap.leave();

    return ret;
}

function hintPlay(board, ignoreCoupled) {
    return play(board, undefined, ignoreCoupled);
}

// Play the game deterministically with the help of CSP.
function detPlay(board, x0, y0, ignoreCoupled) {
    var field0 = board.field(x0, y0);
    return play(board, field0, ignoreCoupled);
}

export { detPlay, hintPlay };
