(ns onedit.core)

(defmacro defun [name args & body]
  `(let [f# (fn ~args ~@body)]
     (def ~name f#)
     (onedit.core/register '~name f#)))
