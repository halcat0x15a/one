(ns onedit.test
  (:require [clojure.java.io :as io])
  (:use clojure.test))

(def names ["core" "buffer" "cursor" "command" "editor"])

(defn cljfile [name]
  (io/file (str "test/onedit/" name ".clj")))

(defn cljsfile [name]
  (io/file (str "src-cljs/onedit/" name ".cljs")))

(defn setup []
  (doseq [name names]
    (io/copy (cljsfile name) (cljfile name)))
  (doseq [name names]
    (require `[~(symbol (str "onedit." name)) :as ~(symbol name)])))

(defn cleanup []
  (doseq [name names]
    (io/delete-file (cljfile name))))

(try
  (cleanup)
  (catch Throwable _ _))

(setup)

(defn fixture [f]
  (f)
  (cleanup))

(use-fixtures :once fixture)

(deftest core
  (testing "Core Functions"
    (testing "get line"
      (is (= (core/get-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))) 0)
             "hello"))
      (testing "index out of bounds"
        (is (= (core/get-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))) 2)
               nil))))
    (testing "count line"
      (is (= (core/count-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))) 0)
             5))
      (testing "index out of bounds"
        (is (= (core/count-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))) 2)
               nil))))))

(deftest buffer
  (testing "Buffer Functions"
    (testing "prepend newline"
      (is (= (buffer/prepend-newline (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 1 1 1))))
          (core/set-buffer core/unit-editor (core/->Buffer ["hello" "" "world"] (core/->Cursor 0 1 0))))))
    (testing "append newline"
      (is (= (buffer/append-newline (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 1 1 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world" ""] (core/->Cursor 0 2 1))))))
    (testing "insert newline"
      (is (= (buffer/insert-newline (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" " world"] (core/->Cursor 0 1 0))))))
    (testing "insert"
      (is (= (buffer/insert (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/->Cursor 5 0 5))) "world")
             (core/set-buffer core/unit-editor (core/->Buffer ["helloworld"] (core/->Cursor 10 0 10))))))))

(deftest cursor
  (testing "Cursor Functions"
    (testing "move left"
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 1 1 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 1 0)))))
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0)))))
      (is (= (cursor/left (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 0 5))))))
    (testing "move right"
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 1 1 1)))))
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 1 0)))))
      (is (= (cursor/right (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5))))))
    (testing "move up"
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/->Cursor 1 1 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/->Cursor 1 0 1)))))
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/->Cursor 1 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/->Cursor 0 0 0)))))
      (is (= (cursor/up (core/set-buffer core/unit-editor (core/->Buffer ["miku" "hello"] (core/->Cursor 5 1 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["miku" "hello"] (core/->Cursor 4 0 5))))))
    (testing "move down"
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5)))))
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello" "miku"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "miku"] (core/->Cursor 4 1 5)))))
      (is (= (cursor/down (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/->Cursor 1 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello"] (core/->Cursor 5 0 5))))))
    (testing "move start line"
      (is (= (cursor/start-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0)))))
      (is (= (cursor/start-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 1 0))))))
    (testing "move end line"
      (is (= (cursor/end-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 0 5)))))
      (is (= (cursor/end-line (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5))))))
    (testing "move next word"
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 1 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 5 0 5)))))
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 11 0 11)))))
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 6 0 6))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 11 0 11)))))
      (is (= (cursor/forward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 10 0 10))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 11 0 11))))))
    (testing "move prev word"
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 1 0 1))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 0 0 0)))))
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 0 0 0)))))
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 6 0 6))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 0 0 0)))))
      (is (= (cursor/backward (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 10 0 10))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello world"] (core/->Cursor 6 0 6))))))
    (testing "move start buffer"
      (is (= (cursor/start-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 0 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0)))))
      (is (= (cursor/start-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))))))
    (testing "move end buffer"
      (is (= (cursor/end-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 0 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5)))))
      (is (= (cursor/end-buffer (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 0 1 0))))
             (core/set-buffer core/unit-editor (core/->Buffer ["hello" "world"] (core/->Cursor 5 1 5))))))))

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
