import { Field } from './field.js';

class Board {
    constructor(w, h) {
        var fields = [];
        var i = 0;
        for (var y = 0; y < h; ++y) {
            var row = [];
            for (var x = 0; x < w; ++x) {
                row.push(new Field(this, x, y, i++));
            }
            fields.push(row);
        }

        this.width = w;
        this.height = h;
        this.fields = fields;
        this.fieldObserver = null;
    }

    field(x, y) {
        if (y >= 0 && y < this.fields.length) {
            var row = this.fields[y];
            if (x >= 0 && x < row.length) {
                return row[x];
            }
        }
        return null;
    }

    fieldById(id) {
        // xxx this is just horrible
        for (var row of this.fields) {
            for (var field of row) {
                if (field.id === id) {
                    return field;
                }
            }
        }
        return null;
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
}

export { Board };
