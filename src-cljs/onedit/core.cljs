(ns onedit.core)

(def editor (js-obj))

(defn register [key f]
  (aset editor (name key) f))

(def count-lines (comp count :buffer))

(defn count-line [editor y]
  (count (get (:buffer editor) y)))
