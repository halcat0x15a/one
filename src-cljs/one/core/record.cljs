(ns one.core.record)

(defrecord Editor [buffers minibuffer current view history functions])

(defrecord Buffer [text cursor mode])

(defrecord Cursor [x y saved])

(defn saved-cursor [x y]
  (Cursor. x y x))

(defrecord Mode [name function])

(defrecord Minibuffer [command cursor])

(defrecord View [x y width height])

(defrecord History [current commands cursor])
