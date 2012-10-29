(ns one.core.macros
  (:use [clojure.core.match :only [match]]))

(defmacro monad-syntax [function bindings expression]
  (match [bindings]
         [[name value]]
         `(~function ~value
                     (fn [arg#]
                       (let [~name arg#]
                         ~expression)))
         [[name value & bindings']]
         `(one.core.monad/bind ~value
                               (fn [arg#]
                                 (let [~name arg#]
                                   (monad-syntax ~function ~bindings' ~expression))))))


(defmacro do-m [bindings expression]
  `(monad-syntax one.core.monad/bind ~bindings ~expression))

(defmacro for-m [bindings expression]
  `(monad-syntax one.core.monad/fmap ~bindings ~expression))

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
