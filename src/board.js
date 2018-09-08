import { Field } from './field.js';

class Board {
    coordToId(x, y) {
        if (this.width <= 10 && this.height <= 10) {
            // Divide to quadrants of 5x5 fields. Attach fields from each
            // quadrant to a different bset word. Thus the number of sets that
            // take more than one word in minimized.

            let hx = (x / 5)|0;
            let hy = (y / 5)|0;
            let q = hy * 2 + hx;

            let dx = x - 5 * hx;
            let dy = y - 5 * hy;
            let i = dy * 5 + dx;

            return q * 32 + i;
        } else {
            return y * this.width + x;
        }
    }

    constructor(w, h) {
        this.width = w;
        this.height = h;

        var fields = [];
        var allFields = [];
        var fieldIndex = [];
        for (var y = 0; y < h; ++y) {
            let row = [];
            for (var x = 0; x < w; ++x) {
                let id = this.coordToId(x, y);
                let field = new Field(this, x, y, id);
                row.push(field);
                allFields.push(field);
                fieldIndex[id] = field;
            }
            fields.push(row);
        }

        this.fields = fields;
        this._allFields = allFields;
        this._fieldIndex = fieldIndex;
        this.fieldObserver = null;
    }

    field(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            let id = this.coordToId(x, y);
            return this.fieldById(id);
        } else {
            return null;
        }
    }

    fieldById(id) {
        return this._fieldIndex[id] || null;
    }

    allFields() {
        return this._allFields;
    }

    callFieldBeforeUncover(field) {
        if (this.fieldObserver !== null) {
            return this.fieldObserver.fieldBeforeUncover(field);
        } else {
            return true;
        }
    }

    callFieldUncovered(field) {
        if (this.fieldObserver !== null) {
            this.fieldObserver.fieldUncovered(field);
        }
    }

    setFieldObserver(fieldObserver) {
        var old = this.fieldObserver;
        this.fieldObserver = fieldObserver;
        return old;
    }

    toString() {
        var ret = "";
        for (var row of this.fields) {
            for (var field of row) {
                if (field.covered) {
                    if (field.hasMine) {
                        ret += "x";
                    } else {
                        ret += ".";
                    }
                } else {
                    if (field.hasMine) {
                        ret += "X";
                    } else {
                        ret += "_";
                    }
                }
            }
            ret += "\n";
        }
        return ret;
    }
}

export { Board };
