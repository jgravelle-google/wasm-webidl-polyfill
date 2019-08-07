;; WebIDL
(@webidl type $int int)
(@webidl type $string DOMString)
(@webidl func-binding
  import "env" "console_log"
  static
  (param
    (utf8-cstr (type $string) (off-idx 0))
    (as (webidl-type $int) (idx 1))
  )
)
