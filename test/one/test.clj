(ns one.test
  (:require [one.core :as core]
            [one.buffer :as buffer]
            [one.cursor :as cursor]
            [one.editor :as editor]
            [one.command :as command]
            [one.parser :as parser]
            [one.syntax :as syntax])
  (:use clojure.test))

(deftest core
  (testing "Core Functions"
    (testing "get line"
      (is (= (core/get-line (core/set-strings core/unit-editor ["hello" "world"]) 0)
             "hello"))
      (testing "index out of bounds"
        (is (= (core/get-line (core/set-strings core/unit-editor ["hello" "world"]) 2)
               nil))))
    (testing "set line"
      (is (= (core/set-line (core/set-strings core/unit-editor ["hello" "world"]) 1 "miku")
             (core/set-strings core/unit-editor ["hello" "miku"]))))
    (testing "count line"
      (is (= (core/count-line (core/set-strings core/unit-editor ["hello" "world"]) 0)
             5))
      (testing "index out of bounds"
        (is (= (core/count-line (core/set-strings core/unit-editor ["hello" "world"]) 2)
               nil))))
    (testing "calculate cursor position"
      (is (= (core/cursor-position (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 3 0))))
             3)
          (= (core/cursor-position (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 3 1))))
             9)))
    (testing "parse command"
      (is (= (core/parse-command (assoc core/unit-editor
                                   :functions {:f "function"}) "f a")
             (list "function" "a"))))))

(deftest buffer
  (testing "Buffer Functions"
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
      (is (= (buffer/delete (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0))))))
    (testing "backspace"
      (is (= (buffer/backspace (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["ello world"] (core/saved-cursor 0 0)))))
      (is (= (buffer/backspace (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0))))))
    (testing "delete line"
      (is (= (buffer/delete-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["world"] (core/saved-cursor 0 0)))))
      (is (= (buffer/delete-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 0 0)))))
      (is (= (buffer/delete-line (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer [""] (core/saved-cursor 0 0))))))
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
             (core/set-buffer core/unit-editor (core/->Buffer ["lo world"] (core/saved-cursor 0 0))))))))

(deftest cursor
  (testing "Cursor Functions"
    (testing "move left"
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1)))))
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0)))))
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))))
    (testing "move right"
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 1 1)))))
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1)))))
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))))
    (testing "move up"
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 1 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 1 0)))))
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 0 0)))))
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["miku" "hello"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["miku" "hello"] (core/->Cursor 4 0 5))))))
    (testing "move down"
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1)))))
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello" "miku"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "miku"] (core/->Cursor 4 1 5)))))
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/saved-cursor 5 0))))))
    (testing "move start line"
      (is (= (cursor/start-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0)))))
      (is (= (cursor/start-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))))
    (testing "move end line"
      (is (= (cursor/end-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0)))))
      (is (= (cursor/end-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))))
    (testing "move next word"
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0)))))
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0)))))
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 6 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0)))))
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 10 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 11 0))))))
    (testing "move prev word"
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0)))))
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0)))))
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 6 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 0 0)))))
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 10 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/saved-cursor 6 0))))))
    (testing "move start buffer"
      (is (= (cursor/start-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0)))))
      (is (= (cursor/start-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))))
    (testing "move end buffer"
      (is (= (cursor/end-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1)))))
      (is (= (cursor/end-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/saved-cursor 5 1))))))))

(deftest command
  (testing "history"
    (testing "prev command"
      (is (= (command/prev-command (assoc core/unit-editor
                                     :history (core/->History ["hello" "world"] 0)))
             (assoc core/unit-editor
               :history (core/->History ["hello" "world"] 1))))
      (is (= (command/prev-command (assoc core/unit-editor
                                     :history (core/->History ["hello" "world"] 1)))
             nil)))
    (testing "next command"
      (is (= (command/next-command (assoc core/unit-editor
                                     :history (core/->History ["hello" "world"] 1)))
             (assoc core/unit-editor
               :history (core/->History ["hello" "world"] 0))))
      (is (= (command/next-command (assoc core/unit-editor
                                     :history (core/->History ["hello" "world"] 0)))
             nil)))
    (testing "set prev command"
      (is (= (command/set-prev-command (assoc core/unit-editor
                                         :history (core/->History ["hello" "world"] 0)))
             (assoc core/unit-editor
               :history (core/->History ["world" "world"] 1))))
      (is (= (command/set-prev-command (assoc core/unit-editor
                                         :history (core/->History ["hello" "world"] 1)))
             (assoc core/unit-editor
               :history (core/->History ["hello" "world"] 1)))))
    (testing "set next command"
      (is (= (command/set-next-command (assoc core/unit-editor
                                         :history (core/->History ["" "hello" "world"] 2)))
             (assoc core/unit-editor
               :history (core/->History ["hello" "hello" "world"] 1))))
      (is (= (command/set-next-command (assoc core/unit-editor
                                         :history (core/->History ["hello" "world"] 1)))
             (assoc core/unit-editor
               :history (core/->History ["" "world"] 0))))
      (is (= (command/set-next-command (assoc core/unit-editor
                                         :history (core/->History ["" "world"] 0)))
             (assoc core/unit-editor
               :history (core/->History ["" "world"] 0)))))))

(deftest editor
  (testing "editor"
    (testing "create buffer"
      (is (= (editor/create-buffer (assoc core/unit-editor
                                     :buffers {"hello" core/unit-buffer}
                                     :current "hello") "world")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer
                         "world" core/unit-buffer}
               :current "world")))
      (is (= (editor/create-buffer (assoc core/unit-editor
                                     :buffers {"hello" core/unit-buffer}
                                     :current "hello") "hello")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer}
               :current "hello"))))
    (testing "change buffer"
      (is (= (editor/change-buffer (assoc core/unit-editor
                                     :buffers {"hello" core/unit-buffer
                                               "world" core/unit-buffer}
                                     :current "hello") "world")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer
                         "world" core/unit-buffer}
               :current "world")))
      (is (= (editor/change-buffer (assoc core/unit-editor
                                     :buffers {"hello" core/unit-buffer}
                                     :current "hello") "world")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer}
               :current "hello"))))
    (testing "create or change buffer"
      (is (= (editor/buffer (assoc core/unit-editor
                              :buffers {"hello" core/unit-buffer}
                              :current "hello") "world")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer
                         "world" core/unit-buffer}
               :current "world")))
      (is (= (editor/buffer (assoc core/unit-editor
                              :buffers {"hello" core/unit-buffer
                                        "world" core/unit-buffer}
                              :current "hello") "world")
             (assoc core/unit-editor
               :buffers {"hello" core/unit-buffer
                         "world" core/unit-buffer}
               :current "world"))))
    (testing "rename buffer"
      (is (= (editor/rename-buffer (assoc core/unit-editor
                                     :buffers {"hello" core/unit-buffer}
                                     :current "hello") "world")
             (assoc core/unit-editor
               :buffers {"world" core/unit-buffer}
               :current "world"))))))

(deftest syntax
  (testing "parser"
    (is (= (parser/parse syntax/clojure "\"a\" \"b\"")
           [(parser/->Token :string "\"a\"") (parser/->Token nil " ") (parser/->Token :string "\"b\"")]))
    (is (time (parser/parse syntax/clojure (slurp "test/one/test.clj"))))))
