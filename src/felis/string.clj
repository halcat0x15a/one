(ns felis.string
  (:refer-clojure :exclude [rest last butlast])
  (:require [clojure.core :as core]
            [clojure.string :as string]))

(defn rest [s]
  (if (-> s count pos?)
    (subs s 1)
    s))

(defn butlast [s]
  (let [length (count s)]
    (if (pos? length)
      (subs s 0 (dec length))
      s)))

(defn split-lines [string]
  (loop [src string acc "" xs (transient [])]
    (if-let [c (first src)]
      (let [src' (core/rest src)]
        (if (identical? c \newline)
          (recur src' "" (conj! xs acc))
          (recur src' (str acc c) xs)))
      (persistent! (conj! xs acc)))))

(def join string/join)

(defn nbsp [source]
  (string/replace source #" " "&nbsp;"))
