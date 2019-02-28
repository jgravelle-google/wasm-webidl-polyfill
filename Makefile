hello_world:
	/s/wbin/wat2wasm hello_world.wat -o hello_world.wasm_code
	python idl_custom_binary.py hello_world.wat hello_world.idl_section
	cat hello_world.wasm_code hello_world.idl_section > hello_world.wasm
