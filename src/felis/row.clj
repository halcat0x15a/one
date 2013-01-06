(ns felis.row
  (:refer-clojure :exclude [replace empty])
  (:require [clojure.string :as string]
            [felis.core :as core]
            [felis.zipper :as zipper]))

(defprotocol Row
  (move [this f])
  (insert [this f char])
  (delete [this f])
  (replace [this char]))

(declare ->Line)

(deftype Empty []
  Row
  (move [this f] this)
  (insert [this f char]
    (->Line char [] []))
  (delete [this f] this)
  (replace [this char] this)
  core/Text
  (text [this] ""))

(def empty (Empty.))

(defrecord Line [char lefts rights]
  Row
  (move [this f]
    (if-let [row (f this)] row this))
  (insert [this f char] (f this char))
  (delete [this f]
    (if-let [row (f this)] row empty))
  (replace [this char]
    (Line. char lefts rights))
  zipper/Zipper
  (value [this] :char)
  (lefts [this] :lefts)
  (rights [this] :rights)
  core/Text
  (text [this]
    (str (string/join lefts) char (string/join rights))))

(defn update [f editor]
  (update-in editor [:buffer :row] f))

(defn string-> [string]
  (if (= string "")
    empty
    (Line. (first string) [] (rest string))))
