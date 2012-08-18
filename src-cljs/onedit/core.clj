(ns onedit.core)

(defmacro defun [name args & body]
  `(do
     (defn ~name ~args ~@body)
     (onedit.core/register '~name ~name)))
