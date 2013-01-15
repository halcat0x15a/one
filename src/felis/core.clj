(ns felis.core
  (:refer-clojure :exclude [char]))

(defprotocol Editor
  (perform [this key]))

(defprotocol Keymap
  (escape? [this event])
  (left? [this event])
  (right? [this event])
  (up? [this event])
  (down? [this event])
  (char [this event]))
