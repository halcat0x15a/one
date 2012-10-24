(comment
(ns one.core.editor
  (:require [one.core.record :as record]
            [one.core.buffer :as buffer]
            [one.core.minibuffer :as minibuffer]
            [one.core.mode :as mode]
            [one.core.view :as view]
            [one.core.tool :as tool]
            [one.core.default :as default]))

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
  ([] (editor 80 24))
  ([width height]
     (record/->Editor {default-name default/buffer} default/minibuffer default-name (default/view width height) default/history @functions)))
)