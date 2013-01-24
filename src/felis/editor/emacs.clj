(ns felis.editor.emacs
  (:require [felis.editor :as editor]
            [felis.editor.row :as row]
            [felis.editor.buffer :as buffer]))

(defrecord Fundamental [buffer])
