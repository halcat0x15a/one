(ns one.core.monad)

(defprotocol Monadic
  (fmap [m f])
  (bind [m f]))

(defrecord State [f]
  Monadic
  (fmap [s g]
    (State. (fn [s]
              (let [[s' a] (f s)]
                [s' (g a)]))))
  (bind [s g]
    (State. (fn [s]
              (let [[s' a] (f s)]
                ((g a) s'))))))
