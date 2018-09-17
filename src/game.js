import { Field } from './field.js';
import { Board } from './board.js';
import { genGame } from './gen.js';
import { hintPlay } from './det.js';

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

    openField(x, y) {
        if (!this.over) {
            this.field(x, y).open();
            if (!this.over) {
                hintPlay(this.board, true);
            }
        }
    }

    flagField(x, y) {
        if (!this.over) {
            this.field(x, y).flag();
            hintPlay(this.board, true);
        }
    }

    kaboom(field) {
        field.crossed = true;
        for (var field of this.board.allFields()) {
            field.covered = false;
        }
        this.over = true;
    }

    fieldBeforeUncover(field) {
        if (!this.started) {
            genGame(this.board, 30, field.x, field.y, undefined, false);
            this.started = true;
        }
        if (field.flagged) {
            return false; // Prevent uncover.
        }
        return true;
    }

    fieldUncovered(field) {
        if (!field.covered && field.hasMine) {
            this.kaboom(field);
        }
    }
};

export { Game };
