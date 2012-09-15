(ns onedit.style)

(def font-size 16)

(def cursor-color "black")

(def background-color "white")

(def text-color "black")

(def font-family "monospace")

(def pointer "\u20DE")

(defn px [n]
  (str n "px"))

(defn em [n]
  (str n "em"))

(def buffer-style
  (js-obj "line-height" (px font-size)
          "font-size" (px font-size)
          "font-family" font-family))
