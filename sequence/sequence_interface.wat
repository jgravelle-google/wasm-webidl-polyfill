;; Interface

(@interface type Comment struct
  (field "message" String)
  (field "score" Int)
)

(@interface func $display (import "js" "display")
  (param Comment)
)

(@interface adapt (export "addComment")
  (param $comment Comment)
  ;; todo
)

(@interface forward (export "init"))
(@interface forward (export "displayAll"))
