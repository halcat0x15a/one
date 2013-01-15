(ns felis.ui)

(defprotocol Canvas
  (text [this string x y]))

(defn draw [editor])