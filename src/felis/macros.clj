;*CLJSBUILD-MACRO-FILE*;
(ns felis.macros
  (:require [clojure.string :as string]))

(defn tag [values]
  `(let [[tag# attrs# & contents#] ~values]
     (str \< (name tag#)
          (reduce-kv (fn [attrs# key# value#]
                       (str attrs# \space (name key#) \= \" (name value#) \"))
                     "" attrs#)
          \> (string/join contents#) \< \/ (name tag#) \>)))

(defn css [style]
  `(reduce-kv (fn [style# selector# block#]
                (str (name selector#) \space \{
                     (reduce-kv (fn [block# prop# value#]
                                  (str block# \space (name prop#) \: \space value# \;))
                                ""
                                block#)
                     \space \}))
              ""
              ~style))
