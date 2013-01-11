(ns felis.buffer
  (:refer-clojure :exclude [name empty])
  (:require [felis.core :as core]
            [felis.string :as string]
            [felis.editable :as editable]
            [felis.serialization :as serialization]
            [felis.functor :as functor]
            [felis.row :as row]))

(declare reader)

(defn- move [buffer field field']
  (if-let [row (editable/first buffer field)]
    (assoc buffer
      :row row
      field (editable/rest buffer field)
      field' (editable/conj buffer field' (:row buffer)))
    buffer))

(defmulti empty identity)
(defmethod empty :tops [field] [])
(defmethod empty :bottoms [field] '())

(defn- insert [buffer field value]
  (assoc buffer
    :row value
    field (editable/conj buffer field (:row buffer))))

(defn- delete [buffer field]
  (if-let [row (editable/first buffer field)]
    (assoc buffer
      :row row
      field (editable/rest buffer field))
    buffer))

(defrecord Buffer [name row tops bottoms]
  editable/Editable
  (next [this]
    (move this :bottoms :tops))
  (prev [this]
    (move this :tops :bottoms))
  (insert [this value]
    (insert this :bottoms value))
  (append [this value]
    (insert this :tops value))
  (delete [this]
    (delete this :bottoms))
  (backspace [this]
    (delete this :tops))
  functor/Functor
  (map [this f]
    (assoc this
      :row (f row)
      :tops (map f tops)
      :bottoms (map f bottoms)))
  serialization/Serializable
  (write [this]
    (->> (concat tops [row] bottoms)
         (map serialization/write)
         (interpose \newline)
         (apply str)))
  (reader [this] reader))

(def default :*scratch*)

(def scratch (Buffer. default row/empty [] '()))

(def reader
  (reify serialization/Reader
    (read [this s]
      (let [read (partial map (partial serialization/read row/reader))
            rows (-> s string/split-lines read)]
        (Buffer. default (first rows) [] (rest rows))))))

(defn update [f editor]
  (update-in editor [:buffer] f))
