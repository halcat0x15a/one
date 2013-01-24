(ns felis.editor.row
  (:refer-clojure :exclude [replace])
  (:require [felis.core :as core]
            [felis.edit :as edit]
            [felis.row :as row]))

(def left
  (partial row/update edit/prev))

(def right
  (partial row/update edit/next))

(def start
  (partial row/update edit/start))

(def end
  (partial row/update edit/end))

(defn insert [editor char]
  (row/update #(edit/insert % char) editor))

(defn append [editor char]
  (row/update #(edit/append % char) editor))

(defn replace [editor char]
  (-> editor
      edit/delete
      (edit/insert char)))

(def delete
  (partial row/update edit/delete))

(def backspace
  (partial row/update edit/backspace))
(comment
(def delete-rights
  (partial row/update edit/delete-rights))

(def delete-lefts
  (partial row/update edit/delete-lefts))
)
