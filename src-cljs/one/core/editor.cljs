(ns one.core.editor
  (:require [one.core.buffer :as buffer]
            [one.core.minibuffer :as minibuffer]
            [one.core.mode :as mode]
            [one.core.view :as view]
            [one.core.tool :as tool]))

(defrecord Editor [buffers minibuffer current view history functions])

(def default-name :scratch)

(def functions
  (atom
   {:vi #(assoc % :mode mode/normal-mode)
    :get-buffer buffer/get-buffer
    :create-buffer buffer/create-buffer
    :change-buffer buffer/change-buffer
    :delete-buffer buffer/delete-buffer
    :buffers buffer/buffers
    :commands tool/commands
    :history tool/history
    :apply-buffers tool/apply-buffers
    :grep tool/grep
    :count-lines tool/count-lines
    :sum tool/sum}))

(defn editor
  ([] (editor 0 0))
  ([width height]
     (Editor. {default-name buffer/default-buffer} buffer/default-minibuffer default-name (view/view width height) minibuffer/default-history @functions)))
