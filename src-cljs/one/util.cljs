(ns one.util
  (:require [clojure.string :as string]))

(defn apply-center [f a p]
  (let [[x y] p]
    (f x a y)))

(defmulti join (fn [x & xs] (string? x)))
(defmethod join true [s & ss] (apply str s ss))
(defmethod join false [x & xs] (apply concat x xs))

(defmulti cut (fn [n xs] (string? xs)))
(defmethod cut true [n s]
  [(subs s 0 n) (subs s n)])
(defmethod cut false [n xs]
  (split-at n xs))

(defn insert [a n c]
  (apply-center join a (cut n c)))

(defn drop-string [m n s]
  (str (subs s 0 m) (subs s n)))

(def join-newline (partial string/join \newline))
