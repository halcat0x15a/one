(ns one.core.maybe
  (:require [one.core.monad :as monad]))

(deftype Some [value]
  monad/Monadic
  (fmap [m f]
    (Some. (f (.value m))))
  (bind [m f]
    (f (.value m))))

(def none
  (reify monad/Monadic
    (fmap [m f] None)
    (bind [m f] None)))
