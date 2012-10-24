(ns one.core.macros
  (:use [clojure.core.match :only [match]]))

(defmacro for-m [bindings expression]
  (match [bindings]
    [[name value]]
      `(one.core.monad/fmap ~value (fn [~name] ~expression))
    [[name value & bindings']]
      `(one.core.monad/bind ~value (fn [~name] (for-m ~bindings' ~expression)))))

(defmacro defdata
  ([name fields]
     `(do
        (defrecord ~name ~fields)
        ~@(map (fn [field#]
                 `(def ~field#
                    (one.core.lens/associative ~(keyword (symbol field#)))))
               fields)))
  ([name fields parent]
     `(do
        (defrecord ~name ~fields)
        ~@(map (fn [field#]
                 `(def ~field#
                    (one.core.lens/compose
                     (one.core.lens/associative ~(keyword (symbol field#)))
                     ~parent)))
               fields))))
