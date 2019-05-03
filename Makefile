FILES=\
anyref/anyref.wasm \
hello_world/hello_world.wasm \
sharing/lib.wasm sharing/main.wasm \
to_upper/to_upper.wasm \
webgl/webgl.wasm \

all: $(FILES)
.PHONY: all

clean:
	rm -f $(FILES)
.PHONY: clean

%.wasm: %.wat webIDL.js
	python make_wasm.py $^
