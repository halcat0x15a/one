(ns felis.editor.buffer
  (:require [felis.zipper :as zipper]
            [felis.buffer :as buffer]
            [felis.editor.row :as row]))

(def top
  (partial buffer/update zipper/left))

(def bottom
  (partial buffer/update zipper/right))

(defn start [editor]
  (->> editor
       (buffer/update zipper/start)
       row/start))

(defn end [editor]
  (->> editor
       (buffer/update zipper/end)
       row/end))

(def insert
  (partial buffer/update #(zipper/insert % felis.row/empty)))

(def append
  (partial buffer/update #(zipper/append % felis.row/empty)))

(def delete
  (partial buffer/update zipper/delete))

(def backspace
  (partial buffer/update zipper/backspace))
