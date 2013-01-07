(ns felis.editor.row
  (:refer-clojure :exclude [replace])
  (:require [felis.core :as core]
            [felis.zipper :as zipper]
            [felis.row :as row]))

(def left
  (partial row/update #(row/move % zipper/left)))

(def right
  (partial row/update #(row/move % zipper/right)))

(def start
  (partial row/update #(row/move % zipper/start)))

(def end
  (partial row/update #(row/move % zipper/end)))

(defn insert [editor char]
  (row/update #(row/insert % zipper/insert char) editor))

(defn append [editor char]
  (row/update #(row/insert % zipper/append char) editor))

(defn replace [editor char]
  (row/update #(row/replace % char) editor))

(def delete
  (partial row/update #(row/delete % zipper/delete)))

(def backspace
  (partial row/update #(row/delete % zipper/backspace)))

(def delete-rights
  (partial row/update #(row/delete % zipper/delete-rights)))

(def delete-lefts
  (partial row/update #(row/delete % zipper/delete-lefts)))

(def initialize
  (partial row/update core/initialize))
