(ns felis.buffer
  (:refer-clojure :exclude [empty sequence])
  (:require [felis.string :as string]
            [felis.collection :as collection]
            [felis.collection.sequence :as sequence]
            [felis.edit :as edit]
            [felis.serialization :as serialization]
            [felis.row :as row]))

(declare reader)

(defn sequence [buffer]
  (concat (-> buffer :lefts :sequence)
          (-> buffer :row list)
          (-> buffer :rights :sequence)))

(defrecord Buffer [name row lefts rights]
  edit/Edit
  (move [buffer field]
    (if-let [row' (-> buffer field collection/peek)]
      (let [field' (edit/opposite field)]
        (assoc buffer
          :row row'
          field (-> buffer field collection/pop)
          field' (-> buffer field' (collection/conj row))))
      buffer))
  (ins [buffer field row']
    (assoc buffer
      :row row'
      field (-> buffer field (collection/conj row))))
  (del [buffer field]
    (if-let [row' (-> buffer field collection/peek)]
      (assoc buffer
        :row row'
        field (-> buffer field collection/pop))
      buffer))
  serialization/Serializable
  (write [buffer]
    (->> buffer
         sequence
         (map serialization/write)
         (interpose \newline)
         (apply str)))
  (reader [buffer] reader))

(def default :*scratch*)

(def scratch
  (Buffer. default row/empty (sequence/->Sequence []) (sequence/->Sequence '())))

(def reader
  (reify serialization/Reader
    (read [reader string]
      (let [read (partial map (partial serialization/read row/reader))
            rows (-> string string/split-lines read)]
        (assoc scratch
          :row (first rows)
          :rights (sequence/->Sequence (rest rows)))))))

(defn update [f editor]
  (update-in editor [:buffer] f))
