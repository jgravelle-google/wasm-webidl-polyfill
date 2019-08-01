FILES=\
anyref/anyref.wasm \
callbacks/callbacks.wasm \
hello_world/hello_world.wasm \
sharing/lib.wasm sharing/main.wasm \
to_upper/to_upper.wasm \
webgl/webgl.wasm \

all: $(FILES)
.PHONY: all

clean:
	rm -f $(FILES)
.PHONY: clean

callbacks/callbacks_base.wat: callbacks/callbacks.cpp
	/s/wbin/clang++ callbacks/callbacks.cpp --target=wasm32 -o callbacks/callbacks_base.wasm \
		-nostdlib -Wl,--no-entry,--allow-undefined,--export-table -O1
	wasm2wat callbacks/callbacks_base.wasm -f -o callbacks/callbacks_base.wat

%.wasm: %.wat webIDL.js
	python make_wasm.py $^
