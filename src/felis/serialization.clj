(ns felis.serialization
  (:refer-clojure :exclude [read]))

(defprotocol Serializable
  (write [this]))

(defmulti read (fn [reader string] reader))
