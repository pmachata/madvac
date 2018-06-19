all:
	npx webpack --mode development

prod:
	npx webpack --mode production

test-csp: all
	d8 dist/csp-tests.bundle.js

test-det: all
	d8 dist/det-tests.bundle.js

test-set128: all
	d8 dist/set128-tests.bundle.js

test: test-csp test-det test-set128
