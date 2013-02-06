(ns felis.node
  (:require [clojure.string :as string]))

(defprotocol Node
  (render [node]))

(defmulti path identity)

(defn attribute [attributes key value]
  (str attributes \space (name key) \= \" (name value) \"))

(defn tag [tag attributes & contents]
  (let [tag (name tag)]
    (str \< tag (reduce-kv attribute "" attributes) \>
         (string/join contents)
         \< \/ tag \>)))
