(ns onedit.style)

(def font-size 16)

(def cursor-color "black")

(def background-color "white")

(def text-color "black")

(def font-family "monospace")

(defn cursor-style
  ([cursor] (cursor-style (:x cursor) (:y cursor)))
  ([x y]
     (str "background-color: " cursor-color
          "; left: " x
          "ex; top: " y "em;")))

(defn buffer-style []
  (str "background-color: " background-color
       "; color: " text-color
       "; line-height: " font-size
       "px; font-size: " font-size
       "px; font-family: " font-family ";"))