(ns felis.editable
  (:refer-clojure :exclude [sequence remove next])
  (:require [clojure.core :as core]
            [felis.string :as string]))

(defprotocol Editable
  (move [this field field'])
  (ins [this field value])
  (del [this field])
  (sequence [this]))

(defn next [editable]
  (move editable :rights :lefts))

(defn prev [editable]
  (move editable :lefts :rights))

(defn insert [editable value]
  (ins editable :rights value))

(defn append [editable value]
  (ins editable :lefts value))

(defn delete [editable]
  (del editable :rights))

(defn backspace [editable]
  (del editable :lefts))

(defn- until [f editable]
  (let [editable' (f editable)]
    (if (identical? editable editable')
      editable'
      (recur f editable'))))

(def start (partial until prev))

(def end (partial until next))

(defn cursor [editable]
  (loop [editable editable n 0]
    (let [editable' (prev editable)]
      (if (identical? editable' editable)
        n
        (recur editable' (inc n))))))

(def sequence-indexed
  (comp (partial map-indexed vector) sequence))
