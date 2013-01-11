(ns felis.test
  (:require [clojure.data.generators :as gen]
            [felis.core :as core]
            [felis.row :as row]
            [felis.buffer :as buffer]
            [felis.editor :as editor]))

(defn row []
  (row/->Row (gen/string) (gen/string)))

(defn buffer []
  (buffer/->Buffer (gen/keyword) (row) (gen/vec row) (gen/list row)))

(defn editable []
  (gen/rand-nth [(row) (buffer)]))

(defn editor []
  (editor/->Normal (buffer)))

(defn serializable []
  (letfn [(row [] (row/->Row "" (gen/string)))]
    (gen/rand-nth
     [(row) (buffer/->Buffer buffer/default (row) [] (gen/list row))])))

(defprotocol Field
  (field [this]))

(extend-protocol Field
  felis.row.Row
  (field [this]
    (gen/rand-nth [:lefts :rights]))
  felis.buffer.Buffer
  (field [this]
    (gen/rand-nth [:tops :bottoms])))

(def keymap
  (reify core/Keymap
    (escape [this] :escape)
    (left [this] :left)
    (right [this] :right)
    (up [this] :up)
    (down [this] :down)
    (char [this key] key)))
