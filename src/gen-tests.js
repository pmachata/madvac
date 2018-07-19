import { assert } from 'chai';
import { genGame } from './gen.js';
import { Board } from './board.js';
import { assertPlayable, assertNotPlayable } from './tests.js';

for (let i = 0; i < 10; ++i) {
    let board = new Board(11, 11);
    let c0 = [5, 5];
    genGame(board, 30, ...c0);
    assertPlayable("", board, ...c0);
}
