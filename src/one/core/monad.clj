(ns one.core.monad)

(defprotocol Monadic
  (fmap [m f])
  (bind [m f]))

(defn bind' [m v]
  (bind m (constantly v)))
