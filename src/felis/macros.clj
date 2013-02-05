;*CLJSBUILD-MACRO-FILE*;
(ns felis.macros
  (:require [clojure.string :as string]))

(defmacro tag [tag attrs & contents]
  (let [open (str \<
                  (name tag)
                  (reduce-kv (fn [attrs key value]
                               (str attrs \space (name key) \= \" (name value) \"))
                             ""
                             attrs)
                  \>)
        close (str \< \/ (name tag) \>)]
    `(str ~open (str ~@contents) ~close)))

(defmacro css [selector block]
  (let [selector (name selector)
        block (reduce-kv (fn [block# prop# value#]
                       (str block# \space (name prop#) \: \space value# \;))
                     ""
                     block)]
    `(str ~selector \space \{ ~block \space \})))
