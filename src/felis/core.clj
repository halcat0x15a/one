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
  (char [this key]))
