(ns felis.string
  (:refer-clojure :exclude [rest butlast])
  (:require [clojure.core :as core]
            [clojure.string :as string]))

(defn rest [string]
  (if (-> string count pos?)
    (subs string 1)
    string))

(defn butlast [string]
  (let [length (count string)]
    (if (pos? length)
      (subs string 0 (dec length))
      string)))

(defn split-lines [string]
  (loop [src string acc "" xs (transient [])]
    (if-let [char (first src)]
      (let [src' (core/rest src)]
        (if (identical? char \newline)
          (recur src' "" (conj! xs acc))
          (recur src' (str acc char) xs)))
      (persistent! (conj! xs acc)))))

(defn nbsp [string]
  (string/replace string #" " "&nbsp;"))
