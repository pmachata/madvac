import { Field } from './field.js';

class Board {
    constructor(w, h) {
        var fields = [];
        var allFields = [];
        var i = 0;
        for (var y = 0; y < h; ++y) {
            var row = [];
            for (var x = 0; x < w; ++x) {
                var field = new Field(this, x, y, i++);
                row.push(field);
                allFields.push(field);
            }
            fields.push(row);
        }

        this.width = w;
        this.height = h;
        this.fields = fields;
        this._allFields = allFields;
        this.fieldObserver = null;
    }

    field(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            var id = y * this.width + x;
            return this.fieldById(id);
        } else {
            return null;
        }
    }

    fieldById(id) {
        if (id >= 0 && id < this._allFields.length) {
            return this._allFields[id];
        } else {
            return null;
        }
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
