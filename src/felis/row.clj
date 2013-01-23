(ns felis.row
  (:refer-clojure :exclude [remove empty])
  (:require [felis.collection :as collection]
            [felis.collection.string :as string]
            [felis.editable :as editable]
            [felis.serialization :as serialization]))

(declare reader)

(defrecord Row [lefts rights]
  editable/Editable
  (move [row field field']
    (if-let [value (-> row field collection/peek)]
      (assoc row
        field (-> row field collection/pop)
        field' (-> row field' (collection/conj value)))
      row))
  (ins [row field char]
    (assoc row
      field (-> row field (collection/conj char))))
  (del [row field]
    (assoc row
      field (-> row field collection/pop)))
  (sequence [row]
    (str (:sequence lefts) (:sequence rights)))
  serialization/Serializable
  (write [row]
    (editable/sequence row))
  (reader [row] reader))

(def empty (Row. (string/->Left "") (string/->Right "")))

(def reader
  (reify serialization/Reader
    (read [this string]
      (Row. (string/->Left "") (string/->Right string)))))

(defn update [f editor]
  (update-in editor [:buffer :row] f))
