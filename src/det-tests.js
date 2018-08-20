import { assert } from 'chai';
import { assertPlayable, assertNotPlayable } from './tests.js';
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

assertPlayable("7", ...boardFromDescription(["......xxxx",
                                             ".x.......x",
                                             "xx...x....",
                                             ".x.x.x..x.",
                                             "...xx...x.",
                                             "o..x..xxxx",
                                             "......x...",
                                             "....xx..x.",
                                             ".xx.....x.",
                                             ".x.x......"]))

assertPlayable("8", ...boardFromDescription(["o........x",
                                             ".....xx...",
                                             ".x..x.xx.x",
                                             "......x...",
                                             "x.........",
                                             "....xxxx.x",
                                             "...xx..xxx",
                                             "..xx...x..",
                                             "x...x....x",
                                             "x...x..x.x"]))

assertPlayable("9", ...boardFromDescription(["...xxx.x..",
                                             "x..x...xx.",
                                             "x..xx.....",
                                             "xx....xx..",
                                             "x...xx..x.",
                                             "x..x....x.",
                                             ".x......x.",
                                             "..xx..o...",
                                             "x.........",
                                             ".....xxx.."]))

assertPlayable("10", ...boardFromDescription([".....x.x.x",
                                              "....x...xx",
                                              ".x.xx.....",
                                              "......x.x.",
                                              "...xx.xxxx",
                                              ".xx.xx....",
                                              ".x......x.",
                                              "..x.x.x.x.",
                                              "o......xx.",
                                              "......x..."]))

assertPlayable("11", ...boardFromDescription(["xx..x.xx..",
                                              "...x..x...",
                                              "x.x.x.x.o.",
                                              "......x...",
                                              ".......x..",
                                              "x..xxxx...",
                                              ".xx..x....",
                                              ".x.x.xx..x",
                                              "..........",
                                              ".x.x..x.x."]))

assertPlayable("12", ...boardFromDescription(["...x..xx..",
                                              "x.xxx.x...",
                                              ".x....x.o.",
                                              ".....x....",
                                              ".x.xx.xx..",
                                              ".x........",
                                              "...x...x..",
                                              "x.x......x",
                                              "x...x....x",
                                              "x.x..xx.x."]))

assertPlayable("13", ...boardFromDescription(["........x.",
                                              "..x..x.x.x",
                                              ".x.......x",
                                              "..x.xx.x..",
                                              "x...x.....",
                                              "x.x..x.o..",
                                              ".x...x....",
                                              ".xx....x.x",
                                              "xxx..xxx..",
                                              ".....x...x"]))

assertPlayable("14", ...boardFromDescription(["....xxx..x",
                                              "...x......",
                                              "...x...x.x",
                                              "x.x..xxxxx",
                                              "x........x",
                                              "xxx.x...x.",
                                              "...x....x.",
                                              "..x...x..x",
                                              "..........",
                                              ".x..o.x..x"]))

assertPlayable("15", ...boardFromDescription(["..........",
                                              ".x...o.x..",
                                              "x..x...x..",
                                              "xxxxx.....",
                                              "........x.",
                                              "....xxx.x.",
                                              ".x..xxxx..",
                                              "....x.x..x",
                                              "...x..x..x",
                                              "xx....x.x."]))

assertPlayable("16", ...boardFromDescription(["..x...x...",
                                              "......x.o.",
                                              "x.x.......",
                                              "...xxx....",
                                              ".x.x..x...",
                                              ".xx.x.....",
                                              "xx.x...x.x",
                                              "xxx......x",
                                              "........xx",
                                              "....xxxx.x"]))

assertPlayable("17", ...boardFromDescription(["x..x..x.x.",
                                              ".....x.x..",
                                              ".x.x.....x",
                                              "x....x.x.x",
                                              "x.xx.....x",
                                              "....x...x.",
                                              "xx..x....x",
                                              ".x...x....",
                                              "..x.x.....",
                                              "..xx...o.x"]))

assertPlayable("18", ...boardFromDescription([".........x",
                                              ".x..xx...x",
                                              "....x....x",
                                              "....x.....",
                                              "x.xx.x.x..",
                                              "xx..x.....",
                                              "....xx...x",
                                              "x....x...x",
                                              ".xx......x",
                                              "xx.x.o..xx"]))

assertPlayable("19", ...boardFromDescription(["....x.x...",
                                              "...x....xx",
                                              "xx......x.",
                                              "x......x.x",
                                              ".x.o.xx..x",
                                              ".x...x....",
                                              "x...xx.x..",
                                              "......xx..",
                                              "x...x.....",
                                              "x...xxx.x."]))

assertPlayable("20", ...boardFromDescription([".....x.x.x",
                                              "x.........",
                                              "..x..x.x..",
                                              "...xx.....",
                                              "..x.xx.x.x",
                                              "..xxx.x...",
                                              "o.xx..xx..",
                                              "...x...xx.",
                                              "xx..x.....",
                                              ".....x...x"]))

assertPlayable("21", ...boardFromDescription([".x....xx..",
                                              "..x...xx..",
                                              ".xx..x....",
                                              ".....xxx..",
                                              "x..x....x.",
                                              "x.x.....x.",
                                              "....x.....",
                                              "x..x.x.o..",
                                              ".x...x...x",
                                              "xx.x....xx"]))

assertPlayable("22", ...boardFromDescription(["xxx...x..x",
                                              "....x.x...",
                                              "..o...x.x.",
                                              "x...xx....",
                                              ".....x.x..",
                                              "x....xxx..",
                                              "..xx..x.x.",
                                              "x.........",
                                              "..xx....x.",
                                              "..x.x...xx"]))

assertPlayable("23", ...boardFromDescription(["x.xx.x...x",
                                              ".......x.x",
                                              "..xx...x.x",
                                              "x....x...x",
                                              "...x......",
                                              "......x.xx",
                                              "x.....x..x",
                                              "..x...x..x",
                                              "o...xx....",
                                              "..x.xx...x"]))

assertPlayable("24", ...boardFromDescription([".xxx..x.xx",
                                              ".x...x....",
                                              "..x....xx.",
                                              ".x...x.x..",
                                              "x..xx.....",
                                              "........x.",
                                              ".xxx..xxxx",
                                              "x........x",
                                              "...x......",
                                              "x.....o.x."]))

assertPlayable("25", ...boardFromDescription(["...x....o.",
                                              ".....x....",
                                              "xxx.xx.x..",
                                              "...x.x....",
                                              "...x...x.x",
                                              ".x..x....x",
                                              ".x.......x",
                                              "x.....x.x.",
                                              ".xx...xx..",
                                              ".x..xxxx.."]))

assertPlayable("26", ...boardFromDescription(["..xxx...x.",
                                              "...x.x....",
                                              ".x.xx.....",
                                              "......o...",
                                              "....x....x",
                                              "x.x..x...x",
                                              "...x..x...",
                                              ".x.x.x.x.x",
                                              ".......xxx",
                                              "xx.x.xx..."]))

assertPlayable("27", ...boardFromDescription(["....x..x.x",
                                              "x.x...x..x",
                                              "....o.....",
                                              "x.....x..x",
                                              "xx.....xxx",
                                              "..x....xxx",
                                              "....x....x",
                                              "........xx",
                                              "..x.x.xx.x",
                                              "....x....x"]))

assertPlayable("28", ...boardFromDescription(["..xx.xxx..",
                                              "..x.x....x",
                                              "...x.x.x.x",
                                              "..x...x...",
                                              ".........x",
                                              "......xx..",
                                              "o..xx..x..",
                                              ".....xx..x",
                                              ".x........",
                                              ".x.x.x.xxx"]))

assertPlayable("29", ...boardFromDescription(["x.xx......",
                                              "x.......x.",
                                              ".x.x.xx.x.",
                                              "..........",
                                              "x....x.xxx",
                                              "..x.x...x.",
                                              "o......x..",
                                              "......x..x",
                                              "xx...xxx.x",
                                              "...xx..x.."]))

assertPlayable("30", ...boardFromDescription(["xx.....x..",
                                              "..xxx..x..",
                                              "x.....x...",
                                              "....x..x.x",
                                              "o..x......",
                                              ".....x...x",
                                              "..x..x....",
                                              "xx..xx..x.",
                                              "x...xxx...",
                                              "xxxx......"]))

assertPlayable("31", ...boardFromDescription([".xx.......",
                                              "....x....x",
                                              "..x...x..x",
                                              "x.....x...",
                                              "x...o.xxx.",
                                              "x.x....x..",
                                              "..x...xx.x",
                                              "..x.x.x..x",
                                              "xx...x....",
                                              "x....x...x"]))

assertPlayable("32", ...boardFromDescription(["....x...xx",
                                              ".xxx.....x",
                                              "xx......xx",
                                              "x...x.x...",
                                              ".....xx..x",
                                              ".o..x.....",
                                              "....xx...x",
                                              "x.....x...",
                                              "...x..xxxx",
                                              "....x....x"]))

assertPlayable("33", ...boardFromDescription(["...xx.x.x.",
                                              "..xxx....x",
                                              "..........",
                                              ".....x.x.o",
                                              "...x......",
                                              "x.....xx..",
                                              "x.xxxx..x.",
                                              "...xx.x.x.",
                                              "..xx.....x",
                                              "x......xx."]))

assertPlayable("34", ...boardFromDescription([".x...x.x..",
                                              "x.....xx.x",
                                              "x.........",
                                              "..........",
                                              "x.xxxxx.x.",
                                              ".x........",
                                              "..xxx...xx",
                                              "..x..xxx.x",
                                              "..xx.....x",
                                              "......o..x"]))

assertPlayable("35", ...boardFromDescription([".xx....x..",
                                              ".x.x.....x",
                                              "..x.xx.x.x",
                                              ".x.x......",
                                              "......xx..",
                                              "..x...xx.o",
                                              "..xx...x..",
                                              "x........x",
                                              "x..x......",
                                              "xxx.x..x.."]))

assertPlayable("36", ...boardFromDescription(["xx....xx..",
                                              "..xx......",
                                              "..xx..o.xx",
                                              ".x..x...x.",
                                              "..........",
                                              ".x.x.x...x",
                                              "x.x..x....",
                                              "xx........",
                                              ".xx.xxx.x.",
                                              "....x..x.."]))

assertPlayable("37", ...boardFromDescription(["xx.......x",
                                              ".x....x.x.",
                                              ".....xx...",
                                              "...xxx...x",
                                              ".xxx...x.x",
                                              "...x.....x",
                                              "........x.",
                                              "x.x.o.....",
                                              "xx....xxxx",
                                              "x...x....."]))

assertPlayable("38", ...boardFromDescription([".x...x..xx",
                                              "x.xx..x...",
                                              ".x..x....x",
                                              "...xx.o..x",
                                              "x.x.......",
                                              "......x...",
                                              "..x.x.....",
                                              ".....x.xx.",
                                              "..xx.xxx..",
                                              ".x.xx....."]))

assertPlayable("39", ...boardFromDescription(["x...x.....",
                                              "...xx..xxx",
                                              ".x...x..x.",
                                              "...o.x..x.",
                                              "xx.....x.x",
                                              "..x....x..",
                                              "..x.x.x.x.",
                                              "....x.....",
                                              "x.x...x...",
                                              "xxx......x"]))

assertPlayable("40", ...boardFromDescription(["xx..x.....",
                                              ".x.......x",
                                              ".xx.x.....",
                                              ".x.xxx..xx",
                                              ".x....x...",
                                              "x.x....xx.",
                                              "..x.o.....",
                                              "x......xx.",
                                              ".x..x.x..x",
                                              ".x..x....."]))

assertPlayable("41", ...boardFromDescription(["..x....xxx",
                                              "...x.xx..x",
                                              "x...x.....",
                                              "..xx.x....",
                                              "...x.x.x.x",
                                              "x.....x...",
                                              "x..xx.....",
                                              "x.x...x.xx",
                                              "....xx....",
                                              "......x..o"]))

assertPlayable("42", ...boardFromDescription(["x.x.x.xx..",
                                              "x..x.x.xx.",
                                              "..........",
                                              "..........",
                                              ".x..x...xx",
                                              "...x..o...",
                                              "...xx.....",
                                              "x.x.x.....",
                                              "..xx.x.x..",
                                              "xx.xx.x.x."]))

assertPlayable("43", ...boardFromDescription(["........xx",
                                              "..xx.x...x",
                                              "...xx.x...",
                                              "......x...",
                                              "...xx.xxx.",
                                              "x..x......",
                                              "xx......o.",
                                              ".xxx.xx...",
                                              "x.....x.xx",
                                              "x......x.."]))

assertPlayable("44", ...boardFromDescription(["x.....xxx.",
                                              "......x.x.",
                                              ".o...x..x.",
                                              "...xxx....",
                                              ".x.x....x.",
                                              "...x...xx.",
                                              "x.xx.x...x",
                                              "......xx..",
                                              ".....xx...",
                                              "...x.xxx.."]))

assertPlayable("45", ...boardFromDescription([".xxxx.....",
                                              ".......xxx",
                                              ".o...x.x..",
                                              ".......x..",
                                              "...xxxxxx.",
                                              "x.x.....x.",
                                              "x......xx.",
                                              "..xx...xx.",
                                              "..x.......",
                                              "...x.xx..."]))

assertPlayable("46", ...boardFromDescription(["x..x...x.x",
                                              ".xx.......",
                                              ".x.x...x..",
                                              ".x..x.x...",
                                              ".x.....x.x",
                                              "x.......x.",
                                              ".x......x.",
                                              "..xx.....x",
                                              "...x.o.xxx",
                                              "x.xx.....x"]))

assertPlayable("47", ...boardFromDescription(["xx..xx.x..",
                                              "....xx....",
                                              ".........x",
                                              ".xx.x.....",
                                              "xx..x.xxx.",
                                              "x...x.x...",
                                              ".x.x..x...",
                                              "...x...x.x",
                                              "o..x...x..",
                                              ".....x.x.."]))

assertPlayable("48", ...boardFromDescription(["..x.x.x.xx",
                                              ".xx.....x.",
                                              "...xx...x.",
                                              "x.x.xx.x.x",
                                              "....x...x.",
                                              ".xx.......",
                                              "x...x...x.",
                                              "....xx.x.x",
                                              "..o.x.....",
                                              "........x."]))

assertPlayable("49", ...boardFromDescription(["xx...x.x.x",
                                              ".x....x..x",
                                              "x.....x...",
                                              ".x........",
                                              ".xxx....xx",
                                              "..x.......",
                                              "x.....o.x.",
                                              "x.x.....x.",
                                              "x.....x.x.",
                                              "x..x.xxx.."]))

assertPlayable("50", ...boardFromDescription(["..xxxx....",
                                              "...x.x....",
                                              "x.x......x",
                                              ".x.....xxx",
                                              ".x......x.",
                                              ".x..xxxx..",
                                              ".xx.....xx",
                                              ".x..x.x...",
                                              ".x.....xx.",
                                              "....o....."]))

assertPlayable("51", ...boardFromDescription(["....x...xx",
                                              ".x........",
                                              "xx..x..x.x",
                                              "....x..x..",
                                              "x...x.....",
                                              "x.x..x.o.x",
                                              ".........x",
                                              "x...xx...x",
                                              "x....xxx..",
                                              "x...xx...x"]))

assertPlayable("52", ...boardFromDescription(["..x..x...x",
                                              "x....x.o..",
                                              "..x.......",
                                              ".x.x..xx..",
                                              ".x......xx",
                                              "....xxx...",
                                              ".........x",
                                              ".xx.x.xx..",
                                              "..x.....xx",
                                              "..xx.xxx.."]))

assertPlayable("53", ...boardFromDescription([".xx.xxxx.x",
                                              "...x..x...",
                                              "xx.x......",
                                              "x....xx.x.",
                                              "xxx.....x.",
                                              "......x.xx",
                                              "......x...",
                                              "xx....x...",
                                              ".......x.x",
                                              "..o.x....."]))

assertPlayable("54", ...boardFromDescription(["..xxxx..x.",
                                              "x..x..xxx.",
                                              ".x.x..x...",
                                              "........x.",
                                              ".....x..xx",
                                              "x.o.....x.",
                                              ".....x...x",
                                              "x..xx...x.",
                                              "x....x..x.",
                                              "xx........"]))

assertPlayable("55", ...boardFromDescription(["..xx.x...x",
                                              ".....x...x",
                                              ".xx.xx...x",
                                              ".x..x...x.",
                                              ".....xx...",
                                              "....x.....",
                                              "x..xx.o.x.",
                                              ".xx.....x.",
                                              "......x.x.",
                                              "xx.x..x..."]))

assertPlayable("56", ...boardFromDescription([".xxx....x.",
                                              ".x.x...x.x",
                                              "..x..xx...",
                                              ".x.xx.....",
                                              "......xx..",
                                              "..xx......",
                                              "o.........",
                                              "...x.x...x",
                                              "....xx.xx.",
                                              "..xx...xxx"]))

assertPlayable("57", ...boardFromDescription(["x..xx..x.x",
                                              "x....xx...",
                                              ".x....xx..",
                                              "...xx.....",
                                              ".x........",
                                              "xx.x......",
                                              "......x..x",
                                              ".x.x.xx...",
                                              "..xx.x....",
                                              "..xxxx...o"]))

assertPlayable("58", ...boardFromDescription(["xxx...x..x",
                                              ".........x",
                                              ".o.x.x....",
                                              ".....xx.x.",
                                              "...xx.x..x",
                                              "..x..xx.x.",
                                              "..x..x.x..",
                                              "...x......",
                                              ".......xx.",
                                              ".x.x.xx..x"]))

assertPlayable("59", ...boardFromDescription([".....x..xx",
                                              ".xxxxxxx..",
                                              "x....x..x.",
                                              "x...x.x...",
                                              "..x.x.x...",
                                              "..x.x.xx..",
                                              "...x...x..",
                                              ".o.x...x..",
                                              ".....x.x..",
                                              "....x....."]))

assertPlayable("60", ...boardFromDescription(["x.xxx.x...",
                                              "x.....x...",
                                              "x....x.x.o",
                                              "..x.x..x..",
                                              ".xx.......",
                                              "x.........",
                                              "xx.x..xx..",
                                              ".x....x..x",
                                              "x...xx....",
                                              "....x.xx.."]))

assertPlayable("61", ...boardFromDescription(["xxx..x....",
                                              "...x.x..xx",
                                              "x..x......",
                                              "........o.",
                                              ".x..xxx...",
                                              "...x..x.xx",
                                              ".x.x......",
                                              "x.x..x....",
                                              ".....x.x.x",
                                              "xxx.....x."]))

assertPlayable("62", ...boardFromDescription(["x.......x.",
                                              "......x...",
                                              ".x..x.xx.x",
                                              "..xx......",
                                              "x.x...xx.x",
                                              "x...o.x...",
                                              "..x...x...",
                                              "xx...x....",
                                              "..x.x...x.",
                                              ".x.x...xxx"]))

assertPlayable("63", ...boardFromDescription(["x..x.....x",
                                              "x....xx.x.",
                                              ".xx..x....",
                                              "x.xxx.x...",
                                              ".x.x...xx.",
                                              "x.........",
                                              "xx..x.....",
                                              "xx...x..o.",
                                              "..........",
                                              "..xx...xx."]))

assertPlayable("64", ...boardFromDescription(["...x..x.xx",
                                              ".x.x...x..",
                                              ".....o.x.x",
                                              "x.........",
                                              "..x.......",
                                              ".x...x..x.",
                                              "xxxxx.x..x",
                                              "x.....x...",
                                              "x........x",
                                              "..x.xx.x.x"]))

assertPlayable("65", ...boardFromDescription(["....xx....",
                                              ".o.xx...x.",
                                              "...x.x....",
                                              ".........x",
                                              "...x.x.x..",
                                              "...x..x...",
                                              "xx.x...xx.",
                                              "x.....x..x",
                                              "x..x.....x",
                                              "xxxx.x.x.."]))

assertPlayable("66", ...boardFromDescription(["x......x..",
                                              "x....xx...",
                                              "..x.xx.x..",
                                              "o.......xx",
                                              "...xxx....",
                                              ".x.....xx.",
                                              "x....xx...",
                                              "....x.x..x",
                                              "x.xxxxx..x",
                                              ".........."]))

assertPlayable("67", ...boardFromDescription(["..........",
                                              "xx........",
                                              ".xx...xxx.",
                                              "x.xx....xx",
                                              "x....x.xxx",
                                              "x....xx...",
                                              "x.xx.....x",
                                              "x.x......x",
                                              "x....o....",
                                              ".......xx."]))

assertPlayable("68", ...boardFromDescription(["x.........",
                                              ".x....xx..",
                                              "x......xxx",
                                              "x.x....x..",
                                              "xx..xxx...",
                                              "...xx.x.x.",
                                              ".x...x....",
                                              "x..x......",
                                              "..xx....x.",
                                              "..xx..o.x."]))

assertPlayable("69", ...boardFromDescription(["xxx...x...",
                                              ".x....xx..",
                                              "...xxx.x..",
                                              ".x.x..x..x",
                                              ".....x....",
                                              "..o..x.x.x",
                                              "....xx...x",
                                              "x.x.......",
                                              "..xx.....x",
                                              ".x..x....x"]))

assertPlayable("70", ...boardFromDescription(["..x.xx....",
                                              "......xxxx",
                                              "o..x..x...",
                                              "...x...xx.",
                                              ".x.x..x...",
                                              "...xx...xx",
                                              "x....xx..x",
                                              "....x...xx",
                                              "......xx..",
                                              "..x....x.."]))

assertPlayable("71", ...boardFromDescription(["x....xxx.x",
                                              "..x.....x.",
                                              "x...xx....",
                                              "x...x....x",
                                              "x..xx..o..",
                                              "x.........",
                                              ".x...xx...",
                                              "x.x..x....",
                                              ".x...x....",
                                              "xx...x..xx"]))

assertPlayable("72", ...boardFromDescription(["x.xx...xx.",
                                              "x...x.x...",
                                              "x..x.x...x",
                                              ".x....x...",
                                              "...o......",
                                              "xx....xxx.",
                                              "...xx..x.x",
                                              "x.........",
                                              ".x....x...",
                                              "...xxx...x"]))

assertPlayable("73", ...boardFromDescription([".....x.x..",
                                              "x...x.x..x",
                                              "...x.....x",
                                              "..xx....x.",
                                              ".x.xxx..x.",
                                              ".x.x..x...",
                                              ".xx.x.x...",
                                              "..x.......",
                                              "......x..x",
                                              ".x.o...xxx"]))

assertPlayable("74", ...boardFromDescription(["..o......x",
                                              ".....x.x..",
                                              "..x..x....",
                                              "..xxxxxxx.",
                                              "...x..xx..",
                                              "xx...xxx..",
                                              ".....xx...",
                                              "xx....x...",
                                              "...xx.....",
                                              "...x..x.x."]))

assertPlayable("75", ...boardFromDescription([".xxx...x..",
                                              "...xx..x.x",
                                              "x...x.x..x",
                                              ".....x....",
                                              "x......x..",
                                              "..x..x..x.",
                                              "..xxxxxx..",
                                              "...x.xxx.o",
                                              "x.........",
                                              "x........."]))

assertPlayable("76", ...boardFromDescription(["x.....xxx.",
                                              ".x.x....x.",
                                              ".....xx...",
                                              "...x.xxx..",
                                              "..x.......",
                                              "...xx..x.x",
                                              "o...xx...x",
                                              ".....x...x",
                                              ".xx..x.xx.",
                                              "....x....x"]))

assertPlayable("77", ...boardFromDescription([".x.xx..x..",
                                              "....x.x...",
                                              "x.....x...",
                                              "x.....x..x",
                                              ".xxx......",
                                              "xx....x.x.",
                                              "xx....x..x",
                                              ".x...x.xx.",
                                              "...o.xxx..",
                                              ".x........"]))

assertPlayable("78", ...boardFromDescription(["...x.....x",
                                              "o.x..xx.x.",
                                              "..x..x....",
                                              "....x.x..x",
                                              "x.........",
                                              "......x...",
                                              ".x.x..x..x",
                                              ".x...xxx.x",
                                              "xx...x....",
                                              "x.x.x..x.x"]))

assertPlayable("79", ...boardFromDescription(["..x.x.xx..",
                                              "x....x...x",
                                              "..x.x.....",
                                              "x...x..x.x",
                                              "...xx.....",
                                              ".x.x......",
                                              ".x.xxx.o..",
                                              "....x.....",
                                              ".x.x......",
                                              "xx.x..x.xx"]))

assertPlayable("80", ...boardFromDescription(["x....xxxxx",
                                              "..xxxx....",
                                              ".x......x.",
                                              "......o..x",
                                              ".x.......x",
                                              "..x...x...",
                                              "x..xx.x...",
                                              "x.x....xx.",
                                              "..x.......",
                                              "x..x..x..x"]))

assertPlayable("81", ...boardFromDescription([".xx..xx..x",
                                              "....x...x.",
                                              "x..x......",
                                              "x.x.x..xx.",
                                              "........x.",
                                              "x..xxx....",
                                              "xx...x....",
                                              ".x......o.",
                                              "..x..x....",
                                              "x..xx...xx"]))

assertPlayable("82", ...boardFromDescription([".x..x.x...",
                                              ".......xx.",
                                              "..x...x.xx",
                                              "..x.....x.",
                                              "xxx.......",
                                              "xx.......o",
                                              "....x.x...",
                                              ".xxx..x...",
                                              "x...x..x.x",
                                              "x...x...xx"]))

assertPlayable("83", ...boardFromDescription(["xx..x.xxx.",
                                              ".x..x.....",
                                              ".xx...x...",
                                              "..x....x..",
                                              "...xx...xx",
                                              "x.x.......",
                                              "....xx.x..",
                                              "x.xxx..xxx",
                                              "..........",
                                              "...o.x...."]))

assertPlayable("84", ...boardFromDescription(["x.x.....xx",
                                              "x.....xxx.",
                                              "......x.x.",
                                              "xx...xx...",
                                              "x..x...x..",
                                              "..........",
                                              "x.xx...o..",
                                              "....xx....",
                                              ".x...xx.xx",
                                              "x.xx......"]))

assertPlayable("85", ...boardFromDescription(["x...x.....",
                                              "...xxx.x..",
                                              ".x...xx...",
                                              ".x...x..x.",
                                              ".........x",
                                              "x...o....x",
                                              "xx.....x.x",
                                              "x..x......",
                                              "x..xx..x..",
                                              ".xx..xx..x"]))

assertPlayable("86", ...boardFromDescription([".x.xx.x.x.",
                                              "....x.....",
                                              "x.o....x..",
                                              "x...x..xx.",
                                              "x...x....x",
                                              "xxx.x.....",
                                              ".x..xx....",
                                              "....xx.xxx",
                                              "....x.....",
                                              ".x.x......"]))

assertPlayable("87", ...boardFromDescription(["..x.o.xx.x",
                                              "x.x.......",
                                              "......xx.x",
                                              "..x.xx...x",
                                              "....x....x",
                                              ".x......x.",
                                              "....x.x..x",
                                              "....x...x.",
                                              "xx.x.....x",
                                              "....x.xx.x"]))

assertPlayable("88", ...boardFromDescription(["x.....xx..",
                                              "...xx.....",
                                              ".........x",
                                              ".x..x...x.",
                                              "x.x....x.x",
                                              ".x.xxx....",
                                              "x.........",
                                              "x..o....x.",
                                              ".....xx...",
                                              "xxxx.xxxx."]))

assertPlayable("89", ...boardFromDescription([".x...x.o..",
                                              ".....x....",
                                              "x.....x.x.",
                                              ".x.x.x....",
                                              ".xxx..xx..",
                                              "x.x..x..xx",
                                              "x...x.....",
                                              "..x..x....",
                                              ".x....x...",
                                              ".xxx..x.x."]))

assertPlayable("90", ...boardFromDescription([".x......xx",
                                              ".xx.x.....",
                                              "x...x.o...",
                                              "........x.",
                                              "x......xx.",
                                              ".......x..",
                                              ".xx..xx.xx",
                                              "..x..xx...",
                                              "..xx..xx..",
                                              ".x.x..xx.."]))

assertPlayable("91", ...boardFromDescription(["....x.x...",
                                              "xx.x.xx...",
                                              ".........x",
                                              "..xx.x....",
                                              "xx.....xx.",
                                              ".x...xxxxx",
                                              ".xxx......",
                                              ".x.x...x..",
                                              "....x.....",
                                              ".....xx.o."]))

assertPlayable("92", ...boardFromDescription(["x.........",
                                              "........xx",
                                              "x.x....x.x",
                                              "..xx.xxxxx",
                                              ".xxx....x.",
                                              "...x...x..",
                                              "x.x.......",
                                              "...x...x..",
                                              "...x.x....",
                                              "o..x.xx..x"]))

assertPlayable("93", ...boardFromDescription(["..x.x...x.",
                                              "..x......x",
                                              "xx..x.x.x.",
                                              "...xx...x.",
                                              "x...x.....",
                                              "x......xx.",
                                              "..xx.x....",
                                              "...xx....x",
                                              "..xx..o...",
                                              ".x.xx....x"]))

assertPlayable("94", ...boardFromDescription(["...x....xx",
                                              ".........x",
                                              "..x.xx..xx",
                                              "x...x....x",
                                              ".x.x.x...x",
                                              ".x......xx",
                                              "xx...x....",
                                              ".x...x....",
                                              "x..xx...x.",
                                              "x.....o.x."]))

assertPlayable("95", ...boardFromDescription(["..x.o....x",
                                              "x.x.......",
                                              ".x.x.xxx.x",
                                              "x.........",
                                              "....x...xx",
                                              "....xx....",
                                              ".....xx...",
                                              "x..xx.x.x.",
                                              ".xx....xx.",
                                              ".....xx..x"]))

assertPlayable("96", ...boardFromDescription([".xxx....xx",
                                              ".x.x.o...x",
                                              "........xx",
                                              "xx..x.....",
                                              ".x..xx....",
                                              ".xx.....x.",
                                              "x....x....",
                                              "x..xx..x..",
                                              ".x.....x..",
                                              "....x.xx.."]))

assertPlayable("97", ...boardFromDescription(["......xxxx",
                                              "....x.x..x",
                                              "..o.x.x.x.",
                                              "x.......x.",
                                              "..xx....x.",
                                              "....x.x...",
                                              ".xxxx.x...",
                                              "...x....x.",
                                              ".x...x.x..",
                                              "....x...xx"]))

assertPlayable("98", ...boardFromDescription([".x.......x",
                                              "x......o.x",
                                              ".x.x......",
                                              "....x.x...",
                                              "...x.....x",
                                              "xx.xxxxx.x",
                                              ".....x....",
                                              ".....x..xx",
                                              ".x.x..xx..",
                                              ".xx..xx..."]))

assertPlayable("99", ...boardFromDescription(["..x.x.xx..",
                                              "......xx..",
                                              ".o..x..xx.",
                                              "...x......",
                                              "x...xx..xx",
                                              "..x.xx.x..",
                                              "......xx..",
                                              "x.........",
                                              "x...x.x...",
                                              "xx.x..x.x."]))

assertPlayable("100", ...boardFromDescription(["xx........",
                                               "x......x..",
                                               ".x.xxx...x",
                                               ".x.....x.x",
                                               "x..x.xxx..",
                                               "....x..xxx",
                                               "o.........",
                                               ".....x....",
                                               ".xx...x.xx",
                                               ".x.....x.x"]))

assertPlayable("101", ...boardFromDescription(["...xx....x",
                                               "..x...x.x.",
                                               "x.........",
                                               "......xxx.",
                                               "xx.xx.x...",
                                               "....xxx...",
                                               "x...xxxxxx",
                                               "..xx......",
                                               ".....o...x",
                                               ".......xx."]))

assertPlayable("102", ...boardFromDescription(["..x.......",
                                               "..xx.x.xxx",
                                               "....x...x.",
                                               "..xx....x.",
                                               ".xx.......",
                                               ".x.x..x..x",
                                               ".....xx..x",
                                               "xx.....x..",
                                               "....x.x...",
                                               ".o.x..xxx."]))

assertPlayable("103", ...boardFromDescription(["....x..x..",
                                               "x.xx......",
                                               "..xx..x.x.",
                                               "..x..xx...",
                                               "xx.x......",
                                               "..x.xx.x.x",
                                               "x...xx...x",
                                               "..xx......",
                                               "........x.",
                                               ".o....xxx."]))

assertPlayable("104", ...boardFromDescription([".....x..x.",
                                               "x.x..x...x",
                                               "....x.x..x",
                                               "o...x..x..",
                                               "...x.....x",
                                               "xxx.....x.",
                                               ".x..x.....",
                                               "x..x...x..",
                                               "x..xx...xx",
                                               "xx.....x.."]))

assertPlayable("105", ...boardFromDescription(["x.....x.x.",
                                               "x..x..xx..",
                                               "x..x..x.x.",
                                               "x........x",
                                               "x........x",
                                               "xxx.x.x.x.",
                                               "x........x",
                                               "xx.xx.....",
                                               "....x.....",
                                               "...x.x.o.."]))
