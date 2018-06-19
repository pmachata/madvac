class BitSet128 {
    constructor(copy) {
        this.clear();
        if (copy) {
            this.addAll(copy);
        }
    }

    clear() {
        this._values = new Uint32Array([0, 0, 0, 0]);
    }

    diff(other) {
	var ret = new BitSet128();
	if (this === other)
	    return ret;

        for (var i = 0; i < this._values.length; ++i) {
            ret._values[i] = this._values[i] & ~other._values[i];
        }
	return ret;
    }

    countBits(v) {
	// http://www-graphics.stanford.edu/~seander/bithacks.html#CountBitsSetKernighan
	var c = 0;
	for (c = 0; v != 0; c++)
	    v &= v - 1;
	return c;
    }

    size() {
        // xxx make it not a function
        var ret = 0;
        for (var v of this._values) {
            ret += this.countBits(v);
        }
        return ret;
    }

    select(key) {
        var i = Math.floor(key / 32);
        if (i < 0 || i >= this._values.length)
            throw "Key out of bounds";
        key -= i * 32;
        return [i, key];
    }

    containsKey(key) {
	var [i, k] = this.select(key);
	return ((1 << k) & this._values[i]) != 0;
    }

    add(key) {
	var [i, k] = this.select(key);
        this._values[i] |= 1 << k;
    }

    remove(key) {
	var [i, k] = this.select(key);
        var orig = this._values[i];
        this._values[i] &= ~(1 << k);
        return this._values[i] != orig;
    }

    *[Symbol.iterator]() {
        for (let i = 0; i < 128; ++i) {
            if (this.containsKey(i)) {
                yield i;
            }
        }
    }

    containsAll(other) {
	return other.diff(this).size() == 0;
    }

    containsAny(other) {
        for (var i = 0; i < this._values.length; ++i) {
            if ((this._values[i] & other._values[i]) != 0) {
                return true;
            }
        }
        return false;
    }

    addAll(other) {
        for (var i = 0; i < this._values.length; ++i) {
            this._values[i] |= other._values[i];
        }
    }

    removeAll(other) {
        for (var i = 0; i < this._values.length; ++i) {
            this._values[i] &= ~other._values[i];
        }
    }

    retainAll(other) {
        for (var i = 0; i < this._values.length; ++i) {
            this._values[i] &= other._values[i];
        }
    }

    equals(other) {
        for (var i = 0; i < this._values.length; ++i) {
            if (this._values[i] != other._values[i]) {
                return false;
            }
        }
        return true;
    }
}

export { BitSet128 };
