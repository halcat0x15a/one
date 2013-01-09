(ns felis.functor
  (:refer-clojure :exclude [map]))

(defprotocol Functor
  (map [this f]))
