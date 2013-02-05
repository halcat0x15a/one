(ns felis.editor.edit
  (:refer-clojure :exclude [sequence next])
  (:require [felis.edit :as edit]))

(defn next [edit]
  (edit/move edit edit/rights))

(defn prev [edit]
  (edit/move edit edit/lefts))

(defn insert [value edit]
  (edit/insert edit edit/rights value))

(defn append [value edit]
  (edit/insert edit edit/lefts value))

(defn delete [edit]
  (edit/delete edit edit/rights))

(defn backspace [edit]
  (edit/delete edit edit/lefts))

(defn- until [f edit]
  (let [edit' (f edit)]
    (if (identical? edit edit')
      edit'
      (recur f edit'))))

(def start (partial until prev))

(def end (partial until next))

(def delete-all (partial until delete))

(def backspace-all (partial until backspace))

(defn cursor [edit]
  (loop [edit edit n 0]
    (let [edit' (prev edit)]
      (if (identical? edit' edit)
        n
        (recur edit' (inc n))))))

