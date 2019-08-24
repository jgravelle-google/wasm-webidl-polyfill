;; Interface
(@interface export "alloc" (param i32) (result i32))
(@interface export "strlen" (param i32) (result i32))
(@interface export "writeNullByte" (param i32 i32) (result i32))
(@interface export "getMessage" (param i32) (result i32))
(@interface export "getScore" (param i32) (result i32))
(@interface export "makeComment" (param i32 i32) (result i32))
(@interface export "addComment" (param i32))

(@interface type $Comment record
  (field $message String)
  (field $score Int)
)

(@interface func $readCStr
  (param $ptr i32)
  (result String)
  (read-utf8
    (arg.get $ptr)
    (call-export "strlen"
      (arg.get $ptr)
    )
  )
)

(@interface func $display (import "js" "display")
  (param $Comment)
)
(@interface adapt (import "js" "display")
  (param $ptr i32)

  (call $display
    (make-record $Comment
      (call $readCStr
        (call-export "getMessage" (arg.get $ptr))
      )
      (call-export "getScore" (arg.get $ptr))
    )
  )
)

(@interface adapt (export "addComment")
  (param $comment $Comment)
  ;; Get message
  (write-utf8 "alloc"
    (get-field $Comment $message (arg.get $comment))
  )
  call-export "writeNullByte"

  (get-field $Comment $score (arg.get $comment))

  call-export "makeComment"
  call-export "addComment"
)

(@interface forward (export "displayAll"))
