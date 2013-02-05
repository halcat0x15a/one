(ns felis.collection
  (:refer-clojure :exclude [pop])
  (:require [clojure.core :as core]))

(defn pop [coll]
  (if (empty? coll)
    coll
    (core/pop coll)))
