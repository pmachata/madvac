import { assert } from 'chai';
import { detPlay, strengthCoupled } from './det.js';

function assertPlayable(what, board, x0, y0) {
    var playable = detPlay(board, x0, y0, strengthCoupled);
    assert.isOk(playable, what + " should be playable");
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
    var playable = detPlay(board, x0, y0, strengthCoupled);
    assert.isNotOk(playable);
}

export { assertPlayable, assertNotPlayable };
