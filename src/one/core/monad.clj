(ns one.core.monad
  (:refer-clojure :exclude [replicate]))

(defprotocol Monadic
  (fmap [m f])
  (bind [m f]))

(defn bind' [m m']
  (bind m (constantly m')))

(defn replicate [f n m]
  (if (zero? n)
    m
    (recur f (dec n) (bind m f))))
