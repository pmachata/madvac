import { Field } from './field.js';
import { CSP } from './csp.js';

function randint(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class Game {
    constructor() {
        function createFields(game) {
            var ret = [];
            var i = 0;
            for (var y = 0; y < 10; ++y) {
                var row = [];
                for (var x = 0; x < 10; ++x) {
                    row.push(new Field(game, x, y, i++));
                }
                ret.push(row);
            }
            return ret;
        }

        this.started = false;
        this.over = false;
        this.fields = createFields(this);
    }

    field(x, y) {
        if (y >= 0 && y < this.fields.length) {
            var row = this.fields[y];
            if (x >= 0 && x < row.length) {
                return row[x];
            }
        }
        return null;
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

    start(x0, y0) {
        // xxx
        this.started = true;
        for (var i = 0; i < 10;) {
            var x = randint(10);
            var y = randint(10);
            if ((x == x0 && y == y0)
                || this.field(x, y).hasMine) {
                continue;
            }
            ++i;
            this.field(x, y).hasMine = true;
        }
    }

    kaboom() {
        for (var row of this.fields) {
            for (var field of row) {
                field.covered = false;
            }
        }
        this.over = true;
    }
};

export { Game };
