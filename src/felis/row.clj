(ns felis.row
  (:refer-clojure :exclude [empty sequence])
  (:require [felis.macros :as macros]
            [felis.collection :as collection]
            [felis.collection.string :as string]
            [felis.edit :as edit]
            [felis.serialization :as serialization]))

(declare reader)

(defn sequence [row]
  (str (-> row :lefts :sequence)
       (-> row :rights :sequence)))

(defrecord Row [lefts rights]
  edit/Edit
  (move [row field]
    (if-let [value (-> row field collection/peek)]
      (let [field' (edit/opposite field)]
        (assoc row
          field (-> row field collection/pop)
          field' (-> row field' (collection/conj value))))
      row))
  (ins [row field char]
    (assoc row
      field (-> row field (collection/conj char))))
  (del [row field]
    (assoc row
      field (-> row field collection/pop)))
  serialization/Serializable
  (write [row]
    (str (:sequence lefts) (:sequence rights)))
  (reader [row] reader)
  serialization/HTML
  (html [row]
    (-> row serialization/write string/nbsp))

(defn focus [{:keys [lefts rights]}]
  (reify serialization/HTML
    (html [this]
      (str (:sequence lefts)
           #tag[:span {:class :focus}
                (get rights 0 "")]
           (-> rights :sequence string/rest)))))

(def empty (Row. (string/->Left "") (string/->Right "")))

(def reader
  (reify serialization/Reader
    (read [this string]
      (Row. (string/->Left "") (string/->Right string)))))

(defn update [f editor]
  (update-in editor [:buffer :row] f))
