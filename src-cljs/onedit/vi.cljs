(ns onedit.vi
  (:require [onedit.cursor :as cursor]
            [onedit.buffer :as buffer]))

(def normal
  {"h" cursor/left
   "j" cursor/down
   "k" cursor/up
   "l" cursor/right
   "w" cursor/forward
   "b" cursor/backward
   "|" cursor/start-line
   "$" cursor/end-line
   "gg" cursor/start-buffer
   "G" cursor/end-buffer
   "i" buffer/insert
   "o" buffer/append-newline
   "O" buffer/prepend-newline
   "x" buffer/delete
   "X" buffer/backspace
   "dd" buffer/delete-line
   "r" buffer/replace-string})

(defn mode [editor]
  (assoc editor :mode normal))