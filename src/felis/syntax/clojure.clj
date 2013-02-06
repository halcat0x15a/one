(ns felis.syntax.clojure
  (:refer-clojure :exclude [keyword comment])
  (:require [felis.syntax :as syntax]
            [felis.node :as node]))

(def identifier (syntax/parser #"^[^\":;]"))

(def special
  (syntax/comp (syntax/parser #"^\s")
               (syntax/parser
                #"^(def)|(if)|(do)|(let)|(quote)|(var)|(fn)|(loop)|(recur)|(throw)|(try)"
                (comp (partial node/tag :span {:class :special})
                      (partial some identity)))
               (syntax/parser #"^\(")))

(def string
  (syntax/parser #"^\".*\"" (partial node/tag :span {:class :string})))

(def keyword
  (syntax/parser #"^:[^\(\) ]+" (partial node/tag :span {:class :keyword})))

(def comment
  (syntax/parser #"^;.*" (partial node/tag :span {:class :comment})))

(def syntax
  (syntax/repeat (syntax/or comment string keyword special identifier)))
