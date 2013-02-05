(ns felis.editor.text
  (:refer-clojure :exclude [replace])
  (:require [felis.text :as text]
            [felis.node :as node]
            [felis.editor.edit :as edit]))

(defn update [f editor]
  (update-in editor text/path f))

(def left
  (partial update edit/prev))

(def right
  (partial update edit/next))

(def start
  (partial update edit/start))

(def end
  (partial update edit/end))

(defn insert [editor char]
  (update (partial edit/insert char) editor))

(defn append [editor char]
  (update (partial edit/append char) editor))

(defn replace [editor char]
  (-> editor
      edit/delete
      (edit/insert char)))

(def delete
  (partial update edit/delete))

(def backspace
  (partial update edit/backspace))
