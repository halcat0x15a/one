(ns felis.row
  (:refer-clojure :exclude [empty])
  (:require [clojure.string :as string]
            [felis.core :as core]
            [felis.editable :as editable]
            [felis.functor :as functor]
            [felis.serialization :as serialization]))

(declare reader)

(defrecord Row [lefts rights]
  editable/Editable
  (next [this]
    (if-let [value (first rights)]
      (assoc this
        :lefts (conj (vec lefts) value)
        :rights (rest rights))
      this))
  (prev [this]
    (if-let [value (last lefts)]
      (assoc this
        :lefts (drop-last lefts)
        :rights (cons value rights))
      this))
  (start [this]
    (assoc this
      :lefts []
      :rights (concat lefts rights)))
  (end [this]
    (assoc this
      :lefts (concat lefts rights)
      :rights []))
  (insert [this value]
    (assoc this
      :rights (cons value rights)))
  (append [this value]
    (assoc this
      :lefts (conj lefts value)))
  (delete [this]
    (assoc this
      :rights (rest rights)))
  (backspace [this]
    (assoc this
      :lefts (drop-last lefts)))
  functor/Functor
  (map [this f]
    (assoc this
      :lefts (map f lefts)
      :rights (map f rights)))
  serialization/Serializable
  (write [this]
    (string/join (concat lefts rights)))
  (reader [this] reader))

(def empty (Row. [] []))

(def reader
  (reify serialization/Reader
    (read [this string]
      (Row. [] (vec string)))))

(defn update [f editor]
  (update-in editor [:buffer :tops 0 :rights 0] f))
