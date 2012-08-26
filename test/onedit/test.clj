(ns onedit.test
  (:require [clojure.java.io :as io])
  (:use clojure.test))

(def names ["core" "buffer" "cursor"])

(defn setup []
  (doseq [name names]
    (io/copy (io/file (str "src-cljs/onedit/" name ".cljs")) (io/file (str "test/onedit/" name ".clj"))))
  (doseq [name names]
    (use (symbol (str "onedit." name)))))

(defn cleanup []
  (doseq [name names]
    (io/delete-file (str "test/onedit/" name ".clj"))))

(setup)

(deftest cursor
  (testing "Cursor Functions"
    (testing "move left"
      (is (= (onedit.cursor/left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1))} "scratch")))
      (is (= (left (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1))} "scratch"))))
    (testing "move right"
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 0 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 1 1))} "scratch")))
      (is (= (right (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "world"] (->Cursor 5 1))} "scratch"))))
    (testing "move up"
      (is (= (up (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0))} "scratch")))
      (is (= (up (->Editor {"scratch" (->Buffer ["miku" "hello"] (->Cursor 5 1))} "scratch"))
             (->Editor {"scratch" (->Buffer ["miku" "hello"] (->Cursor 4 0))} "scratch"))))
    (testing "move down"
      (is (= (down (->Editor {"scratch" (->Buffer ["hello" "miku"] (->Cursor 5 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello" "miku"] (->Cursor 4 1))} "scratch")))
      (is (= (down (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0))} "scratch"))
             (->Editor {"scratch" (->Buffer ["hello"] (->Cursor 1 0))} "scratch"))))))

(cleanup)
