(ns felis.collection.string
  (:require [felis.string :as string]
            [felis.collection :as collection]))

(defrecord Left [sequence]
  collection/Sequence
  (peek [left]
    (string/last sequence))
  (pop [left]
    (assoc left
      :sequence (string/butlast sequence)))
  (conj [left character]
    (assoc left
      :sequence (str sequence character))))

(defrecord Right [sequence]
  collection/Sequence
  (peek [right]
    (string/first sequence))
  (pop [right]
    (assoc right
      :sequence (string/rest sequence)))
  (conj [right value]
    (assoc right
      :sequence (str value sequence))))
