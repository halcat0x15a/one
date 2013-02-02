(ns felis.editor.emacs
  (:require [felis.editor :as editor]
            [felis.editor.text :as text]
            [felis.editor.buffer :as buffer]))

(defrecord Fundamental [root])
