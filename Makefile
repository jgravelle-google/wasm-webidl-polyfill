FILES=\
hello_world/hello_world.wasm \
to_upper/to_upper.wasm \
anyref/anyref.wasm \
sharing/lib.wasm \
sharing/main.wasm \

all: $(FILES)
.PHONY: all

%.wasm: %.wat webIDL.js
	python make_wasm.py $^
