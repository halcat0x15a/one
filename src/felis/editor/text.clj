(ns felis.editor.text
  (:refer-clojure :exclude [replace])
  (:require [felis.text :as text]
            [felis.node :as node]
            [felis.editor.edit :as edit]))

(def left
  (partial text/update edit/prev))

(def right
  (partial text/update edit/next))

(def start
  (partial text/update edit/start))

(def end
  (partial text/update edit/end))

(defn insert [editor char]
  (text/update (partial edit/insert char) editor))

(defn append [editor char]
  (text/update (partial edit/append char) editor))

(def delete
  (partial text/update edit/delete))

(def backspace
  (partial text/update edit/backspace))
