;; Interface
(@interface export "cLog" (param i32))
(@interface export "strlen" (param i32) (result i32))
(@interface export "write_null_byte" (param i32 i32) (result i32))

(@interface func $cLog (import "lib" "cLog")
  (param string)
)
(@interface adapt (import "lib" "cLog")
  (param $ptr i32) (param $len i32)
  arg.get $ptr
  arg.get $len
  read-utf8
  call $cLog
)

(@interface forward (export "main"))
