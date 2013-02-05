(ns felis.style
;*CLJSBUILD-REMOVE*;  (:use-macros [felis.macros :only (css)])
  )

;*CLJSBUILD-REMOVE*;(comment
(use '[felis.macros :only (css)])
;*CLJSBUILD-REMOVE*;)

(def editor
  (css :.editor
       {:color "black"
        :background-color "white"
        :font-size "16px"
        :font-family "monospace"}))

(def focus
  (css :.focus
       {:display "inline-block"
        :width "1ex"
        :height "1em"
        :color "white"
        :background-color "black"}))

(def minibuffer
  (css :.minibuffer
       {:position "absolute"
        :bottom "0px"}))

(def all [editor focus minibuffer])
