(ns felis.editable
  (:require [clojure.data.generators :as gen]
            [felis.editor.row :as row]
            [felis.editor.buffer :as buffer]))

(defprotocol Edit
  (string-> [this string])
  (left [this editor])
  (right [this editor])
  (start [this editor])
  (end [this editor])
  (insert [this editor])
  (append [this editor])
  (delete [this editor])
  (backspace [this editor]))

(deftype Row []
  Edit
  (string-> [this string]
    (felis.row/string-> string))
  (left [this editor]
    (row/left editor))
  (right [this editor]
    (row/right editor))
  (start [this editor]
    (row/start editor))
  (end [this editor]
    (row/end editor))
  (insert [this editor]
    (row/insert editor (gen/printable-ascii-char)))
  (append [this editor]
    (row/append editor (gen/printable-ascii-char)))
  (delete [this editor]
    (row/delete editor))
  (backspace [this editor]
    (row/backspace editor)))

(deftype Buffer []
  Edit
  (string-> [this string]
    (felis.buffer/string-> string))
  (left [this editor]
    (buffer/top editor))
  (right [this editor]
    (buffer/bottom editor))
  (start [this editor]
    (buffer/start editor))
  (end [this editor]
    (buffer/end editor))
  (insert [this editor]
    (buffer/insert editor))
  (append [this editor]
    (buffer/append editor))
  (delete [this editor]
    (buffer/delete editor))
  (backspace [this editor]
    (buffer/backspace editor)))

(defprotocol Editable
  (edit [this]))

(extend-protocol Editable
  felis.row.Row
  (edit [this] (Row.))
  felis.buffer.Buffer
  (edit [this] (Buffer.)))
