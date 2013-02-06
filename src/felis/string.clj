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

(defn make-string [sep coll]
  (->> coll (interpose sep) string/join))

(defn split-lines [string]
  (loop [source string chunk "" strings (transient [])]
    (if-let [char (first source)]
      (let [source' (core/rest source)]
        (if (identical? char \newline)
          (recur source' "" (conj! strings chunk))
          (recur source' (str chunk char) strings)))
      (persistent! (conj! strings chunk)))))
