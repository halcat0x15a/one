(ns onedit.editor
  (:require [onedit.buffer :as buffer]
            [onedit.cursor :as cursor]))

(defrecord Editor [buffer cursor])

(defn create []
  (Editor. (buffer/create) (cursor/create)))

(defn update [editor]
  (buffer/update (:buffer editor))
  (cursor/update (:cursor editor)))
