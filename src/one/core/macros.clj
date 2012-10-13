(ns one.core.macros
  (:use [clojure.core.match :only [match]]
        [one.core.monad :only [fmap bind]]))

(defmacro do-m [bindings expression]
  (match [bindings]
    [[name value]]
      `(fmap (fn [~name] ~expression) ~value)
    [[name value & bindings']]
      `(bind (fn [~name] (do-m ~bindings' ~expression)) ~value)))
