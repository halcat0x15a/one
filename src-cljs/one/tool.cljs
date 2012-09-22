(ns one.tool
  (:require [one.core :as core]
            [one.editor :as editor]))

(defn commands [this]
  (-> this
      (editor/buffer "commands")
      (core/set-strings (vec (map name (keys (:functions this)))))))

(defn history [this]
  (-> this
      (editor/buffer "history")
      (core/set-strings (vec (:commands (:history this))))))

(defn apply-buffers [this command & args]
  (let [[f & _] (core/parse-command this command)]
    (loop [this this buffers (:buffers this) result []]
      (if (empty? buffers)
        (-> this
            (editor/buffer "apply-buffers")
            (core/set-strings (vec result)))
        (let [[k v] (first buffers)
              this' (apply f (-> this (editor/buffer k)) args)]
          (recur this' (rest buffers) (concat result (core/get-strings this'))))))))

(defn grep [this string]
  (let [re (re-pattern string)]
    (-> this
        (editor/buffer "grep")
        (core/set-strings (vec (filter (partial re-find re) (core/get-strings this)))))))

(defn count-lines [this]
  (-> this
      (editor/buffer "count-lines")
      (core/set-strings [(str (core/count-lines this))])))

(defn sum [this]
  (-> this
      (editor/buffer "sum")
      (core/set-strings [(str (apply + (map int (flatten (map (partial re-seq #"\d+") (core/get-strings this))))))])))
