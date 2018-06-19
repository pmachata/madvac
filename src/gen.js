import { detPlay } from './det.js';

function randint(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function randCoord(w, h) {
    return [randint(w), randint(h)];
}

function randEmptyField(board) {
    while (true) {
        var [x, y] = randCoord(board.width, board.height);
        var field = board.field(x, y);
        if (!field.hasMine) {
            return field;
        }
    }
}

function genGame(board, want_nmines, x0, y0) {
    var origObserver = board.setFieldObserver(null);

    var mines = [];
    var tally = [0];
    while (mines.length < want_nmines) {
        var field = randEmptyField(board);

        field.hasMine = true;
        mines.push(field);

        var playable = detPlay(board, x0, y0);
        board.allFields().forEach(function(field) {
            field.covered = true;
            field.flagged = false;
        });
        if (playable) {
            tally.push(0);
            continue;
        }

        field = mines.pop();
        field.hasMine = false;

        while (tally.length > 1 && ++tally[tally.length - 1] > 3) {
            tally.pop();
            field = mines.pop();
            field.hasMine = false;
        }
    }

    board.setFieldObserver(origObserver);
}

export { genGame };
