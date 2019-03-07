default: all
.PHONY: default

all: hello_world.wasm to_upper.wasm anyref.wasm
.PHONY: all

hello_world.wasm: hello_world/hello_world.wat
	python make_wasm.py hello_world/hello_world.wat

to_upper.wasm: to_upper/to_upper.wat
	python make_wasm.py to_upper/to_upper.wat

anyref.wasm: anyref/anyref.wat
	python make_wasm.py anyref/anyref.wat
