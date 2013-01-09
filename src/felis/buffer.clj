(ns felis.buffer
  (:refer-clojure :exclude [empty])
  (:require [clojure.string :as string]
            [felis.core :as core]
            [felis.editable :as editable]
            [felis.functor :as functor]
            [felis.serialization :as serialization]
            [felis.row :as row]))

(def default :*scratch*)

(declare reader)

(defrecord Buffer [name row tops bottoms]
  editable/Editable
  (next [this]
    (if-let [row' (first bottoms)]
      (assoc this
        :row row'
        :tops (conj tops row)
        :bottoms (rest bottoms))
      this))
  (prev [this]
    (if-let [row' (peek tops)]
      (assoc this
        :row row'
        :tops (pop tops)
        :bottoms (cons row bottoms))
      this))
  (start [this]
    (if-let [row' (first tops)]
      (assoc this
        :row row'
        :tops []
        :bottoms (concat (rest tops) (list row) bottoms))
      this))
  (end [this]
    (if-let [row' (peek bottoms)]
      (assoc this
        :row row'
        :tops (vec (concat tops (list row) (pop bottoms)))
        :bottoms [])
      this))
  (insert [this value]
    (assoc this
      :row value
      :bottoms (cons row bottoms)))
  (append [this value]
    (assoc this
      :row value
      :tops (conj tops row)))
  (delete [this]
    (if-let [row (first bottoms)]
      (assoc this
        :row row
        :bottoms (rest bottoms))
      this))
  (backspace [this]
    (if-let [row (peek tops)]
      (assoc this
        :row row
        :tops (pop tops))
      this))
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
         string/join))
  (reader [this] reader))

(def reader
  (reify serialization/Reader
    (read [this string]
      (let [rows
            (->> string
                 core/split-lines
                 (map (partial serialization/read row/reader)))]
        (Buffer. default (first rows) [] (rest rows))))))

(def empty (Buffer. default row/empty [] []))

(defn update [f editor]
  (update-in editor [:buffer 0] f))
