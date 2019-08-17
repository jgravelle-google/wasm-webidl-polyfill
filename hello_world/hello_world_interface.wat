;; Interface
(@interface export "strlen" (param i32) (result i32))
(@interface export "write_null_byte" (param i32 i32) (result i32))

(@interface func $log (import "host" "console_log")
  (param string)
)
(@interface adapt (import "host" "console_log")
  (param $ptr i32)
  arg.get $ptr
  arg.get $ptr
  call-export "strlen"
  read-utf8
  call $log
)

(@interface func $title (import "host" "document_title")
  (result string)
)
(@interface adapt (import "host" "document_title")
  (result i32)
  call $title
  write-utf8 "alloc"
  call-export "write_null_byte"
)
