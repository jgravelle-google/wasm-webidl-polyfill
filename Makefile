CXX=/s/wbin/clang++
COMPILE=$(CXX) --target=wasm32 -nostdlib -O1 \
	-Wl,--no-entry,--allow-undefined,--export-table
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

%_base.wat: %.cpp
	$(COMPILE) $^ -o $^.wasm
	wasm2wat $^.wasm -f -o $@

%.wat: %_base.wat %_interface.wat
	cat $^ > $@

%.wasm: %.wat webIDL.js make_wasm.py idl_custom_binary.py
	python make_wasm.py $<
