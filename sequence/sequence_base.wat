(module
  (type (;0;) (func (param i32)))
  (type (;1;) (func (param i32) (result i32)))
  (type (;2;) (func))
  (type (;3;) (func (param i32 i32)))
  (import "js" "display" (func $display_Comment_ (type 0)))
  (func $getMessage (type 1) (param i32) (result i32)
    (i32.load
      (local.get 0)))
  (func $getScore (type 1) (param i32) (result i32)
    (i32.load offset=4
      (local.get 0)))
  (func $sortComments__ (type 2)
    (local i32 i32 i32 i32 i32 i32 i32)
    (block  ;; label = @1
      (br_if 0 (;@1;)
        (i32.lt_s
          (local.tee 0
            (i32.load offset=1152
              (i32.const 0)))
          (i32.const 2)))
      (local.set 1
        (i32.const 1036))
      (local.set 2
        (i32.const 0))
      (loop  ;; label = @2
        (local.set 3
          (local.get 1))
        (local.set 5
          (local.tee 2
            (i32.add
              (local.tee 4
                (local.get 2))
              (i32.const 1))))
        (local.set 6
          (local.get 4))
        (block  ;; label = @3
          (br_if 0 (;@3;)
            (i32.ge_s
              (local.get 2)
              (local.get 0)))
          (loop  ;; label = @4
            (local.set 6
              (select
                (local.get 5)
                (local.get 6)
                (i32.lt_s
                  (i32.load
                    (i32.add
                      (i32.shl
                        (local.get 6)
                        (i32.const 3))
                      (i32.const 1028)))
                  (i32.load
                    (local.get 3)))))
            (local.set 3
              (i32.add
                (local.get 3)
                (i32.const 8)))
            (br_if 0 (;@4;)
              (i32.ne
                (local.get 0)
                (local.tee 5
                  (i32.add
                    (local.get 5)
                    (i32.const 1))))))
          (br_if 0 (;@4;)
            (i32.eq
              (local.get 6)
              (local.get 4)))
          (call $void_swap<Comment>_Comment&__Comment&_
            (i32.add
              (i32.shl
                (local.get 6)
                (i32.const 3))
              (i32.const 1024))
            (i32.add
              (i32.shl
                (local.get 4)
                (i32.const 3))
              (i32.const 1024))))
        (local.set 1
          (i32.add
            (local.get 1)
            (i32.const 8)))
        (br_if 0 (;@4;)
          (i32.lt_s
            (local.get 2)
            (i32.add
              (local.tee 0
                (i32.load offset=1152
                  (i32.const 0)))
              (i32.const -1)))))))
  (func $void_swap<Comment>_Comment&__Comment&_ (type 3) (param i32 i32)
    (local i64)
    (local.set 2
      (i64.load align=4
        (local.get 0)))
    (i64.store align=4
      (local.get 0)
      (i64.load align=4
        (local.get 1)))
    (i64.store align=4
      (local.get 1)
      (local.get 2)))
  (func $alloc (type 1) (param i32) (result i32)
    (local i32)
    (i32.store offset=1156
      (i32.const 0)
      (i32.add
        (i32.add
          (local.get 0)
          (local.tee 1
            (i32.load offset=1156
              (i32.const 0))))
        (i32.const 1)))
    (local.get 1))
  (func $strlen (type 1) (param i32) (result i32)
    (local i32 i32 i32)
    (block  ;; label = @1
      (br_if 0 (;@1;)
        (i32.load8_u
          (local.get 0)))
      (return
        (i32.const 0)))
    (local.set 1
      (i32.add
        (local.get 0)
        (i32.const 1)))
    (local.set 0
      (i32.const 0))
    (loop  ;; label = @2
      (local.set 2
        (i32.add
          (local.get 1)
          (local.get 0)))
      (local.set 0
        (local.tee 3
          (i32.add
            (local.get 0)
            (i32.const 1))))
      (br_if 0 (;@2;)
        (i32.load8_u
          (local.get 2))))
    (local.get 3))
  (func $addComment (type 0) (param i32)
    (local i32)
    (i32.store offset=1152
      (i32.const 0)
      (i32.add
        (local.tee 1
          (i32.load offset=1152
            (i32.const 0)))
        (i32.const 1)))
    (i64.store
      (i32.add
        (i32.shl
          (local.get 1)
          (i32.const 3))
        (i32.const 1024))
      (i64.load align=4
        (local.get 0))))
  (func $displayAll (type 2)
    (local i32 i32 i32 i64)
    (global.set 0
      (local.tee 0
        (i32.sub
          (global.get 0)
          (i32.const 16))))
    (call $sortComments__)
    (block  ;; label = @1
      (br_if 0 (;@1;)
        (i32.lt_s
          (i32.load offset=1152
            (i32.const 0))
          (i32.const 1)))
      (local.set 1
        (i32.const 1024))
      (local.set 2
        (i32.const 0))
      (loop  ;; label = @2
        (i64.store
          (local.get 0)
          (local.tee 3
            (i64.load
              (local.get 1))))
        (i64.store offset=8
          (local.get 0)
          (local.get 3))
        (local.set 1
          (i32.add
            (local.get 1)
            (i32.const 8)))
        (call $display_Comment_
          (local.get 0))
        (br_if 0 (;@2;)
          (i32.lt_s
            (local.tee 2
              (i32.add
                (local.get 2)
                (i32.const 1)))
            (i32.load offset=1152
              (i32.const 0))))))
    (global.set 0
      (i32.add
        (local.get 0)
        (i32.const 16))))
  (table (;0;) 1 1 funcref)
  (memory (;0;) 2)
  (global (;0;) (mut i32) (i32.const 66704))
  (export "memory" (memory 0))
  (export "__indirect_function_table" (table 0))
  (export "getMessage" (func $getMessage))
  (export "getScore" (func $getScore))
  (export "alloc" (func $alloc))
  (export "strlen" (func $strlen))
  (export "addComment" (func $addComment))
  (export "displayAll" (func $displayAll))
  (data (;0;) (i32.const 1024) "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00")
  (data (;1;) (i32.const 1156) "\00\08\00\00"))
