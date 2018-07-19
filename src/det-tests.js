import { assert } from 'chai';
import { detPlay } from './det.js';
import { Board } from './board.js';

function boardFromDescription(descr) {
    var [x0, y0] = [undefined, undefined];
    var h = descr.length;
    var w = h > 0 ? descr[0].length : 0;
    var board = new Board(w, h);
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var c = descr[y][x];
            switch (c) {
            case '.':
                break;
            case 'x':
                board.field(x, y).hasMine = true;
                break;
            case 'o':
                x0 = x;
                y0 = y;
                break;
            default:
                throw "Invalid field code '" + c + "'";
            }
        }
    }
    if (x0 === null || y0 === null) {
        throw "Board is missing starting point";
    }
    return [board, x0, y0];
}

function assertPlayable(what, board, x0, y0) {
    var playable = detPlay(board, x0, y0);
    assert.isOk(playable);
    for (var field of board.allFields()) {
        if (field.hasMine) {
            assert.isOk(field.flagged,
                        what + ": " + field.toString() + " flagged");
        } else {
            assert.isNotOk(field.covered,
                           what + ": " + field.toString() + " !covered");
        }
    }
}

function assertNotPlayable(what, board, x0, y0) {
    var playable = detPlay(board, x0, y0);
    assert.isNotOk(playable);
}

assertPlayable("1", ...boardFromDescription(["x.x",
                                             "...",
                                             "..o"]))

assertPlayable("2", ...boardFromDescription([".....",
                                             ".x.x.",
                                             ".....",
                                             "..o..",
                                             "....."]))

assertNotPlayable("3", ...boardFromDescription([".xxxx",
                                                "x..x.",
                                                ".....",
                                                "..o..",
                                                "....."]))

assertPlayable("4", ...boardFromDescription([".....",
                                             ".xxxx",
                                             "....x",
                                             "..o.x",
                                             "x...x"]))

assertPlayable("5", ...boardFromDescription([".....x.x...x......",
                                             "....x.x.x.x.x.....",
                                             "...x.....x...x....",
                                             "..x...........x...",
                                             ".x......o......x..",
                                             "..................",
                                             "............x....."]))

assertNotPlayable("6", ...boardFromDescription(["xxxxxx.xxx",
                                                ".x.x..xxxx",
                                                ".x..x...xx",
                                                "x..x...x.x",
                                                "x..x.o...x",
                                                "x..x...x.x",
                                                ".x.x..xxxx",
                                                "xxx.x.xx..",
                                                "xxxxx....x",
                                                "xx........"]))
