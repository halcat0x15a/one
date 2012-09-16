(ns onedit.test
  (:require [clojure.java.io :as io])
  (:use clojure.test))

(def names ["core" "buffer" "cursor" "command"])

(defn cljfile [name]
  (io/file (str "test/onedit/" name ".clj")))

(defn cljsfile [name]
  (io/file (str "src-cljs/onedit/" name ".cljs")))

(defn setup []
  (doseq [name names]
    (io/copy (cljsfile name) (cljfile name)))
  (doseq [name names]
    (use (symbol (str "onedit." name)))))

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
      (is (= (get-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil) 0)
             "hello"))
      (testing "index out of bounds"
        (is (= (get-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil) 2)
               nil))))
    (testing "count line"
      (is (= (count-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil) 0)
             5))
      (testing "index out of bounds"
        (is (= (count-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil) 2)
               nil))))))

(deftest buffer
  (testing "Buffer Functions"
    (testing "prepend newline"
      (is (= (prepend-newline (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil))))
    (testing "append newline"
      (is (= (append-newline (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world" ""] (->Cursor 0 2 1))} "scratch" unit-history nil))))
    (testing "insert newline"
      (is (= (insert-newline (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" " world"] (->Cursor 0 1 0))} "scratch" unit-history nil))))
    (testing "insert"
      (is (= (insert (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 5 0 5))} "scratch" unit-history nil) "world")
             (->Editor {"scratch" (->Buffer ["helloworld"] (->Cursor 10 0 10))} "scratch" unit-history nil))))))

(deftest cursor
  (testing "Cursor Functions"
    (testing "move left"
      (is (= (left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil)))
      (is (= (left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil)))
      (is (= (left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch" unit-history nil))))
    (testing "move right"
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch" unit-history nil)))
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil)))
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil))))
    (testing "move up"
      (is (= (up (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 1 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0 1))} "scratch" unit-history nil)))
      (is (= (up (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 0 0 0))} "scratch" unit-history nil)))
      (is (= (up (->Editor {"scratch" (->Buffer ["miku" "hello"] (->Cursor 5 1 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["miku" "hello"] (->Cursor 4 0 5))} "scratch" unit-history nil))))
    (testing "move down"
      (is (= (down (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil)))
      (is (= (down (->Editor {"scratch" (->Buffer ["hello" "miku"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "miku"] (->Cursor 4 1 5))} "scratch" unit-history nil)))
      (is (= (down (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 5 0 5))} "scratch" unit-history nil))))
    (testing "move start line"
      (is (= (start-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil)))
      (is (= (start-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil))))
    (testing "move end line"
      (is (= (end-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch" unit-history nil)))
      (is (= (end-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil))))
    (testing "move next word"
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 1 0 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch" unit-history nil)))
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 11 0 11))} "scratch" unit-history nil)))
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 6 0 6))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 11 0 11))} "scratch" unit-history nil)))
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 10 0 10))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 11 0 11))} "scratch" unit-history nil))))
    (testing "move prev word"
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 1 0 1))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 0 0 0))} "scratch" unit-history nil)))
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 0 0 0))} "scratch" unit-history nil)))
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 6 0 6))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 0 0 0))} "scratch" unit-history nil)))
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 10 0 10))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 6 0 6))} "scratch" unit-history nil))))
    (testing "move start buffer"
      (is (= (start-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil)))
      (is (= (start-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil))))
    (testing "move end buffer"
      (is (= (end-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil)))
      (is (= (end-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch" unit-history nil))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch" unit-history nil))))))

(deftest command
  (testing "history"
    (testing "prev command"
      (is (= (prev-command (assoc unit-editor
                             :history (->History ["hello" "world"] 0)))
             (assoc unit-editor
               :history (->History ["hello" "world"] 1))))
      (is (= (prev-command (assoc unit-editor
                             :history (->History ["hello" "world"] 1)))
             nil)))
    (testing "next command"
      (is (= (next-command (assoc unit-editor
                             :history (->History ["hello" "world"] 1)))
             (assoc unit-editor
               :history (->History ["hello" "world"] 0))))
      (is (= (next-command (assoc unit-editor
                             :history (->History ["hello" "world"] 0)))
             nil)))
    (testing "set prev command"
      (is (= (set-prev-command (assoc unit-editor
                                 :history (->History ["hello" "world"] 0)))
             (assoc unit-editor
               :history (->History ["world" "world"] 1))))
      (is (= (set-prev-command (assoc unit-editor
                                 :history (->History ["hello" "world"] 1)))
             (assoc unit-editor
               :history (->History ["hello" "world"] 1)))))
    (testing "next command"
      (is (= (set-next-command (assoc unit-editor
                                 :history (->History ["" "hello" "world"] 2)))
             (assoc unit-editor
               :history (->History ["hello" "hello" "world"] 1))))
      (is (= (set-next-command (assoc unit-editor
                                 :history (->History ["hello" "world"] 1)))
             (assoc unit-editor
               :history (->History ["hello" "world"] 0))))
      (is (= (set-next-command (assoc unit-editor
                                 :history (->History ["hello" "world"] 0)))
             (assoc unit-editor
               :history (->History ["" "world"] 0)))))))
