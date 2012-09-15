(ns onedit
  (:require [onedit.core :as core]
            [onedit.system :as system]
            [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]
            [onedit.editor :as editor]
            [onedit.command :as command]
            [onedit.file :as file]))

(extend-type js/HTMLCollection
  ISeqable
  (-seq [coll]
    (array-seq coll)))

(extend-type js/FileList
  ISeqable
  (-seq [files]
    (array-seq files)))

(def functions
  (js-obj
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
   "delete-forward" buffer/delete-forward
   "x" buffer/delete-forward
   "delete-backward" buffer/delete-backward
   "X" buffer/delete-backward
   "delete-line" buffer/delete-line
   "dd" buffer/delete-line
   "replace-character" buffer/replace-character
   "r" buffer/replace-character
   "commands" command/commands
   "apply-buffers" command/apply-buffers
   "grep" command/grep
   "count-lines" command/count-lines
   "sum" command/sum
   "open" file/open))

(defn main []
  (set! core/functions functions)
  (system/init))

(main)
