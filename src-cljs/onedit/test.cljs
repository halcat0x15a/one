(ns onedit.test
  (:require [clojure.browser.dom :as dom]
            [onedit.core :as core]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]))

(defn assert= [n a b]
  (if (= a b)
    (dom/log n)
    (dom/log a "=/=" b))
  (inc n))

(defn run []
  (-> 0
      (assert= (buffer/prepend-newline (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["" "hello"] (core/->Cursor 0 0))} "scratch"))
      (assert= (buffer/append-newline (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["hello" ""] (core/->Cursor 0 1))} "scratch"))
      (assert= (buffer/insert-newline (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["h" "ello"] (core/->Cursor 0 1))} "scratch"))
      (assert= (buffer/insert (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch") "world")
               (core/->Editor {"scratch" (core/->Buffer ["hworldello"] (core/->Cursor 6 0))} "scratch"))
      (assert= (buffer/delete-forward (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["hllo"] (core/->Cursor 1 0))} "scratch"))
      (assert= (buffer/delete-backward (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["ello"] (core/->Cursor 0 0))} "scratch"))
      (assert= (buffer/delete-line (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer [""] (core/->Cursor 0 0))} "scratch"))
      (assert= (cursor/left (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 0 0))} "scratch"))
      (assert= (cursor/right (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 2 0))} "scratch"))
      (assert= (cursor/up (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
      (assert= (cursor/down (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))
               (core/->Editor {"scratch" (core/->Buffer ["hello"] (core/->Cursor 1 0))} "scratch"))))
