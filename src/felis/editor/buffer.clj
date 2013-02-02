(ns felis.editor.buffer
  (:require [felis.buffer :as buffer]
            [felis.text :as text]
            [felis.node :as node]
            [felis.empty :as empty]
            [felis.editor.edit :as edit]))

(defn update [f editor]
  (update-in editor (node/path felis.buffer.Buffer) f))

(def top
  (partial update edit/prev))

(def bottom
  (partial update edit/next))

(def start
  (partial update edit/start))

(def end
  (partial update edit/end))

(def insert-newline
  (partial update #(edit/insert % (empty/empty felis.text.Inner))))

(def append-newline
  (partial update #(edit/append % (empty/empty felis.text.Inner))))

(def delete
  (partial update edit/delete))

(def backspace
  (partial update edit/backspace))
