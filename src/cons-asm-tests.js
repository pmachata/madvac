import { assert } from 'chai';
import { asm } from './asmctx.js';

var c1 = 0x100;
asm.bs_init(c1);
asm.bs_add(c1, 0);
asm.bs_add(c1, 1);
asm.c_initSumOnly(c1, 10);

assert.strictEqual(asm.c_sum(c1), 10, "1: sum is 10");
assert.isOk(asm.bs_has(c1, 0), "1: has 0");
assert.isOk(asm.bs_has(c1, 1), "1: has 1");
assert.isNotOk(asm.bs_has(c1, 2), "1: hasn't 2");

asm.bs_init(c1);
asm.c_initSumOnly(c1, 20);

assert.strictEqual(asm.c_sum(c1), 20, "2: sum is 20");
assert.isNotOk(asm.bs_has(c1, 0), "2: hasn't 0");
assert.isNotOk(asm.bs_has(c1, 1), "2: hasn't 1");
assert.isNotOk(asm.bs_has(c1, 2), "2: hasn't 2");

asm.bs_add(c1, 0);
asm.bs_add(c1, 1);

assert.isOk(asm.bs_has(c1, 0), "3: has 0");
assert.isOk(asm.bs_has(c1, 1), "3: has 1");
assert.isNotOk(asm.bs_has(c1, 2), "3: hasn't 2");
