(ns felis.style)

(def default
  {:.editor
   {:color :black
    :background-color :white
    :font-size :16px
    :font-family :monospace}
   :.focus
   {:display :inline-block
    :width :1ex
    :height :1em
    :color :white
    :background-color :black}
   :.minibuffer
   {:position :absolute
    :bottom :0px}
   :.special
   {:color :fuchsia}
   :.string
   {:color :red}
   :.keyword
   {:color :aqua}})

(defn css [style]
  (reduce-kv (fn [string selector block]
               (let [selector (name selector)
                     block (reduce-kv (fn [block property value]
                                        (str block \space (name property) \: \space (name value) \;))
                                      ""
                                      block)]
                 (str string \space selector \space \{ block \space \})))
             ""
             style))
