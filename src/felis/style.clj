(ns felis.style
  (:require [felis.macros :as macros]))

(def editor
  #css{:.editor
       {:color "black"
        :background-color "white"
        :font-size "16px"
        :font-family "monospace"}})

(def focus
  #css{:.focus
       {:display "inline-block"
        :width "1ex"
        :height "1em"
        :color "white"
        :background-color "black"}})

(def all [editor focus])
