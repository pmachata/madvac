import { assert } from 'chai';
import { genGame } from './gen.js';
import { Board } from './board.js';

var board = new Board(11, 11);
genGame(board, 30, 5, 5);
