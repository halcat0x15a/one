(ns onedit.core)

(defmacro defun [name args & body]
  `(do
     (defn ~name ~args ~@body)
     (onedit.core/register '~name ~name)))

(defmacro fn-map
  ([command]
     `{~(keyword command) ~command})
  ([command & commands]
     `(merge (fn-map ~command) (fn-map ~@commands))))
