(ns onedit.test
  (:require [clojure.java.io :as io])
  (:use clojure.test))

(def names ["core" "buffer" "cursor"])

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
      (is (= (get-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch") 0)
             "hello"))
      (testing "index out of bounds"
        (is (= (get-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch") 2)
               nil))))
    (testing "count line"
      (is (= (count-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch") 0)
             5))
      (testing "index out of bounds"
        (is (= (count-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch") 2)
               nil))))))

(deftest buffer
  (testing "Buffer Functions"
    (testing "prepend newline"
      (is (= (prepend-newline (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "" "world"] (->Cursor 0 1 0))} "scratch"))))
    (testing "append newline"
      (is (= (append-newline (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world" ""] (->Cursor 0 2 1))} "scratch"))))
    (testing "insert newline"
      (is (= (insert-newline (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" " world"] (->Cursor 0 1 0))} "scratch"))))))

(deftest cursor
  (testing "Cursor Functions"
    (testing "move left"
      (is (= (left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch")))
      (is (= (left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch")))
      (is (= (left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch"))))
    (testing "move right"
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1 1))} "scratch")))
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch")))
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch"))))
    (testing "move up"
      (is (= (up (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 1 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0 1))} "scratch")))
      (is (= (up (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 0 0 0))} "scratch")))
      (is (= (up (->Editor {"scratch" (->Buffer ["miku" "hello"] (->Cursor 5 1 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["miku" "hello"] (->Cursor 4 0 5))} "scratch"))))
    (testing "move down"
      (is (= (down (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch")))
      (is (= (down (->Editor {"scratch" (->Buffer ["hello" "miku"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "miku"] (->Cursor 4 1 5))} "scratch")))
      (is (= (down (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 5 0 5))} "scratch"))))
    (testing "move start line"
      (is (= (start-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch")))
      (is (= (start-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch"))))
    (testing "move end line"
      (is (= (end-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch")))
      (is (= (end-line (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch"))))
    (testing "move next word"
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 1 0 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch")))
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 11 0 11))} "scratch")))
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 6 0 6))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 11 0 11))} "scratch")))
      (is (= (forward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 10 0 10))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 11 0 11))} "scratch"))))
    (testing "move prev word"
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 1 0 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 0 0 0))} "scratch")))
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 0 0 0))} "scratch")))
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 6 0 6))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 0 0 0))} "scratch")))
      (is (= (backward (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 10 0 10))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello world"] (->Cursor 6 0 6))} "scratch"))))
    (testing "move start buffer"
      (is (= (start-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 0 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch")))
      (is (= (start-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch"))))
    (testing "move end buffer"
      (is (= (end-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 0 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch")))
      (is (= (end-buffer (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1 5))} "scratch"))))))
