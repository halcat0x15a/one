(ns felis.collection
  (:refer-clojure :exclude [peek pop conj sequence])
  (:require [clojure.core :as core]
            [felis.string :as string]
            [felis.empty :as empty]
            [felis.serialization :as serialization]))

(defprotocol Collection
  (peek [sequence])
  (pop [sequence])
  (conj [sequence value]))

(defprotocol Sequence
  (sequence [sequence]))

(extend-protocol Collection
  felis.collection.Sequence
  (peek [this]
    (-> this sequence core/peek))
  (pop [this]
    (if (-> this sequence empty?)
      this
      (update-in this [:sequence] core/pop)))
  (conj [this value]
    (update-in this [:sequence] #(core/conj % value))))

(defrecord Top [sequence]
  Sequence
  (sequence [top] sequence))

(defrecord Bottom [sequence]
  Sequence
  (sequence [bottom] sequence))

(defrecord Left [sequence]
  Collection
  (peek [left]
    (last sequence))
  (pop [left]
    (update-in left [:sequence] string/butlast))
  (conj [left char]
    (update-in left [:sequence] #(str % char)))
  serialization/Serializable
  (write [_] sequence))

(defrecord Right [sequence]
  Collection
  (peek [right]
    (first sequence))
  (pop [right]
    (update-in right [:sequence] string/rest))
  (conj [right char]
    (update-in right [:sequence] (partial str char)))
  serialization/Serializable
  (write [_] sequence))

(defmethod empty/empty Top [_] (Top. []))

(defmethod empty/empty Bottom [_] (Bottom. '()))

(defmethod empty/empty Left [_] (Left. ""))

(defmethod empty/empty Right [_] (Right. ""))

(defmethod serialization/read Left [_ string]
  (Left. string))

(defmethod serialization/read Right [_ string]
  (Right. string))
