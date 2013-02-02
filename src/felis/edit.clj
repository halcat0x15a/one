(ns felis.edit)

(defprotocol Edit
  (move [this field])
  (insert [this field value])
  (delete [this field]))

(defmulti opposite identity)
(defmethod opposite :lefts [side] :rights)
(defmethod opposite :rights [side] :lefts)
