(ns felis.collection.sequence
  (:require [felis.collection :as collection]))

(defrecord Sequence [sequence]
  collection/Sequence
  (peek [this]
    (peek sequence))
  (pop [this]
    (if (empty? sequence)
      this
      (assoc this
        :sequence (pop sequence))))
  (conj [this value]
    (assoc this
      :sequence (conj sequence value))))
