import { assert } from 'chai';
import { strengthCoupled } from './det.js';
import { genGame } from './gen.js';
import { Board } from './board.js';
import { assertPlayable, assertNotPlayable } from './tests.js';

function deterministicRandCoord() {
    let x = 0;
    let y = 0;
    return function (w, h) {
        ++x;
        if (x >= w) {
            x = 0;
            ++y;
        }
        return [x, y];
    }
}

for (let i = 0; i < 10; ++i) {
    let board = new Board(10, 10);
    let c0 = [5, 5];
    genGame(board, 30, ...c0, undefined, strengthCoupled);
    assertPlayable("", board, ...c0);
}

for (let i = 0; i < 10; ++i) {
    let board = new Board(10, 10);
    let c0 = [5, 5];
    genGame(board, 38, ...c0, deterministicRandCoord(), strengthCoupled);
    assertPlayable("", board, ...c0);
}
