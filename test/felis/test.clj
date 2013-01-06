(ns felis.test
  (:refer-clojure :exclude [chars])
  (:require [clojure.data.generators :as gen]
            [felis.editable :as editable]
            [felis.row :as row]
            [felis.buffer :as buffer]
            [felis.editor :as editor]))

(defprotocol Generator
  (line [this])
  (buffer [this]))

(def chars
  (partial gen/vec gen/printable-ascii-char))

(defn row [generator]
  (gen/rand-nth [row/empty (line generator)]))

(def rows (comp gen/vec row))

(defn zipper [generator]
  (gen/rand-nth [(line generator) (buffer generator)]))

(defn editor [generator]
  (editor/->Normal (buffer generator)))

(defn editable [generator]
  (gen/rand-nth [(row generator) (buffer generator)]))

(def edit
  (partial gen/rand-nth [(editable/->Row) (editable/->Buffer)]))

(def default
  (reify Generator
    (line [this] (row/->Line (gen/printable-ascii-char) (chars) (chars)))
    (buffer [this] (buffer/->Buffer (gen/keyword) (row this) (rows this) (rows this)))))

(def initial
  (reify Generator
    (line [this] (row/->Line (gen/printable-ascii-char) [] (chars)))
    (buffer [this] (buffer/->Buffer buffer/default (row this) [] (rows this)))))
