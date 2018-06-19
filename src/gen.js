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
    for (var nmines = 0; nmines < want_nmines; ) {
        var field = randEmptyField(board);
        if (field.x !== x0 || field.y !== y0) {
            field.hasMine = true;
            ++nmines;
        }
    }
    board.setFieldObserver(origObserver);
}

export { genGame };
