;; Interface
(@interface export "strlen" (param i32) (result i32))

(@interface func $getElem (import "document" "getElementById")
  (param String) (result Any)
)
(@interface func $getContext (import "host" "getContext")
  (param Any String) (result Any)
)
(@interface func $fillRect (import "host" "fillRect")
  (param Any Float Float Float Float)
)
(@interface func $setFillStyle (import "host" "setFillStyle")
  (param Any String)
)

(@interface adapt (import "document" "getElementById")
  (param $str i32) (result i32)
  arg.get $str
  arg.get $str
  call-export "strlen"
  read-utf8
  call-import $getElem
  table-ref-add
)
(@interface adapt (import "host" "getContext")
  (param $elem i32) (param $str i32) (result i32)
  arg.get $elem
  table-ref-get
  arg.get $str
  arg.get $str
  call-export "strlen"
  read-utf8
  call-method $getContext
  table-ref-add
)
(@interface adapt (import "host" "fillRect")
  (param $ctx i32) (param $x f32) (param $y f32) (param $w f32) (param $h f32)
  arg.get $ctx
  table-ref-get
  arg.get $x
  as-interface Float
  arg.get $y
  as-interface Float
  arg.get $w
  as-interface Float
  arg.get $h
  as-interface Float
  call-method $fillRect
)
(@interface adapt (import "host" "setFillStyle")
  (param $ctx i32) (param $str i32)
  arg.get $ctx
  table-ref-get
  arg.get $str
  arg.get $str
  call-export "strlen"
  read-utf8
  call-import $setFillStyle
)

(@interface forward (export "main"))
