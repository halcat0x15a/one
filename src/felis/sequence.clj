(ns felis.sequence)

(defprotocol Sequence
  (add' [this seq value]))

(defrecord List [shown size hidden]
  Sequence
  (add' [this seq value]
    (cons value seq)))

(defrecord Vector [shown size hidden]
  Sequence
  (add' [this seq value]
    (conj seq value)))

(defn add [fixed value]
  (let [{:keys [shown size hidden]} fixed]
    (if (< (count shown) size)
      (add' fixed shown value)
      (add' fixed hidden value))))
