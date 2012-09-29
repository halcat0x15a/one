(ns one.core.tool
  (:require [one.core :as core]
            [one.core.buffer :as buffer]))

(defn commands [this]
  (-> this
      (buffer/create-buffer :commands)
      (core/set-text (vec (map name (keys (:functions this)))))))

(defn history [this]
  (-> this
      (buffer/create-buffer :history)
      (core/set-text (vec (:commands (:history this))))))

(defn apply-buffers [this command & args]
  (let [[f & _] (core/parse-command this command)]
    (loop [this this buffers (:buffers this) result []]
      (if (empty? buffers)
        (-> this
            (buffer/create-buffer :apply-buffers)
            (core/set-text (vec result)))
        (let [[k v] (first buffers)
              this' (apply f (-> this (buffer/create-buffer k)) args)]
          (recur this' (rest buffers) (concat result (core/get-text this'))))))))

(defn grep [this pattern]
  (let [re (re-pattern pattern)]
    (-> this
        (buffer/create-buffer :grep)
        (core/set-text (vec (filter (partial re-find re) (core/get-text this)))))))

(defn count-lines [this]
  (-> this
      (buffer/create-buffer :count-lines)
      (core/set-text [(str (core/count-lines this))])))

(defn sum [this]
  (-> this
      (buffer/create-buffer :sum)
      (core/set-text [(str (apply + (map int (flatten (map (partial re-seq #"\d+") (core/get-text this))))))])))
