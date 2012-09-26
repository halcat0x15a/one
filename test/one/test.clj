(ns one.test
  (:require [one.core :as core]
            [one.buffer :as buffer]
            [one.cursor :as cursor]
            [one.editor :as editor]
            [one.command :as command]
            [one.mode :as mode]
            [one.input :as input]
            [one.parser :as parser]
            [one.syntax :as syntax])
  (:use clojure.test))

(deftest core
  (testing "get line"
    (is (= (core/get-line (core/set-strings core/unit-editor ["hello" "world"]) 0)
           "hello"))
    (testing "with index out of bounds"
      (is (nil? (core/get-line (core/set-strings core/unit-editor ["hello" "world"]) 2)))))
  (testing "set line"
    (is (= (core/set-line (core/set-strings core/unit-editor ["hello" "world"]) 1 "miku")
           (core/set-strings core/unit-editor ["hello" "miku"]))))
  (testing "count line"
    (is (= (core/count-line (core/set-strings core/unit-editor ["hello" "world"]) 0)
           5))
    (testing "with index out of bounds"
      (is (nil? (core/count-line (core/set-strings core/unit-editor ["hello" "world"]) 2)))))
  (testing "calculate cursor position"
    (are [x y] (= x y)
         (core/cursor-position (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 3 0))))
         3
         (core/cursor-position (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 3 1))))
         9))
  (testing "parse command"
    (is (= (core/parse-command (assoc core/unit-editor :functions {:f :function}) "f a")
           (list :function "a")))))

(deftest buffer
  (testing "prepend newline"
    (is (= (buffer/prepend-newline (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello" "" "world"] (core/saved-cursor 0 1))))))
  (testing "append newline"
    (is (= (buffer/append-newline (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world" ""] (core/->Cursor 0 2 1))))))
  (testing "insert newline"
    (is (= (buffer/insert-newline (core/set-buffer core/unit-editor (core/->Buffer ["foo" "hello world" "bar"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["foo" "hello" " world" "bar"] (core/saved-cursor 0 2))))))
  (testing "insert"
    (is (= (buffer/insert (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 5 0))) "world")
           (core/set-buffer core/unit-editor (core/->Buffer ["helloworld"] (core/saved-cursor 10 0))))))
  (testing "delete"
    (is (= (buffer/delete (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 10 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello worl"] (core/saved-cursor 10 0)))))
    (testing "with end cursor of line"
      (is (= (buffer/delete (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0)))))))
  (testing "backspace"
    (is (= (buffer/backspace (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 1 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["ello world"] (core/saved-cursor 0 0)))))
    (testing "with start cursor of line"
      (is (= (buffer/backspace (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0)))))))
  (testing "delete line"
    (are [x y] (= x y)
         (buffer/delete-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
         (core/set-buffer core/unit-editor (core/->Buffer ["world"] (core/saved-cursor 0 0)))
         (buffer/delete-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 0 0))))
    (testing "with buffer has one line"
      (is (= (buffer/delete-line (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer [""] (core/saved-cursor 0 0)))))))
  (testing "delete forward"
    (is (= (buffer/delete-forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 3 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hel world"] (core/saved-cursor 3 0)))))
    (is (= (buffer/delete-forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 5 0))))))
  (testing "delete backward"
    (is (= (buffer/delete-backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 3 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["lo world"] (core/saved-cursor 0 0)))))
    (is (= (buffer/delete-backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 6 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["world"] (core/saved-cursor 0 0))))))
  (testing "delete from cursor"
    (is (= (buffer/delete-from (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 3 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hel"] (core/saved-cursor 3 0))))))
  (testing "delete to cursor"
    (is (= (buffer/delete-to (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 3 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["lo world"] (core/saved-cursor 0 0)))))))

(deftest cursor
  (testing "move left"
    (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1)))))
    (testing "with start cursor of line"
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))))
    (testing "with start cursor of buffer"
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0)))))))
  (testing "move right"
    (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1)))))
    (testing "with end cursor of line"
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))))
    (testing "with end cursor of buffer"
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1)))))))
  (testing "move up"
    (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 0)))))
    (testing "with top cursor of buffer"
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))))
    (testing "with lines has diffrent length"
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["hell" "world"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hell" "world"] (core/->Cursor 4 0 5)))))))
  (testing "move down"
    (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1)))))
    (testing "with bottom cursor of buffer"
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))))
    (testing "with lines has diffrent length"
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello" "word"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "word"] (core/->Cursor 4 1 5)))))))
  (testing "move start line"
    (are [x y] (= x y)
         (cursor/start-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0)))
         (cursor/start-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1)))))
  (testing "move end line"
    (are [x y] (= x y)
         (cursor/end-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0)))
         (cursor/end-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1)))))
  (testing "move next word"
    (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 1 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0)))))
    (testing "with cursor before white space"
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0)))))))
  (testing "move previous word"
    (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 1 0))))
           (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0)))))
    (testing "with cursor after white space"
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 6 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0)))))))
  (testing "move start buffer"
    (are [x y] (= x y)
         (cursor/start-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0)))
         (cursor/start-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0)))))
  (testing "move end buffer"
    (are [x y] (= x y)
         (cursor/end-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1)))
         (cursor/end-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
         (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))))

(deftest command
  (testing "history"
    (testing "previous command"
      (is (= (command/prev-command (assoc core/unit-editor
                                     :history (core/->History "hello" ["hello" "world"] 0)))
             (assoc core/unit-editor
               :history (core/->History "hello" ["hello" "world"] 1))))
      (testing "with end cursor of history"
        (is (nil? (command/prev-command (assoc core/unit-editor
                                     :history (core/->History  "hello" ["hello" "world"] 1)))))))
    (testing "next command"
      (is (= (command/next-command (assoc core/unit-editor
                                     :history (core/->History "hello" ["hello" "world"] 1)))
             (assoc core/unit-editor
               :history (core/->History "hello" ["hello" "world"] 0))))
      (testing "with start cursor of history"
        (is (nil? (command/next-command (assoc core/unit-editor
                                          :history (core/->History "hello" ["hello" "world"] 0)))))))
    (testing "set previous command"
      (is (= (command/set-prev-command (assoc core/unit-editor
                                         :history (core/->History "hello" ["hello" "world"] 0)))
             (assoc core/unit-editor
               :history (core/->History "world" ["hello" "world"] 1))))
      (testing "with end cursor of history"
        (is (= (command/set-prev-command (assoc core/unit-editor
                                           :history (core/->History "world" ["hello" "world"] 1)))
               (assoc core/unit-editor
                 :history (core/->History "world" ["hello" "world"] 1))))))
    (testing "set next command"
      (is (= (command/set-next-command (assoc core/unit-editor
                                         :history (core/->History "world" ["hello" "world"] 1)))
             (assoc core/unit-editor
               :history (core/->History "hello" ["hello" "world"] 0))))
      (testing "with start cursor of history"
        (is (= (command/set-next-command (assoc core/unit-editor
                                           :history (core/->History "hello" ["hello" "world"] 0)))
               (assoc core/unit-editor
                 :history (core/->History "hello" ["hello" "world"] 0))))))))

(deftest editor
  (testing "create buffer"
    (is (= (editor/create-buffer (assoc core/unit-editor
                                   :buffers {"hello" core/unit-buffer}
                                   :current "hello")
                                 "world")
           (assoc core/unit-editor
             :buffers {"hello" core/unit-buffer
                       "world" core/unit-buffer}
             :current "world")))
    (testing "with name exists on buffers"
      (is (= (editor/create-buffer (assoc core/unit-editor
                                     :buffers {"hello" core/unit-buffer}
                                     :current "hello")
                                   "hello")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer}
               :current "hello")))))
  (testing "change buffer"
    (is (= (editor/change-buffer (assoc core/unit-editor
                                   :buffers {"hello" core/unit-buffer
                                             "world" core/unit-buffer}
                                   :current "hello")
                                 "world")
           (assoc core/unit-editor
             :buffers {"hello" core/unit-buffer
                       "world" core/unit-buffer}
             :current "world")))
    (testing "with name not exists on buffers"
      (is (= (editor/change-buffer (assoc core/unit-editor
                                     :buffers {"hello" core/unit-buffer}
                                     :current "hello")
                                   "world")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer}
               :current "hello")))))
  (testing "create or change buffer"
    (are [x y] (= x y)
         (editor/buffer (assoc core/unit-editor
                          :buffers {"hello" core/unit-buffer}
                          :current "hello")
                        "world")
         (assoc core/unit-editor
           :buffers {"hello" core/unit-buffer
                     "world" core/unit-buffer}
           :current "world")
         (editor/buffer (assoc core/unit-editor
                          :buffers {"hello" core/unit-buffer
                                    "world" core/unit-buffer}
                          :current "hello")
                        "world")
         (assoc core/unit-editor
           :buffers {"hello" core/unit-buffer
                     "world" core/unit-buffer}
           :current "world")))
  (testing "rename buffer"
    (is (= (editor/rename-buffer (assoc core/unit-editor
                                   :buffers {"hello" core/unit-buffer}
                                   :current "hello")
                                 "world")
           (assoc core/unit-editor
             :buffers {"world" core/unit-buffer}
             :current "world")))))

(deftest input
  (testing "key"
    (testing "for general mode"
      (is (= (input/input-buffer (assoc core/unit-editor :mode mode/general-mode) :a)
             (buffer/insert (assoc core/unit-editor :mode mode/general-mode) "a"))))))

(deftest syntax
  (testing "parse clojure"
    (are [x y] (= x y)
         (parser/parse syntax/clojure "(def a 100)")
         [(parser/->Token nil "(")
          (parser/->Token nil "def")
          (parser/->Token nil " ")
          (parser/->Token nil "a")
          (parser/->Token nil " ")
          (parser/->Token :number "100")
          (parser/->Token nil ")")]
         (parser/parse syntax/clojure "\"a\" \"b\"")
         [(parser/->Token :string "\"a\"")
          (parser/->Token nil " ")
          (parser/->Token :string "\"b\"")]))
    (is (time (parser/parse syntax/clojure (slurp "test/one/test.clj")))))
