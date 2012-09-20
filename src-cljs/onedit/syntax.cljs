(ns onedit.syntax
  (:require [onedit.parser :as parser])
  (:refer-clojure :exclude [name keyword]))

(def space (parser/sym #"^\s+"))

(def number-literal (parser/sym :number-literal #"^\d+"))

(def string-literal (parser/sym :string-literal #"^\".*\""))

(def character-literal (parser/sym :character-literal #"^\\\w+"))

(def keyword-literal (parser/sym :keyword-literal #"^:\w+"))

(def name (parser/sym #"^[^\(\[\{\)\]\}\s\d][^\(\[\{\)\]\}\s]*"))

(def open (parser/sym #"^[\(\[\{]"))

(def close (parser/sym #"^[\)\]\}]"))

(def literal
  (parser/select number-literal string-literal character-literal keyword-literal))

(defn expression [this]
  ((parser/select
    literal
    name
    (parser/exp name expression)
    (parser/exp open (parser/rep (parser/exp expression (parser/opt space))) close))
   this))

(def clojure (parser/rep (parser/exp (parser/opt space) expression (parser/opt space))))
