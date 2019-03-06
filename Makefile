default: all
.PHONY: default

all: hello_world.wasm to_upper.wasm anyref.wasm
.PHONY: all

hello_world.wasm: hello_world.wat
	/s/wbin/wat2wasm hello_world.wat -o hello_world.wasm_code
	python idl_custom_binary.py hello_world.wat hello_world.idl_section
	cat hello_world.wasm_code hello_world.idl_section > hello_world.wasm

to_upper.wasm: to_upper.wat
	/s/wbin/wat2wasm to_upper.wat -o to_upper.wasm_code
	python idl_custom_binary.py to_upper.wat to_upper.idl_section
	cat to_upper.wasm_code to_upper.idl_section > to_upper.wasm

anyref.wasm: anyref.wat
	/s/wbin/wat2wasm --enable-reference-types anyref.wat -o anyref.wasm_code
	python idl_custom_binary.py anyref.wat anyref.idl_section
	cat anyref.wasm_code anyref.idl_section > anyref.wasm
