(ns felis.editable
  (:refer-clojure :exclude [next]))

(defprotocol Editable
  (prev [this])
  (next [this])
  (start [this])
  (end [this])
  (insert [this value])
  (append [this value])
  (delete [this])
  (backspace [this]))
