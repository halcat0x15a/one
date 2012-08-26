(ns onedit.style)

(def font-size 16)

(def cursor-color "black")

(def background-color "white")

(def text-color "black")

(def font-family "monospace")

(def pointer "\u25AF")

(defn px [n]
  (str n "px"))

(defn em [n]
  (str n "em"))

(defn cursor-style []
  (js-obj "line-height" (px font-size)
          "font-size" (px font-size)
          "font-family" font-family))

(defn space-style [cursor]
  (js-obj "top" (em (:y cursor))
          "color" background-color
          "background-color" background-color))

(defn pointer-style [cursor]
  (js-obj "top" (em (:y cursor))
          "color" cursor-color))

(defn buffer-style []
  (js-obj "color" text-color
          "line-height" (px font-size)
          "font-size" (px font-size)
          "font-family" font-family))
