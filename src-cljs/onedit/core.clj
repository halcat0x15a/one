(ns onedit.core)

(defmacro fn-map
  ([command]
     `{~(keyword command) ~command})
  ([command & commands]
     `(merge (fn-map ~command) (fn-map ~@commands))))
