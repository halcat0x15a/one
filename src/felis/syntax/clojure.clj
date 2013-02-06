(ns felis.syntax.clojure
  (:refer-clojure :exclude [keyword comment])
;*CLJSBUILD-REMOVE*;  (:use-macros [felis.macros :only (tag)])
  (:require [felis.syntax :as syntax]))

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (tag)])
;*CLJSBUILD-REMOVE*;)

(def identifier (syntax/parser #"^[^\":;]"))

(def special
  (syntax/comp (syntax/parser #"^\s")
               (syntax/parser
                #"^(def)|(if)|(do)|(let)|(quote)|(var)|(fn)|(loop)|(recur)|(throw)|(try)"
                #(tag :span {:class "special"} (some identity %)))
               (syntax/parser #"^\(")))

(def string
  (syntax/parser #"^\".*\"" #(tag :span {:class "string"} %)))

(def keyword
  (syntax/parser #"^:[^\(\) ]+" #(tag :span {:class "keyword"} %)))

(def comment
  (syntax/parser #"^;.*" #(tag :span {:class "comment"} %)))

(def syntax
  (syntax/repeat (syntax/or comment string keyword special identifier)))
