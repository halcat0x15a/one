(ns felis.editor.buffer
  (:require [felis.buffer :as buffer]
            [felis.text :as text]
            [felis.node :as node]
            [felis.empty :as empty]
            [felis.editor.edit :as edit]))

(defn update [f editor]
  (update-in editor buffer/path f))

(def top
  (partial update edit/prev))

(def bottom
  (partial update edit/next))

(def start
  (partial update edit/start))

(def end
  (partial update edit/end))

(def insert-newline
  (partial update (partial edit/insert text/empty)))

(def append-newline
  (partial update (partial edit/append text/empty)))

(def delete
  (partial update edit/delete))

(def backspace
  (partial update edit/backspace))
