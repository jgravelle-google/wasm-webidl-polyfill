;; Interface
(@interface export "init" (param i32))
(@interface export "cLog" (param i32))
(@interface export "strlen" (param i32) (result i32))
(@interface export "write_null_byte" (param i32 i32) (result i32))

(@interface func $log (import "host" "log")
  (param Any String)
)
(@interface adapt (import "host" "log")
  (param $logger i32) (param $str i32)
  arg.get $logger
  table-ref-get
  arg.get $str
  arg.get $str
  call-export "strlen"
  read-utf8
  call $log
)

(@interface adapt (export "cLog")
  (param $str String)
  arg.get $str
  write-utf8 "constaddr_1024"
  call-export "write_null_byte"
  call-export "cLog"
)

(@interface adapt (export "init")
  (param $console Any)
  arg.get $console
  table-ref-add
  call-export "init"
)
