(ns felis.serialization
  (:refer-clojure :exclude [read]))

(defprotocol Serializable
  (write [this])
  (reader [this]))

(defprotocol Reader
  (read [this string]))
