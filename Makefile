CXX=/s/wbin/clang++
COMPILE=$(CXX) --target=wasm32 -nostdlib -O1 \
	-Wl,--no-entry,--allow-undefined,--export-table
FILES=\
callbacks/callbacks.wasm \
hello_world/hello_world.wasm \
sequence/array.wasm sequence/list.wasm \
sharing/lib.wasm sharing/main.wasm \
record/record.wasm \
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
