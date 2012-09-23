(ns one
  (:require [clojure.browser.dom :as dom]
            [one.core :as core]
            [one.system :as system]
            [one.buffer :as buffer]
            [one.cursor :as cursor]
            [one.editor :as editor]
            [one.tool :as tool]
            [one.file :as file]
            [one.vi :as vi]))

(set! *print-fn* dom/log)

(extend-type js/HTMLCollection
  ISeqable
  (-seq [coll]
    (array-seq coll)))

(extend-type js/FileList
  ISeqable
  (-seq [files]
    (array-seq files)))

(def functions
  {:vi vi/normal-mode
   :buffer editor/buffer
   :create-buffer editor/create-buffer
   :change-buffer editor/change-buffer
   :delete-buffer editor/delete-buffer
   :buffers editor/buffers
   :commands tool/commands
   :history tool/history
   :apply-buffers tool/apply-buffers
   :grep tool/grep
   :count-lines tool/count-lines
   :sum tool/sum
   :open file/open})

(defn main []
  (swap! core/current-editor #(assoc % :functions functions))
  (system/init))

(main)
