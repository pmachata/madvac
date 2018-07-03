all:
	npx webpack --mode development

prod:
	npx webpack --mode production

test-%: all
	d8 dist/$*-tests.bundle.js

test: test-csp test-det test-set128-asm test-cons-asm test-csp-asm
