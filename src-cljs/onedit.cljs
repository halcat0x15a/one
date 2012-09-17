(ns onedit
  (:require [onedit.core :as core]
            [onedit.system :as system]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]
            [onedit.editor :as editor]
            [onedit.tool :as tool]
            [onedit.file :as file]
            [onedit.vi :as vi]))

(extend-type js/HTMLCollection
  ISeqable
  (-seq [coll]
    (array-seq coll)))

(extend-type js/FileList
  ISeqable
  (-seq [files]
    (array-seq files)))

(def functions
  {"vi" vi/mode
   "left" cursor/left
   "h" cursor/left
   "down" cursor/down
   "j" cursor/down
   "up" cursor/up
   "k" cursor/up
   "right" cursor/right
   "l" cursor/right
   "forward" cursor/forward
   "w" cursor/forward
   "backward" cursor/backward
   "b" cursor/backward
   "start-line" cursor/start-line
   "|" cursor/start-line
   "end-line" cursor/end-line
   "$" cursor/end-line
   "start-buffer" cursor/start-buffer
   "gg" cursor/start-buffer
   "end-buffer" cursor/end-buffer
   "G" cursor/end-buffer
   "insert" buffer/insert
   "i" buffer/insert
   "append-newline" buffer/append-newline
   "o" buffer/append-newline
   "prepend-newline" buffer/prepend-newline
   "O" buffer/prepend-newline
   "delete" buffer/delete
   "x" buffer/delete
   "backspace" buffer/backspace
   "X" buffer/backspace
   "delete-line" buffer/delete-line
   "dd" buffer/delete-line
   "replace-string" buffer/replace-string
   "r" buffer/replace-string
   "buffer" editor/buffer
   "create-buffer" editor/create-buffer
   "change-buffer" editor/change-buffer
   "delete-buffer" editor/delete-buffer
   "buffers" editor/buffers
   "commands" tool/commands
   "history" tool/history
   "apply-buffers" tool/apply-buffers
   "grep" tool/grep
   "count-lines" tool/count-lines
   "sum" tool/sum
   "open" file/open})

(defn main []
  (swap! core/current-editor #(assoc % :functions functions))
  (system/init))

(main)
