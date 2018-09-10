class Field {
    constructor(board, x, y, id) {
        this.board = board;
        this.covered = true;
        this.flagged = false;
        this.hasMine = false;
        this.crossed = false;
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

    open() {
        if (this.covered) {
            this.uncover();
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

    neighbors() {
        var ret = [];
        for (var dx = -1; dx <= 1; ++dx) {
            for (var dy = -1; dy <= 1; ++dy) {
                var field = this.neighbor(dx, dy);
                if (field) {
                    ret.push(field);
                }
            }
        }
        return ret;
    }

    countNeighMines() {
        return this.neighbors().filter(field => field.hasMine).length;
    }

    uncoverNeighbors() {
        for (var field of this.neighbors()) {
            field.uncover();
        }
    }

    toString() {
        return "{x:" + this.x + ", y:" + this.y + ", f" + this.id + "}";
    }
};

export { Field };
