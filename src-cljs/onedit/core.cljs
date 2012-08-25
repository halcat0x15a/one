(ns onedit.core)

(defrecord Cursor [x y])

(def unit-cursor (Cursor. 0 0))

(defrecord Buffer [strings cursor])

(def unit-buffer (Buffer. [""] unit-cursor))

(defrecord Editor [buffers current])

(def unit-editor (Editor. {:scratch unit-buffer} :scratch))

(def current-editor (atom unit-editor))

(defn get-buffer [editor]
  ((:buffers editor) (:current editor)))

(def get-cursor (comp :cursor get-buffer))

(def get-strings (comp :strings get-buffer))

(defn set-buffer [editor buffer]
  (assoc editor
    :buffers (assoc (:buffers editor)
               (:current editor) buffer)))

(defn set-cursor [editor cursor]
  (set-buffer editor (assoc (get-buffer editor)
                       :cursor cursor)))

(defn set-strings [editor strings]
  (set-buffer editor (assoc (get-buffer editor)
                       :strings strings)))

(def count-lines (comp count get-strings))

(defn get-line [editor y]
  (get (get-strings editor) y))

(def count-line (comp count get-line))
