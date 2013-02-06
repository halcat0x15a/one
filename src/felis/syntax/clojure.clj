(ns felis.syntax.clojure
;*CLJSBUILD-REMOVE*;  (:use-macros [felis.macros :only (tag)])
  (:require [felis.highlighter :as highlighter]))

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (tag)])
;*CLJSBUILD-REMOVE*;)

(def identifier (highlighter/highlight #"^[^\"]+"))

(def special
  (highlighter/highlight
   #"^\((def)|(if)|(do)|(let)|(quote)|(var)|(fn)|(loop)|(recur)|(throw)|(try)"
   #(tag :span {:class :special} (some identity %))))

(def string
  (highlighter/highlight #"^\".*\"") #(tag :span {:class :string} %))
