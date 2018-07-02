import { AsmMod } from './asm.js';

class Logger {
    log(err, j, k) {
        if (err) {
            console.log("ERR " + i + "; j=" + j + "; k=" + k);
        } else {
            console.log("j=" + j + "; k=" + k);
        }
    }
};

var heap = new ArrayBuffer(0x10000);
var asm = AsmMod(global, {log: new Logger().log}, heap);

export { asm };
