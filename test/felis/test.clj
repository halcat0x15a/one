(ns felis.test
  (:refer-clojure :exclude [sequence])
  (:require [clojure.data.generators :as gen]
            [felis.core :as core]
            [felis.collection.sequence :as sequence]
            [felis.collection.string :as string]
            [felis.row :as row]
            [felis.buffer :as buffer]
            [felis.editor :as editor]))

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

(defn sequence []
  (gen/rand-nth [(left) (right) (top row) (bottom row)]))

(defn buffer []
  (buffer/->Buffer (gen/keyword) (row) (top row) (bottom row)))

(defn editable []
  (gen/rand-nth [(row) (buffer)]))

(defn editor []
  (editor/->Normal (buffer)))

(defn serializable []
  (letfn [(row [] (row/->Row (string/->Left "") (right)))]
    (gen/rand-nth
     [(row) (buffer/->Buffer buffer/default (row) (sequence/->Sequence []) (bottom row))])))

(defprotocol Field
  (field [this]))

(extend-protocol Field
  felis.row.Row
  (field [this]
    (gen/rand-nth [:lefts :rights]))
  felis.buffer.Buffer
  (field [this]
    (gen/rand-nth [:tops :bottoms])))

(def keymap
  (reify core/Keymap
    (escape? [this key] (= key :escape))
    (left? [this key] (= key :left))
    (right? [this key] (= key :right))
    (up? [this key] (= key :up))
    (down? [this key] (= key :down))
    (char [this key] key)))
