(ns felis.core
  (:refer-clojure :exclude [char]))

(defprotocol Editor
  (perform [this key]))

(defprotocol Keymap
  (escape [this])
  (left [this])
  (right [this])
  (up [this])
  (down [this])
  (char [this]))

(defn split-lines [string]
  (letfn [(split-lines [src acc xs]
            (if (empty? src)
              (conj xs acc)
              (let [c (first src)
                    src' (rest src)]
                (if (= c \newline)
                  (recur src' "" (conj xs acc))
                  (recur src' (str acc c) xs)))))]
    (split-lines string "" [])))
