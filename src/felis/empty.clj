(ns felis.empty
  (:refer-clojure :exclude [empty empty?]))

(defmulti empty identity)

(defn empty? [x]
  (= x (-> x type empty)))
