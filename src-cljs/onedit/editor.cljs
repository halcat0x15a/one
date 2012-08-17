(ns onedit.editor
  (:require [onedit.buffer :as buffer]
            [onedit.cursor :as cursor])
  (:use-macros [onedit.core :only [defun]]))

(defrecord Editor [buffers cursor])

(defn create []
  (Editor. (buffer/create) (cursor/create)))

(defn update [editor]
  (buffer/update (:buffers editor))
  (cursor/update (:cursor editor)))

(defun commands [editor])
