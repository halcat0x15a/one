(ns one.core.id
  (:require [one.core.monad :as monad]))

(deftype Id [value]
  monad/Monadic
  (fmap [i f]
    (Id. (f (.value i))))
  (bind [i f]
    (f (.value i))))
