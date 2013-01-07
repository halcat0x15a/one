(ns felis.row
  (:refer-clojure :exclude [replace empty])
  (:require [clojure.string :as string]
            [felis.core :as core]
            [felis.zipper :as zipper]))

(declare ->Line)

(defprotocol Row
  (move [this f])
  (insert [this f char])
  (delete [this f])
  (replace [this char]))

(deftype Empty []
  Row
  (move [this f] this)
  (insert [this f char]
    (->Line char [] []))
  (delete [this f] this)
  (replace [this char] this)
  core/Initialize
  (initialize [this] this)
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
  core/Initialize
  (initialize [this] empty)
  core/Text
  (text [this]
    (str (string/join lefts) char (string/join rights))))

(defn update [f editor]
  (update-in editor [:buffer :row] f))

(defn string-> [string]
  (if (empty? string)
    empty
    (Line. (first string) [] (rest string))))
