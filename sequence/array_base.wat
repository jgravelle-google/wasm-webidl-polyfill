(module
  (type (;0;) (func (param i32) (result i32)))
  (type (;1;) (func (param i32 i32) (result i32)))
  (type (;2;) (func (param i32 i32)))
  (func $alloc_int_ (type 0) (param i32) (result i32)
    (local i32)
    (i32.store offset=1024
      (i32.const 0)
      (i32.add
        (local.tee 1
          (i32.load offset=1024
            (i32.const 0)))
        (local.get 0)))
    (local.get 1))
  (func $average_Array<int>_ (type 0) (param i32) (result i32)
    (local i32 i32)
    (block  ;; label = @1
      (block  ;; label = @2
        (br_if 0 (;@2;)
          (i32.ge_s
            (call $Array<int>::length__
              (local.get 0))
            (i32.const 1)))
        (local.set 1
          (i32.const 0))
        (br 1 (;@1;)))
      (local.set 2
        (i32.const 0))
      (local.set 1
        (i32.const 0))
      (loop  ;; label = @3
        (local.set 1
          (i32.add
            (i32.load
              (call $Array<int>::operator___int_
                (local.get 0)
                (local.get 2)))
            (local.get 1)))
        (br_if 0 (;@3;)
          (i32.lt_s
            (local.tee 2
              (i32.add
                (local.get 2)
                (i32.const 1)))
            (call $Array<int>::length__
              (local.get 0))))))
    (i32.div_s
      (local.get 1)
      (call $Array<int>::length__
        (local.get 0))))
  (func $Array<int>::length__ (type 0) (param i32) (result i32)
    (i32.load offset=8
      (local.get 0)))
  (func $Array<int>::operator___int_ (type 1) (param i32 i32) (result i32)
    (i32.add
      (i32.load
        (local.get 0))
      (i32.shl
        (local.get 1)
        (i32.const 2))))
  (func $reversed_Array<int>_ (type 2) (param i32 i32)
    (local i32 i32)
    (local.set 2
      (call $Array<int>::Array__
        (local.get 0)))
    (block  ;; label = @1
      (br_if 0 (;@1;)
        (i32.lt_s
          (call $Array<int>::length__
            (local.get 1))
          (i32.const 1)))
      (local.set 3
        (i32.const 0))
      (local.set 0
        (i32.const -1))
      (loop  ;; label = @2
        (call $Array<int>::add_int_
          (local.get 2)
          (i32.load
            (call $Array<int>::operator___int_
              (local.get 1)
              (i32.add
                (call $Array<int>::length__
                  (local.get 1))
                (local.get 0)))))
        (local.set 0
          (i32.add
            (local.get 0)
            (i32.const -1)))
        (br_if 0 (;@2;)
          (i32.lt_s
            (local.tee 3
              (i32.add
                (local.get 3)
                (i32.const 1)))
            (call $Array<int>::length__
              (local.get 1)))))))
  (func $Array<int>::Array__ (type 0) (param i32) (result i32)
    (local i32)
    (i32.store offset=4
      (local.get 0)
      (i32.const 16))
    (local.set 1
      (call $alloc_int_
        (i32.const 64)))
    (i32.store offset=8
      (local.get 0)
      (i32.const 0))
    (i32.store
      (local.get 0)
      (local.get 1))
    (local.get 0))
  (func $Array<int>::add_int_ (type 2) (param i32 i32)
    (local i32 i32 i32 i32)
    (block  ;; label = @1
      (br_if 0 (;@1;)
        (i32.ne
          (i32.load offset=8
            (local.get 0))
          (local.tee 2
            (i32.load offset=4
              (local.get 0)))))
      (i32.store offset=4
        (local.get 0)
        (i32.shl
          (local.get 2)
          (i32.const 1)))
      (local.set 3
        (call $alloc_int_
          (i32.shl
            (local.get 2)
            (i32.const 3))))
      (block  ;; label = @2
        (br_if 0 (;@2;)
          (i32.lt_s
            (i32.load offset=8
              (local.get 0))
            (i32.const 1)))
        (local.set 2
          (i32.load
            (local.get 0)))
        (local.set 4
          (i32.const 0))
        (local.set 5
          (local.get 3))
        (loop  ;; label = @3
          (i32.store
            (local.get 5)
            (i32.load
              (local.get 2)))
          (local.set 2
            (i32.add
              (local.get 2)
              (i32.const 4)))
          (local.set 5
            (i32.add
              (local.get 5)
              (i32.const 4)))
          (br_if 0 (;@3;)
            (i32.lt_s
              (local.tee 4
                (i32.add
                  (local.get 4)
                  (i32.const 1)))
              (i32.load offset=8
                (local.get 0))))))
      (i32.store
        (local.get 0)
        (local.get 3)))
    (i32.store
      (i32.add
        (i32.load
          (local.get 0))
        (i32.shl
          (i32.load offset=8
            (local.get 0))
          (i32.const 2)))
      (local.get 1))
    (i32.store offset=8
      (local.get 0)
      (i32.add
        (i32.load offset=8
          (local.get 0))
        (i32.const 1))))
  (table (;0;) 1 1 funcref)
  (memory (;0;) 2)
  (global (;0;) (mut i32) (i32.const 66576))
  (export "memory" (memory 0))
  (export "__indirect_function_table" (table 0))
  (export "_Z7average5ArrayIiE" (func $average_Array<int>_))
  (export "_Z8reversed5ArrayIiE" (func $reversed_Array<int>_))
  (export "_ZN5ArrayIiEC2Ev" (func $Array<int>::Array__))
  (export "_ZN5ArrayIiE3addEi" (func $Array<int>::add_int_))
  (data (;0;) (i32.const 1024) "\00\10\00\00"))
