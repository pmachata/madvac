import { Board } from './board.js';
import { CSP, Cons } from './csp.js';

class DetGame {
    constructor(board, x0, y0) {
        this.board = board;
        this.csp = new CSP();
        this.knowns = new Set();
        this.uncoverQueue = [];

        if (this.board.setFieldObserver(this) !== null) {
            throw "DetGame expects a board without an observer";
        }
        this.board.field(x0, y0).uncover();
    }

    fieldBeforeUncover(field) {
        return true;
    }

    fieldUncovered(field) {
        //console.log("uncovered " + field.toString());
        var vs = field.neighbors().map(field => field.id);
        var sum = field.countNeighMines();
        var cons = new Cons(vs, sum);
        //console.log(" => " + cons);
        this.csp.pushCons(cons);
    }

    step() {
        for (var [id, value] of this.csp.simplify()) {
            var field = this.board.fieldById(id);
            if (field === null) {
                throw "CSP resolved a variable with no corresponding field";
            }

            if (value === 0) {
                //console.log("push to uncoverQueue: " + field.toString());
                this.uncoverQueue.push(field);
            } else {
                field.flag();
            }
        }

        if (this.uncoverQueue.length > 0) {
            var field = this.uncoverQueue.pop();
            field.uncover();
            return true;
        }

        return false;
    }
};

// Play the game deterministically with the help of CSP.
function detPlay(board, x0, y0) {
    var game = new DetGame(board, x0, y0);
    while (game.step()) {}
    board.setFieldObserver(null);
    return board.allFields().every(field => (!field.covered || field.hasMine));
}

export { detPlay };
