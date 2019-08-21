;; Interface
(@interface export "alloc" (param i32) (result i32))
(@interface export "strlen" (param i32) (result i32))
(@interface export "writeNullByte" (param i32 i32) (result i32))
(@interface export "getMessage" (param i32) (result i32))
(@interface export "getScore" (param i32) (result i32))
(@interface export "makeComment" (param i32 i32) (result i32))
(@interface export "addComment" (param i32))

(@interface type Comment struct
  (field "message" String)
  (field "score" Int)
)

(@interface func $readCStr
  (param $ptr i32)
  (result String)
  arg.get $ptr
  arg.get $ptr
  call-export "strlen"
  read-utf8
)

(@interface func $display (import "js" "display")
  (param Comment)
)
(@interface adapt (import "js" "display")
  (param $ptr i32)
  make-struct Comment

  ;; Set message
  arg.get $ptr
  call-export "getMessage"
  call $readCStr
  set-field "message"

  ;; Set score
  arg.get $ptr
  call-export "getScore"
  set-field "score"

  call $display
)

(@interface adapt (export "addComment")
  (param $comment Comment)
  ;; Get message
  arg.get $comment
  get-field "message"
  write-utf8 "alloc"
  call-export "writeNullByte"

  ;; Get score
  arg.get $comment
  get-field "score"

  call-export "makeComment"
  call-export "addComment"
)

(@interface forward (export "displayAll"))
