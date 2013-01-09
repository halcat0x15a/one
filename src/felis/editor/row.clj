(ns felis.editor.row
  (:refer-clojure :exclude [replace])
  (:require [felis.core :as core]
            [felis.editable :as editable]
            [felis.row :as row]))

(def left
  (partial row/update editable/prev))

(def right
  (partial row/update editable/next))

(def start
  (partial row/update editable/start))

(def end
  (partial row/update editable/end))

(defn insert [editor char]
  (row/update #(editable/insert % char) editor))

(defn append [editor char]
  (row/update #(editable/append % char) editor))

(defn replace [editor char]
  (-> editor
      editable/delete
      (editable/insert char)))

(def delete
  (partial row/update editable/delete))

(def backspace
  (partial row/update editable/backspace))
(comment
(def delete-rights
  (partial row/update editable/delete-rights))

(def delete-lefts
  (partial row/update editable/delete-lefts))
)