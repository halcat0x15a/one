(comment
(ns one.core.style)

(def font-size (atom 16))

(def cursor-color (atom "black"))

(def background-color (atom "white"))

(def text-color (atom "black"))

(def font-family (atom "monospace"))

(def pointer (atom "\u20DE"))

(def highlight
  {:keyword-literal "aqua"
   :string-literal "fuchsia"
   :number-literal "lime"})
)