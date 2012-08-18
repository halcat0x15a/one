(ns onedit.core)

(def editor (js-obj))

(defn register [key f]
  (aset editor (name key) f))

(defrecord Cursor [x y])

(def unit (Cursor. 0 0))

(defrecord Editor [buffer cursor])

(def count-lines (comp count :buffer))

(defn count-line [editor y]
  (count (get (:buffer editor) y)))
