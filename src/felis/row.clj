(ns felis.row
  (:refer-clojure :exclude [empty])
  (:require [felis.string :as string]
            [felis.editable :as editable]
            [felis.serialization :as serialization]
            [felis.functor :as functor]))

(declare reader)

(defn- move [row field field']
  (if-let [value (editable/first row field)]
    (assoc row
      field (editable/rest row field)
      field' (editable/conj row field' value))
    row))

(defn- insert [row field value]
  (assoc row
     field (editable/conj row field value)))

(defn- delete [row field]
  (assoc row
     field (editable/rest row field)))

(defrecord Row [lefts rights]
  editable/Editable
  (next [this]
    (move this :rights :lefts))
  (prev [this]
    (move this :lefts :rights))
  (insert [this value]
    (insert this :rights value))
  (append [this value]
    (insert this :lefts value))
  (delete [this]
    (delete this :rights))
  (backspace [this]
    (delete this :lefts))
  functor/Functor
  (map [this f]
    (assoc this
      :lefts (clojure.string/join (map f lefts))
      :rights (clojure.string/join (map f rights))))
  serialization/Serializable
  (write [this]
    (str lefts rights))
  (reader [this] reader))

(def empty (Row. "" ""))

(def reader
  (reify serialization/Reader
    (read [this s]
      (Row. "" s))))

(defn update [f editor]
  (update-in editor [:buffer :row] f))
