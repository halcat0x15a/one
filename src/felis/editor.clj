(ns felis.editor
  (:require [felis.key :as key]))

(defprotocol Editor
  (keymap [editor])
  (input [editor char]))

(defprotocol KeyCode
  (code [this event]))
