;; Interface
(@interface export "_Z5alloci" (param i32) (result i32))
(@interface export "_Z6strlenPKc" (param i32) (result i32))
(@interface export "_Z7average5ArrayIiE" (param i32) (result i32))
(@interface export "_Z8reversed5ArrayIiE" (param i32 i32))
(@interface export "_ZN5ArrayIiEC2Ev" (param i32) (result i32))
(@interface export "_ZN5ArrayIiE3addEi" (param i32 i32))
(@interface export "_ZN5ArrayIiE6lengthEv" (param i32) (result i32))

;; Printf debugging!
(@interface func $logStr (import "js" "log")
  (param String)
)
(@interface adapt (import "js" "logStr")
  (param $ptr i32)
  arg.get $ptr
  arg.get $ptr
  call-export "_Z6strlenPKc"
  read-utf8
  call $logStr
)

(@interface func $addToArray
  (param $ptr i32) (param $item Int)
  (result i32)
  arg.get $ptr
  arg.get $item
  as-wasm i32
  call-export "_ZN5ArrayIiE3addEi"
  arg.get $ptr
)

(@interface adapt (export "average")
  (param $items (Seq Int))
  (result Int)
  arg.get $items
  const i32 16 ;; >= sizeof(Array<int>)
  call-export "_Z5alloci"
  call-export "_ZN5ArrayIiEC2Ev"
  fold-seq $addToArray ;; [(Seq Int), i32] -> [i32]
  call-export "_Z7average5ArrayIiE"
  as-interface Int
)
(@interface func $reversed
  (param $input i32)
  (param $result i32)
  (result (Seq Int))

  arg.get $result
  arg.get $input
  call-export "_Z8reversed5ArrayIiE"

  ;; ptr
  arg.get $result
  load i32 "memory" ;; Array::buffer is an int* located at ptr[0]

  ;; len
  arg.get $result
  call-export "_ZN5ArrayIiE6lengthEv"

  mem-to-seq i32 "memory"
)
(@interface adapt (export "reversed")
  (param $items (Seq Int))
  (result (Seq Int))

  ;; input = Array(items)
  arg.get $items
  const i32 16
  call-export "_Z5alloci"
  call-export "_ZN5ArrayIiEC2Ev"
  fold-seq $addToArray

  ;; result = Array()
  const i32 16
  call-export "_Z5alloci"
  ;; call-export "_ZN5ArrayIiEC2Ev"

  ;; reversed(&input, &result)
  call $reversed
)
