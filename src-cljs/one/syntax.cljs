(ns one.syntax
  (:require [one.parser :as parser])
  (:refer-clojure :exclude [name keyword newline]))

(def re-newline #"^\n")

(def newline (parser/sym nil re-newline))

(def space (parser/select newline (parser/sym nil #"^\s+")))

(def number (parser/sym :number #"^\d+"))

(def string (parser/sym :string #"^\"[^\"]*\""))

(def character (parser/sym :character #"^\\\w+"))

(def keyword-literal (parser/sym :keyword-literal #"^:\w+"))

(def name (parser/sym nil #"^[^\(\[\{\)\]\}\s\d][^\(\[\{\)\]\}\s]*"))

(def open (parser/sym nil #"^[\(\[\{]"))

(def close (parser/sym nil #"^[\)\]\}]"))

(def literal
  (parser/select number string character keyword-literal))

(defn expression [this]
  ((parser/exp
    (parser/opt space)
    (parser/select
     literal
     name
     (parser/exp open (parser/rep expression) close)
     (parser/exp name expression))
    (parser/opt space))
   this))

(def clojure (parser/rep expression))
