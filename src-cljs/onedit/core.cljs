(ns onedit.core)

(def editor (js-obj))

(defn register [key f]
  (aset editor (name key) f))
