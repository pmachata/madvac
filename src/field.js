class Field {
    constructor(board, x, y, id) {
        this.board = board;
        this.covered = true;
        this.flagged = false;
        this.hasMine = false;
        this.x = x;
        this.y = y;
        this.id = id;
    }

    uncover() {
        if (this.covered && this.board.callFieldBeforeUncover(this)) {
            this.covered = false;
            this.board.callFieldUncovered(this);
        }
    }

    toggle() {
        if (this.covered) {
            this.uncover();
        } else {
            this.covered = true;
        }
    }

    flag() {
        if (this.covered) {
            this.flagged = !this.flagged;
        }
    }

    neighbor(dx, dy) {
        return this.board.field(this.x + dx, this.y + dy);
    }

    countNeighMines() {
        var count = 0;
        for (var dx = -1; dx <= 1; ++dx) {
            for (var dy = -1; dy <= 1; ++dy) {
                var neigh = this.neighbor(dx, dy);
                if (neigh && neigh.hasMine) {
                    ++count;
                }
            }
        }
        return count;
    }

    uncoverNeighbors() {
        for (var dx = -1; dx <= 1; ++dx) {
            for (var dy = -1; dy <= 1; ++dy) {
                var neigh = this.neighbor(dx, dy);
                if (neigh) {
                    neigh.uncover();
                }
            }
        }
    }
};

export { Field };
