(ns felis.collection
  (:refer-clojure :exclude [peek pop conj]))

(defprotocol Sequence
  (peek [sequence])
  (pop [sequence])
  (conj [sequence value]))
