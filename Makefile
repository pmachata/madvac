all:
	npx webpack --mode development

prod:
	npx webpack --mode production

test: all
	d8 dist/csp-tests.bundle.js
