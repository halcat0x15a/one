(ns one.core.monad
  (:refer-clojure :exclude [replicate])
  (:use
   [one.core.macros :only [for-m]]))

(defprotocol Monadic
  (fmap [m f])
  (bind [m f]))

(defn bind' [m m']
  (bind m (constantly m')))

(defn replicate [f n m]
  (if (zero? n)
    m
    (recur f (dec n) (bind m f))))

(defn sequence [m & ms]
  (reduce (fn [ms' m']
            (for-m [xs ms'
                    v m']
                   (conj xs v)))
          m
          ms))