(ns felis.editor.buffer
  (:require [felis.core :as core]
            [felis.zipper :as zipper]
            [felis.buffer :as buffer]
            [felis.editor.row :as row]))

(def top
  (partial buffer/update zipper/left))

(def bottom
  (partial buffer/update zipper/right))

(def start
  (partial buffer/update zipper/start))

(def end
  (partial buffer/update zipper/end))

(def insert
  (partial buffer/update #(zipper/insert % felis.row/empty)))

(def append
  (partial buffer/update #(zipper/append % felis.row/empty)))

(def delete
  (partial buffer/delete zipper/delete))

(def backspace
  (partial buffer/delete zipper/backspace))

(def delete-bottoms
  (partial buffer/delete zipper/delete-rights))

(def delete-tops
  (partial buffer/delete zipper/delete-lefts))

(def initialize
  (partial buffer/update core/initialize))
