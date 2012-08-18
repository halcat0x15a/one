(ns onedit.core)

(def editor (js-obj))

(defn register [key f]
  (aset editor (name key) f))

(defrecord Cursor [x y])

(def unit-cursor (Cursor. 0 0))

(defrecord Editor [buffer cursor])

(defrecord X [buffers current])

(def current-cursor (comp :cursor :current))

(def current-buffer (comp :buffer :current))

(def count-lines (comp count :buffer))

(defn count-line [editor y]
  (count (get (:buffer editor) y)))
