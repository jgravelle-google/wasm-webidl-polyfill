;; Interface
(@interface export "cLog" (param i32))
(@interface export "strlen" (param i32) (result i32))
(@interface export "write_null_byte" (param i32 i32) (result i32))

(@interface func $getConsole (import "host" "getConsole")
  (result any)
)
(@interface adapt (import "host" "getConsole")
  (result anyref)
  call $getConsole
  as-wasm anyref
)

(@interface func $log (import "host" "log")
  (param any string)
)
(@interface adapt (import "host" "log")
  (param $logger anyref) (param $str i32)
  arg.get $logger
  as-interface any
  arg.get $str
  arg.get $str
  call-export "strlen"
  read-utf8
  call $log
)

(@interface adapt (export "cLog")
  (param $str string)
  arg.get $str
  write-utf8 "constaddr_1024"
  call-export "write_null_byte"
  call-export "cLog"
)
