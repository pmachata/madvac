import { Cons, CSP } from './csp.js';

var csp = new CSP();
csp.pushCons(new Cons([1, 3, 5], 3));
console.log(csp.toString());
csp.simplify();
console.log("---");
console.log(csp.toString());


/*
import { Field } from './field.js';

class GameStub {
    constructor(script) {
        this.fields = [];
        var i = 0;
        for (var y = 0; y < script.length(); ++y) {
            var row = [];
            for (var x = 0; x < script[y].length; ++x) {
                var c = script[y][x];
                var f = new Field(this, x, y, i++);
                if (c == "X") {
                    f.hasMine = true;
                } else {
                    console.assert(c == " ");
                }
                row.push(f);
            }
            this.fields.push(row);
        }
    }
};
*/
