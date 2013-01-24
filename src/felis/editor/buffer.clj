(ns felis.editor.buffer
  (:require [felis.core :as core]
            [felis.edit :as edit]
            [felis.buffer :as buffer]
            [felis.editor.row :as row]))

(def top
  (partial buffer/update edit/prev))

(def bottom
  (partial buffer/update edit/next))

(def start
  (partial buffer/update edit/start))

(def end
  (partial buffer/update edit/end))

(def insert-newline
  (partial buffer/update #(edit/insert % felis.row/empty)))

(def append-newline
  (partial buffer/update #(edit/append % felis.row/empty)))

(def delete
  (partial buffer/update edit/delete))

(def backspace
  (partial buffer/update edit/backspace))
(comment
(def delete-bottoms
  (partial buffer/update edit/delete-rights))

(def delete-tops
  (partial buffer/update edit/delete-lefts))
)
