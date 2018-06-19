import { Field } from './field.js';
import { Board } from './board.js';
import { genGame } from './gen.js';

class Game {
    constructor() {
        this.started = false;
        this.over = false;
        this.board = new Board(10, 10);
        this.board.setFieldObserver(this);
    }

    field(x, y) {
        return this.board.field(x, y);
    }

    toggleField(x, y) {
        if (!this.over) {
            this.field(x, y).toggle();
        }
    }

    flagField(x, y) {
        if (!this.over) {
            this.field(x, y).flag();
        }
    }

    kaboom() {
        for (var row of this.board.fields) {
            for (var field of row) {
                field.covered = false;
            }
        }
        this.over = true;
    }

    fieldBeforeUncover(field) {
        if (!this.started) {
            genGame(this.board, 10, field.x, field.y);
            this.started = true;
        }
        if (field.flagged) {
            return false; // Prevent uncover.
        }
        return true;
    }

    fieldUncovered(field) {
        if (field.countNeighMines() == 0) {
            field.uncoverNeighbors();
        }
        if (!field.covered && field.hasMine) {
            this.kaboom();
        }
    }
};

export { Game };
