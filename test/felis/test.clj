(ns felis.test
  (:refer-clojure :exclude [chars])
  (:require [clojure.data.generators :as gen]
            [felis.row :as row]
            [felis.buffer :as buffer]
            [felis.editor :as editor]))

(def chars
  (partial gen/vec gen/printable-ascii-char))

(defn rows [row]
  (gen/vec row))

(defn row []
  (row/->Row (chars) (chars)))

(defn buffer []
  (buffer/->Buffer (gen/keyword) (row) (rows row) (rows row)))

(defn editable []
  (gen/rand-nth [(row)
                 (buffer)]))

(defn editor []
  (editor/->Normal (buffer)))

(defn serializable []
  (letfn [(row [] (row/->Row [] (chars)))]
    (gen/rand-nth [(row)
                   (buffer/->Buffer buffer/default (row) [] (rows row))])))
