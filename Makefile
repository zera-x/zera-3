.PHONY: build clean test deps

BIN=dist/wonderscript.js
MAP=dist/wonderscript.map

build: $(BIN) test

$(BIN):
	java -jar vendor/closure-compiler/compiler.jar --js_output_file $(BIN) --create_source_map $(MAP) --js src/*.js

test:
	nodeunit

clean:
	rm -rf $(BIN)
	rm -rf $(MAP)

deps:
	./vendor/closure-library/closure/bin/build/depswriter.py --root_with_prefix="src ../../../../src" > vendor/closure-library/closure/goog/wonderscript_deps.js
