(ns felis.editor.buffer
  (:require [felis.core :as core]
            [felis.editable :as editable]
            [felis.buffer :as buffer]
            [felis.editor.row :as row]))

(def top
  (partial buffer/update editable/prev))

(def bottom
  (partial buffer/update editable/next))

(def start
  (partial buffer/update editable/start))

(def end
  (partial buffer/update editable/end))

(def insert-newline
  (partial buffer/update #(editable/insert % felis.row/empty)))

(def append-newline
  (partial buffer/update #(editable/append % felis.row/empty)))

(def delete
  (partial buffer/update editable/delete))

(def backspace
  (partial buffer/update editable/backspace))
(comment
(def delete-bottoms
  (partial buffer/update editable/delete-rights))

(def delete-tops
  (partial buffer/update editable/delete-lefts))
)
