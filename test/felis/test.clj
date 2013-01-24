(ns felis.test
  (:refer-clojure :exclude [sequence])
  (:require [clojure.data.generators :as gen]
            [felis.collection.sequence :as sequence]
            [felis.collection.string :as string]
            [felis.row :as row]
            [felis.buffer :as buffer]
            [felis.editor.vim :as vim]))

(defn left []
  (string/->Left (gen/string)))

(defn right []
  (string/->Right (gen/string)))

(defn top [row]
  (sequence/->Sequence (gen/vec row)))

(defn bottom [row]
  (sequence/->Sequence (into '() (gen/list row))))

(defn row []
  (row/->Row (left) (right)))

(defn collection []
  (gen/rand-nth [(left) (right) (top row) (bottom row)]))

(defn buffer []
  (buffer/->Buffer (gen/keyword) (row) (top row) (bottom row)))

(defn edit []
  (gen/rand-nth [(row) (buffer)]))

(defn editor []
  (gen/rand-nth [(vim/->Normal (buffer))]))

(defn serializable []
  (letfn [(row [] (assoc row/empty
                    :rights (right)))]
    (gen/rand-nth [(row) (assoc buffer/scratch
                           :row (row)
                           :rights (bottom row))])))
