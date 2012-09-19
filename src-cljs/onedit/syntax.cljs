(ns onedit.syntax
  (:require [onedit.parser :as parser])
  (:refer-clojure :exclude [name keyword]))

(def space (parser/sym #"^\s+"))

(def number (parser/sym :number #"^\d+"))

(def string (parser/sym :string #"^\".*\""))

(def character (parser/sym :character #"^\\\w+"))

(def keyword (parser/sym :keyword #"^:\w+"))

(def name (parser/sym :name #"^\w+"))

(def define (parser/sym :define #"^(defn)|(def)"))

(def open (parser/sym #"^[\(\[\{]"))

(def close (parser/sym #"^[\)\]\}]"))

(def literal
  (parser/select number string character keyword))

(defn expression [this]
  ((parser/select
    literal
    name
    (parser/exp open define space name space expression close))
   this))

(def clojure (parser/rep (parser/exp (parser/opt space) expression (parser/opt space))))
