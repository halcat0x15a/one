(ns felis.serialization)

(defprotocol Serializable
  (serialize [this]))

(defmulti deserialize (fn [serializable string] serializable))
