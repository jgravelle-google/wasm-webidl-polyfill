;; Interface
(@interface export "_Z5alloci" (param i32) (result i32))
(@interface export "_Z6strlenPKc" (param i32) (result i32))
(@interface export "_Z7average4ListIiE" (param i32) (result i32))
(@interface export "_Z8reversed4ListIiE" (param i32 i32))
(@interface export "_ZN4ListIiEC2Ev" (param i32) (result i32))
(@interface export "_ZN4ListIiE3addEi" (param i32 i32))
;; (@interface export "_ZN5ArrayIiE6lengthEv" (param i32) (result i32))

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

(@interface func $addToList
  (param $ptr i32) (param $item Int)
  (result i32)
  arg.get $ptr
  arg.get $item
  as-wasm i32
  call-export "_ZN4ListIiE3addEi"
  arg.get $ptr
)

(@interface adapt (export "average")
  (param $items (Seq Int))
  (result Int)
  arg.get $items
  const i32 16 ;; >= sizeof(List<int>)
  call-export "_Z5alloci"
  call-export "_ZN4ListIiEC2Ev"
  fold-seq $addToList ;; [(Seq Int), i32] -> [i32]
  call-export "_Z7average4ListIiE"
  as-interface Int
)

(@interface func $isNull
  (param $ptr i32)
  (result i32)
  arg.get $ptr
)
(@interface func $addListNext
  (param $acc (Seq Int)) (param $ptr i32)
  (result (Seq Int) i32)
  arg.get $acc
  arg.get $ptr
  load i32 "memory"
  as-interface Int
  list.push ;; [(Seq Int), Int] -> [(Seq Int)]

  arg.get $ptr
  const i32 4
  add i32
  load i32 "memory"
)

(@interface func $reversed
  (param $input i32)
  (param $result i32)
  (result (Seq Int))

  arg.get $result
  arg.get $input
  call-export "_Z8reversed4ListIiE"

  seq.new Int ;; [] -> [(Seq Int)]
  arg.get $result
  load i32 "memory" ;; List -> Node
  repeat-while $isNull $addListNext ;; [(Seq Int), i32] -> [(Seq Int)]
)
(@interface adapt (export "reversed")
  (param $items (Seq Int))
  (result (Seq Int))

  ;; input = List(items)
  arg.get $items
  const i32 16
  call-export "_Z5alloci"
  call-export "_ZN4ListIiEC2Ev"
  fold-seq $addToList

  ;; result = List()
  const i32 16
  call-export "_Z5alloci"
  ;; List() constructor called by C++ code

  ;; reversed(&input, &result)
  call $reversed
)
