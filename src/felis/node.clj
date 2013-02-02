(ns felis.node)

(defprotocol Node
  (render [node]))

(defmulti path identity)
