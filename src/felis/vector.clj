(ns felis.vector
  (:refer-clojure :exclude [pop cons rest])
  (:require [clojure.core :as core]))

(defn pop [vector]
  (if (empty? vector)
    vector
    (core/pop vector)))

(def cons (comp vec core/cons))

(defn rest (comp vec core/rest))
