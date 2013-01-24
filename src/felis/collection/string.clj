(ns felis.collection.string
  (:require [felis.string :as string]
            [felis.collection :as collection]))

(defrecord Left [sequence]
  collection/Sequence
  (peek [left]
    (last sequence))
  (pop [left]
    (assoc left
      :sequence (string/butlast sequence)))
  (conj [left char]
    (assoc left
      :sequence (str sequence char))))

(defrecord Right [sequence]
  collection/Sequence
  (peek [right]
    (first sequence))
  (pop [right]
    (assoc right
      :sequence (string/rest sequence)))
  (conj [right char]
    (assoc right
      :sequence (str char sequence))))
