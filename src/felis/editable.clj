(ns felis.editable
  (:refer-clojure :exclude [next first rest conj])
  (:require [clojure.core :as core]
            [felis.string :as string]))

(defprotocol Editable
  (prev [this])
  (next [this])
  (insert [this value])
  (append [this value])
  (delete [this])
  (backspace [this]))

(defn- until [f editable]
  (let [editable' (f editable)]
    (if (identical? editable editable')
      editable'
      (recur f editable'))))

(def start (partial until prev))

(def end (partial until next))

(defn field [row field & other] field)

(defmulti first field)
(defmethod first :rights [editable field]
  (-> editable field string/first))
(defmethod first :lefts [editable field]
  (-> editable field string/last))
(defmethod first :bottoms [editable field]
  (-> editable field core/first))
(defmethod first :tops [editable field]
  (-> editable field peek))

(defmulti rest field)
(defmethod rest :rights [editable field]
  (-> editable field string/rest))
(defmethod rest :lefts [editable field]
  (-> editable field string/butlast))
(defmethod rest :bottoms [editable field]
  (-> editable field core/rest))
(defmethod rest :tops [editable field]
  (let [field (field editable)]
    (if (empty? field)
      []
      (pop field))))

(defmulti conj field)
(defmethod conj :rights [editable field value]
  (->> editable field (str value)))
(defmethod conj :lefts [editable field value]
  (-> editable field (str value)))
(defmethod conj :bottoms [editable field value]
  (->> editable field (cons value)))
(defmethod conj :tops [editable field value]
  (-> editable field (core/conj value)))
